import { request } from "./apiClient";

const dashboardService = {
    getOverview() {
        return request("/dashboard/overview");
    }
};

export default dashboardService;
