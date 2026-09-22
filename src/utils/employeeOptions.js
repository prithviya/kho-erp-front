const SUPERADMIN_ID = 1;
const SUPERADMIN_EMAIL = "admin@gmail.com";

export function isExcludedSuperadmin(user) {
  const roleCodes = (Array.isArray(user?.roles) ? user.roles : [])
    .map((role) => String(role?.code || role?.name || "").trim().toUpperCase().replace(/[\s_-]+/g, ""));

  return Number(user?.id ?? user?.userId) === SUPERADMIN_ID
    || String(user?.email || "").trim().toLowerCase() === SUPERADMIN_EMAIL
    || roleCodes.includes("SUPERADMIN");
}

export function filterEmployeeOptions(users = []) {
  return (Array.isArray(users) ? users : []).filter((user) => !isExcludedSuperadmin(user));
}