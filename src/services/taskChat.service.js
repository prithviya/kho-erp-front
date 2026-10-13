import { request } from "./apiClient";

const taskChatService = {
    list(taskId) {
        return request(`/task-chat/${taskId}`);
    },
    send(taskId, payload) {
        if (payload instanceof FormData) {
            return request(`/task-chat/${taskId}`, { method: "POST", body: payload });
        }
        return request(`/task-chat/${taskId}`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }
};

export default taskChatService;
