import {
  Users,
  UserRound,
  Trophy,
  Activity,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dashboardService from "../../services/dashboard.service";

const formatInr = (amount) => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
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
  

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await dashboardService.getOverview();
        if (!mounted) return;
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
        if (mounted) {
          toast.error(error.message || "Failed to load dashboard data.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => ([
    {
      title: "TOTAL LEADS",
      value: dashboard.stats.totalLeads,
      icon: <Users size={22} className="text-blue-700" />,
      bg: "bg-blue-100"
    },
    {
      title: "RECENT LEADS",
      value: dashboard.stats.recentLeads,
      icon: <UserRound size={22} className="text-sky-600" />,
      bg: "bg-cyan-100"
    },
    {
      title: "CONVERTED DEALS",
      value: dashboard.stats.convertedDeals,
      icon: <Trophy size={22} className="text-emerald-600" />,
      bg: "bg-emerald-100"
    },
    {
      title: "ACTIVE USERS",
      value: dashboard.stats.activeUsers,
      icon: <Activity size={22} className="text-amber-600" />,
      bg: "bg-amber-100"
    }
  ]), [dashboard.stats]);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-100 via-gray-50 to-white p-4 sm:p-6">
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {/* <div className="mb-3 flex items-center justify-between">
              <span className={`inline-flex rounded-xl p-2 ${item.bg}`}>{item.icon}</span>
              <span className="text-xs font-medium text-gray-500">Live</span>
            </div> */}
            <p className="text-xs font-semibold tracking-wide text-gray-500">{item.title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading ? "..." : item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-y-auto h-[35vh]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Recent User Activity</h2>
            <button
              className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium hover:bg-gray-200"
              onClick={() => navigate("/user-management")}
            >
              View All
            </button>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mail Id</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-sm text-gray-500">Loading users...</td>
                </tr>
              ) : dashboard.activeUsers.length ? (
                dashboard.activeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                       <span className="rounded-full bg-emerald-100  px-3 py-1 text-xs font-semibold text-emerald-700">
                        ● {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {user.role}
                      </span>                    
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-sm text-gray-500">No active users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-y-auto h-[35vh]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Recent Leads</h2>
            <button
              className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium hover:bg-gray-200"
              onClick={() => navigate("/lead-overview")}
            >
              View Pipeline
            </button>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-sm text-gray-500">Loading leads...</td>
                </tr>
              ) : dashboard.recentLeads.length ? (
                dashboard.recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{lead.company}</p>
                      <p className="text-sm text-gray-500">{lead.client || "-"}</p>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{formatInr(lead.budget)}</td>
                    <td className="p-4">
                      {lead.status ? (
                        <span
                          className="rounded-full px-4 py-1 text-sm font-medium text-blue-700"
                          style={{
                            backgroundColor: lead.statusColor ? `${lead.statusColor}22` : "#DBEAFE",
                            color: lead.statusColor || "#1D4ED8"
                          }}
                        >
                          {lead.status}
                        </span>
                      ) : (
                        <div className="h-2 w-8 rounded-full bg-gray-200" />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-sm text-gray-500">No recent leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-y-auto h-[35vh]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Hiring </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MIN. EXP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-gray-500">Loading openings...</td>
                </tr>
              ) : dashboard.hiring.length ? (
                dashboard.hiring.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{job.jobTitle}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{job.experience}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{job.minExp} Years</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      <a href={`/careers/${job.id}`} className="hover:underline">View</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-gray-500">No openings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}