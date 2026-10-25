import { request } from "./apiClient";

const notificationService = {
  list: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),
  remove: (id) => request(`/notifications/${id}`, { method: "DELETE" })
};

export default notificationService;
