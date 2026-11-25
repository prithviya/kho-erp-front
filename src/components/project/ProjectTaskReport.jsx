import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckSquare, Download, FileSpreadsheet, FileText, Loader2, Printer, RefreshCw } from "lucide-react";
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

function formatCount(num) {
  if (num === null || num === undefined) return "00";
  return String(num).padStart(2, "0");
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
    const headers = ["S.no", "Project", "Service", "Configured sub-services", "Planned total", "Tasks due in range", "Completed", "Overdue", "Upcoming", "Remaining", "Extra"];
    const lines = [
      headers.map(csvCell).join(","),
      ...reportRows.map((row, index) => [
        index + 1,
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
    <main className="min-h-full bg-[#f8f9fa] p-4 sm:p-6 text-slate-800">
      <style>{`
        @media print {
          body * { visibility: hidden !important; background: #ffffff !important; }
          .project-task-report-print, .project-task-report-print * { visibility: visible !important; }
          .project-task-report-print { position: absolute; inset: 0; width: 100%; padding: 16px; background: white !important; }
          .project-task-report-print .print-hidden { display: none !important; }
          .project-task-report-print table { border-collapse: collapse; width: 100%; }
          .project-task-report-print th, .project-task-report-print td { border: 1px solid #e2e8f0; padding: 8px; color: #0f172a !important; }
          .project-task-report-print th { background: #111111 !important; color: white !important; }
        }
      `}</style>
      <section className="project-task-report-print mx-auto flex max-w-7xl flex-col gap-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#7a0c16] px-3.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase">
              PROJECT REPORT
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Task Report</h1>
          </div>
          <div className="print-hidden flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadReportData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!reportRows.length || dateRangeInvalid}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100/70 disabled:opacity-50 transition"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" /> Export Excel (CSV)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!reportRows.length || dateRangeInvalid}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-100/70 disabled:opacity-50 transition"
            >
              <Printer size={15} className="text-blue-600" /> Export PDF
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="print-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                SPOC
              </label>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-800 shadow-xs focus:border-[#7a0c16] focus:outline-none focus:ring-1 focus:ring-[#7a0c16]"
              >
                <option value="">All Accessible Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.projectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                From
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-800 shadow-xs focus:border-[#7a0c16] focus:outline-none focus:ring-1 focus:ring-[#7a0c16]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                To
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  max={todayKey}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-800 shadow-xs focus:border-[#7a0c16] focus:outline-none focus:ring-1 focus:ring-[#7a0c16]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4 Metric Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Planned Total */}
          <article className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Planned Total</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {formatCount(totals.planned)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <FileText size={20} />
            </div>
          </article>

          {/* Completed */}
          <article className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {formatCount(totals.completed)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckSquare size={20} />
            </div>
          </article>

          {/* Remaining */}
          <article className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Remaining</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {formatCount(totals.remaining)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <FileText size={20} />
            </div>
          </article>

          {/* Extra Beyond Plan */}
          <article className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Extra Beyond Plan</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {formatCount(totals.extra)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
              <FileText size={20} />
            </div>
          </article>
        </section>

        {/* Service Summary Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Service Summary</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Due Dates: {fromDate ? fromDate.split("-").reverse().join("-") : "Any"} to {toDate ? toDate.split("-").reverse().join("-") : "Any"}
              </p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!reportRows.length || dateRangeInvalid}
              className="print-hidden inline-flex items-center gap-1.5 rounded-xl bg-[#7a0c16] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#630911] disabled:opacity-50 transition"
            >
              <Download size={14} /> Download
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="bg-[#111111] text-white">
                <tr>
                  <th className="px-4 py-3.5 font-medium w-14">S.no</th>
                  <th className="px-4 py-3.5 font-medium">Project</th>
                  <th className="px-4 py-3.5 font-medium">Service/Sub-Service</th>
                  <th className="px-4 py-3.5 font-medium text-center">Planned</th>
                  <th className="px-4 py-3.5 font-medium text-center">Task Due</th>
                  <th className="px-4 py-3.5 font-medium text-center">Completed</th>
                  <th className="px-4 py-3.5 font-medium text-center">Over Due</th>
                  <th className="px-4 py-3.5 font-medium text-center">Upcoming</th>
                  <th className="px-4 py-3.5 font-medium text-center">Remaining</th>
                  <th className="px-4 py-3.5 font-medium text-center">Extra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="mx-auto animate-spin" size={24} />
                      <p className="mt-2 text-xs text-slate-400">Loading task report...</p>
                    </td>
                  </tr>
                ) : dateRangeInvalid ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-red-600 font-medium">
                      Start date must be on or before end date.
                    </td>
                  </tr>
                ) : reportRows.length ? (
                  reportRows.map((row, index) => (
                    <tr key={`${row.projectId}-${row.serviceName}-${index}`} className="align-middle hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{row.projectName}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-800">{row.serviceName}</span>
                          {row.subservices && row.subservices.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {row.subservices.map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-600"
                                >
                                  {sub.name}: {sub.count}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{row.planned}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{row.created}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{row.completed}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-rose-600">{row.overdue}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-500">{row.upcoming}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">{row.remaining}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-purple-600">{row.extra}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-500">
                      {projects.length ? "No project tasks found for this due-date range." : "No accessible projects found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <p className="text-[11px] leading-relaxed text-slate-400">
              Remaining = Planned total minus created tasks, with a minimum of zero. Overdue and upcoming are subsets of created tasks. Extra counts created tasks beyond the configured plan.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default ProjectTaskReport;

