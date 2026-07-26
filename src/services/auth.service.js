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
    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers
    });
    // Token Expired
    if (response.status === 401 && retry && session?.refreshToken) {
        const refreshed = await refreshToken(session.refreshToken);
        if (refreshed.success) {
            const newSession = {
                ...session,
                accessToken: refreshed.data.accessToken,
                refreshToken: refreshed.data.refreshToken
            };
            setSession(newSession);
            return request(url, options, false);
        }
        clearSession();
        window.location.href = "/";
        return;
    }
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }
    return result;
}

async function refreshToken(refreshTokenValue) {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                refreshToken: refreshTokenValue
            })
        });
        return await response.json();
    } catch {
        return {
            success: false
        };
    }
}

const authService = {
    login(data) {
        return request("/auth/login", {
            method: "POST",
            body: JSON.stringify(data)
        }, false);
    },
    register(data) {
        return request("/auth/register", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    forgotPassword(data) {
        return request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    resetPassword(data) {
        return request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    changePassword(data) {
        return request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    getProfile() {
        return request("/auth/profile");
    },
    updateProfile(data) {
        return request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },
    getSessions() {
        return request("/auth/sessions");
    },
    removeSession(id) {
        return request(`/auth/sessions/${id}`, {
            method: "DELETE"
        });
    },
    logout(refreshToken) {
        return request("/auth/logout", {
            method: "POST",
            body: JSON.stringify({
                refreshToken
            })
        });
    },
    logoutAll() {
        return request("/auth/logout-all", {
            method: "POST"
        });
    }
};
export default authService;