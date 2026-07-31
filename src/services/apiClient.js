import { clearSession, getSession } from "../utils/session";

const BASE_URL = import.meta.env.VITE_API_URL;

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function refreshSession() {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await parseJsonSafe(response);
    return {
      ok: response.ok && Boolean(result?.success),
      result,
    };
  } catch {
    return { ok: false, result: null };
  }
}

export async function request(url, options = {}, retry = true) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed.ok) {
      return request(url, options, false);
    }

    clearSession();
    window.location.href = "/";
    return null;
  }

  const result = await parseJsonSafe(response);
  if (!response.ok) {
    const err = new Error(result?.message || "Something went wrong.");
    err.status = response.status;
    err.errors = result?.errors || null;
    throw err;
  }

  return result;
}

export function getCurrentUserSession() {
  return getSession();
}