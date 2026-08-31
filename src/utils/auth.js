import { getSession, clearSession } from "./session";

const ROLE_CODES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    CRM_EXECUTIVE: "CRM_EXECUTIVE",
    MANAGER: "MANAGER",
    HR: "HR",
};

const normalizeRole = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

const ROLE_ALIASES = {
    [ROLE_CODES.SUPER_ADMIN]: ["superadmin"],
    [ROLE_CODES.CRM_EXECUTIVE]: ["crmexecutive"],
    [ROLE_CODES.MANAGER]: ["manager"],
    [ROLE_CODES.HR]: ["hr"],
};

const resolveCanonicalRole = (value = "") => {
    const normalized = normalizeRole(value);

    return (
        Object.entries(ROLE_ALIASES).find(([, aliases]) =>
            aliases.includes(normalized)
        )?.[0] || null
    );
};

export const isAuthenticated = () => {
    const session = getSession();
    return !!session?.user;
};
export const getAccessToken = () => {
    return null;
};
export const getRefreshToken = () => {
    return null;
};
export const getCurrentUser = () => {
    return getSession()?.user;
};
export const getRoles = () => {
    return getSession()?.user?.roles || [];
};

export const getCanonicalRoles = (user = null) => {
    const sourceRoles = user?.roles || getRoles();

    return [...new Set(
        sourceRoles
            .flatMap((role) => [resolveCanonicalRole(role?.code), resolveCanonicalRole(role?.name)])
            .filter(Boolean)
    )];
};

export const hasRole = (roleCode) => {
    const canonical = resolveCanonicalRole(roleCode) || roleCode;
    return getCanonicalRoles().includes(canonical);
};

export const hasAnyRole = (roleCodes = []) => {
    const allowed = roleCodes
        .map((roleCode) => resolveCanonicalRole(roleCode) || roleCode)
        .filter(Boolean);

    if (allowed.length === 0) {
        return true;
    }

    return allowed.some((roleCode) => hasRole(roleCode));
};

export const getDefaultHomePath = (user = null) => {
    const roles = getCanonicalRoles(user);

    if (roles.includes(ROLE_CODES.SUPER_ADMIN)) {
        return "/dashboard";
    }

    if (roles.includes(ROLE_CODES.CRM_EXECUTIVE)) {
        return "/lead-overview";
    }

    if (roles.includes(ROLE_CODES.MANAGER)) {
        return "/onboard-prjt";
    }

    if (roles.includes(ROLE_CODES.HR)) {
        return "/onboarding";
    }

    return "/dashboard";
};

export const hasPermission = (permissionKey) => {
    const roles = getRoles();
    return roles.some(role =>
        role.permissions?.some(permission =>
            permission.permissionKey === permissionKey
        )
    );
};
export const logout = () => {
    clearSession();
    window.location.href = "/";
};

export { ROLE_CODES };