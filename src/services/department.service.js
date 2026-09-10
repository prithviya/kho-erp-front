import { request } from "./apiClient";

const departmentService = {
    async getDepartments(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await request(`/departments${query ? `?${query}` : ""}`);
        if (!params.all && res?.data) {
            res.data = res.data.filter(x => x.isActive !== false);
        }
        return res;
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