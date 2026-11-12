import {
  X, Mail, Phone, User, UserCheck, IndianRupee,
  CalendarDays, Loader2, Clock3, FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
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

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

function getTodayDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "Date not available";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getHistoryEntries(lead, statuses) {
  const history = lead?.leadHistory ?? lead?.history ?? lead?.statusHistory;
  const getStatusName = (statusId) => statuses.find((status) => status.id === Number(statusId))?.name;
  if (Array.isArray(history) && history.length > 0) {
    return history.map((entry, index) => ({
      id: entry.id ?? index,
      title: entry.title || entry.action || entry.event
        || (entry.notes === "Lead Created"
          ? "Lead Created"
          : entry.newStatusId && Number(entry.oldStatusId) !== Number(entry.newStatusId)
            ? "Lead status changed"
            : "Lead updated"),
      status: entry.statusName || entry.leadStatus?.name || entry.status || getStatusName(entry.newStatusId),
      date: entry.createdAt || entry.updatedAt || entry.changedAt || entry.date,
      followupDate: entry.newFollowupDate || entry.nextFollowupDate,
      notes: entry.notes || entry.reason || entry.internalNotes,
    }));
  }

  return [{
    id: "current",
    title: lead?.createdAt ? "Lead created" : "Current lead details",
    status: lead?.leadStatus?.name,
    date: lead?.updatedAt || lead?.createdAt,
    followupDate: lead?.nextFollowupDate,
    notes: lead?.notes,
  }];
}

function DetailRow({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 text-sm text-slate-700 sm:px-6">
      <Icon size={16} className="shrink-0 text-[#9c1018]" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-3 text-[11px] font-semibold text-slate-600">
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

  useEffect(() => {
    if (!open) return;
    leadService.getLeadStatuses()
      .then((res) => setStatuses((res?.data || []).filter((status) => status.isActive !== false)))
      .catch(() => setStatuses([]));
  }, [open]);

  useEffect(() => {
    if (!open || !lead?.id) return;
    setLoadingLead(true);
    leadService.getLeadById(lead.id)
      .then((res) => setLeadDetails(res?.data || null))
      .catch(() => setLeadDetails(null))
      .finally(() => setLoadingLead(false));
  }, [open, lead?.id]);

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
  const isConverted = currentStatusName.trim().toLowerCase() === "converted";

  const progressValue = STATUS_PROGRESS[currentStatusName] || 10;

  const originalStatusId = activeLead?.leadStatusId ?? activeLead?.leadStatus?.id;
  const originalFollowup = toDateInputValue(activeLead?.nextFollowupDate);
  const isChanged =
    (statusId && Number(statusId) !== originalStatusId) ||
    followupDate !== originalFollowup ||
    reason.trim().length > 0;

  const assignedName = activeLead?.assignedUser
    ? `${activeLead.assignedUser.firstName ?? ""} ${activeLead.assignedUser.lastName ?? ""}`.trim()
    : activeLead?.referralName || "";

  const servicePills = (activeLead?.Services ?? activeLead?.services ?? []).map((svc) => ({
    id: svc.id,
    label: svc.Category?.name || svc.category?.name
      ? `${svc.Category?.name ?? svc.category?.name}: ${svc.name}`
      : svc.name,
    color: svc.Category?.color || svc.category?.color || "#6B7280",
  }));
  const historyEntries = getHistoryEntries(activeLead, statuses);

  async function handleUpdate() {
    if (!activeLead?.id) return;
    if (followupDate && followupDate < getTodayDate()) {
      const msg = "Follow-up date cannot be in the past.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    const hasStatusChanged = statusId && Number(statusId) !== originalStatusId;

    try {
      const payload = {
        companyName: activeLead.companyName,
        salutation: activeLead.salutation,
        contactPerson: activeLead.contactPerson,
        phoneCountryCode: activeLead.phoneCountryCode,
        phone: activeLead.phone,
        email: activeLead.email,
        requirement: activeLead.requirement,
        budget: activeLead.budget,
        leadSourceId: activeLead.leadSourceId,
        leadStatusId: statusId ? Number(statusId) : originalStatusId,
        assignedTo: activeLead.assignedTo,
        referralName: activeLead.referralName,
        notes: reason.trim() ? `${activeLead.notes ? activeLead.notes + "\n" : ""}${reason.trim()}` : activeLead.notes,
        changeReason: reason.trim(),
        nextFollowupDate: followupDate || undefined,
        serviceIds: extractServiceIds(activeLead),
      };

      const result = await leadService.updateLead(activeLead.id, payload);
      setLeadDetails(result?.data || activeLead);
      setSuccess(true);
      setReason("");
      onUpdated?.(result?.data);

      const toastMessage = hasStatusChanged
        ? `Lead status updated to "${currentStatusName}"`
        : "Lead updated successfully.";

      toast.success(toastMessage, {
        autoClose: 800,
        onClose: () => {
          window.location.reload();
        },
      });
    } catch (err) {
      const errorMsg = err.message || "Failed to update lead.";
      setError(errorMsg);
      toast.error(errorMsg);
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[500px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-[#f7f7fa] px-5 py-3.5 sm:px-6">
          <h2 className="text-sm font-semibold text-[#211d20]">Lead Details</h2>
          <button
            type="button"
            title="Close"
            aria-label="Close lead details"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg font-semibold text-[#8f1018]">
              {activeLead?.companyName?.trim()[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0">
              <p className="break-words text-base font-semibold text-[#211d20]">{activeLead?.companyName || "—"}</p>
              <p className="mt-0.5 text-sm text-slate-500">{[activeLead?.salutation, activeLead?.contactPerson].filter(Boolean).join(" ") || "—"}</p>
            </div>
          </div>

          <div>
            <DetailRow icon={Mail}>{activeLead?.email || "—"}</DetailRow>
            <DetailRow icon={Phone}>{[activeLead?.phoneCountryCode, activeLead?.phone].filter(Boolean).join(" ") || "—"}</DetailRow>
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
            <div className="px-5 pb-3 text-xs text-slate-400 sm:px-6">Refreshing lead details...</div>
          )}

          {servicePills.length > 0 && (
            <div className="px-5 py-5 sm:px-6">
              <SectionLabel>Required Services</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {servicePills.map((svc) => (
                  <span
                    key={svc.id}
                    style={{
                      color: svc.color,
                      backgroundColor: `color-mix(in srgb, ${svc.color} 12%, white)`,
                    }}
                    className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold"
                  >
                    {svc.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <SectionLabel>Status Pipeline</SectionLabel>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-[#9c1018] transition-all duration-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <span className="mt-3 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8f1018]">
              {currentStatusName}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-5 sm:px-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 sm:col-span-2">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 sm:col-span-2">
                Lead updated successfully.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                Update Status
              </label>
              <select
                value={statusId}
                onChange={(e) => { setStatusId(e.target.value); setSuccess(false); }}
                className="w-full rounded-lg border border-gray-200 bg-[#fbfbfc] px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9c1018]/15 focus:border-[#9c1018]"
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
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                Next Follow-up Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={followupDate}
                  min={getTodayDate()}
                  disabled={isConverted}
                  onChange={(e) => { setFollowupDate(e.target.value); setSuccess(false); }}
                  className={`w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c1018]/15 focus:border-[#9c1018] ${
                    isConverted ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-700"
                  }`}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                Internal Notes (Reason for change)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this being updated?"
                className="w-full resize-none rounded-lg border border-gray-200 bg-[#fbfbfc] px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9c1018]/15 focus:border-[#9c1018]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                Lead History Tracking
              </label>
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-[#fbfbfc] p-3">
                {historyEntries.map((entry) => (
                  <div key={entry.id} className="relative border-l-2 border-rose-200 pl-4">
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#9c1018]" />
                    <p className="text-sm font-semibold text-gray-700">{entry.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                      <Clock3 size={12} /> {formatDateTime(entry.date)}
                    </p>
                    {entry.status && (
                      <p className="mt-2 text-xs text-gray-600">Status: <span className="font-medium">{entry.status}</span></p>
                    )}
                    {entry.followupDate && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                        <CalendarDays size={12} /> Follow-up: {toDateInputValue(entry.followupDate)}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-gray-600">
                        <FileText size={12} className="mt-0.5 shrink-0" /> {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={!isChanged || saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8f1018] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#780c13] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Updating…" : "Update Lead"}
          </button>
        </div>
      </div>
    </>
  );
}