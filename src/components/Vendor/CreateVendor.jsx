import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Building2, MapPin, FileCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import vendorService from "../../services/vendor.service";
import leadService from "../../services/lead.service";

const INITIAL_FORM = {
    vendor_name: "",
    vendor_email: "",
    vendor_contact: "",
    vendor_company_name: "",
    vendor_address: "",
    gst_registered: "no",
    gst_number: "",
    status: "active",
    services: [],
};

const EMPTY_SERVICE = { categoryId: "", serviceId: "", price: "" };

function validate(form) {
    const errors = {};
    if (!form.vendor_name.trim()) errors.vendor_name = "Vendor name is required.";
    if (form.vendor_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.vendor_email)) {
        errors.vendor_email = "Invalid email format.";
    }
    if (!/^\d{10}$/.test(form.vendor_contact)) {
        errors.vendor_contact = "Phone number must be exactly 10 digits.";
    }
    if (form.gst_registered === "yes" && !/^[A-Za-z0-9]{15}$/.test(form.gst_number)) {
        errors.gst_number = "GST number must be exactly 15 alphanumeric characters.";
    }
    const selectedServices = new Set();
    form.services.forEach((service, index) => {
        if (!service.categoryId) errors[`service_category_${index}`] = "Select a category.";
        if (!service.serviceId) errors[`service_${index}`] = "Select a service.";
        if (service.price === "" || Number(service.price) < 0) errors[`price_${index}`] = "Enter a valid price.";
        if (service.serviceId && selectedServices.has(String(service.serviceId))) errors[`service_${index}`] = "This service is already selected.";
        if (service.serviceId) selectedServices.add(String(service.serviceId));
    });
    return errors;
}

export default function CreateVendor({ open, onClose, onCreated }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    useEffect(() => {
        if (open) {
            setLoadingCategories(true);
            leadService.getCategoriesWithServices()
                .then((response) => setCategories(response?.data || []))
                .catch((err) => toast.error(err.message || "Failed to load services."))
                .finally(() => setLoadingCategories(false));
        }
        if (!open) {
            setForm({ ...INITIAL_FORM, services: [] });
            setErrors({});
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const normalizedValue = name === "vendor_contact"
            ? value.replace(/\D/g, "").slice(0, 10)
            : name === "gst_number"
                ? value.replace(/[^A-Za-z0-9]/g, "").slice(0, 15)
                : value;
        setForm((prev) => ({ ...prev, [name]: normalizedValue }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                services: form.services.map((service) => ({
                    service_category_id: Number(service.categoryId),
                    service_id: Number(service.serviceId),
                    price: Number(service.price),
                })),
            };
            await vendorService.create(payload);
            toast.success("Vendor created successfully!");
            onCreated?.();

            // Small delay for toast visibility, followed by reload
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to create vendor.";
            toast.error(errorMsg);
            setSubmitting(false);
        }
    };

    const inputCls = (field) =>
        `w-full rounded-lg border bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
            errors[field] ? "border-red-400 bg-red-50/30" : "border-gray-200"
        }`;

    const updateService = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            services: prev.services.map((service, serviceIndex) =>
                serviceIndex === index
                    ? { ...service, [field]: value, ...(field === "categoryId" ? { serviceId: "" } : {}) }
                    : service
            ),
        }));
        setErrors((prev) => ({ ...prev, [`service_category_${index}`]: undefined, [`service_${index}`]: undefined, [`price_${index}`]: undefined }));
    };

    const addService = () => setForm((prev) => ({ ...prev, services: [...prev.services, { ...EMPTY_SERVICE }] }));
    const removeService = (index) => setForm((prev) => ({ ...prev, services: prev.services.filter((_, serviceIndex) => serviceIndex !== index) }));

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => !submitting && onClose()}
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
                    <button 
                        type="button" 
                        disabled={submitting} 
                        onClick={onClose} 
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition disabled:opacity-40"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form id="create-vendor-form" onSubmit={handleSubmit} className="space-y-4 p-6">
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
                                    disabled={submitting}
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
                                    disabled={submitting}
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
                                    disabled={submitting}
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
                                    disabled={submitting}
                                    value={form.vendor_contact}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="10-digit phone number"
                                    className={inputCls("vendor_contact")}
                                />
                            </div>
                            {errors.vendor_contact && <p className="mt-1 text-xs text-red-500">{errors.vendor_contact}</p>}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Services</label>
                                <button type="button" onClick={addService} disabled={submitting || loadingCategories} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">
                                    <Plus size={14} /> Add Service
                                </button>
                            </div>
                            {loadingCategories && <p className="text-xs text-gray-400">Loading service categories...</p>}
                            {form.services.map((service, index) => {
                                const category = categories.find((item) => String(item.id) === String(service.categoryId));
                                const availableServices = category?.services || category?.Services || [];
                                return (
                                    <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                            <select value={service.categoryId} disabled={submitting || loadingCategories} onChange={(e) => updateService(index, "categoryId", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                                <option value="">Category</option>
                                                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                            </select>
                                            <select value={service.serviceId} disabled={submitting || !service.categoryId} onChange={(e) => updateService(index, "serviceId", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                                <option value="">Sub service</option>
                                                {availableServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                            </select>
                                            <button type="button" title="Remove service" onClick={() => removeService(index)} disabled={submitting} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"><Trash2 size={16} /></button>
                                        </div>
                                        <input type="number" min="0" step="0.01" value={service.price} disabled={submitting || !service.serviceId} onChange={(e) => updateService(index, "price", e.target.value)} placeholder="Sub service price" className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                                        {(errors[`service_category_${index}`] || errors[`service_${index}`] || errors[`price_${index}`]) && <p className="mt-1 text-xs text-red-500">{errors[`service_category_${index}`] || errors[`service_${index}`] || errors[`price_${index}`]}</p>}
                                    </div>
                                );
                            })}
                            {!form.services.length && <p className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-400">Add one or more services for this vendor.</p>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                GST Registered?
                            </label>
                            <select
                                name="gst_registered"
                                disabled={submitting}
                                value={form.gst_registered}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </select>
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
                                        disabled={submitting}
                                        maxLength={15}
                                        value={form.gst_number}
                                        onChange={handleChange}
                                        autoCapitalize="characters"
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
                                    disabled={submitting}
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