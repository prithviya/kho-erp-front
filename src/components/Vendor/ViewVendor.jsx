import { X, Mail, Phone, Building2, MapPin } from "lucide-react";
import { getCategoryName, getServiceName, getServicePrice, getVendorServices } from "./vendorServices";

export default function ViewVendor({ open, onClose, vendor }) {
    if (!open || !vendor) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300" onClick={onClose} />
            <div className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[500px] flex-col bg-white shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-[#f7f7fa] px-5 py-3.5 sm:px-6">
                    <h2 className="text-sm font-semibold text-[#211d20]">Vendor Details</h2>
                    <button type="button" title="Close" aria-label="Close vendor details" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-lg font-semibold text-[#8f1018] uppercase">
                            {vendor.vendor_name?.charAt(0) || "V"}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{vendor.vendor_name}</h3>
                            <p className="text-sm text-gray-500">{vendor.vendor_company_name || "Independent Vendor"}</p>
                            <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                vendor.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                                {vendor.status?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Mail size={16} className="text-gray-400" />
                            <span>{vendor.vendor_email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone size={16} className="text-gray-400" />
                            <span>{vendor.vendor_contact}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Building2 size={16} className="text-gray-400" />
                            <span>{vendor.vendor_company_name || "Not Specified"}</span>
                        </div>
                        <div className="flex items-start gap-3 text-gray-700">
                            <MapPin size={16} className="text-gray-400 mt-0.5" />
                            <span>{vendor.vendor_address || "No address on file"}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                        <h4 className="mb-2 text-[11px] font-semibold text-slate-600">GST & Compliance</h4>
                        <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-500">GST Status</span>
                            <span className="font-medium text-gray-800 capitalize">{vendor.gst_registered}</span>
                        </div>
                        {vendor.gst_registered === "yes" && (
                            <div className="flex items-center justify-between text-sm py-1 border-t border-gray-100 mt-2 pt-2">
                                <span className="text-gray-500">GSTIN</span>
                                <span className="font-mono font-medium text-gray-800">{vendor.gst_number || "—"}</span>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                        <h4 className="mb-3 text-[11px] font-semibold text-slate-600">Category / Sub service & Pricing</h4>
                        {getVendorServices(vendor).length ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b text-left text-xs text-gray-400"><tr><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Sub service</th><th className="pb-2 text-right">Price</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">{getVendorServices(vendor).map((service, index) => <tr key={service.id || index}><td className="py-2 pr-3 text-gray-500">{getCategoryName(service)}</td><td className="py-2 pr-3 font-medium text-gray-800">{getServiceName(service)}</td><td className="py-2 text-right font-medium text-gray-800">{getServicePrice(service)}</td></tr>)}</tbody>
                                </table>
                            </div>
                        ) : <p className="text-sm text-gray-400">No services assigned.</p>}
                    </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3.5 sm:px-6">
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}