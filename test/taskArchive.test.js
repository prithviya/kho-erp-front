import test from 'node:test';
import assert from 'node:assert/strict';
import { getTaskArchiveAt, isTaskArchived } from '../src/utils/taskArchive.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const completedAt = '2026-01-01T10:00:00.000Z';
const completionTime = new Date(completedAt).getTime();

test('keeps completed tasks active until two full days have elapsed', () => {
  const task = { status: 'COMPLETED', completedAt };

  assert.equal(getTaskArchiveAt(task), completionTime + 2 * DAY_MS);
  assert.equal(isTaskArchived(task, completionTime + 2 * DAY_MS - 1), false);
  assert.equal(isTaskArchived(task, completionTime + 2 * DAY_MS), true);
});

test('does not archive reopened tasks or completed tasks without a valid completion date', () => {
  assert.equal(isTaskArchived({ status: 'TODO', completedAt }, completionTime + 3 * DAY_MS), false);
  assert.equal(isTaskArchived({ status: 'COMPLETED' }, completionTime + 3 * DAY_MS), false);
  assert.equal(isTaskArchived({ status: 'COMPLETED', completedAt: 'invalid' }, completionTime + 3 * DAY_MS), false);
});
