import { request } from "./apiClient";

const departmentService = {
    getDepartments(params = {}) {
        const query = new URLSearchParams(params).toString();

        return request(
            `/departments${query ? `?${query}` : ""}`
        );
    },

    getById(id) {
        return request(`/departments/${id}`);
    },

    create(payload) {
        return request("/departments", {
            method: "POST",
            body: JSON.stringify({
                name: payload.name,
                isActive: payload.isActive ?? true,
            }),
        });
    },

    update(id, payload) {
        return request(`/departments/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: payload.name,
                isActive: payload.isActive ?? true,
            }),
        });
    },

    delete(id) {
        return request(`/departments/${id}`, {
            method: "DELETE",
        });
    },
};

export default departmentService;