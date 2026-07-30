import { X, Building2, User, Phone, Mail, LogIn, IndianRupee,
    CalendarDays, FileText, Users, StickyNote, UserCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import leadService from "../../services/lead.service";

const NOTES_MAX = 1000;

const EMPTY_FORM = {
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    leadSourceId: "",
    leadStatusId: "",
    referralName: "",
    serviceIds: [],
    budget: "",
    nextFollowupDate: "",
    requirement: "",
    assignedTo: "",
    notes: "",
};

function validate(form) {
    const errors = {};
    if (!form.companyName.trim()) errors.companyName = "Company name is required.";
    if (!form.contactPerson.trim()) errors.contactPerson = "Contact person is required.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) errors.phone = "Invalid phone number.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email address.";
    if (!form.leadSourceId) errors.leadSourceId = "Lead source is required.";
    if (form.budget !== "" && Number(form.budget) < 0) errors.budget = "Budget must be a positive number.";
    return errors;
}

function FieldError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function IconInput({ icon: Icon, children }) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Icon size={16} />
            </span>
            {children}
        </div>
    );
}

function Skeleton({ rows = 5 }) {
    return (
        <div className="space-y-5 p-6 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i}>
                    <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
                    <div className="h-10 rounded-lg bg-gray-200" />
                </div>
            ))}
        </div>
    );
}

// Accepts either `leadId` (a number/string id) or a full `lead` object.
// This way it works no matter which prop the parent passes.
export default function EditLead({ open, onClose, leadId: leadIdProp, lead: leadProp, onUpdated }) {
    const leadId = leadIdProp ?? leadProp?.id ?? null;

    const [form, setForm] = useState(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [leadSources, setLeadSources] = useState([]);
    const [leadStatuses, setLeadStatuses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Fetch lookup data when panel opens
    useEffect(() => {
        if (!open) return;
        setLoadingData(true);
        setServerError(null);
        Promise.allSettled([
            leadService.getLeadSources(),
            leadService.getLeadStatuses(),
            leadService.getCategoriesWithServices(),
            leadService.getUsers(),
        ]).then(([src, sta, cat, usr]) => {
            if (src.status === "fulfilled") setLeadSources(src.value?.data || []);
            if (sta.status === "fulfilled") setLeadStatuses(sta.value?.data || []);
            if (cat.status === "fulfilled") setCategories(cat.value?.data || []);
            if (usr.status === "fulfilled") setUsers(usr.value?.data || []);
        }).finally(() => setLoadingData(false));
    }, [open]);

    // Fetch lead data when panel opens and leadId is available
    useEffect(() => {
        if (!open || !leadId) return;
        setLoading(true);
        setServerError(null);

        leadService.getLeadById(leadId)
            .then((response) => {
                const l = response?.data;
                if (l) {
                    setForm({
                        companyName: l.companyName || "",
                        contactPerson: l.contactPerson || "",
                        phone: l.phone || "",
                        email: l.email || "",
                        leadSourceId: l.leadSourceId || "",
                        leadStatusId: l.leadStatusId || "",
                        referralName: l.referralName || "",
                        serviceIds: l.serviceIds || [],
                        budget: l.budget ?? "",
                        nextFollowupDate: l.nextFollowupDate
                            ? l.nextFollowupDate.slice(0, 10) // yyyy-mm-dd for <input type="date">
                            : "",
                        requirement: l.requirement || "",
                        assignedTo: l.assignedTo || "",
                        notes: l.notes || "",
                    });
                }
            })
            .catch((err) => {
                setServerError(err.message || "Failed to load lead data.");
            })
            .finally(() => setLoading(false));
    }, [open, leadId]);

    // Reset form when panel closes
    useEffect(() => {
        if (!open) {
            setForm(EMPTY_FORM);
            setFieldErrors({});
            setServerError(null);
        }
    }, [open]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    function toggleService(id) {
        setForm((prev) => ({
            ...prev,
            serviceIds: prev.serviceIds.includes(id)
                ? prev.serviceIds.filter((s) => s !== id)
                : [...prev.serviceIds, id],
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setServerError(null);

        const errors = validate(form);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const payload = {
            ...form,
            leadSourceId: Number(form.leadSourceId),
            leadStatusId: form.leadStatusId ? Number(form.leadStatusId) : undefined,
            assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
            budget: form.budget !== "" ? Number(form.budget) : undefined,
            nextFollowupDate: form.nextFollowupDate || undefined,
            referralName: form.referralName.trim() || undefined,
        };

        setSubmitting(true);
        try {
            const result = await leadService.updateLead(leadId, payload);
            onUpdated?.(result.data);
            onClose();
        } catch (err) {
            if (err.status === 422 && Array.isArray(err.errors)) {
                const mapped = {};
                err.errors.forEach(({ field, message }) => { mapped[field] = message; });
                setFieldErrors(mapped);
            } else {
                setServerError(err.message || "Something went wrong.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    const inputCls = (field) =>
        `w-full rounded-lg border bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
            fieldErrors[field] ? "border-red-400 bg-red-50/30" : "border-gray-200"
        }`;

    const selectCls = (field) =>
        `w-full rounded-lg border bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none ${
            fieldErrors[field] ? "border-red-400 bg-red-50/30" : "border-gray-200"
        }`;

    const selectedSource = leadSources.find((s) => s.id === Number(form.leadSourceId));
    const isReferral = selectedSource?.name?.toLowerCase().includes("referral");
    const selectedCount = form.serviceIds.length;

    // Progress calculation based on lead status
    const progress = {
        "New Lead": 10,
        "Contacted": 30,
        "Discussion": 50,
        "Proposal": 70,
        "Negotiation": 85,
        "Converted": 100,
        "On Hold": 20,
    };

    const currentStatus = leadStatuses.find((s) => s.id === Number(form.leadStatusId));
    const statusName = currentStatus?.name || "New Lead";
    const progressValue = progress[statusName] || 10;

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Slide-in panel */}
            <div
                className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Edit Lead</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Status Progress Bar */}
                <div className="border-b px-6 py-4">
                    <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-gray-700">Lead Status</span>
                        <span className="text-gray-500">{statusName}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                        <div
                            className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>New</span>
                        <span>In Progress</span>
                        <span>Converted</span>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    {loadingData || loading ? (
                        <Skeleton rows={8} />
                    ) : (
                        <form id="edit-lead-form" className="space-y-4 p-6" onSubmit={handleSubmit} noValidate>
                            {serverError && (
                                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                                    {serverError}
                                </div>
                            )}

                            {/* Company Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <IconInput icon={Building2}>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        placeholder="Company Ltd"
                                        className={inputCls("companyName")}
                                    />
                                </IconInput>
                                <FieldError message={fieldErrors.companyName} />
                            </div>

                            {/* Contact Person */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Contact Person <span className="text-red-500">*</span>
                                </label>
                                <IconInput icon={User}>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={form.contactPerson}
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        className={inputCls("contactPerson")}
                                    />
                                </IconInput>
                                <FieldError message={fieldErrors.contactPerson} />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <IconInput icon={Phone}>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+91 ..."
                                        className={inputCls("phone")}
                                    />
                                </IconInput>
                                <FieldError message={fieldErrors.phone} />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <IconInput icon={Mail}>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="contact@email.com"
                                        className={inputCls("email")}
                                    />
                                </IconInput>
                                <FieldError message={fieldErrors.email} />
                            </div>

                            {/* Lead Source */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Lead Source <span className="text-red-500">*</span>
                                </label>
                                <IconInput icon={LogIn}>
                                    <select
                                        name="leadSourceId"
                                        value={form.leadSourceId}
                                        onChange={handleChange}
                                        className={selectCls("leadSourceId")}
                                    >
                                        <option value="">Select Source</option>
                                        {leadSources.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </IconInput>
                                <FieldError message={fieldErrors.leadSourceId} />
                            </div>

                            {/* Lead Status */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Lead Status
                                </label>
                                <IconInput icon={UserCheck}>
                                    <select
                                        name="leadStatusId"
                                        value={form.leadStatusId}
                                        onChange={handleChange}
                                        className={selectCls("leadStatusId")}
                                    >
                                        <option value="">Select Status</option>
                                        {leadStatuses.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </IconInput>
                            </div>

                            {/* Referral Name — shown only when source is Referral */}
                            {isReferral && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Referred By
                                    </label>
                                    <IconInput icon={UserCheck}>
                                        <input
                                            type="text"
                                            name="referralName"
                                            value={form.referralName}
                                            onChange={handleChange}
                                            placeholder="Referral person or company"
                                            className={inputCls("referralName")}
                                        />
                                    </IconInput>
                                </div>
                            )}

                            {/* Required Services */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Required Services
                                    </label>
                                    {selectedCount > 0 && (
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                            {selectedCount} selected
                                        </span>
                                    )}
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                                    {categories.map((cat) => {
                                        const services = cat.Services ?? cat.services ?? [];
                                        if (!services.length) return null;
                                        const color = cat.color || "#6B7280";
                                        return (
                                            <div key={cat.id}>
                                                <p className="mb-2 text-xs font-semibold text-gray-600">{cat.name}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {services.map((svc) => {
                                                        const selected = form.serviceIds.includes(svc.id);
                                                        return (
                                                            <button
                                                                key={svc.id}
                                                                type="button"
                                                                onClick={() => toggleService(svc.id)}
                                                                style={{
                                                                    borderColor: color,
                                                                    color: selected ? "#fff" : color,
                                                                    backgroundColor: selected ? color : "transparent",
                                                                }}
                                                                className="rounded-full border px-3 py-1 text-xs font-medium transition-all hover:shadow-sm active:scale-95"
                                                            >
                                                                {svc.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {categories.length === 0 && (
                                        <p className="py-2 text-center text-xs text-gray-400">No services available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Estimated Budget */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Estimated Budget (₹)
                                </label>
                                <IconInput icon={IndianRupee}>
                                    <input
                                        type="number"
                                        name="budget"
                                        value={form.budget}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="0"
                                        className={inputCls("budget")}
                                    />
                                </IconInput>
                                <FieldError message={fieldErrors.budget} />
                            </div>

                            {/* Next Follow-up Date */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Next Follow-up Date
                                </label>
                                <IconInput icon={CalendarDays}>
                                    <input
                                        type="date"
                                        name="nextFollowupDate"
                                        value={form.nextFollowupDate}
                                        onChange={handleChange}
                                        className={inputCls("nextFollowupDate")}
                                    />
                                </IconInput>
                            </div>

                            {/* Project Name / Requirement */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Project Name
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                                        <FileText size={16} />
                                    </span>
                                    <textarea
                                        rows={3}
                                        name="requirement"
                                        value={form.requirement}
                                        onChange={handleChange}
                                        placeholder="Name of the Project"
                                        className="w-full resize-none rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            {/* Assigned CRM Executive */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Assigned CRM Executive
                                </label>
                                <IconInput icon={Users}>
                                    <select
                                        name="assignedTo"
                                        value={form.assignedTo}
                                        onChange={handleChange}
                                        className={selectCls("assignedTo")}
                                    >
                                        <option value="">Select Executive</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.firstName
                                                    ? `${u.firstName} ${u.lastName ?? ""}`.trim()
                                                    : u.name}
                                            </option>
                                        ))}
                                    </select>
                                </IconInput>
                            </div>

                            {/* Internal Notes with character counter */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Internal Notes
                                    </label>
                                    <span className={`text-xs ${form.notes.length > NOTES_MAX * 0.9 ? "text-orange-500" : "text-gray-400"}`}>
                                        {form.notes.length}/{NOTES_MAX}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                                        <StickyNote size={16} />
                                    </span>
                                    <textarea
                                        rows={3}
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        maxLength={NOTES_MAX}
                                        placeholder="Private notes for the team..."
                                        className="w-full resize-none rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <FieldError message={fieldErrors.notes} />
                            </div>

                            {/* Spacer */}
                            <div className="h-2" />
                        </form>
                    )}
                </div>

                {/* Sticky footer */}
                {!loadingData && !loading && (
                    <div className="shrink-0 border-t bg-white px-6 py-4">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-lead-form"
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-md shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-60"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {submitting ? "Updating…" : "Update Lead"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}