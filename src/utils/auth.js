import { getSession, clearSession } from "./session";

const ROLE_CODES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    CRM_EXECUTIVE: "CRM_EXECUTIVE",
    MANAGER: "MANAGER",
    CEO: "CEO",
    HR: "HR",
    TEAM_MEMBER: "TEAM_MEMBER",
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
    [ROLE_CODES.CEO]: ["ceo"],
    [ROLE_CODES.HR]: ["hr"],
    [ROLE_CODES.TEAM_MEMBER]: ["teammember"],
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

export const isSuperAdmin = () => hasRole(ROLE_CODES.SUPER_ADMIN);

// Keep the existing per-account delete switch in addition to role grants.
export const canDeleteRecords = (moduleCode = null) =>
    getCurrentUser()?.canDelete !== false
    && (isSuperAdmin() || Boolean(moduleCode && hasModulePermission(`${moduleCode}.delete`)));

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

    const accessiblePages = [
        ["dashboard.view", "/dashboard"],
        ["lead_management.view", "/lead-overview"],
        ["reports.view", "/report"],
        ["project_onboard.view", "/onboard-prjt"],
        ["project_details.view", "/prjt-details"],
        ["assign_board.view", "/assign-board"],
        ["opening.view", "/job"],
        ["applied.view", "/applied"],
        ["recruitment.view", "/recruitment-process"],
        ["onboarding.view", "/onboarding"],
        ["employee.view", "/employee"],
        ["payroll_management.view", "/payroll"],
        ["leave.view", "/leave"],
        ["user_management.view", "/user-management"],
        ["master.view", "/master"],
        ["vendor_management.view", "/vendor-overview"],
    ];
    const sourceRoles = user?.roles || getRoles();
    const accessiblePage = accessiblePages.find(([permissionKey]) =>
        sourceRoles.some((role) => {
            if (role.isActive === false) return false;
            const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
            return permissions.some((permission) => permission.permissionKey === permissionKey);
        })
    );

    return accessiblePage?.[1] || "/profile";
};

export const hasPermission = (permissionKey) => {
    const roles = getRoles();
    return roles.some(role =>
        role.permissions?.some(permission =>
            permission.permissionKey === permissionKey
        )
    );
};

// Latest permission keys fetched from the server (null until fetched or for Super Admin).
let livePermissionKeys = null;
export const setLivePermissionKeys = (keys) => {
    livePermissionKeys = Array.isArray(keys) ? new Set(keys) : null;
};

export const hasModulePermission = (permissionKey) => {
    if (!permissionKey || isSuperAdmin()) {
        return true;
    }

    if (livePermissionKeys) {
        return livePermissionKeys.has(permissionKey);
    }

    return getRoles().some((role) => (
        role.isActive !== false
        && role.permissions?.some((permission) => permission.permissionKey === permissionKey)
    ));
};
export const logout = () => {
    clearSession();
    window.location.href = "/";
};

export { ROLE_CODES };