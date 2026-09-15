import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ArrowLeft, ArrowRight, CalendarDays, RefreshCcw, X } from "lucide-react";
import taskService, { TASK_STATUSES, getPriorityMeta, getStatusMeta } from "../../services/task.service";
import { getCurrentUser, hasAnyRole, isSuperAdmin } from "../../utils/auth";

function userName(user) {
  if (!user) return "-";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "-";
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function isOverdue(task) {
  if (!task?.dueDate || task.status === "COMPLETED") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

const STATUS_ORDER = TASK_STATUSES.map((s) => s.value);

export default function TaskBoard() {
  const currentUser = getCurrentUser();
  const superAdmin = isSuperAdmin();
  const manager = hasAnyRole(["MANAGER"]);

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [scope, setScope] = useState("all"); // "all" | "mine" (only meaningful for managers / super admins)

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await taskService.getTasks();
      setTasks(res?.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const projectOptions = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (t.project?.id) map.set(t.project.id, t.project.projectName);
    });
    return [...map.entries()];
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (projectFilter && String(t.project?.id) !== String(projectFilter)) return false;
      if (scope === "mine" && Number(t.assignedToId) !== Number(currentUser?.id)) return false;
      return true;
    });
  }, [tasks, projectFilter, scope, currentUser]);

  const columns = useMemo(
    () => TASK_STATUSES.map((status) => ({
      ...status,
      tasks: visibleTasks.filter((t) => t.status === status.value)
    })),
    [visibleTasks]
  );

  const canMove = (task) =>
    superAdmin
    || Number(task.assignedToId) === Number(currentUser?.id)
    || Number(task.reportingHeadId) === Number(currentUser?.id)
    || Number(task.createdBy) === Number(currentUser?.id);

  const moveTask = async (task, direction) => {
    const index = STATUS_ORDER.indexOf(task.status);
    const nextStatus = STATUS_ORDER[index + direction];
    if (!nextStatus || busyId) return;
    try {
      setBusyId(task.id);
      await taskService.updateStatus(task.id, nextStatus);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
      if (selectedTask?.id === task.id) setSelectedTask((prev) => ({ ...prev, status: nextStatus }));
    } catch (err) {
      toast.error(err.message || "Failed to move task.");
    } finally {
      setBusyId(null);
    }
  };

  const heading = superAdmin ? "All Tasks" : manager ? "Team Tasks" : "My Tasks";
  const subheading = superAdmin
    ? "Every task across all projects"
    : manager
      ? "Tasks you report on and tasks assigned to you"
      : "Tasks assigned to you";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
          <p className="text-xs text-gray-500">{subheading}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(superAdmin || manager) && (
            <div className="inline-flex rounded-lg bg-white p-0.5 shadow-sm">
              {[{ value: "all", label: "All" }, { value: "mine", label: "Assigned to me" }].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScope(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${scope === opt.value ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">
            <option value="">All projects</option>
            {projectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <button type="button" onClick={loadTasks} title="Refresh" className="rounded-lg bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-100">
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => (
            <div key={column.value} className={`flex min-h-[60vh] flex-col rounded-xl border-t-4 bg-white shadow-sm ${column.column}`}>
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-800">{column.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${column.badge}`}>{column.tasks.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {column.tasks.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-gray-400">No tasks</p>
                ) : (
                  column.tasks.map((task) => {
                    const priority = getPriorityMeta(task.priority);
                    const due = formatDate(task.dueDate);
                    const index = STATUS_ORDER.indexOf(task.status);
                    const movable = canMove(task);
                    return (
                      <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                        <button type="button" onClick={() => setSelectedTask(task)} className="w-full text-left">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {task.project?.projectName}{task.service?.name ? ` · ${task.service.name}` : ""}
                          </p>
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priority.badge}`}>{priority.label}</span>
                          {due && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${isOverdue(task) ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              <CalendarDays size={11} /> {due}
                            </span>
                          )}
                          {(superAdmin || manager) && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] text-purple-700">{userName(task.assignee)}</span>
                          )}
                        </div>
                        {movable && (
                          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2">
                            <button
                              type="button"
                              onClick={() => moveTask(task, -1)}
                              disabled={index === 0 || busyId === task.id}
                              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                            >
                              <ArrowLeft size={12} /> {index > 0 ? getStatusMeta(STATUS_ORDER[index - 1]).label : ""}
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(task, 1)}
                              disabled={index === STATUS_ORDER.length - 1 || busyId === task.id}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-30"
                            >
                              {index < STATUS_ORDER.length - 1 ? getStatusMeta(STATUS_ORDER[index + 1]).label : ""} <ArrowRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedTask(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">Task Details</h2>
                <button type="button" onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4 px-6 py-5 text-sm">
                <div>
                  <p className="text-base font-semibold text-gray-900">{selectedTask.title}</p>
                  <p className="text-xs text-gray-500">
                    {selectedTask.project?.projectName} · {selectedTask.project?.companyName}
                    {selectedTask.service?.name ? ` · ${selectedTask.service.name}` : ""}
                  </p>
                </div>
                {selectedTask.description && (
                  <p className="whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-gray-700">{selectedTask.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned To</p>
                    <p className="text-gray-800">{userName(selectedTask.assignee)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reporting Head</p>
                    <p className="text-gray-800">{userName(selectedTask.reportingHead)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priority</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityMeta(selectedTask.priority).badge}`}>{getPriorityMeta(selectedTask.priority).label}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusMeta(selectedTask.status).badge}`}>{getStatusMeta(selectedTask.status).label}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Due Date</p>
                    <p className={isOverdue(selectedTask) ? "font-medium text-red-600" : "text-gray-800"}>{formatDate(selectedTask.dueDate) || "-"}</p>
                  </div>
                </div>
                {canMove(selectedTask) && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Move To</p>
                    <div className="flex flex-wrap gap-2">
                      {TASK_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={s.value === selectedTask.status || busyId === selectedTask.id}
                          onClick={async () => {
                            try {
                              setBusyId(selectedTask.id);
                              await taskService.updateStatus(selectedTask.id, s.value);
                              setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, status: s.value } : t)));
                              setSelectedTask((prev) => ({ ...prev, status: s.value }));
                            } catch (err) {
                              toast.error(err.message || "Failed to move task.");
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${s.badge} disabled:opacity-40`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
