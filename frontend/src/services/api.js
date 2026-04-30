import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getResponseStatus(error) {
  return error?.response?.status;
}

async function with404Fallback(requests) {
  let lastError;

  for (const makeRequest of requests) {
    try {
      return await makeRequest();
    } catch (error) {
      lastError = error;

      if (getResponseStatus(error) !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
}

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

export async function getAllUsers() {
  const response = await api.get("/api/admin/users");
  return response.data;
}

export async function updateUserDetails(id, details) {
  const response = await api.put(`/api/admin/users/${id}`, details);
  return response.data;
}

export async function deleteUser(id) {
  await api.delete(`/api/admin/users/${id}`);
}

export async function getUserPing() {
  const response = await api.get("/api/user/ping");
  return response.data;
}

/* ================= PROFILE ================= */

export async function getProfile() {
  const response = await api.get("/api/profile");
  return response.data;
}

export async function updateProfileImage(base64Image) {
  const response = await api.patch("/api/profile/image", {
    image: base64Image,
  });
  return response.data;
}

/* ================= NOTIFICATIONS ================= */

export async function getNotifications() {
  const response = await api.get("/api/notifications");
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get("/api/notifications/unread-count");
  return response.data;
}

export async function markNotificationAsRead(id) {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead() {
  await api.patch("/api/notifications/read-all");
}

/* ================= TICKETS ================= */

export async function createTicket(payload, images = []) {
  const formData = new FormData();

  formData.append(
    "payload",
    new Blob([JSON.stringify(payload)], {
      type: "application/json",
    }),
  );

  images.slice(0, 3).forEach((image) => {
    formData.append("images", image);
  });

  const response = await api.post("/api/tickets", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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
  const response = await api.patch(`/api/tickets/${id}/assign`, {
    technicianEmail,
  });
  return response.data;
}

export async function resolveTicket(id, resolutionNotes) {
  const response = await api.patch(`/api/tickets/${id}/resolve`, {
    resolutionNotes,
  });
  return response.data;
}

export async function addComment(id, text) {
  const response = await api.post(`/api/tickets/${id}/comments`, { text });
  return response.data;
}

export async function editComment(id, commentId, text) {
  const response = await api.patch(`/api/tickets/${id}/comments/${commentId}`, {
    text,
  });
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
  const response = await api.delete(
    `/api/tickets/${id}/images/${encodeURIComponent(fileName)}`,
  );
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

/* ================= RESOURCES ================= */

export async function getResources(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      params.append(key, value);
    }
  });

  const query = params.toString();
  const response = await api.get(`/api/resources${query ? `?${query}` : ""}`);
  return response.data;
}

export async function createResource(payload) {
  const response = await api.post("/api/resources", payload);
  return response.data;
}

export async function updateResource(id, payload) {
  const response = await api.put(`/api/resources/${id}`, payload);
  return response.data;
}

export async function updateResourceStatus(id, status) {
  const response = await api.patch(`/api/resources/${id}/status`, { status });
  return response.data;
}

export async function deleteResource(id) {
  const response = await api.delete(`/api/resources/${id}`);
  return response.data;
}

/* ================= BOOKINGS ================= */

export async function createBooking(payload) {
  const response = await with404Fallback([
    () => api.post("/api/bookings", payload),
    () => api.post("/api/bookings/create", payload),
  ]);
  return response.data;
}

export async function getMyBookings(page) {
  const query = page !== undefined && page !== null ? `?page=${page}` : "";
  const response = await with404Fallback([
    () => api.get(`/api/bookings/user/my-bookings${query}`),
    () => api.get(`/api/bookings/my-bookings${query}`),
    () => api.get(`/api/bookings/my${query}`),
  ]);
  return response.data;
}

export async function getPendingBookings() {
  const response = await with404Fallback([
    () => api.get("/api/bookings/admin/pending"),
    () => api.get("/api/bookings/pending"),
  ]);
  return response.data;
}

export async function getAllBookings() {
  const response = await with404Fallback([
    () => api.get("/api/bookings/admin/all"),
    () => api.get("/api/bookings/all"),
  ]);
  return response.data;
}

export async function getResourceBookings(resourceId) {
  const response = await with404Fallback([
    () => api.get(`/api/bookings/resource/${resourceId}`),
    () => api.get(`/api/resources/${resourceId}/bookings`),
  ]);
  return response.data;
}

export async function getBookingById(id) {
  const response = await api.get(`/api/bookings/${id}`);
  return response.data;
}

export async function approveBooking(id, approved, rejectionReason = "") {
  const response = await with404Fallback([
    () =>
      api.put(`/api/bookings/${id}/approve`, {
        approved,
        rejectionReason,
      }),
    () =>
      api.put(`/api/bookings/${id}/approval`, {
        approved,
        rejectionReason,
      }),
  ]);
  return response.data;
}

export async function cancelBooking(id) {
  const response = await with404Fallback([
    () => api.delete(`/api/bookings/${id}/cancel`),
    () => api.delete(`/api/bookings/${id}`),
  ]);
  return response.data;
}

/* ================= GOOGLE LOGIN ================= */

export function getGoogleLoginUrl() {
  return `${api.defaults.baseURL}/oauth2/authorization/google`;
}

export default api;
