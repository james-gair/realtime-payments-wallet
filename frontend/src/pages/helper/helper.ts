    import { authFetch } from "../../services/firebaseFetch"; 


export async function fetchTransactions<T = unknown>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  options: Omit<RequestInit, "method"> = {},
): Promise<T> {
  // authFetch wraps normal fetch with your token logic
  const response = await authFetch(url, {
    method,
    ...options,          // allow caller‑supplied headers, body, etc.
  });

  if (!response.ok) {
    // Surface HTTP errors as thrown promises
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }

  // Type assertion uses the generic <T>
  return (await response.json()) as T;
}