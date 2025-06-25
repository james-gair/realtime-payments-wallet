import { auth } from "./firebase";

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const user = auth.currentUser;
  // no secure layer calling without auth, needed for security
  if (!user) throw new Error("not authenticated");

  const idToken = await user.getIdToken();

  const headers = {
    ...(init.headers || {}),
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };

  return fetch(input, {
    ...init,
    headers,
  });
}
