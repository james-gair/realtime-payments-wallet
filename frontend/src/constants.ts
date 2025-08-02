// src/constants.ts
if (!import.meta.env.VITE_BACKEND_URL) {
  throw new Error("Missing VITE_BACKEND_URL");
}
export const { VITE_BACKEND_URL } = import.meta.env;
