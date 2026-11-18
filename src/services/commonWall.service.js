import { request } from "./apiClient";

const commonWallService = {
  getOverview() {
    return request("/common-wall");
  },
  getAnnouncementCount() {
    return request("/common-wall/announcement-count");
  },
};

export default commonWallService;
