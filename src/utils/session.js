export const SESSION_KEY = "erp_session";
export const getSession = () => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
};
export const setSession = (data) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
};
export const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
};
export const isAuthenticated = () => {
    return !!getSession()?.user;
};