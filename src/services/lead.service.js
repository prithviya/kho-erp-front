import { request } from "./apiClient";

const leadService = {
    createLead(data) {
        return request("/lead", { method: "POST", body: JSON.stringify(data) });
    },
    getLeads(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/lead${query ? `?${query}` : ""}`);
    },
    getLeadById(id) {
        return request(`/lead/${id}`);
    },
    updateLead(id, data) {
        return request(`/lead/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteLead(id) {
        return request(`/lead/${id}`, { method: "DELETE" });
    },
    createServiceCategory(data) {
        return request("/service-categories", { method: "POST", body: JSON.stringify(data) });
    },
    updateServiceCategory(id, data) {
        return request(`/service-categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteServiceCategory(id) {
        return request(`/service-categories/${id}`, { method: "DELETE" });
    },
    createService(data) {
        return request("/services", { method: "POST", body: JSON.stringify(data) });
    },
    updateService(id, data) {
        return request(`/services/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteService(id) {
        return request(`/services/${id}`, { method: "DELETE" });
    },
    createLeadSource(data) {
        return request("/lead-sources", { method: "POST", body: JSON.stringify(data) });
    },
    updateLeadSource(id, data) {
        return request(`/lead-sources/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteLeadSource(id) {
        return request(`/lead-sources/${id}`, { method: "DELETE" });
    },
    createLeadStatus(data) {
        return request("/lead-statuses", { method: "POST", body: JSON.stringify(data) });
    },
    updateLeadStatus(id, data) {
        return request(`/lead-statuses/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteLeadStatus(id) {
        return request(`/lead-statuses/${id}`, { method: "DELETE" });
    },

    // Lookup data for the create/edit form
    getLeadSources() { return request("/lead-sources"); },
    getLeadStatuses() { return request("/lead-statuses"); },
    getCategoriesWithServices() { return request("/service-categories/with-services"); },
    getUsers() { return request("/users"); },
};

export default leadService;
