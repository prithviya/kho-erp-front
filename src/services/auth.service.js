import { request } from "./apiClient";

const authService = {
    login(data) {
        return request("/auth/login", {
            method: "POST",
            body: JSON.stringify(data)
        }, false);
    },
    register(data) {
        return request("/auth/register", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    forgotPassword(data) {
        return request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    resetPassword(data) {
        return request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    changePassword(data) {
        return request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    getProfile() {
        return request("/auth/profile");
    },
    updateProfile(data) {
        return request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },
    getSessions() {
        return request("/auth/sessions");
    },
    removeSession(id) {
        return request(`/auth/sessions/${id}`, {
            method: "DELETE"
        });
    },
    logout() {
        return request("/auth/logout", {
            method: "POST"
        });
    },
    logoutAll() {
        return request("/auth/logout-all", {
            method: "POST"
        });
    }
};
export default authService;