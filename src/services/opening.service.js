import { request } from "./apiClient";

const jobOpeningServices = {
    // Get all openings
    async getOpenings() {
        try {
            return await request("/openings");
        } catch (error) {
            console.error('Get Openings Error:', error);
            throw error;
        }
    },

    // Create new opening
    async createOpening(data) {
        try {
            return await request("/openings", {
                method: 'POST',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Create Opening Error:', error);
            throw error;
        }
    },

    // Update opening
    async updateOpening(id, data) {
        try {
            return await request(`/openings/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Update Opening Error:', error);
            throw error;
        }
    },

    // Update status only
    async updateStatus(id, isActive) {
        try {
            return await request(`/openings/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive }),
            });
        } catch (error) {
            console.error('Update Status Error:', error);
            throw error;
        }
    },

    // Delete opening
    async deleteOpening(id) {
        try {
            return await request(`/openings/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Delete Opening Error:', error);
            throw error;
        }
    },

    // Get opening by ID
    async getOpeningById(id) {
        try {
            return await request(`/openings/${id}`);
        } catch (error) {
            console.error('Get Opening Error:', error);
            throw error;
        }
    },

    // Get active openings only
    async getActiveOpenings() {
        try {
            return await request('/openings/active');
        } catch (error) {
            console.error('Get Active Openings Error:', error);
            throw error;
        }
    }
};

export default jobOpeningServices;