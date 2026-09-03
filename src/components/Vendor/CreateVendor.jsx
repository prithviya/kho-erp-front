import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Building2, MapPin, FileCheck, Loader2 } from "lucide-react";
import vendorService from "../../services/vendor.service";

const INITIAL_FORM = {
    vendor_name: "",
    vendor_email: "",
    vendor_contact: "",
    vendor_company_name: "",
    vendor_address: "",
    gst_registered: "no",
    gst_number: "",
    status: "active",
};

function validate(form) {
    const errors = {};
    if (!form.vendor_name.trim()) errors.vendor_name = "Vendor name is required.";
    if (!form.vendor_email.trim()) errors.vendor_email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.vendor_email)) errors.vendor_email = "Invalid email format.";
    if (!form.vendor_contact.trim()) errors.vendor_contact = "Contact number is required.";
    if (form.gst_registered === "yes" && !form.gst_number.trim()) {
        errors.gst_number = "GST number is required when GST registered is selected.";
    }
    return errors;
}

export default function CreateVendor({ open, onClose, onCreated }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setForm(INITIAL_FORM);
            setErrors({});
            setServerError(null);
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            await vendorService.create(form);
            onCreated?.();
        } catch (err) {
            setServerError(err.response?.data?.message || err.message || "Failed to create vendor.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = (field) =>
        `w-full rounded-lg border bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
            errors[field] ? "border-red-400 bg-red-50/30" : "border-gray-200"
        }`;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Slide-in Panel */}
            <div
                className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Add New Vendor</h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form id="create-vendor-form" onSubmit={handleSubmit} className="space-y-4 p-6">
                        {serverError && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                                {serverError}
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Vendor Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                    <User size={16} />
                                </span>
                                <input
                                    type="text"
                                    name="vendor_name"
                                    value={form.vendor_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Ramesh Kumar"
                                    className={inputCls("vendor_name")}
                                />
                            </div>
                            {errors.vendor_name && <p className="mt-1 text-xs text-red-500">{errors.vendor_name}</p>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Company Name
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                    <Building2 size={16} />
                                </span>
                                <input
                                    type="text"
                                    name="vendor_company_name"
                                    value={form.vendor_company_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Supplies Pvt Ltd"
                                    className={inputCls("vendor_company_name")}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                    <Mail size={16} />
                                </span>
                                <input
                                    type="email"
                                    name="vendor_email"
                                    value={form.vendor_email}
                                    onChange={handleChange}
                                    placeholder="vendor@company.com"
                                    className={inputCls("vendor_email")}
                                />
                            </div>
                            {errors.vendor_email && <p className="mt-1 text-xs text-red-500">{errors.vendor_email}</p>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                    <Phone size={16} />
                                </span>
                                <input
                                    type="text"
                                    name="vendor_contact"
                                    value={form.vendor_contact}
                                    onChange={handleChange}
                                    placeholder="10-digit phone number"
                                    className={inputCls("vendor_contact")}
                                />
                            </div>
                            {errors.vendor_contact && <p className="mt-1 text-xs text-red-500">{errors.vendor_contact}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    GST Registered?
                                </label>
                                <select
                                    name="gst_registered"
                                    value={form.gst_registered}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {form.gst_registered === "yes" && (
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    GST Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                        <FileCheck size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        maxLength={15}
                                        value={form.gst_number}
                                        onChange={handleChange}
                                        placeholder="22AAAAA0000A1Z5"
                                        className={inputCls("gst_number")}
                                    />
                                </div>
                                {errors.gst_number && <p className="mt-1 text-xs text-red-500">{errors.gst_number}</p>}
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Vendor Address
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                                    <MapPin size={16} />
                                </span>
                                <textarea
                                    rows={3}
                                    name="vendor_address"
                                    value={form.vendor_address}
                                    onChange={handleChange}
                                    placeholder="Street, City, Pincode"
                                    className="w-full resize-none rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="shrink-0 border-t bg-white px-6 py-4">
                    <button
                        type="submit"
                        form="create-vendor-form"
                        disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-60"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? "Saving…" : "Save Vendor"}
                    </button>
                </div>
            </div>
        </>
    );
}