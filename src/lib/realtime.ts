import { getApiBaseUrl } from "@/lib/api";

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
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = toWebSocketBaseUrl(getApiBaseUrl());
  return `${baseUrl}${normalizedPath}`;
}
