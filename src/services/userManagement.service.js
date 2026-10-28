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
    getDirectory() {
        return request("/users/directory");
    },
    getRoles() {
        return request("/roles");
    },
    getManageRoles() {
        return request("/roles/manage");
    },
    createRole(payload) {
        return request("/roles", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    updateRole(id, payload) {
        return request(`/roles/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    deleteRole(id) {
        return request(`/roles/${id}`, { method: "DELETE" });
    },
    getRolePermissionMatrix(roleId = "new") {
        return request(`/roles/${roleId}/permission-matrix`);
    },
    getPermissionCatalog() {
        return request("/roles/permission-catalog");
    },
    initializePermissionCatalog() {
        return request("/roles/permission-catalog/initialize", {
            method: "POST",
            body: JSON.stringify({})
        });
    },
    getMyMenus() {
        return request("/menus/my");
    },
    getMenus() {
        return request("/menus");
    },
    createMenu(payload) {
        return request("/menus", { method: "POST", body: JSON.stringify(payload) });
    },
    updateMenu(id, payload) {
        return request(`/menus/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    deleteMenu(id) {
        return request(`/menus/${id}`, { method: "DELETE" });
    },
    reorderMenus(items) {
        return request("/menus/reorder", { method: "PUT", body: JSON.stringify({ items }) });
    },
    addMenuAction(id, action) {
        return request(`/menus/${id}/actions`, { method: "POST", body: JSON.stringify({ action }) });
    },
    removeMenuAction(id, permissionId) {
        return request(`/menus/${id}/actions/${permissionId}`, { method: "DELETE" });
    }
};

export default userManagementService;
