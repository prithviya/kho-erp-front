import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Building2, MapPin, FileCheck, Loader2 } from "lucide-react";
import vendorService from "../../services/vendor.service";

export default function EditVendor({ open, onClose, vendor, onUpdated }) {
    const [form, setForm] = useState({
        vendor_name: "",
        vendor_email: "",
        vendor_contact: "",
        vendor_company_name: "",
        vendor_address: "",
        gst_registered: "no",
        gst_number: "",
        status: "active",
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (vendor && open) {
            setForm({
                vendor_name: vendor.vendor_name || "",
                vendor_email: vendor.vendor_email || "",
                vendor_contact: vendor.vendor_contact || "",
                vendor_company_name: vendor.vendor_company_name || "",
                vendor_address: vendor.vendor_address || "",
                gst_registered: vendor.gst_registered || "no",
                gst_number: vendor.gst_number || "",
                status: vendor.status || "active",
            });
            setErrors({});
            setServerError(null);
        }
    }, [vendor, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        if (!form.vendor_name.trim()) {
            setErrors({ vendor_name: "Vendor name is required." });
            return;
        }

        setSubmitting(true);
        try {
            await vendorService.update(vendor.vendorId, form);
            onUpdated?.();
        } catch (err) {
            setServerError(err.response?.data?.message || err.message || "Failed to update vendor.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
            <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-white shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Edit Vendor</h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form id="edit-vendor-form" onSubmit={handleSubmit} className="space-y-4 p-6">
                        {serverError && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                                {serverError}
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Vendor Name *
                            </label>
                            <input
                                type="text"
                                name="vendor_name"
                                value={form.vendor_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Company Name
                            </label>
                            <input
                                type="text"
                                name="vendor_company_name"
                                value={form.vendor_company_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="vendor_email"
                                value={form.vendor_email}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Contact Number *
                            </label>
                            <input
                                type="text"
                                name="vendor_contact"
                                value={form.vendor_contact}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    GST Registered
                                </label>
                                <select
                                    name="gst_registered"
                                    value={form.gst_registered}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {form.gst_registered === "yes" && (
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    name="gst_number"
                                    maxLength={15}
                                    value={form.gst_number}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none font-mono"
                                />
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Address
                            </label>
                            <textarea
                                rows={3}
                                name="vendor_address"
                                value={form.vendor_address}
                                onChange={handleChange}
                                className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="shrink-0 border-t bg-white px-6 py-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-vendor-form"
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? "Updating…" : "Update Vendor"}
                    </button>
                </div>
            </div>
        </>
    );
}