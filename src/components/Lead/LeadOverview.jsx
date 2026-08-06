    import { useState, useEffect, useCallback } from "react";
    import { useNavigate } from "react-router-dom";
    import {
        Users, BadgeCheck, Phone, MessageSquare, FileText, Handshake,
        Eye, Pencil, Trash2, Rocket, Search, CalendarDays,
    } from "lucide-react";
    import CreateLead from "./CreateLead";
    import EditLead from "./EditLead";
    import ViewLead from "./ViewLead";
    import leadService from "../../services/lead.service";
    import { hasRole } from "../../utils/auth";
    import { toast } from "react-toastify";

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

    // Avatar circle from first letter of name
    function Avatar({ name = "" }) {
        const letter = name.trim()[0]?.toUpperCase() ?? "?";
        const colors = [
            "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500",
            "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
        ];
        const color = colors[letter.charCodeAt(0) % colors.length];
        return (
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${color}`}>
                {letter}
            </span>
        );
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

        const [createOpen, setCreateOpen] = useState(false);
        const [editOpen, setEditOpen] = useState(false);
        const [viewOpen, setViewOpen] = useState(false);
        const [selectedLead, setSelectedLead] = useState(null);
        const [deleteTarget, setDeleteTarget] = useState(null);
        const [deleting, setDeleting] = useState(false);
        const [deleteError, setDeleteError] = useState("");
        const navigate = useNavigate();

        const canDeleteLead = hasRole("SUPER_ADMIN");

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
                .then((res) => setLeads(normalizeList(res)))
                .catch((err) => setError(err.message || "Failed to load leads."))
                .finally(() => setLoading(false));
        }, [search, statusFilter]);

        // Fetch lead statuses once for the filter dropdown
        useEffect(() => {
            leadService.getLeadStatuses()
                .then((res) => setStatuses(normalizeList(res)))
                .catch(() => {});
        }, []);

        useEffect(() => {
            fetchLeads();
        }, [fetchLeads]);

        const confirmDeleteLead = async () => {
            if (!deleteTarget?.id) return;
            setDeleting(true);
            setDeleteError("");
            try {
                await leadService.deleteLead(deleteTarget.id);
                if (selectedLead?.id === deleteTarget.id) {
                    setSelectedLead(null);
                    setViewOpen(false);
                    setEditOpen(false);
                }
                setDeleteTarget(null);
                toast.success("Lead deleted successfully.");
                fetchLeads();
            } catch (err) {
                setDeleteError(err.message || "Failed to delete lead.");
            } finally {
                setDeleting(false);
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

        const STAT_CARDS = [
            { label: "Total Leads",     value: totalLeads,      icon: Users,          bg: "bg-blue-100",   color: "text-blue-600"  },
            { label: "Converted Deals", value: convertedDeals,  icon: BadgeCheck,     bg: "bg-green-100",  color: "text-green-600" },
            { label: "Contacted",       value: statusCounts["Contacted"]  || 0, icon: Phone,         bg: "bg-yellow-100", color: "text-yellow-600" },
            { label: "Discussion",      value: statusCounts["Discussion"] || 0, icon: MessageSquare, bg: "bg-purple-100", color: "text-purple-600" },
            { label: "Proposal",        value: statusCounts["Proposal"]   || 0, icon: FileText,      bg: "bg-orange-100", color: "text-orange-600" },
            { label: "Negotiation",     value: statusCounts["Negotiation"]|| 0, icon: Handshake,     bg: "bg-pink-100",   color: "text-pink-600"  },
        ];

        return (
            <div className="p-4 space-y-4">
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {STAT_CARDS.map(({ label, value, icon: Icon, bg, color }) => (
                        <div key={label} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{label}</p>
                                <h2 className="mt-2 text-3xl font-bold text-gray-900">{value}</h2>
                            </div>
                            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${bg}`}>
                                <Icon className={`h-7 w-7 ${color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    {/* Toolbar */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">Lead Pipeline</h4>
                            <p className="text-sm text-gray-500">Track and manage your opportunities</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search leads..."
                                    className="rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 w-52"
                                />
                            </div>
                            {/* Status filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value="">All Status</option>
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {/* Add Lead */}
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                            >
                                + Add Lead
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3 text-left">Company &amp; Contact</th>
                                    <th className="px-4 py-3 text-left">Source</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Assigned To</th>
                                    <th className="px-4 py-3 text-left">Next Follow-up</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                                            Loading leads…
                                        </td>
                                    </tr>
                                )}
                                {!loading && error && (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-sm text-red-500">{error}</td>
                                    </tr>
                                )}
                                {!loading && !error && leads.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                                            No leads found.
                                        </td>
                                    </tr>
                                )}
                                {!loading && !error && leads.map((lead, idx) => {
                                    const assignedName = lead.assignedUser
                                        ? `${lead.assignedUser.firstName ?? ""} ${lead.assignedUser.lastName ?? ""}`.trim()
                                        : "—";
                                    const followUp = formatDate(lead.nextFollowupDate);
                                    const isOverdue = lead.nextFollowupDate && new Date(lead.nextFollowupDate) < new Date();
                                    const statusColor = lead.leadStatus?.color;
                                    const isConverted = lead.leadStatus?.name?.toLowerCase() === "converted";

                                    return (
                                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                            {/* # */}
                                            <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>

                                            {/* Company & Contact */}
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">{lead.companyName}</p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={11} /> {lead.contactPerson}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={11} /> {lead.phone}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Source */}
                                            <td className="px-4 py-3">
                                                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${sourceBadgeCls(lead.leadSource?.name)}`}>
                                                    {lead.leadSource?.name ?? "—"}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                {lead.leadStatus ? (
                                                    <span
                                                        className="rounded-full px-3 py-1 text-xs font-medium"
                                                        style={statusColor
                                                            ? { backgroundColor: `${statusColor}20`, color: statusColor }
                                                            : { backgroundColor: "#f3f4f6", color: "#374151" }
                                                        }
                                                    >
                                                        {lead.leadStatus.name}
                                                    </span>
                                                ) : "—"}
                                            </td>

                                            {/* Assigned To */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={assignedName} />
                                                    <span className="text-gray-700">{assignedName}</span>
                                                </div>
                                            </td>

                                            {/* Next Follow-up */}
                                            <td className="px-4 py-3">
                                                {followUp ? (
                                                    <span className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                                                        <CalendarDays size={13} className={isOverdue ? "text-red-500" : "text-gray-400"} />
                                                        {followUp}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <CalendarDays size={13} /> Not Set
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        title="View"
                                                        onClick={() => { setSelectedLead(lead); setViewOpen(true); }}
                                                        className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50 transition"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        title="Edit"
                                                        onClick={() => { setSelectedLead(lead); setEditOpen(true); }}
                                                        className="rounded-md p-1.5 text-green-500 hover:bg-green-50 transition"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    {isConverted && (
                                                        <button
                                                            title="Move to Project"
                                                            onClick={() => navigate("/onboard-prjt", {
                                                                state: {
                                                                    leadId: lead.id,
                                                                    userId: lead.assignedTo || null
                                                                }
                                                            })}
                                                            className="rounded-md p-1.5 text-purple-500 hover:bg-purple-50 transition"
                                                        >
                                                            <Rocket size={16} />
                                                        </button>
                                                    )}
                                                    {canDeleteLead && (
                                                        <button
                                                            title="Delete"
                                                            onClick={() => { setDeleteError(""); setDeleteTarget(lead); }}
                                                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition"
                                                        >
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
                <CreateLead
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onCreated={() => { setCreateOpen(false); fetchLeads(); }}
                />
                <EditLead
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    lead={selectedLead}
                    onUpdated={() => { setEditOpen(false); fetchLeads(); }}
                />
                <ViewLead
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                    lead={selectedLead}
                />

                {/* Delete confirmation modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Lead</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Are you sure you want to delete
                                <span className="font-semibold text-gray-800"> {deleteTarget.companyName || "this lead"}</span>?
                                This action can be restored only from database backups.
                            </p>
                            {deleteError && (
                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {deleteError}
                                </div>
                            )}
                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setDeleteTarget(null); setDeleteError(""); }}
                                    disabled={deleting}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteLead}
                                    disabled={deleting}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
