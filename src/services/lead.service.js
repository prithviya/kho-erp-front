import { getSession, setSession, clearSession } from "../utils/session";

const BASE_URL = import.meta.env.VITE_API_URL;

async function request(url, options = {}, retry = true) {
    const session = getSession();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
    }
    const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

    if (response.status === 401 && retry && session?.refreshToken) {
        const refreshed = await refreshToken(session.refreshToken);
        if (refreshed.success) {
            setSession({ ...session, accessToken: refreshed.data.accessToken, refreshToken: refreshed.data.refreshToken });
            return request(url, options, false);
        }
        clearSession();
        window.location.href = "/";
        return;
    }

    const result = await response.json();
    if (!response.ok) {
        // Attach validation errors so callers can surface them per-field
        const err = new Error(result.message || "Something went wrong.");
        err.errors = result.errors || null;
        err.status = response.status;
        throw err;
    }
    return result;
}

async function refreshToken(refreshTokenValue) {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refreshTokenValue })
        });
        return await response.json();
    } catch {
        return { success: false };
    }
}

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

    // Lookup data for the create/edit form
    getLeadSources() { return request("/lead-sources"); },
    getLeadStatuses() { return request("/lead-statuses"); },
    getCategoriesWithServices() { return request("/service-categories/with-services"); },
    getUsers() { return request("/users"); },
};

export default leadService;
