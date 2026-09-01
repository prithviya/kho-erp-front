
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/session";
const PublicRoute = ({ children, allowAuthenticated = false }) => {
    if (isAuthenticated() && !allowAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};
export default PublicRoute;