
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/session";
const PublicRoute = ({ children }) => {
    if (isAuthenticated()) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};
export default PublicRoute;