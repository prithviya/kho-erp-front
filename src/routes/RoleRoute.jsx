import { Navigate } from "react-router-dom";
import { getSession } from "../utils/session";
const RoleRoute = ({ roles, children }) => {
    const session = getSession();
    if (!session) {
        return <Navigate to="/" replace />;
    }
    const userRoles = session.user.roles.map(r => r.code);
    const allowed = roles.some(role => userRoles.includes(role));
    if (!allowed) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};
export default RoleRoute;