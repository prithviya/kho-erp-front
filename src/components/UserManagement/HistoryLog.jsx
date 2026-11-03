import { useCallback, useEffect, useState } from "react";
import { Download, History, RefreshCw, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import activityLogService from "../../services/activityLog.service";

const EMPTY_FILTERS = {
  projectId: "",
  employeeId: "",
  fromDate: "",
  toDate: "",
  fromTime: "",
  toTime: "",
  search: "",
};

const ACTION_STYLES = {
  LOGIN: "bg-emerald-50 text-emerald-700",
  LOGOUT: "bg-slate-100 text-slate-600",
  LOGIN_FAILED: "bg-red-50 text-red-700",
  DELETE: "bg-red-50 text-red-700",
  CREATE: "bg-blue-50 text-blue-700",
  UPLOAD: "bg-blue-50 text-blue-700",
  UPDATE: "bg-amber-50 text-amber-700",
  STATUS_CHANGE: "bg-amber-50 text-amber-700",
  DOWNLOAD: "bg-violet-50 text-violet-700",
  MESSAGE: "bg-cyan-50 text-cyan-700",
};

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(value) {
  if (!value) return "-";
  const [hours, minutes, seconds] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds || 0).padStart(2, "0")} ${suffix}`;
}

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const fieldClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500";

export default function HistoryLog() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [options, setOptions] = useState({ projects: [], employees: [] });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    activityLogService.filters()
      .then((response) => setOptions(response.data || { projects: [], employees: [] }))
      .catch((error) => toast.error(error.message || "Unable to load filters."));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await activityLogService.list({ ...filters, page, limit: 25 });
      setItems(response.data?.items || []);
      setPagination(response.data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (error) {
      toast.error(error.message || "Unable to load the history log.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const setPreset = (fromDate, toDate) => {
    setPage(1);
    setFilters((current) => ({ ...current, fromDate, toDate }));
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const blob = await activityLogService.exportExcel(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `history-log-${todayIso()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error.message || "Unable to export the history log.");
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><History size={20} /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">History Log</h1>
            <p className="text-xs text-slate-500">Every login, logout and action, kept for 6 months.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={exportExcel} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            <Download size={14} /> {exporting ? "Preparing..." : "Download Excel"}
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-slate-500">Project
            <select className={`${fieldClass} mt-1`} value={filters.projectId} onChange={(event) => updateFilter("projectId", event.target.value)}>
              <option value="">All projects</option>
              {options.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Employee
            <select className={`${fieldClass} mt-1`} value={filters.employeeId} onChange={(event) => updateFilter("employeeId", event.target.value)}>
              <option value="">All employees</option>
              {options.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">From date
            <input type="date" className={`${fieldClass} mt-1`} value={filters.fromDate} max={filters.toDate || undefined} onChange={(event) => updateFilter("fromDate", event.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-500">To date
            <input type="date" className={`${fieldClass} mt-1`} value={filters.toDate} min={filters.fromDate || undefined} onChange={(event) => updateFilter("toDate", event.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-500">From time
            <input type="time" className={`${fieldClass} mt-1`} value={filters.fromTime} onChange={(event) => updateFilter("fromTime", event.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-500">To time
            <input type="time" className={`${fieldClass} mt-1`} value={filters.toTime} onChange={(event) => updateFilter("toTime", event.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-500 sm:col-span-2">Search
            <div className="relative mt-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${fieldClass} pl-9`} placeholder="Employee, project or details" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </div>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Quick:</span>
          <button type="button" onClick={() => setPreset(todayIso(), todayIso())} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50">Today</button>
          <button type="button" onClick={() => {
            const date = new Date(); date.setDate(date.getDate() - 1);
            const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            setPreset(iso, iso);
          }} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50">Yesterday</button>
          <button type="button" onClick={() => {
            const date = new Date(); date.setDate(date.getDate() - 6);
            setPreset(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10), todayIso());
          }} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50">Last 7 days</button>
          {hasFilters && (
            <button type="button" onClick={() => { setPage(1); setFilters(EMPTY_FILTERS); }} className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-1 text-red-600 hover:bg-red-50">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(item.localDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatTime(item.localTime)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.actorName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ACTION_STYLES[item.action] || "bg-slate-100 text-slate-600"}`}>
                      {item.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.projectName || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.description}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {loading ? "Loading..." : "No activity found for the selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>{pagination.total} activit{pagination.total === 1 ? "y" : "ies"}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
