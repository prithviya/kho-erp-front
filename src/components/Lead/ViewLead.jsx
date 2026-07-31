import {
  X, Mail, Phone, User, UserCheck, IndianRupee,
  CalendarDays, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import leadService from "../../services/lead.service";

const STATUS_PROGRESS = {
  "New Lead": 10,
  "Contacted": 30,
  "Discussion": 50,
  "Proposal": 70,
  "Negotiation": 85,
  "Converted": 100,
  "On Hold": 20,
};

const FALLBACK_STATUSES = [
  "New Lead", "Contacted", "Discussion", "Proposal",
  "Negotiation", "Converted", "On Hold",
];

const AVATAR_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500",
  "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
];

function avatarColor(name = "") {
  const letter = name.trim()[0]?.toUpperCase() ?? "?";
  return AVATAR_COLORS[letter.charCodeAt(0) % AVATAR_COLORS.length];
}

// yyyy-mm-dd for the native <input type="date">
function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

function DetailRow({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-3 text-sm text-gray-700">
      <Icon size={16} className="shrink-0 text-gray-400" />
      <span>{children}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  );
}

function extractServiceIds(lead = {}) {
  const fromIds = Array.isArray(lead.serviceIds) ? lead.serviceIds : [];
  if (fromIds.length > 0) {
    return fromIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  const fromRelations = lead.services ?? lead.Services ?? [];
  if (!Array.isArray(fromRelations)) return [];

  return fromRelations
    .map((svc) => Number(svc?.id ?? svc?.serviceId))
    .filter((id) => Number.isFinite(id));
}

export default function ViewLead({ open, onClose, lead, onUpdated }) {
  const [statuses, setStatuses] = useState([]);
  const [leadDetails, setLeadDetails] = useState(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [statusId, setStatusId] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load status options when panel opens
  useEffect(() => {
    if (!open) return;
    leadService.getLeadStatuses()
      .then((res) => setStatuses(res?.data || []))
      .catch(() => setStatuses([]));
  }, [open]);

  // Load full lead details so field values match detailed API response.
  useEffect(() => {
    if (!open || !lead?.id) return;
    setLoadingLead(true);
    leadService.getLeadById(lead.id)
      .then((res) => setLeadDetails(res?.data || null))
      .catch(() => setLeadDetails(null))
      .finally(() => setLoadingLead(false));
  }, [open, lead?.id]);

  // Reset fields whenever a (new) lead is opened
  useEffect(() => {
    const activeLead = leadDetails ?? lead;
    setStatusId(activeLead?.leadStatusId ?? activeLead?.leadStatus?.id ?? "");
    setFollowupDate(toDateInputValue(activeLead?.nextFollowupDate));
    setReason("");
    setError(null);
    setSuccess(false);
  }, [lead, leadDetails, open]);

  if (!open) return null;

  const activeLead = leadDetails ?? lead;

  const currentStatusName =
    statuses.find((s) => s.id === Number(statusId))?.name
    || activeLead?.leadStatus?.name
    || "New Lead";

  const progressValue = STATUS_PROGRESS[currentStatusName] || 10;

  const originalStatusId = activeLead?.leadStatusId ?? activeLead?.leadStatus?.id;
  const originalFollowup = toDateInputValue(activeLead?.nextFollowupDate);
  const isChanged =
    (statusId && Number(statusId) !== originalStatusId) ||
    followupDate !== originalFollowup;

  const assignedName = activeLead?.assignedUser
    ? `${activeLead.assignedUser.firstName ?? ""} ${activeLead.assignedUser.lastName ?? ""}`.trim()
    : activeLead?.referralName || "";

  // Group required services into colored pills, e.g. "Design: Logo"
  const servicePills = (activeLead?.Services ?? activeLead?.services ?? []).map((svc) => ({
    id: svc.id,
    label: svc.Category?.name || svc.category?.name
      ? `${svc.Category?.name ?? svc.category?.name}: ${svc.name}`
      : svc.name,
    color: svc.Category?.color || svc.category?.color || "#6B7280",
  }));

  async function handleUpdate() {
    if (!activeLead?.id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        companyName: activeLead.companyName,
        contactPerson: activeLead.contactPerson,
        phone: activeLead.phone,
        email: activeLead.email,
        requirement: activeLead.requirement,
        budget: activeLead.budget,
        leadSourceId: activeLead.leadSourceId,
        leadStatusId: statusId ? Number(statusId) : originalStatusId,
        assignedTo: activeLead.assignedTo,
        referralName: activeLead.referralName,
        notes: reason.trim() ? `${activeLead.notes ? activeLead.notes + "\n" : ""}${reason.trim()}` : activeLead.notes,
        nextFollowupDate: followupDate || undefined,
        serviceIds: extractServiceIds(activeLead),
      };
      const result = await leadService.updateLead(activeLead.id, payload);
      setLeadDetails(result?.data || activeLead);
      setSuccess(true);
      setReason("");
      onUpdated?.(result?.data);
    } catch (err) {
      setError(err.message || "Failed to update lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      {/* Offcanvas */}
      <div
        className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Avatar + name block */}
          <div className="flex items-center gap-4 px-6 py-5">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${avatarColor(activeLead?.companyName)}`}>
              {activeLead?.companyName?.trim()[0]?.toUpperCase() ?? "?"}
            </span>
            <div>
              <p className="text-lg font-bold text-gray-900">{activeLead?.companyName || "—"}</p>
              <p className="text-sm text-gray-400">{activeLead?.contactPerson}</p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="border-t border-gray-100">
            <DetailRow icon={Mail}>{activeLead?.email || "—"}</DetailRow>
            <DetailRow icon={Phone}>{activeLead?.phone || "—"}</DetailRow>
            <DetailRow icon={User}>Source: {activeLead?.leadSource?.name || "—"}</DetailRow>
            {assignedName && (
              <DetailRow icon={UserCheck}>{assignedName}</DetailRow>
            )}
            <DetailRow icon={IndianRupee}>
              {activeLead?.budget ? `₹${Number(activeLead.budget).toLocaleString("en-IN")}` : "Not set"}
            </DetailRow>
            <DetailRow icon={CalendarDays}>
              Follow-up: {activeLead?.nextFollowupDate
                ? new Date(activeLead.nextFollowupDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "Not Set"}
            </DetailRow>
          </div>

          {loadingLead && (
            <div className="px-6 pb-3 text-xs text-gray-400">Refreshing lead details...</div>
          )}

          {/* Required Services */}
          {servicePills.length > 0 && (
            <div className="px-6 py-5">
              <SectionLabel>Required Services</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {servicePills.map((svc) => (
                  <span
                    key={svc.id}
                    style={{ backgroundColor: svc.color }}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  >
                    {svc.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status Pipeline */}
          <div className="px-6 py-5">
            <SectionLabel>Status Pipeline</SectionLabel>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <span className="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
              {currentStatusName}
            </span>
          </div>

          {/* Update section */}
          <div className="space-y-4 border-t border-gray-100 px-6 py-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                Lead updated successfully.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Update Status
              </label>
              <select
                value={statusId}
                onChange={(e) => { setStatusId(e.target.value); setSuccess(false); }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {statuses.length > 0
                  ? statuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  : FALLBACK_STATUSES.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Next Follow-up Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => { setFollowupDate(e.target.value); setSuccess(false); }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Internal Notes (Reason for change)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this being updated?"
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t bg-white px-6 py-4">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={!isChanged || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Updating…" : "Update Lead"}
          </button>
        </div>
      </div>
    </>
  );
}