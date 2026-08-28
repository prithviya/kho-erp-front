import { request } from "./apiClient";

const ventorService = {

    // Get all vendors
    getVendors(params = {}) {
        const query = new URLSearchParams(params).toString();

        return request(
            `/ventor${query ? `?${query}` : ""}`
        );
    },

    // Get vendor by ID
    getById(vid) {
        return request(`/ventor/${vid}`);
    },

    // Create vendor
    create(payload) {
        return request("/ventor", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    // Update vendor
    update(vid, payload) {
        return request(`/ventor/${vid}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    // Delete vendor
    delete(vid) {
        return request(`/ventor/${vid}`, {
            method: "DELETE",
        });
    },
};

export default ventorService;