import { request, requestBlob } from "./apiClient";

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value != null) params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

const activityLogService = {
  list(filters) {
    return request(`/activity-logs${buildQuery(filters)}`);
  },
  filters() {
    return request("/activity-logs/filters");
  },
  exportExcel(filters) {
    return requestBlob(`/activity-logs/export${buildQuery(filters)}`);
  },
};

export default activityLogService;
