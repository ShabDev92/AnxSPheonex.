let baseUrl = "";

export function setApiBaseUrl(url: string) {
  baseUrl = url;
}

export function getApiUrl(): string {
  return baseUrl;
}
