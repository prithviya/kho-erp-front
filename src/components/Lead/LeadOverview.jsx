    import { useState, useEffect, useCallback } from "react";
    import { useNavigate } from "react-router-dom";
    import {
        Users, Phone,
        Eye, Pencil, Rocket, Search, CalendarDays, Trash2, RefreshCw,
    } from "lucide-react";
    import { toast } from "react-toastify";
    import CreateLead from "./CreateLead";
    import EditLead from "./EditLead";
    import ViewLead from "./ViewLead";
    import leadService from "../../services/lead.service";
    import { hasRole, canDeleteRecords } from "../../utils/auth";
    import SortableHeader from "../common/SortableHeader";
    import { sortRows } from "../../utils/tableSorting";

    // Source badge colours keyed by source name (case-insensitive match)
    const SOURCE_COLORS = {
        website:      "bg-blue-100 text-blue-700",
        whatsapp:     "bg-green-100 text-green-700",
        referral:     "bg-purple-100 text-purple-700",
        instagram:    "bg-pink-100 text-pink-700",
        facebook:     "bg-indigo-100 text-indigo-700",
        "facebook ads": "bg-indigo-100 text-indigo-700",
        google:       "bg-yellow-100 text-yellow-700",
    };

    function sourceBadgeCls(name = "") {
        return SOURCE_COLORS[name.toLowerCase()] ?? "bg-gray-100 text-gray-600";
    }

    function formatDate(dateStr) {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }

    export default function LeadOverview() {
        const [leads, setLeads] = useState([]);
        const [statuses, setStatuses] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        const [search, setSearch] = useState("");
        const [statusFilter, setStatusFilter] = useState("");
        const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

        const [createOpen, setCreateOpen] = useState(false);
        const [editOpen, setEditOpen] = useState(false);
        const [viewOpen, setViewOpen] = useState(false);
        const [selectedLead, setSelectedLead] = useState(null);
        const navigate = useNavigate();

        const canCreateLead = hasRole("SUPER_ADMIN");
        const canDelete = canDeleteRecords('lead_management');
        const [deletingId, setDeletingId] = useState(null);

        const normalizeList = (payload) => {
            if (Array.isArray(payload)) return payload;
            if (payload && Array.isArray(payload.data)) return payload.data;
            return [];
        };

        const fetchLeads = useCallback(() => {
            setLoading(true);
            setError(null);
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.leadStatusId = statusFilter;
            leadService.getLeads(params)
                .then((res) => {
                    if (Array.isArray(res?.data) || Array.isArray(res)) {
                        setLeads(normalizeList(res));
                    }
                })
                .catch((err) => setError(err.message || "Failed to load leads."))
                .finally(() => setLoading(false));
        }, [search, statusFilter]);

        // Fetch lead statuses once for the filter dropdown
        useEffect(() => {
            leadService.getLeadStatuses()
                .then((res) => setStatuses(normalizeList(res).filter((status) => status.isActive !== false)))
                .catch(() => {});
        }, []);

        useEffect(() => {
            fetchLeads();
        }, [fetchLeads]);

        const ALREADY_ONBOARDED_MSG = "This lead is already onboarded with a project. If needed, create a new lead.";

        const isLeadOnboarded = (lead) => Array.isArray(lead?.projects) && lead.projects.length > 0;

        const handleMoveToProject = (lead) => {
            if (isLeadOnboarded(lead)) {
                toast.warning(ALREADY_ONBOARDED_MSG);
                return;
            }
            navigate("/onboard-prjt", { state: { leadId: lead.id, userId: lead.assignedTo || null } });
        };

        const handleDelete = async (lead) => {
            if (!canDelete || deletingId) return;
            if (!window.confirm(`Delete lead "${lead.companyName || lead.contactName || `#${lead.id}`}"? This action cannot be undone.`)) return;
            try {
                setDeletingId(lead.id);
                await leadService.deleteLead(lead.id);
                toast.success("Lead deleted successfully.");
                fetchLeads();
            } catch (err) {
                toast.error(err.message || "Failed to delete lead.");
            } finally {
                setDeletingId(null);
            }
        };

        // Derived stats
        const totalLeads = leads.length;
        const convertedDeals = leads.filter(
            (l) => l.leadStatus?.name?.toLowerCase().includes("convert")
        ).length;

        const statusCounts = leads.reduce((acc, l) => {
            const name = l.leadStatus?.name;
            if (name) acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        const sortedLeads = sortRows(leads, sortConfig.key, sortConfig.direction, (lead) => {
            if (sortConfig.key === "company") return lead.companyName;
            if (sortConfig.key === "source") return lead.leadSource?.name;
            if (sortConfig.key === "status") return lead.leadStatus?.name;
            if (sortConfig.key === "assigned") return `${lead.assignedUser?.firstName ?? ""} ${lead.assignedUser?.lastName ?? ""}`;
            if (sortConfig.key === "followUp") return lead.nextFollowupDate;
            return "";
        });
        const toggleSort = (key) => setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));

        const STAT_CARDS = [
            { label: "Total Leads", value: totalLeads },
            { label: "Converted Deals", value: convertedDeals },
            { label: "Contacted", value: statusCounts["Contacted"] || 0 },
            { label: "Discussion", value: statusCounts["Discussion"] || 0 },
            { label: "Proposal", value: statusCounts["Proposal"] || 0 },
            { label: "Negotiation", value: statusCounts["Negotiation"] || 0 },
        ];

        return (
            <div className="min-h-full space-y-4 bg-[#f4f5f9] p-3 sm:p-4 lg:p-6">
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {STAT_CARDS.map(({ label, value }) => (
                        <div key={label} className="flex min-h-[76px] items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:px-5">
                            <div>
                                <p className="text-xs font-medium text-slate-500">{label}</p>
                                <h2 className="mt-1 text-2xl font-semibold leading-none text-[#211d20]">{value}</h2>
                            </div>
                            {/* <div className={`flex h-14 w-14 items-center justify-center rounded-full ${bg}`}>
                                <Icon className={`h-7 w-7 ${color}`} />
                            </div> */}
                        </div>
                    ))}
                </div>

                {/* Table card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_3px_15px_rgba(15,23,42,0.025)] sm:p-5">
                    {/* Toolbar */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8f1018]">
                                    Track and manage your opportunities
                                </p>
                                <h4 className="text-base font-semibold text-[#211d20]">Lead Pipeline</h4>
                            </div>
                            <button
                                type="button"
                                onClick={fetchLeads}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#8f1018] disabled:cursor-wait disabled:opacity-50"
                                title="Refresh leads"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                Refresh
                            </button>
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                            {/* Search */}
                            <div className="relative min-w-[180px] flex-1 sm:flex-none">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Leads" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-[#9c1018] focus:outline-none focus:ring-2 focus:ring-rose-100 sm:w-52" />
                            </div>
                            {/* Status filter */}
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[118px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#9c1018] focus:outline-none focus:ring-2 focus:ring-rose-100">
                                <option value="">All Status</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {/* Add Lead */}
                            {canCreateLead && (
                                <button type="button" onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#8f1018] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#780c13]">
                                    + Add Lead
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="erp-list-table min-w-[1000px] w-full text-sm">
                            <thead className="text-[10px] font-semibold uppercase tracking-wide text-white">
                                <tr>
                                    <th className="w-14 border-r border-white/10 px-3 py-3 text-center">S.no</th>
                                    <th className="min-w-[280px] border-r border-white/10 px-4 py-3 text-left"><SortableHeader label="Company & Contact" sortKey="company" sortConfig={sortConfig} onSort={toggleSort} className="text-white/90 hover:text-white focus-visible:outline-white" /></th>
                                    <th className="w-28 border-r border-white/10 px-4 py-3 text-left"><SortableHeader label="Source" sortKey="source" sortConfig={sortConfig} onSort={toggleSort} className="text-white/90 hover:text-white focus-visible:outline-white" /></th>
                                    <th className="w-32 border-r border-white/10 px-4 py-3 text-left"><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={toggleSort} className="text-white/90 hover:text-white focus-visible:outline-white" /></th>
                                    <th className="w-36 border-r border-white/10 px-4 py-3 text-left"><SortableHeader label="Assigned To" sortKey="assigned" sortConfig={sortConfig} onSort={toggleSort} className="text-white/90 hover:text-white focus-visible:outline-white" /></th>
                                    <th className="w-36 border-r border-white/10 px-4 py-3 text-left"><SortableHeader label="Next Follow-up" sortKey="followUp" sortConfig={sortConfig} onSort={toggleSort} className="text-white/90 hover:text-white focus-visible:outline-white" /></th>
                                    <th className="w-36 px-3 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="border-t border-slate-100 py-10 text-center text-sm text-gray-400">
                                            Loading leads…
                                        </td>
                                    </tr>
                                )}
                                {!loading && error && (
                                    <tr>
                                        <td colSpan={7} className="border-t border-slate-100 py-10 text-center text-sm text-red-500">{error}</td>
                                    </tr>
                                )}
                                {!loading && !error && leads.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="border-t border-slate-100 py-10 text-center text-sm text-gray-400">
                                            No leads found.
                                        </td>
                                    </tr>
                                )}
                                {!loading && !error && sortedLeads.map((lead, idx) => {
                                    const assignedName = lead.assignedUser
                                        ? `${lead.assignedUser.firstName ?? ""} ${lead.assignedUser.lastName ?? ""}`.trim(): "—";
                                    const followUp = formatDate(lead.nextFollowupDate);
                                    const isOverdue = lead.nextFollowupDate && new Date(lead.nextFollowupDate) < new Date();
                                    const statusColor = lead.leadStatus?.color;
                                    const isConverted = lead.leadStatus?.name?.toLowerCase() === "converted";

                                    return (
                                        <tr key={lead.id} className="border-t border-slate-100 transition-colors hover:bg-[#fbfafb]">
                                            <td className="border-r border-slate-100 px-3 py-4 text-center text-xs text-gray-500">{idx + 1}</td>
                                            <td className="border-r border-slate-100 px-4 py-3.5">
                                                <p className="font-semibold text-gray-900">{lead.companyName}</p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={11} /> {[lead.salutation, lead.contactPerson].filter(Boolean).join(" ")}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={11} /> {[lead.phoneCountryCode, lead.phone].filter(Boolean).join(" ")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border-r border-slate-100 px-4 py-3.5">
                                                <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${sourceBadgeCls(lead.leadSource?.name)}`}>
                                                    {lead.leadSource?.name ?? "—"}
                                                </span>
                                            </td>
                                            <td className="border-r border-slate-100 px-4 py-3.5">
                                                {lead.leadStatus ? (
                                                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={statusColor
                                                            ? { backgroundColor: `${statusColor}20`, color: statusColor }
                                                            : { backgroundColor: "#f3f4f6", color: "#374151" }
                                                        }
                                                    >
                                                        {lead.leadStatus.name}
                                                    </span>
                                                ) : "—"}
                                            </td>
                                            <td className="border-r border-slate-100 px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-700">{assignedName}</span>
                                                </div>
                                            </td>
                                            <td className="border-r border-slate-100 px-4 py-3.5">
                                                {followUp ? (
                                                    <span className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                                                        <CalendarDays size={13} className={isOverdue ? "text-red-500" : "text-[#9c1018]"} /> {followUp}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <CalendarDays size={13} /> Not Set
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 py-3.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button type="button" title="View" aria-label="View lead" onClick={() => { setSelectedLead(lead); setViewOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button type="button" title="Edit" aria-label="Edit lead" onClick={() => { setSelectedLead(lead); setEditOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                                                        <Pencil size={16} />
                                                    </button>
                                                    {isConverted && (
                                                        <button
                                                            type="button"
                                                            title={isLeadOnboarded(lead) ? "Already onboarded" : "Move to Project"}
                                                            aria-label={isLeadOnboarded(lead) ? "Lead already onboarded" : "Move lead to project"}
                                                            onClick={() => handleMoveToProject(lead)}
                                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${isLeadOnboarded(lead) ? "bg-slate-50 text-slate-400 hover:bg-slate-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                                                        >
                                                            <Rocket size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button type="button" title="Delete" aria-label="Delete lead" onClick={() => handleDelete(lead)} disabled={deletingId === lead.id} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panels */}
                <CreateLead open={createOpen}  onClose={() => setCreateOpen(false)}  onCreated={(newLead) => { setCreateOpen(false);
                        // 1. Immediately prepend the new lead to your table state (instant UI update)
                        if (newLead && typeof newLead === "object") {
                            setLeads((prevLeads) => [newLead, ...prevLeads]);
                        }
                        // 2. Clear filters so the new lead is guaranteed to be visible, then re-fetch
                        setSearch("");
                        setStatusFilter("");
                        fetchLeads();
                    }}
                />
                <EditLead open={editOpen} onClose={() => setEditOpen(false)} lead={selectedLead} onUpdated={() => { setEditOpen(false); fetchLeads(); }}/>
                <ViewLead open={viewOpen} onClose={() => setViewOpen(false)} lead={selectedLead}/>
            </div>
        );
    }
