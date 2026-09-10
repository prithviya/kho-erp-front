import { request } from "./apiClient";

const leadService = {
    createLead(data) {
        return request("/lead", { method: "POST", body: JSON.stringify(data) });
    },
    getLeads(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/lead${query ? `?${query}` : ""}`, {
            cache: "no-store",
        });
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
    async getLeadSources(options = {}) { 
        const res = await request("/lead-sources"); 
        if (!options.all && res?.data) {
            res.data = res.data.filter(x => x.isActive !== false);
        }
        return res;
    },
    async getLeadStatuses(options = {}) { 
        const res = await request("/lead-statuses"); 
        if (!options.all && res?.data) {
            res.data = res.data.filter(x => x.isActive !== false);
        }
        return res;
    },
    async getCategoriesWithServices(options = {}) { 
        const res = await request("/service-categories/with-services"); 
        if (!options.all && res?.data) {
            res.data = res.data.filter(c => c.isActive !== false).map(c => {
                if (c.services) {
                    c.services = c.services.filter(s => s.isActive !== false);
                }
                return c;
            });
        }
        return res;
    },
    getUsers() { return request("/users"); },
};

export default leadService;
