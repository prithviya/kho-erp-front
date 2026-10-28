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
    },
    update(taskId, messageId, payload) {
        if (payload instanceof FormData) {
            return request(`/task-chat/${taskId}/messages/${messageId}`, { method: "PUT", body: payload });
        }
        return request(`/task-chat/${taskId}/messages/${messageId}`, {
            method: "PUT",
            body: JSON.stringify({ message: payload })
        });
    },
    remove(taskId, messageId) {
        return request(`/task-chat/${taskId}/messages/${messageId}`, { method: "DELETE" });
    }
};

export default taskChatService;
