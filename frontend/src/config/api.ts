/**
 * Dynamically resolves the API base URL.
 * In development, requests can use relative URLs `/api/...`
 * or explicitly point to the current host so mobile clients on LAN work seamlessly.
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.location) {
    // Relative path works with our reverse-proxy server.ts
    return "";
  }
  return "http://localhost:3000";
};

export const API_BASE_URL = getApiBaseUrl();
