import { request } from "./apiClient";

const jobOpeningServices = {

    getOpenings(params = {}) {
        const query = new URLSearchParams(params).toString();

        return request(
            `/openings${query ? `?${query}` : ""}`
        );
    },

    createOpening(data) {
        return request("/openings", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

};

export default jobOpeningServices;