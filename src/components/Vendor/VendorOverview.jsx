import { useState, useEffect, useCallback } from "react";
import {
    Search, Plus, Eye, Pencil, Trash2,
    Building2, Phone, Mail, CheckCircle2, XCircle, Power
} from "lucide-react";
import vendorService from "../../services/vendor.service";
import CreateVendor from "./CreateVendor";
import EditVendor from "./EditVendor";
import ViewVendor from "./ViewVendor";
import { getCategoryName, getServiceName, getServicePrice, getVendorServices } from "./vendorServices";

export default function VendorOverview() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await vendorService.getAll();
            const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            setVendors(list);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load vendors.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vendor?")) return;
        try {
            await vendorService.delete(id);
            fetchVendors();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete vendor.");
        }
    };

    const handleStatusToggle = async (vendor) => {
        setUpdatingStatusId(vendor.vendorId);
        try {
            await vendorService.update(vendor.vendorId, {
                ...vendor,
                status: vendor.status === "active" ? "inactive" : "active",
            });
            await fetchVendors();
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to update vendor status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const filteredVendors = vendors.filter((v) => {
        const matchesSearch =
            v.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
            v.vendor_company_name?.toLowerCase().includes(search.toLowerCase()) ||
            v.vendor_email?.toLowerCase().includes(search.toLowerCase()) ||
            v.vendor_contact?.includes(search);
        const matchesStatus = statusFilter ? v.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const totalVendors = vendors.length;
    const activeVendors = vendors.filter((v) => v.status === "active").length;
    const inactiveVendors = vendors.filter((v) => v.status === "inactive").length;
    const gstRegistered = vendors.filter((v) => v.gst_registered === "yes").length;

    const STAT_CARDS = [
        { label: "Total Vendors", value: totalVendors },
        { label: "Active", value: activeVendors },
        { label: "Inactive", value: inactiveVendors },
        { label: "GST Registered", value: gstRegistered },
    ];

    return (
        <div className="p-4 space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STAT_CARDS.map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">{label}</p>
                        <h2 className="mt-2 text-3xl font-bold text-gray-900">{value}</h2>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                {/* Toolbar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Vendor Directory</h4>
                        <p className="text-sm text-gray-500">Manage supplier accounts and tax credentials</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search vendors..."
                                className="w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                        >
                            <Plus size={16} /> Add Vendor
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-center">#</th>
                                <th className="px-4 py-3 text-left">Vendor & Company</th>
                                <th className="px-4 py-3 text-left">Contact Info</th>
                                <th className="px-4 py-3 text-left">GST Status</th>
                                <th className="px-4 py-3 text-left">Category / Sub service</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading && (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-sm text-gray-400">Loading vendors…</td>
                                </tr>
                            )}
                            {!loading && error && (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-sm text-red-500">{error}</td>
                                </tr>
                            )}
                            {!loading && !error && filteredVendors.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-sm text-gray-400">No vendors found.</td>
                                </tr>
                            )}
                            {!loading && !error && filteredVendors.map((vendor, idx) => (
                                <tr key={vendor.vendorId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                   
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{vendor.vendor_name}</p>
                                        <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                            <Building2 size={12} /> {vendor.vendor_company_name || "—"}
                                        </p>
                                    </td>
                                    
                                    <td className="px-4 py-3">
                                        <div className="space-y-0.5 text-xs text-gray-600">
                                            <p className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {vendor.vendor_email}</p>
                                            <p className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {vendor.vendor_contact}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {vendor.gst_registered === "yes" ? (
                                            <div>
                                                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    <CheckCircle2 size={12} /> Registered
                                                </span>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">{vendor.gst_number || "—"}</p>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                <XCircle size={12} /> Unregistered
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="max-w-xs space-y-1 text-xs text-gray-600">
                                            {getVendorServices(vendor).length ? getVendorServices(vendor).map((service, serviceIndex) => <p key={service.id || serviceIndex}><span className="font-medium text-gray-800">{getServiceName(service)}</span> <span className="text-gray-400">({getCategoryName(service)})</span> <span className="font-semibold text-blue-600">{getServicePrice(service)}</span></p>) : <span className="text-gray-400">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                            vendor.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                        }`}>
                                            {vendor.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                title="View"
                                                onClick={() => { setSelectedVendor(vendor); setViewOpen(true); }}
                                                className="rounded-md p-1.5 bg-blue-100 text-blue-500 hover:bg-blue-50 transition"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                title="Edit"
                                                onClick={() => { setSelectedVendor(vendor); setEditOpen(true); }}
                                                className="rounded-md p-1.5 bg-green-100 text-green-500 hover:bg-green-50 transition"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                title="Delete"
                                                onClick={() => handleDelete(vendor.vendorId)}
                                                className="rounded-md p-1.5 bg-red-100 text-red-500 hover:bg-red-50 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                            type="button"
                                            title={`Set vendor ${vendor.status === "active" ? "inactive" : "active"}`}
                                            aria-label={`Set vendor ${vendor.status === "active" ? "inactive" : "active"}`}
                                            onClick={() => handleStatusToggle(vendor)}
                                            disabled={updatingStatusId === vendor.vendorId}
                                            className={`rounded-md p-1.5 transition disabled:cursor-wait bg-gray-100 disabled:opacity-50 ${
                                                vendor.status === "active"
                                                    ? "text-emerald-600 hover:bg-emerald-50"
                                                    : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <Power size={16} />
                                        </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Offcanvas Panels */}
            <CreateVendor
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { setCreateOpen(false); fetchVendors(); }}
            />
            <EditVendor
                open={editOpen}
                onClose={() => setEditOpen(false)}
                vendor={selectedVendor}
                onUpdated={() => { setEditOpen(false); fetchVendors(); }}
            />
            <ViewVendor
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                vendor={selectedVendor}
            />
        </div>
    );
}