import {
  BadgeCheck,
  BriefcaseBusiness,
  RefreshCw,
  UserRound,
  UserRoundCheck,
  Users
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dashboardService from "../../services/dashboard.service";
import SortableHeader from "../common/SortableHeader";
import { sortRows } from "../../utils/tableSorting";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700"
};

const formatInr = (amount) => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getStatusClass = (value = "") => {
  const normalized = String(value).toLowerCase();
  return STATUS_STYLES[normalized] || "bg-slate-100 text-slate-700";
};

const formatCount = (value) => {
  const count = Number(value || 0);
  return Number.isFinite(count) ? String(count).padStart(2, "0") : value;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userSortConfig, setUserSortConfig] = useState({ key: "", direction: "asc" });
  const [leadSortConfig, setLeadSortConfig] = useState({ key: "", direction: "asc" });
  const [dashboard, setDashboard] = useState({
    stats: {
      totalLeads: 0,
      recentLeads: 0,
      convertedDeals: 0,
      activeUsers: 0
    },
    activeUsers: [],
    recentLeads: [],
    hiring: []
  });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getOverview();
      const payload = res?.data ?? res ?? {};
      setDashboard({
        stats: payload?.stats || {
          totalLeads: 0,
          recentLeads: 0,
          convertedDeals: 0,
          activeUsers: 0
        },
        activeUsers: payload?.activeUsers || [],
        recentLeads: payload?.recentLeads || [],
        hiring: payload?.hiring || []
      });
    } catch (error) {
      toast.error(error.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const sortedUsers = sortRows(dashboard.activeUsers, userSortConfig.key, userSortConfig.direction, (user) => {
    if (userSortConfig.key === "user") return user.name;
    if (userSortConfig.key === "role") return user.role;
    if (userSortConfig.key === "status") return user.status;
    return "";
  });
  const sortedLeads = sortRows(dashboard.recentLeads, leadSortConfig.key, leadSortConfig.direction, (lead) => {
    if (leadSortConfig.key === "company") return lead.company;
    if (leadSortConfig.key === "amount") return lead.budget;
    if (leadSortConfig.key === "status") return lead.status;
    return "";
  });
  const toggleSort = (setConfig) => (key) => setConfig((current) => ({
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  }));

  const stats = useMemo(
    () => [
      {
        title: "Total Leads",
        value: dashboard.stats.totalLeads,
        icon: <Users size={20} className="text-emerald-600" />,
        iconBg: "bg-emerald-50"
      },
      {
        title: "Recent Leads",
        value: dashboard.stats.recentLeads,
        icon: <UserRound size={20} className="text-orange-500" />,
        iconBg: "bg-orange-50"
      },
      {
        title: "Converted Leads",
        value: dashboard.stats.convertedDeals,
        icon: <BadgeCheck size={20} className="text-amber-500" />,
        iconBg: "bg-amber-50"
      },
      {
        title: "Active Users",
        value: dashboard.stats.activeUsers,
        icon: <UserRoundCheck size={20} className="text-violet-500" />,
        iconBg: "bg-violet-50"
      }
    ],
    [dashboard.stats]
  );

  return (
    <div className="min-h-full bg-[#f4f5f9] p-3 sm:p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-[#9c1018] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            Performance Snapshot
          </span>
          <h1 className="mt-2 text-xl font-semibold text-[#171317] sm:text-2xl">Dashboard Overview</h1>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <section aria-label="Dashboard summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stats.map((item) => (
              <article
                key={item.title}
                className="flex min-h-[92px] items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_3px_15px_rgba(15,23,42,0.025)] sm:px-5"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">{item.title}</p>
                  <p className="mt-1 text-2xl font-semibold leading-none text-[#201d20]">
                    {loading ? "--" : formatCount(item.value)}
                  </p>
                </div>
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>
                  {item.icon}
                </span>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_3px_15px_rgba(15,23,42,0.025)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#201d20]">Recent User Activity</h2>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-200"
                onClick={() => navigate("/user-management")}
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="erp-list-table w-full min-w-full text-left">
                <thead className="bg-[#10070a] text-white">
                  <tr>
                    <th className="rounded-tl-xl px-4 py-3 text-[11px] font-medium"><SortableHeader label="User" sortKey="user" sortConfig={userSortConfig} onSort={toggleSort(setUserSortConfig)} className="text-white hover:text-white" /></th>
                    <th className="px-4 py-3 text-[11px] font-medium"><SortableHeader label="Role" sortKey="role" sortConfig={userSortConfig} onSort={toggleSort(setUserSortConfig)} className="text-white hover:text-white" /></th>
                    <th className="rounded-tr-xl px-4 py-3 text-[11px] font-medium"><SortableHeader label="Status" sortKey="status" sortConfig={userSortConfig} onSort={toggleSort(setUserSortConfig)} className="text-white hover:text-white" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-sm text-slate-500">Loading users...</td>
                    </tr>
                  ) : dashboard.activeUsers.length ? (
                    sortedUsers.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                              {getInitials(user.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-800">{user.name || "-"}</p>
                              <p className="truncate text-[10px] text-slate-400">{user.email || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">{user.role || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusClass(user.status)}`}>
                            {user.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-sm text-slate-500">No active users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_3px_15px_rgba(15,23,42,0.025)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#201d20]">Recent Leads</h2>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-200"
                onClick={() => navigate("/lead-overview")}
              >
                View Pipeline
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="erp-list-table w-full min-w-full text-left">
                <thead className="bg-[#10070a] text-white">
                  <tr>
                    <th className="rounded-tl-xl px-4 py-3 text-[11px] font-medium"><SortableHeader label="Project Name" sortKey="company" sortConfig={leadSortConfig} onSort={toggleSort(setLeadSortConfig)} className="text-white hover:text-white" /></th>
                    <th className="px-4 py-3 text-[11px] font-medium"><SortableHeader label="Amount" sortKey="amount" sortConfig={leadSortConfig} onSort={toggleSort(setLeadSortConfig)} className="text-white hover:text-white" /></th>
                    <th className="rounded-tr-xl px-4 py-3 text-[11px] font-medium"><SortableHeader label="Status" sortKey="status" sortConfig={leadSortConfig} onSort={toggleSort(setLeadSortConfig)} className="text-white hover:text-white" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-sm text-slate-500">Loading leads...</td>
                    </tr>
                  ) : dashboard.recentLeads.length ? (
                    sortedLeads.map((lead) => (
                      <tr key={lead.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                              {getInitials(lead.company)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-800">{lead.company || "-"}</p>
                              <p className="truncate text-[10px] text-slate-400">{lead.client || "No client name"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-800">
                          {formatInr(lead.budget)}
                        </td>
                        <td className="px-4 py-3">
                          {lead.status ? (
                            <span
                              className="inline-flex rounded-full px-3 py-1 text-[10px] font-semibold"
                              style={{
                                backgroundColor: lead.statusColor ? `${lead.statusColor}22` : "#DBEAFE",
                                color: lead.statusColor || "#1D4ED8"
                              }}
                            >
                              {lead.status}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not available</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-sm text-slate-500">No recent leads found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_3px_15px_rgba(15,23,42,0.025)] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#201d20]">Hiring</h2>
              <BriefcaseBusiness size={17} className="text-slate-400" />
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-100 p-4 text-center text-sm text-slate-500">Loading openings...</div>
            ) : dashboard.hiring.length ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dashboard.hiring.map((job) => (
                  <article key={job.id} className="rounded-xl border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                    <p className="flex min-h-8 items-start gap-2 text-xs font-medium text-slate-700">
                      <BriefcaseBusiness size={14} className="mt-0.5 shrink-0 text-slate-500" />
                      <span className="line-clamp-2">{job.jobTitle || "Untitled role"}</span>
                    </p>
                    <div className="mt-3 grid grid-cols-2 divide-x divide-slate-100 rounded-lg bg-slate-50 px-2 py-2">
                      <div className="pr-2">
                        <p className="text-sm font-semibold text-slate-800">{job.minExp ?? "--"}</p>
                        <p className="text-[10px] text-slate-400">Min Exp</p>
                      </div>
                      <div className="pl-2">
                        <p className="text-sm font-semibold text-slate-800">{job.openingCount ?? "--"}</p>
                        <p className="text-[10px] text-slate-400">Vacancy</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 p-4 text-center text-sm text-slate-500">No openings found.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
