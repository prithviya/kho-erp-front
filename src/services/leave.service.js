import { request } from "./apiClient";

const leaveService = {
  getCategories() {
    return request("/leaves/categories");
  },
  createCategory(payload) {
    return request("/leaves/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCategory(id, payload) {
    return request(`/leaves/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/leaves/summary${query ? `?${query}` : ""}`);
  },
  getRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/leaves/requests${query ? `?${query}` : ""}`);
  },
  getRequestById(id) {
    return request(`/leaves/requests/${id}`);
  },
  createRequest(payload) {
    return request("/leaves/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateRequest(id, payload) {
    return request(`/leaves/requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  updateRequestStatus(id, payload) {
    return request(`/leaves/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteRequest(id) {
    return request(`/leaves/requests/${id}`, {
      method: "DELETE",
    });
  },
};

export default leaveService;
