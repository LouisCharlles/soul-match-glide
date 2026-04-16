import { getApiBaseUrl, getStoredAccessToken } from "@/lib/api";

function toWebSocketBaseUrl(httpBaseUrl: string) {
  if (httpBaseUrl.startsWith("https://")) {
    return `wss://${httpBaseUrl.slice("https://".length)}`;
  }
  if (httpBaseUrl.startsWith("http://")) {
    return `ws://${httpBaseUrl.slice("http://".length)}`;
  }
  return httpBaseUrl;
}

export function buildWebSocketUrl(path: string) {
  const token = getStoredAccessToken();
  if (!token) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = toWebSocketBaseUrl(getApiBaseUrl());
  const separator = normalizedPath.includes("?") ? "&" : "?";
  return `${baseUrl}${normalizedPath}${separator}token=${encodeURIComponent(token)}`;
}
