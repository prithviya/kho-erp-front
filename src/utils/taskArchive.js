const TASK_ARCHIVE_DELAY_MS = 2 * 24 * 60 * 60 * 1000;

export function getTaskArchiveAt(task) {
  if (String(task?.status || '').toUpperCase() !== 'COMPLETED' || !task.completedAt) return null;
  const completedAt = new Date(task.completedAt).getTime();
  return Number.isFinite(completedAt) ? completedAt + TASK_ARCHIVE_DELAY_MS : null;
}

export function isTaskArchived(task, now = Date.now()) {
  const archiveAt = getTaskArchiveAt(task);
  return archiveAt !== null && archiveAt <= now;
}
