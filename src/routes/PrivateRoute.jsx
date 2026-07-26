import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/session";
const PrivateRoute = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    return children;
};
export default PrivateRoute;