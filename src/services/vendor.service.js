import { request } from "./apiClient"; // adjust the path to your request helper file

const vendorService = {
  getAll: async () => {
    return request("/vendor", {
      method: "GET",
    });
  },

  getById: async (id) => {
    return request(`/vendor/${id}`, {
      method: "GET",
    });
  },

  create: async (data) => {
    return request("/vendor", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return request(`/vendor/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return request(`/vendor/${id}`, {
      method: "DELETE",
    });
  },
};

export default vendorService;