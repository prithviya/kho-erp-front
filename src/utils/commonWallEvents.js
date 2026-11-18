export const COMMON_WALL_COUNT_EVENT = "common-wall-announcement-count";

export function publishAnnouncementCount(count) {
  window.dispatchEvent(new CustomEvent(COMMON_WALL_COUNT_EVENT, { detail: count }));
}
