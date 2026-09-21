import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, CircleAlert, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import taskService, { TASK_PRIORITIES, TASK_STATUSES, getPriorityMeta, getStatusMeta } from "../../services/task.service";

function userName(user) {
  if (!user) return "Unassigned";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.fullName || user.email || "Unassigned";
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No due date" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MyTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks();
      setTasks(response?.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const updateStatus = async (task, status) => {
    if (status === task.status) return;
    try {
      setBusyId(task.id);
      await taskService.updateStatus(task.id, status);
      await loadTasks();
    } catch (error) {
      toast.error(error.message || "Failed to update task status.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
          <p className="text-xs text-gray-500">Track work and keep task status current.</p>
        </div>
        <button type="button" onClick={loadTasks} disabled={loading} title="Refresh tasks" className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !tasks.length ? (
        <div className="flex justify-center rounded-xl bg-white py-16 text-gray-500"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status.value);
            return (
              <section key={status.value} className={`min-h-64 rounded-xl border-t-4 bg-white p-3 shadow-sm ${status.column}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">{status.label}</h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{columnTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const priority = getPriorityMeta(task.priority);
                    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
                    return (
                      <article key={task.id} className="rounded-lg border border-gray-200 p-3 shadow-sm">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                          {task.status === "COMPLETED" ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : overdue ? <CircleAlert size={16} className="shrink-0 text-red-500" /> : null}
                        </div>
                        <p className="mb-3 text-xs text-gray-500">{task.project?.projectName || `Project #${task.projectOnboardId}`}</p>
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.badge}`}>{priority.label}</span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{userName(task.assignee)}</span>
                        </div>
                        <div className={`mb-3 flex items-center gap-1 text-xs ${overdue ? "text-red-600" : "text-gray-500"}`}>
                          <CalendarDays size={13} /> {formatDate(task.dueDate)}
                        </div>
                        <select value={task.status} disabled={busyId === task.id} onChange={(event) => updateStatus(task, event.target.value)} className={`w-full rounded-md border-0 px-2 py-1.5 text-xs font-medium outline-none ${getStatusMeta(task.status).badge}`}>
                          {TASK_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </article>
                    );
                  })}
                  {!columnTasks.length && <p className="py-8 text-center text-xs text-gray-400">No tasks</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}