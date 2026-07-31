import { request } from "./apiClient";

const userManagementService = {
    getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/users${query ? `?${query}` : ""}`);
    },
    createUser(payload) {
        return request("/users", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    updateUser(id, payload) {
        return request(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    updateUserStatus(id, isActive) {
        return request(`/users/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ isActive })
        });
    },
    deleteUser(id) {
        return request(`/users/${id}`, { method: "DELETE" });
    },
    getRoles() {
        return request("/roles");
    }
};

export default userManagementService;
