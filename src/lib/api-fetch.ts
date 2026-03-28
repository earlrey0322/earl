export async function apiFetch(url: string, options: RequestInit = {}) {
  const isGet = !options.method || options.method === "GET";
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isGet) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
