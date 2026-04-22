import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export async function getCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data;
}

export async function logout() {
  await api.post("/logout");
}

export async function getAdminPing() {
  const response = await api.get("/api/admin/ping");
  return response.data;
}

export async function getUserPing() {
  const response = await api.get("/api/user/ping");
  return response.data;
}

export function getGoogleLoginUrl() {
  return `${api.defaults.baseURL}/oauth2/authorization/google`;
}

export default api;
