import { Navigate } from "react-router-dom";
import { getSession } from "../utils/session";
import { getDefaultHomePath, hasAnyRole, hasModulePermission } from "../utils/auth";

const RoleRoute = ({ roles, permissionKey, children }) => {
    const session = getSession();

    if (!session) {
        return <Navigate to="/" replace />;
    }

    const allowed = permissionKey
        ? hasModulePermission(permissionKey, roles || [])
        : hasAnyRole(roles || []);

    if (!allowed) {
        return <Navigate to={getDefaultHomePath(session.user)} replace />;
    }

    return children;
};

export default RoleRoute;