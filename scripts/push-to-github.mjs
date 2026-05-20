import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const TOKEN = process.env.GH_TOKEN;
const OWNER = 'Shabdev92';
const REPO = 'AnxSPheonex.';
const BRANCH = 'main';
const ROOT = '/home/runner/workspace';

const EXCLUDE = new Set([
  'node_modules', '.git', 'dist', '.local', 'android', 'ios',
  '.expo', '__pycache__', '.cache', 'build', 'coverage',
  'attached_assets', 'scripts/push-to-github.mjs'
]);

const EXCLUDE_EXT = new Set(['.map', '.lock']);
const MAX_SIZE = 900 * 1024; // 900KB per file

function collectFiles(dir, results = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return results; }
  for (const entry of entries) {
    if (EXCLUDE.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stat;
    try { stat = statSync(fullPath); } catch { continue; }
    if (stat.isDirectory()) {
      collectFiles(fullPath, results);
    } else {
      const ext = entry.includes('.') ? '.' + entry.split('.').pop() : '';
      if (EXCLUDE_EXT.has(ext)) continue;
      if (stat.size > MAX_SIZE) { console.warn(`Skipping large file: ${fullPath}`); continue; }
      results.push(fullPath);
    }
  }
  return results;
}

async function githubFetch(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function createBlob(content, encoding) {
  const data = await githubFetch(`/repos/${OWNER}/${REPO}/git/blobs`, 'POST', { content, encoding });
  return data.sha;
}

async function main() {
  console.log('Collecting files...');
  const files = collectFiles(ROOT);
  console.log(`Found ${files.length} files`);

  // Get base tree SHA
  const refData = await githubFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
  const headSha = refData.object.sha;
  const commitData = await githubFetch(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`);
  const baseTreeSha = commitData.tree.sha;

  console.log(`Base commit: ${headSha}`);
  console.log('Creating blobs...');

  const treeItems = [];
  let count = 0;
  for (const filePath of files) {
    const relPath = relative(ROOT, filePath);
    let content, encoding;
    try {
      const buf = readFileSync(filePath);
      // Try to detect if binary
      const isBinary = buf.some(b => b === 0);
      if (isBinary) {
        content = buf.toString('base64');
        encoding = 'base64';
      } else {
        content = buf.toString('utf8');
        encoding = 'utf-8';
      }
      const sha = await createBlob(content, encoding);
      treeItems.push({ path: relPath, mode: '100644', type: 'blob', sha });
      count++;
      if (count % 20 === 0) console.log(`  ${count}/${files.length} blobs created...`);
    } catch (e) {
      console.warn(`  Skipping ${relPath}: ${e.message}`);
    }
  }

  console.log(`Creating tree with ${treeItems.length} files...`);
  const tree = await githubFetch(`/repos/${OWNER}/${REPO}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  console.log('Creating commit...');
  const commit = await githubFetch(`/repos/${OWNER}/${REPO}/git/commits`, 'POST', {
    message: 'Sync project from Replit',
    tree: tree.sha,
    parents: [headSha],
  });

  console.log('Updating branch ref...');
  await githubFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, 'PATCH', {
    sha: commit.sha,
    force: true,
  });

  console.log(`Done! Pushed ${treeItems.length} files to ${OWNER}/${REPO} @ ${commit.sha}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
