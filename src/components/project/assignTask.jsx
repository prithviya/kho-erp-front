import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Eye, Pencil, Trash2, Search, X, Briefcase, UserCheck, Users, Layers } from "lucide-react";
import taskService, { TASK_STATUSES, TASK_PRIORITIES, getStatusMeta } from "../../services/task.service";
import projectOnboardService from "../../services/projectOnboard.service";
import userManagementService from "../../services/userManagement.service";
import employeeService from "../../services/employee.service";
import leadService from "../../services/lead.service";
import { getCurrentUser, isSuperAdmin, canDeleteRecords } from "../../utils/auth";

const EMPTY_FORM = {
  projectOnboardId: "",
  serviceId: "",
  title: "",
  description: "",
  assignedToId: "",
  reportingHeadId: "",
  priority: "MEDIUM",
  dueDate: ""
};

const MANAGER_ROLES = new Set(["manager", "superadmin", "super_admin", "ceo"]);

function userName(user) {
  if (!user) return "-";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.fullName || user.email || "-";
}

function isManagerUser(user) {
  return (user?.roles || []).some((role) =>
    MANAGER_ROLES.has(String(role?.code || role?.name || "").toLowerCase().replace(/[\s_-]+/g, ""))
  );
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const Badge = ({ meta }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
);

export default function AssignTask() {
  const currentUser = getCurrentUser();
  const superAdmin = isSuperAdmin();
  const canDelete = canDeleteRecords();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await taskService.getTasks({ status: statusFilter, projectOnboardId: projectFilter, search: search.trim() });
      setTasks(res?.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load tasks.");
    }
  }, [statusFilter, projectFilter, search]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [projectRes, userRes, employeeRes, categoryRes] = await Promise.allSettled([
        projectOnboardService.list(),
        userManagementService.getDirectory ? userManagementService.getDirectory() : userManagementService.getUsers(),
        employeeService.list ? employeeService.list() : Promise.resolve({ data: [] }),
        leadService.getCategoriesWithServices()
      ]);
      if (!mounted) return;
      setProjects(projectRes.status === "fulfilled" ? projectRes.value?.data || [] : []);
      setUsers(userRes.status === "fulfilled" ? userRes.value?.data || [] : []);
      setEmployees(employeeRes.status === "fulfilled" ? employeeRes.value?.data || [] : []);
      setCategories(categoryRes.status === "fulfilled" ? categoryRes.value?.data || [] : []);
      
      if (projectRes.status === "rejected") toast.error("Failed to load projects.");
      if (userRes.status === "rejected") toast.error("Failed to load users.");
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadTasks, 250);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(Number(u.id), u));
    return map;
  }, [users]);

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp) => map.set(Number(emp.id), emp));
    return map;
  }, [employees]);

  const serviceMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      (category.services || category.Services || []).forEach((service) => {
        map.set(Number(service.id), service);
        if (service.name) map.set(String(service.name).trim().toLowerCase(), service);
      });
    });
    return map;
  }, [categories]);

  const projectMap = useMemo(() => new Map(projects.map((p) => [Number(p.id), p])), [projects]);
  const managerOptions = useMemo(() => users.filter(isManagerUser), [users]);

  const formProject = projectMap.get(Number(form.projectOnboardId));
  const formServiceOptions = useMemo(() => {
    const ids = Array.isArray(formProject?.serviceIds) ? formProject.serviceIds : [];
    return ids.map((id) => serviceMap.get(Number(id))).filter(Boolean);
  }, [formProject, serviceMap]);

  const counts = useMemo(() => {
    const result = { ALL: tasks.length };
    TASK_STATUSES.forEach((s) => { result[s.value] = tasks.filter((t) => t.status === s.value).length; });
    return result;
  }, [tasks]);

  const canManage = (task) =>
    superAdmin || Number(task.reportingHeadId) === Number(currentUser?.id) || Number(task.createdBy) === Number(currentUser?.id);

  const getNamesFromList = (list = [], sourceMap) => {
    return (Array.isArray(list) ? list : [])
      .map((item) => {
        const id = typeof item === "object" ? item.id ?? item.userId : item;
        const record = sourceMap.get(Number(id));
        return record ? userName(record) : (typeof item === "object" ? item.name || item.fullName : String(item));
      })
      .filter(Boolean);
  };

  const getServiceNamesFromList = (list = []) => {
    return (Array.isArray(list) ? list : [])
      .map((item) => {
        const id = typeof item === "object" ? item.id ?? item.serviceId : item;
        const svc = serviceMap.get(Number(id)) || serviceMap.get(String(id).trim().toLowerCase());
        return svc?.name || (typeof item === "object" ? item.name : String(item));
      })
      .filter(Boolean);
  };

  const openCreate = (defaultProjectId = "") => {
    setEditingTask(null);
    setForm({
      ...EMPTY_FORM,
      projectOnboardId: defaultProjectId || projectFilter || "",
      reportingHeadId: superAdmin ? "" : String(currentUser?.id || "")
    });
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      projectOnboardId: String(task.projectOnboardId || ""),
      serviceId: task.serviceId ? String(task.serviceId) : "",
      title: task.title || "",
      description: task.description || "",
      assignedToId: String(task.assignedToId || ""),
      reportingHeadId: task.reportingHeadId ? String(task.reportingHeadId) : "",
      priority: task.priority || "MEDIUM",
      dueDate: task.dueDate || ""
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingTask(null);
    setForm(EMPTY_FORM);
  };

  const setField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "projectOnboardId") next.serviceId = "";
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectOnboardId) return toast.error("Select a project.");
    if (!form.title.trim()) return toast.error("Task title is required.");
    if (!form.assignedToId) return toast.error("Select an assignee.");

    const payload = {
      projectOnboardId: Number(form.projectOnboardId),
      serviceId: form.serviceId ? Number(form.serviceId) : null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      assignedToId: Number(form.assignedToId),
      reportingHeadId: form.reportingHeadId ? Number(form.reportingHeadId) : null,
      priority: form.priority,
      dueDate: form.dueDate || null
    };

    try {
      setSaving(true);
      if (editingTask) {
        await taskService.updateTask(editingTask.id, payload);
        toast.success("Task updated.");
      } else {
        await taskService.createTask(payload);
        toast.success("Task assigned.");
      }
      setShowForm(false);
      setEditingTask(null);
      setForm(EMPTY_FORM);
      await loadTasks();
    } catch (err) {
      toast.error(err.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (status === task.status) return;
    try {
      setBusyId(task.id);
      await taskService.updateStatus(task.id, status);
      await loadTasks();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (task) => {
    if (!canDelete || busyId) return;
    if (!window.confirm(`Delete task "${task.title}"? This action cannot be undone.`)) return;
    try {
      setBusyId(task.id);
      await taskService.deleteTask(task.id);
      toast.success("Task deleted.");
      await loadTasks();
    } catch (err) {
      toast.error(err.message || "Failed to delete task.");
    } finally {
      setBusyId(null);
    }
  };

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500";
  const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Work Allocation</h1>
          <p className="text-xs text-gray-500">
            {superAdmin ? "All projects & tasks across company" : "Tasks you assign or report on"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 transition-colors"
        >
          <Plus size={16} /> Assign Task
        </button>
      </div>

      {/* ========================================================= */}
      {/* 🚀 ALL PROJECTS GRID (Reporting Head, SPOC, Assigned, Services) */}
      {/* ========================================================= */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-600" /> Active Projects Overview
          </h2>
          {projectFilter && (
            <button
              onClick={() => setProjectFilter("")}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Clear Project Filter (Showing All)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => {
            const isSelected = String(projectFilter) === String(project.id);
            const rHeads = getNamesFromList(project.projectManagerIds || [project.reportingHeadId], userMap);
            const spocs = getNamesFromList(project.spocIds || [project.spocId], userMap);
            const assignees = getNamesFromList(project.assignedToIds || [], employeeMap);
            const svcs = getServiceNamesFromList(project.serviceIds || []);

            return (
              <div
                key={project.id}
                onClick={() => setProjectFilter(isSelected ? "" : String(project.id))}
                className={`relative cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                {/* Project Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="truncate pr-2">
                    <h3 className="truncate text-base font-bold text-gray-900">{project.projectName}</h3>
                    <p className="truncate text-xs font-medium text-gray-500">{project.companyName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreate(String(project.id));
                    }}
                    title="Quick Assign Task"
                    className="rounded-md bg-gray-100 p-1.5 text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Reporting Head */}
                  <div>
                    <span className="font-semibold text-gray-500 flex items-center gap-1">
                      <UserCheck size={13} className="text-blue-500" /> Reporting Head:
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {rHeads.length ? (
                        rHeads.map((name) => (
                          <span key={name} className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 font-medium">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* SPOC */}
                  <div>
                    <span className="font-semibold text-gray-500 flex items-center gap-1">
                      <Users size={13} className="text-green-600" /> SPOC:
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {spocs.length ? (
                        spocs.map((name) => (
                          <span key={name} className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 font-medium">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Person */}
                  <div>
                    <span className="font-semibold text-gray-500 flex items-center gap-1">
                      <Users size={13} className="text-purple-600" /> Assigned Person:
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {assignees.length ? (
                        assignees.map((name) => (
                          <span key={name} className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-800 font-medium">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">Not Assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Required Services */}
                  <div>
                    <span className="font-semibold text-gray-500 flex items-center gap-1">
                      <Layers size={13} className="text-orange-500" /> Required Services:
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {svcs.length ? (
                        svcs.map((svc) => (
                          <span key={svc} className="rounded-md bg-gray-100 px-2 py-0.5 text-gray-700">
                            {svc}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-2 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Click card to filter tasks</span>
                  {isSelected && <span className="font-bold text-blue-600">Active Filter ✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Filters & Search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ value: "", label: "All Tasks" }, ...TASK_STATUSES].map((s) => (
          <button
            key={s.value || "all"}
            type="button"
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s.value ? "bg-gray-800 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-gray-100"
            }`}
          >
            {s.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[s.value || "ALL"] ?? 0}</span>
          </button>
        ))}

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Filter: All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.projectName}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Task Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Task Title", "Project", "Assigned To", "Reporting Head", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Loading tasks...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No tasks found.</td></tr>
              ) : (
                tasks.map((task) => {
                  const taskProj = projectMap.get(Number(task.projectOnboardId));
                  return (
                    <tr key={task.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.service?.name && <p className="text-xs text-gray-500">{task.service.name}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800">{taskProj?.projectName || `#${task.projectOnboardId}`}</p>
                        <p className="text-xs text-gray-400">{taskProj?.companyName || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-700 font-medium">
                          {userName(task.assignee)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700 font-medium">
                          {userName(task.reportingHead)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          disabled={busyId === task.id}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ${getStatusMeta(task.status).badge}`}
                        >
                          {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button type="button" title="View" onClick={() => { setSelectedTask(task); setShowView(true); }} className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50">
                            <Eye size={16} />
                          </button>
                          {canManage(task) && (
                            <button type="button" title="Edit" onClick={() => openEdit(task)} className="rounded-md p-1.5 text-green-600 hover:bg-green-50">
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" title="Delete" onClick={() => handleDelete(task)} disabled={busyId === task.id} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeForm} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">{editingTask ? "Edit Task" : "Assign Task"}</h2>
                <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Project <span className="text-red-500">*</span></label>
                    <select value={form.projectOnboardId} onChange={(e) => setField("projectOnboardId", e.target.value)} className={inputCls} required>
                      <option value="">Select project</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName} — {p.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Service</label>
                    <select value={form.serviceId} onChange={(e) => setField("serviceId", e.target.value)} className={inputCls} disabled={!form.projectOnboardId}>
                      <option value="">{form.projectOnboardId ? "General (no specific service)" : "Select project first"}</option>
                      {formServiceOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Task Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputCls} placeholder="e.g. Design homepage banner" maxLength={200} required />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} className={inputCls} placeholder="What needs to be done" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Assign To <span className="text-red-500">*</span></label>
                    <select value={form.assignedToId} onChange={(e) => setField("assignedToId", e.target.value)} className={inputCls} required>
                      <option value="">Select team member</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{userName(u)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Reporting Head</label>
                    <select value={form.reportingHeadId} onChange={(e) => setField("reportingHeadId", e.target.value)} className={inputCls}>
                      <option value="">{superAdmin ? "Select reporting head" : "Me (default)"}</option>
                      {managerOptions.map((u) => <option key={u.id} value={u.id}>{userName(u)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select value={form.priority} onChange={(e) => setField("priority", e.target.value)} className={inputCls}>
                      {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Due Date</label>
                    <input type="date" value={form.dueDate} onChange={(e) => setField("dueDate", e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                  <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60">
                    {saving ? "Saving..." : editingTask ? "Update Task" : "Assign Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task View Modal */}
      {showView && selectedTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowView(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">Task Details</h2>
                <button type="button" onClick={() => setShowView(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4 px-6 py-5 text-sm">
                <div>
                  <p className="text-base font-semibold text-gray-900">{selectedTask.title}</p>
                  {selectedTask.service?.name && <p className="text-xs text-gray-500">{selectedTask.service.name}</p>}
                </div>
                {selectedTask.description && (
                  <p className="whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-gray-700">{selectedTask.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><p className={labelCls}>Assigned To</p><p className="text-gray-800">{userName(selectedTask.assignee)}</p></div>
                  <div><p className={labelCls}>Reporting Head</p><p className="text-gray-800">{userName(selectedTask.reportingHead)}</p></div>
                  <div><p className={labelCls}>Status</p><Badge meta={getStatusMeta(selectedTask.status)} /></div>
                  <div><p className={labelCls}>Created</p><p className="text-gray-800">{formatDate(selectedTask.createdAt)} by {userName(selectedTask.creator)}</p></div>
                  {selectedTask.completedAt && (
                    <div><p className={labelCls}>Completed</p><p className="text-gray-800">{formatDate(selectedTask.completedAt)}</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}