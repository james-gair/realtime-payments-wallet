import { authFetch } from "./firebaseFetch";

export const getProfile = async () => {
  const res = await authFetch("http://localhost:4000/api/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

export const updateProfile = async (data: {
  email: string;
  phone: string;
  billing_address: string;
}) => {
  const res = await authFetch("http://localhost:4000/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
};