import { request } from "./apiClient"; // adjust the path to your request helper file

const vendorService = {
  getAll: async () => {
    return request("/vendors", {
      method: "GET",
    });
  },

  getById: async (id) => {
    return request(`/vendors/${id}`, {
      method: "GET",
    });
  },

  create: async (data) => {
    return request("/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return request(`/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return request(`/vendors/${id}`, {
      method: "DELETE",
    });
  },
};

export default vendorService;