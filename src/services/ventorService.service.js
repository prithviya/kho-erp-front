import { request } from "./apiClient";

const ventorServiceService = {

    // Get all vendor services
    getAll() {
        return request("/ventorservices");
    },

    // Get services by vendor
    getByVendor(vid) {
        return request(`/ventorservices/vendor/${vid}`);
    },

    // Get service by ID
    getById(vserid) {
        return request(`/ventorservices/${vserid}`);
    },

    // Create vendor service
    create(payload) {
        return request("/ventorservices", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    // Update vendor service
    update(vserid, payload) {
        return request(`/ventorservices/${vserid}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    // Delete vendor service
    delete(vserid) {
        return request(`/ventorservices/${vserid}`, {
            method: "DELETE",
        });
    },
};

export default ventorServiceService;