import { request } from "./apiClient";

const notificationService = {
  list: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/read-all", { method: "PATCH" })
};

export default notificationService;
