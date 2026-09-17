import { request } from "./apiClient";

function getTaskList(response) {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    return data?.tasks || data?.items || data?.rows || [];
}

export const TASK_STATUSES = [
    { value: "TODO", label: "To Do", badge: "bg-gray-100 text-gray-700", column: "border-gray-300" },
    { value: "IN_PROGRESS", label: "In Progress", badge: "bg-blue-100 text-blue-700", column: "border-blue-400" },
    { value: "REVIEW", label: "Review", badge: "bg-amber-100 text-amber-700", column: "border-amber-400" },
    { value: "COMPLETED", label: "Completed", badge: "bg-emerald-100 text-emerald-700", column: "border-emerald-400" }
];

export const TASK_PRIORITIES = [
    { value: "LOW", label: "Low", badge: "bg-slate-100 text-slate-600" },
    { value: "MEDIUM", label: "Medium", badge: "bg-sky-100 text-sky-700" },
    { value: "HIGH", label: "High", badge: "bg-red-100 text-red-700" }
];

export const getStatusMeta = (value) =>
    TASK_STATUSES.find((s) => s.value === value) || TASK_STATUSES[0];

export const getPriorityMeta = (value) =>
    TASK_PRIORITIES.find((p) => p.value === value) || TASK_PRIORITIES[1];

const taskService = {
    getTasks(params = {}) {
        const query = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined))
        ).toString();
        return request(`/tasks${query ? `?${query}` : ""}`).then((response) => ({
            ...response,
            data: getTaskList(response)
        }));
    },
    getTaskById(id) {
        return request(`/tasks/${id}`);
    },
    createTask(payload) {
        return request("/tasks", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    updateTask(id, payload) {
        return request(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    updateStatus(id, status) {
        return request(`/tasks/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });
    },
    deleteTask(id) {
        return request(`/tasks/${id}`, { method: "DELETE" });
    }
};

export default taskService;
