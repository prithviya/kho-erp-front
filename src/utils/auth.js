import { getSession, clearSession } from "./session";
export const isAuthenticated = () => {
    const session = getSession();
    return !!session?.accessToken;
};
export const getAccessToken = () => {
    return getSession()?.accessToken;
};
export const getRefreshToken = () => {
    return getSession()?.refreshToken;
};
export const getCurrentUser = () => {
    return getSession()?.user;
};
export const getRoles = () => {
    return getSession()?.user?.roles || [];
};
export const hasRole = (roleCode) => {
    const roles = getRoles();
    return roles.some(role => role.code === roleCode);
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