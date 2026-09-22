import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, CircleAlert, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";
import taskService, { TASK_PRIORITIES, TASK_STATUSES, getPriorityMeta, getStatusMeta } from "../../services/task.service";
import projectOnboardService from "../../services/projectOnboard.service";

function userName(user) {
  if (!user) return "Unassigned";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.fullName || user.email || "Unassigned";
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No due date" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function MyTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectRecords, setProjectRecords] = useState([]);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [taskResponse, projectResponse] = await Promise.all([
        taskService.getTasks(),
        projectOnboardService.list()
      ]);
      setTasks(taskResponse?.data || []);
      setProjectRecords(projectResponse?.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const projects = useMemo(() => {
    const seen = new Map();
    [...projectRecords, ...tasks.map((task) => task.project).filter(Boolean)].forEach((projectRecord) => {
      const task = projectRecord.projectName ? { project: projectRecord, projectOnboardId: projectRecord.id } : projectRecord;
      const id = Number(task.projectOnboardId);
      if (!seen.has(id)) {
        seen.set(id, {
          id,
          name: task.project?.projectName || `Project #${task.projectOnboardId}`,
          company: task.project?.companyName || ""
        });
      }
    });
    return [...seen.values()];
  }, [projectRecords, tasks]);

  const visibleProjects = useMemo(
    () => projects.filter((project) => !projectFilter || String(project.id) === projectFilter),
    [projects, projectFilter]
  );

  const getProjectPeople = (project, ids) => {
    const values = Array.isArray(project?.[ids]) ? project[ids] : [];
    return values.map((person) => typeof person === "object" ? person : { id: person });
  };

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
          <p className="text-xs text-gray-500">Track project work and keep task status current.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            <option value="">All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button type="button" onClick={loadTasks} disabled={loading} title="Refresh tasks" className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !tasks.length ? (
        <div className="flex justify-center rounded-xl bg-white py-16 text-gray-500"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleProjects.map((project) => {
            const projectTasks = tasks.filter((task) => Number(task.projectOnboardId) === project.id);
            const projectRecord = projectRecords.find((record) => Number(record.id) === project.id);
            const projectServices = parseArray(projectRecord?.serviceIds);
            const serviceGroups = projectTasks.reduce((groups, task) => {
              const serviceId = task.service?.id || task.serviceId || "general";
              const serviceName = task.service?.name || "General";
              const existing = groups.get(String(serviceId)) || { id: serviceId, name: serviceName, tasks: [] };
              existing.tasks.push(task);
              groups.set(String(serviceId), existing);
              return groups;
            }, new Map());

            projectServices.forEach((service) => {
              const serviceId = typeof service === "object" ? service.id ?? service.serviceId : service;
              const key = String(serviceId);
              if (!serviceGroups.has(key)) serviceGroups.set(key, { id: serviceId, name: typeof service === "object" ? service.name || service.serviceName || `Service #${serviceId}` : `Service #${serviceId}`, tasks: [] });
            });

            return <section key={project.id} className="overflow-hidden rounded-xl border border-gray-200 bg-slate-200 shadow-sm">
              <header className="flex items-center justify-between bg-white px-4 py-3">
                <div><h2 className="font-semibold text-gray-900">{project.name}</h2>{project.company && <p className="text-xs text-gray-500">{project.company}</p>}</div>
                <span className="text-xs text-gray-500">{projectTasks.length} task{projectTasks.length === 1 ? "" : "s"}</span>
              </header>
              <div className="flex min-h-64 overflow-x-auto">
                {[...serviceGroups.values()].map((serviceGroup, index) => <div key={serviceGroup.id} className="min-w-64 flex-1 border-r border-slate-300 last:border-r-0">
                  <div className={`flex items-center justify-between px-4 py-3 text-sm font-semibold text-white ${["bg-sky-500", "bg-pink-500", "bg-amber-400", "bg-emerald-500", "bg-violet-500"][index % 5]}`}>
                    <span>{serviceGroup.name}</span><span>{serviceGroup.tasks.length || ""}</span>
                  </div>
                  <div className="space-y-2 p-3">
                  <div className="space-y-2">
                    {serviceGroup.tasks.map((task) => {
                        const priority = getPriorityMeta(task.priority);
                        const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
                        return <article key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer rounded-lg border border-gray-200 p-3 shadow-sm transition hover:border-blue-400 hover:shadow-md">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                            {task.status === "COMPLETED" ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : overdue ? <CircleAlert size={16} className="shrink-0 text-red-500" /> : null}
                          </div>
                          {task.service?.name && <p className="mt-1 text-xs text-blue-600">{task.service.name}</p>}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.badge}`}>{priority.label}</span>
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{userName(task.assignee)}</span>
                          </div>
                          <div className={`mt-2 flex items-center gap-1 text-xs ${overdue ? "text-red-600" : "text-gray-500"}`}><CalendarDays size={13} /> {formatDate(task.dueDate)}</div>
                        </article>;
                    })}
                  </div>
                  </div>
                  <button type="button" title={`Add task to ${serviceGroup.name}`} onClick={() => toast.info("Use Assign Task to add work for this service.")} className="mx-auto mb-3 block rounded-lg border border-gray-300 bg-white px-3 py-1 text-lg leading-none text-gray-500 hover:bg-gray-50">+</button>
                </div>)}
                {!serviceGroups.size && <p className="w-full py-5 text-center text-xs text-gray-400">No project deliverables</p>}
              </div>
            </section>;
          })}
        </div>
      )}

      {selectedTask && <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedTask(null)} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h2>
              <button type="button" title="Close" onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm">
              <p className="whitespace-pre-wrap text-gray-700">{selectedTask.description || "No description added."}</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Project</p><p className="font-medium">{selectedTask.project?.projectName || `Project #${selectedTask.projectOnboardId}`}</p></div>
                <div><p className="text-xs text-gray-500">Service</p><p className="font-medium">{selectedTask.service?.name || "General"}</p></div>
                <div><p className="text-xs text-gray-500">Assigned To</p><p className="font-medium">{userName(selectedTask.assignee)}</p></div>
                <div><p className="text-xs text-gray-500">Reporting Head</p><p className="font-medium">{userName(selectedTask.reportingHead)}</p></div>
                <div><p className="text-xs text-gray-500">Due Date</p><p className="font-medium">{formatDate(selectedTask.dueDate)}</p></div>
              </div>
              <div><p className="mb-1 text-xs text-gray-500">Status</p><select value={selectedTask.status} disabled={busyId === selectedTask.id} onChange={(event) => { updateStatus(selectedTask, event.target.value); setSelectedTask({ ...selectedTask, status: event.target.value }); }} className={`rounded-md border-0 px-2 py-1.5 text-xs font-medium ${getStatusMeta(selectedTask.status).badge}`}>{TASK_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>
              <div><p className="mb-1 text-xs text-gray-500">Project SPOCs</p><div className="flex flex-wrap gap-1.5">{getProjectPeople(selectedTask.project, "spocIds").map((spoc) => <span key={spoc.id} className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{userName(spoc)}</span>)}</div></div>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}