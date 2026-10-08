import { request } from "./apiClient";

const projectChatService = {
    list(projectId) {
        return request(`/project-chat/${projectId}`);
    },
    send(projectId, payload) {
        return request(`/project-chat/${projectId}`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }
};

export default projectChatService;
