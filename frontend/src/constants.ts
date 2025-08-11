// import env for the backend url, used in authfetch
if (!import.meta.env.VITE_BACKEND_URL) {
  throw new Error("Missing VITE_BACKEND_URL");
}
export const { VITE_BACKEND_URL } = import.meta.env;
