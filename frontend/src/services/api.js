import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

/* ================= AUTH ================= */

export async function getCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data;
}

export async function logout() {
  await api.post("/api/auth/logout");
}

export async function registerUser(payload) {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
}

export async function loginWithEmail(payload) {
  const response = await api.post("/api/auth/login", payload);
  return response.data;
}

/* ================= TEST ================= */

export async function getAdminPing() {
  const response = await api.get("/api/admin/ping");
  return response.data;
}

export async function getUserPing() {
  const response = await api.get("/api/user/ping");
  return response.data;
}

/* ================= TICKETS ================= */

export async function createTicket(payload, images = []) {
  const formData = new FormData();

  formData.append(
    "payload",
    new Blob([JSON.stringify(payload)], {
      type: "application/json"
    })
  );

  images.slice(0, 3).forEach((image) => {
    formData.append("images", image);
  });

  const response = await api.post("/api/tickets", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
}

export async function getMyTickets() {
  const response = await api.get("/api/tickets/my");
  return response.data;
}

export async function getTicketsForRole() {
  const response = await api.get("/api/tickets");
  return response.data;
}

export async function updateTicketStatus(id, status) {
  const response = await api.patch(`/api/tickets/${id}/status`, { status });
  return response.data;
}

export async function assignTechnician(id, technicianEmail) {
  const response = await api.patch(`/api/tickets/${id}/assign`, { technicianEmail });
  return response.data;
}

export async function resolveTicket(id, resolutionNotes) {
  const response = await api.patch(`/api/tickets/${id}/resolve`, { resolutionNotes });
  return response.data;
}

export async function addComment(id, text) {
  const response = await api.post(`/api/tickets/${id}/comments`, { text });
  return response.data;
}

export async function editComment(id, commentId, text) {
  const response = await api.patch(`/api/tickets/${id}/comments/${commentId}`, { text });
  return response.data;
}

export async function deleteComment(id, commentId) {
  const response = await api.delete(`/api/tickets/${id}/comments/${commentId}`);
  return response.data;
}

export async function getTicketImages(id) {
  const response = await api.get(`/api/tickets/${id}/images`);
  return response.data;
}

export async function deleteTicketImage(id, fileName) {
  const response = await api.delete(`/api/tickets/${id}/images/${encodeURIComponent(fileName)}`);
  return response.data;
}

export async function updateTicketDetails(id, details) {
  const response = await api.put(`/api/tickets/${id}/details`, details);
  return response.data;
}

/* ================= ANALYTICS ================= */

export async function getAnalytics() {
  const response = await api.get("/api/analytics");
  return response.data;
}

/* ================= GOOGLE LOGIN ================= */

export function getGoogleLoginUrl() {
  return `${api.defaults.baseURL}/oauth2/authorization/google`;
}

export default api;