import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Printer, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import leadService from "../../services/lead.service";
import projectOnboardService from "../../services/projectOnboard.service";
import taskService from "../../services/task.service";

function parseValue(value, fallback = value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asArray(value) {
  const parsed = parseValue(value);
  if (Array.isArray(parsed)) return parsed;
  return parsed === null || parsed === undefined || parsed === "" ? [] : [parsed];
}

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");
}

function getServiceDetails(project, serviceId, serviceName) {
  const details = parseValue(project?.serviceDetails, {});
  if (!details || Array.isArray(details) || typeof details !== "object") return {};
  const exact = details[String(serviceId)] || details[serviceName];
  if (exact) return parseValue(exact, {});
  const key = Object.keys(details).find((candidate) =>
    normalizeName(candidate) === normalizeName(serviceName)
    || String(candidate) === String(serviceId)
  );
  return key ? parseValue(details[key], {}) || {} : {};
}

function getConfiguredSubservices(details) {
  const entries = Object.entries(details || {});
  const subserviceKey = entries.find(([key]) => normalizeName(key) === "subservice")?.[1];
  const names = asArray(subserviceKey).map((value) =>
    typeof value === "object" ? value.name || value.label || value.title : value
  ).filter(Boolean);

  const quantities = entries.filter(([key, value]) =>
    /count$/i.test(key) && Number.isFinite(Number(value)) && String(value).trim() !== ""
  );
  const configured = names.map((name) => {
    const nameKey = normalizeName(name);
    const quantity = quantities.find(([key]) => {
      const countKey = normalizeName(key.replace(/count$/i, ""));
      return countKey === nameKey;
    });
    return { name: String(name), count: quantity ? Number(quantity[1]) : 0 };
  });

  quantities.forEach(([key, value]) => {
    const name = key.replace(/count$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2");
    if (!configured.some((entry) => normalizeName(entry.name) === normalizeName(name))) {
      configured.push({ name: name || key, count: Number(value) });
    }
  });

  return configured;
}

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function ProjectTaskReport() {
  const [searchParams] = useSearchParams();
  const requestedProjectId = searchParams.get("projectId") || "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayKey = getLocalDateKey(today);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [services, setServices] = useState([]);
  const [projectId, setProjectId] = useState(requestedProjectId);
  const [fromDate, setFromDate] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`);
  const [toDate, setToDate] = useState(today.getDate() === 1 ? todayKey : getLocalDateKey(yesterday));
  const [loading, setLoading] = useState(true);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectResult, taskResult, serviceResult] = await Promise.all([
        projectOnboardService.list(),
        taskService.getTasks(),
        leadService.getCategoriesWithServices()
      ]);
      setProjects(projectResult?.data || []);
      setTasks(taskResult?.data || []);
      const categories = serviceResult?.data || [];
      setServices(categories.flatMap((category) => category.services || category.Services || []));
    } catch (error) {
      toast.error(error?.message || "Unable to load project task report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const filteredProjects = useMemo(
    () => projects.filter((project) => !projectId || String(project.id) === projectId),
    [projects, projectId]
  );

  const reportRows = useMemo(() => {
    const todayKey = getLocalDateKey(new Date());
    return filteredProjects.flatMap((project) => {
      const projectTasks = tasks.filter((task) => Number(task.projectOnboardId) === Number(project.id)
        && (!fromDate || (task.dueDate && String(task.dueDate).slice(0, 10) >= fromDate))
        && (!toDate || (task.dueDate && String(task.dueDate).slice(0, 10) <= toDate)));
      const detailMap = parseValue(project.serviceDetails, {}) || {};
      const serviceIds = [...new Set([
        ...asArray(project.serviceIds).map((value) => typeof value === "object" ? value.id ?? value.serviceId : value),
        ...Object.keys(detailMap && !Array.isArray(detailMap) ? detailMap : {})
      ].filter((value) => value !== null && value !== undefined).map(String))];

      const projectServices = serviceIds.map((id) => {
        const service = services.find((item) => String(item.id) === id || normalizeName(item.name) === normalizeName(id));
        const serviceName = service?.name || projectTasks.find((task) => String(task.serviceId) === id)?.service?.name || `Service #${id}`;
        const serviceTasks = projectTasks.filter((task) => String(task.serviceId || "") === id);
        const normalizedTasks = serviceTasks.map((task) => ({
          ...task,
          normalizedStatus: String(task.status || "TODO").toUpperCase()
        }));
        const completed = normalizedTasks.filter((task) => task.normalizedStatus === "COMPLETED").length;
        const overdue = normalizedTasks.filter((task) => task.normalizedStatus !== "COMPLETED"
          && task.dueDate && String(task.dueDate).slice(0, 10) < todayKey).length;
        const upcoming = normalizedTasks.filter((task) => task.normalizedStatus !== "COMPLETED"
          && task.dueDate && String(task.dueDate).slice(0, 10) >= todayKey).length;
        const details = getServiceDetails(project, id, serviceName);
        const subservices = getConfiguredSubservices(details);
        const planned = subservices.reduce((total, item) => total + item.count, 0);

        return {
          projectId: project.id,
          projectName: project.projectName,
          serviceName,
          subservices,
          planned,
          created: normalizedTasks.length,
          completed,
          overdue,
          upcoming,
          remaining: Math.max(planned - normalizedTasks.length, 0),
          extra: planned > 0 ? Math.max(normalizedTasks.length - planned, 0) : 0
        };
      });

      const knownServiceIds = new Set(serviceIds);
      const taskOnlyServices = [...new Set(projectTasks.map((task) => String(task.serviceId || "")).filter((id) => id && !knownServiceIds.has(id)))];
      taskOnlyServices.forEach((id) => {
        const serviceTasks = projectTasks.filter((task) => String(task.serviceId) === id);
        const completed = serviceTasks.filter((task) => String(task.status).toUpperCase() === "COMPLETED").length;
        const overdue = serviceTasks.filter((task) => String(task.status).toUpperCase() !== "COMPLETED"
          && task.dueDate && String(task.dueDate).slice(0, 10) < todayKey).length;
        const upcoming = serviceTasks.filter((task) => String(task.status).toUpperCase() !== "COMPLETED"
          && task.dueDate && String(task.dueDate).slice(0, 10) >= todayKey).length;
        projectServices.push({
          projectId: project.id,
          projectName: project.projectName,
          serviceName: serviceTasks[0]?.service?.name || `Service #${id}`,
          subservices: [],
          planned: 0,
          created: serviceTasks.length,
          completed,
          overdue,
          upcoming,
          remaining: 0,
          extra: 0
        });
      });

      return projectServices;
    });
  }, [filteredProjects, tasks, fromDate, toDate, services]);

  const totals = reportRows.reduce((result, row) => ({
    planned: result.planned + row.planned,
    created: result.created + row.created,
    completed: result.completed + row.completed,
    overdue: result.overdue + row.overdue,
    upcoming: result.upcoming + row.upcoming,
    remaining: result.remaining + row.remaining,
    extra: result.extra + row.extra
  }), { planned: 0, created: 0, completed: 0, overdue: 0, upcoming: 0, remaining: 0, extra: 0 });

  const exportCsv = () => {
    const headers = ["Project", "Service", "Configured sub-services", "Planned total", "Tasks due in range", "Completed", "Overdue", "Upcoming", "Remaining", "Extra"];
    const lines = [
      headers.map(csvCell).join(","),
      ...reportRows.map((row) => [
        row.projectName,
        row.serviceName,
        row.subservices.map((item) => `${item.name}: ${item.count}`).join("; "),
        row.planned,
        row.created,
        row.completed,
        row.overdue,
        row.upcoming,
        row.remaining,
        row.extra
      ].map(csvCell).join(","))
    ];
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-task-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const dateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);

  return (
    <main className="min-h-full bg-slate-50 p-4 sm:p-6 bg-[#f4f5f9]">
      <style>{`
        @media print {
          body * { visibility: hidden !important; background: #f4f5f9 !important; }
          .project-task-report-print, .project-task-report-print * { visibility: visible !important; }
          .project-task-report-print { position: absolute; inset: 0; width: 100%; padding: 16px; background: white !important; }
          .project-task-report-print .print-hidden { display: none !important; }
          .project-task-report-print table { border-collapse: collapse; width: 100%; }
          .project-task-report-print th, .project-task-report-print td { border: 1px solid #cbd5e1; padding: 8px; color: #0f172a !important; }
          .project-task-report-print th { background: #e2e8f0 !important; }
        }
      `}</style>
      <section className="project-task-report-print mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="inline-flex rounded-full bg-rose-700 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white">PROJECT REPORT</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Task Report</h1>
            <p className="mt-1 text-sm text-slate-500">Project task status and configured service quantities.</p>
          </div>
          <div className="print-hidden flex flex-wrap gap-2">
            <button type="button" onClick={loadReportData} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button type="button" onClick={exportCsv} disabled={!reportRows.length || dateRangeInvalid} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
              <FileSpreadsheet size={15} /> Export Excel (CSV)
            </button>
            <button type="button" onClick={() => window.print()} disabled={!reportRows.length || dateRangeInvalid} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50">
              <Printer size={15} /> Export PDF
            </button>
          </div>
        </header>

        <section className="print-hidden grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">
            Project
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800">
              <option value="">All accessible projects</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.projectName}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            From
            <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-800" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            To
            <input type="date" value={toDate} min={fromDate || undefined} max={todayKey} onChange={(event) => setToDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-800" />
          </label>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Planned total", totals.planned, "bg-violet-50 text-violet-700"],
            // ["Tasks due in range", totals.created, "bg-sky-50 text-sky-700"],
            ["Completed", totals.completed, "bg-emerald-50 text-emerald-700"],
            ["Remaining", totals.remaining, "bg-slate-100 text-slate-700"],
            // ["Overdue", totals.overdue, "bg-red-50 text-red-700"],
            // ["Upcoming", totals.upcoming, "bg-amber-50 text-amber-700"],
            ["Extra beyond plan", totals.extra, "bg-rose-50 text-rose-700"]
          ].map(([label, count, style]) => (
            <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className={`mt-2 inline-flex rounded-lg px-3 py-1.5 text-xl font-bold ${style}`}>{count}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Service summary</h2>
              <p className="mt-1 text-xs text-slate-500">
                Due dates: {fromDate || "Any"} to {toDate || "Any"}
              </p>
            </div>
            <Download size={18} className="print-hidden text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
                <tr>
                  {["Project", "Service / sub-services", "Planned", "Tasks due", "Completed", "Overdue", "Upcoming", "Remaining", "Extra"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="9" className="px-4 py-12 text-center text-slate-500"><Loader2 className="mx-auto animate-spin" /></td></tr>
                ) : dateRangeInvalid ? (
                  <tr><td colSpan="9" className="px-4 py-12 text-center text-red-600">Start date must be on or before end date.</td></tr>
                ) : reportRows.length ? reportRows.map((row) => (
                  <tr key={`${row.projectId}-${row.serviceName}`} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.projectName}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{row.serviceName}</p>
                      {row.subservices.length > 0 && <p className="mt-1 text-xs text-slate-500">{row.subservices.map((item) => `${item.name}: ${item.count}`).join(" · ")}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.planned}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.created}</td>
                    <td className="px-4 py-3 text-emerald-700">{row.completed}</td>
                    <td className="px-4 py-3 text-red-700">{row.overdue}</td>
                    <td className="px-4 py-3 text-amber-700">{row.upcoming}</td>
                    <td className="px-4 py-3 text-slate-700">{row.remaining}</td>
                    <td className="px-4 py-3 text-rose-700">{row.extra}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" className="px-4 py-12 text-center text-slate-500">{projects.length ? "No project tasks found for this due-date range." : "No accessible projects found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Remaining = planned total minus created tasks, with a minimum of zero. Overdue and upcoming are subsets of created tasks. Extra counts created tasks beyond the configured plan.
          </p>
        </section>
      </section>
    </main>
  );
}

export default ProjectTaskReport;
