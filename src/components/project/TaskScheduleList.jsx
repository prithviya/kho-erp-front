import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import taskService from "../../services/task.service";

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "No due date"
    : date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
}

function getTodayDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function TaskScheduleList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks();
      setTasks(response?.data || []);
    } catch (error) {
      toast.error(error?.message || "Unable to load task schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const groups = useMemo(() => {
    const sortedTasks = [...tasks].sort((left, right) => {
      if (!left.dueDate && !right.dueDate) return String(left.title || "").localeCompare(String(right.title || ""));
      if (!left.dueDate) return 1;
      if (!right.dueDate) return -1;
      return String(left.dueDate).localeCompare(String(right.dueDate));
    });
    const grouped = new Map();

    sortedTasks.forEach((task) => {
      const key = task.dueDate || "no-date";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(task);
    });

    return [...grouped.entries()];
  }, [tasks]);

  const today = getTodayDate();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Task Schedule List</h1>
            <p className="mt-1 text-sm text-slate-600">
              Tasks across your assigned projects, ordered by due date.
            </p>
          </div>
          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            title="Refresh task schedule"
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && !tasks.length ? (
          <div className="flex justify-center rounded-xl bg-white py-16 text-slate-500">
            <Loader2 className="animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl bg-white px-4 py-12 text-center text-sm text-slate-500">
            No scheduled tasks found for your assigned projects.
          </div>
        ) : (
          <div className="relative space-y-5 before:absolute before:bottom-4 before:left-[5.7rem] before:top-4 before:w-px before:bg-slate-300 sm:before:left-28">
            {groups.map(([date, groupTasks]) => {
              const overdue = date !== "no-date" && date < today
                && groupTasks.some((task) => task.status !== "COMPLETED");
              return (
                <section key={date} className="relative pl-24 sm:pl-28">
                  <div className="absolute left-0 top-4 w-20 pr-3 text-right text-xs font-semibold text-slate-600 sm:w-24">
                    {date === "no-date" ? "No date" : formatDate(date)}
                  </div>
                  <span className={`absolute left-[5.35rem] top-5 h-3 w-3 rounded-full border-2 border-white ring-2 sm:left-[6.65rem] ${overdue ? "bg-red-500 ring-red-200" : "bg-sky-500 ring-sky-200"}`} />

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className={`border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide ${overdue ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"}`}>
                      {overdue ? "Overdue" : date === "no-date" ? "Unscheduled" : "Scheduled"}
                    </div>
                    {groupTasks.map((task) => (
                      <article
                        key={task.id}
                        className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-violet-700">
                            {task.title || "Untitled task"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            {task.project?.projectName && (
                              <span className="font-medium text-emerald-700">{task.project.projectName}</span>
                            )}
                            {task.project?.projectName && task.service?.name && (
                              <span className="text-slate-300" aria-hidden="true">•</span>
                            )}
                            {task.service?.name && (
                              <span className="font-medium text-red-600">{task.service.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                          <CalendarDays size={14} />
                          <span>{task.status?.replaceAll("_", " ") || "TODO"}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default TaskScheduleList;
