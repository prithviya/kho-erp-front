import {
  Users,
  UserRound,
  Trophy,
  Activity,

  BriefcaseBusiness,
  
  RefreshCw
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dashboardService from "../../services/dashboard.service";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  const stats = useMemo(
    () => [
      {
        title: "Total Leads",
        value: dashboard.stats.totalLeads,
        icon: <Users size={20} className="text-blue-700" />,
        panel: "bg-gradient-to-br from-blue-50 to-white",
        iconBg: "bg-blue-100"
      },
      {
        title: "Recent Leads",
        value: dashboard.stats.recentLeads,
        icon: <UserRound size={20} className="text-cyan-700" />,
        panel: "bg-gradient-to-br from-cyan-50 to-white",
        iconBg: "bg-cyan-100"
      },
      {
        title: "Converted Deals",
        value: dashboard.stats.convertedDeals,
        icon: <Trophy size={20} className="text-emerald-700" />,
        panel: "bg-gradient-to-br from-emerald-50 to-white",
        iconBg: "bg-emerald-100"
      },
      {
        title: "Active Users",
        value: dashboard.stats.activeUsers,
        icon: <Activity size={20} className="text-amber-700" />,
        panel: "bg-gradient-to-br from-amber-50 to-white",
        iconBg: "bg-amber-100"
      }
    ],
    [dashboard.stats]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-blue-100/60 via-cyan-100/40 to-emerald-100/60" />

      <div className="relative mb-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Performance Snapshot</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Quick health view of leads, users, conversions and open hiring.</p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="relative mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className={`rounded-2xl border border-slate-200/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.panel}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.title}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{loading ? "..." : item.value}</p>
              </div>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                {item.icon}
              </span>
            </div>
            
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-1 gap-4 2xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm 2xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent User Activity</h2>
            <button
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              onClick={() => navigate("/user-management")}
            >
              View All
            </button>
          </div>

          <div className="max-h-[460px] overflow-y-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-sm text-slate-500">Loading users...</td>
                  </tr>
                ) : dashboard.activeUsers.length ? (
                  dashboard.activeUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {getInitials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{user.name || "-"}</p>
                            <p className="truncate text-xs text-slate-500">{user.email || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(user.status)}`}>
                          {user.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {user.role || "-"}
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
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm 2xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Leads</h2>
            <button
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              onClick={() => navigate("/lead-overview")}
            >
              View Pipeline
            </button>
          </div>

          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="rounded-xl border border-slate-200 p-4 text-center text-sm text-slate-500">Loading leads...</div>
            ) : dashboard.recentLeads.length ? (
              dashboard.recentLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{lead.company || "-"}</p>
                      <p className="truncate text-xs text-slate-500">{lead.client || "No client name"}</p>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {formatInr(lead.budget)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Status</span>
                    {lead.status ? (
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
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
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 text-center text-sm text-slate-500">No recent leads found.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm 2xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Hiring</h2>
            <BriefcaseBusiness size={18} className="text-slate-400" />
          </div>

          <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-xl border border-slate-200 p-4 text-center text-sm text-slate-500">Loading openings...</div>
            ) : dashboard.hiring.length ? (
              dashboard.hiring.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50/70">
                  <p className="text-sm font-semibold text-slate-900">{job.jobTitle || "Untitled role"}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{job.experience || "Experience not specified"}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-100 px-2 py-1.5 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Min Exp</p>
                      <p className="text-sm font-bold text-slate-800">{job.minExp ?? "-"}</p>
                    </div>
                    <div className="rounded-lg bg-blue-100 px-2 py-1.5 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Vacancy</p>
                      <p className="text-sm font-bold text-blue-800">{job.openingCount ?? "-"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 text-center text-sm text-slate-500">No openings found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
