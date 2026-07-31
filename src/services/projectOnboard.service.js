import { request } from "./apiClient";

const projectOnboardService = {
    list() {
        return request("/project-onboards");
    },
    getById(id) {
        return request(`/project-onboards/${id}`);
    },
    create(payload) {
        return request("/project-onboards", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    update(id, payload) {
        return request(`/project-onboards/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    assign(id, payload) {
        return request(`/project-onboards/${id}/assign`, {
            method: "PATCH",
            body: JSON.stringify(payload)
        });
    }
};

export default projectOnboardService;
