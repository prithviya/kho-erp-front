import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Check, Eye, X, Trash2 } from "lucide-react";
import leaveService from "../../services/leave.service";
import { getCurrentUser, canDeleteRecords } from "../../utils/auth";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status = "") {
  const normalized = String(status).toUpperCase();
  if (normalized === "APPROVED") return "bg-green-100 text-green-700";
  if (normalized === "REJECTED") return "bg-red-100 text-red-700";
  if (normalized === "CANCELLED") return "bg-gray-200 text-gray-700";
  return "bg-yellow-100 text-yellow-700";
}

const conflictingLeaveCodes = new Set(["CASUAL_LEAVE", "LEAVE_WITHOUT_PAY", "PERMISSION"]);
const conflictingLeaveTypes = {
  CASUAL_LEAVE: ["LEAVE_WITHOUT_PAY", "PERMISSION"],
  LEAVE_WITHOUT_PAY: ["CASUAL_LEAVE", "PERMISSION"],
  PERMISSION: ["CASUAL_LEAVE", "LEAVE_WITHOUT_PAY"],
};

const durationOptions = [
  ["FULL_DAY", "Full Day"],
  ["HALF_DAY", "Half Day"],
  ["QUARTER_DAY", "Quarter Day"],
  ["HOURS", "Hours"],
];

function getAllowedDurationTypes(categoryCode) {
  return {
    CASUAL_LEAVE: ["FULL_DAY", "HALF_DAY"],
    ON_THE_DUTY: ["FULL_DAY", "HALF_DAY", "QUARTER_DAY", "HOURS"],
    LEAVE_WITHOUT_PAY: ["FULL_DAY", "HALF_DAY", "HOURS"],
    PERMISSION: ["HOURS"],
  }[categoryCode] || durationOptions.map(([value]) => value);
}

function get12HourParts(value) {
  const [hours = "", minutes = ""] = String(value || "").split(":");
  const hourValue = Number(hours);
  if (!Number.isInteger(hourValue) || hourValue < 0 || hourValue > 23 || !/^\d{2}$/.test(minutes)) {
    return { hour: "", minute: "", period: "AM" };
  }

  return {
    hour: String(hourValue % 12 || 12).padStart(2, "0"),
    minute: minutes,
    period: hourValue >= 12 ? "PM" : "AM",
  };
}

function to24HourValue(hour, minute, period) {
  if (!hour || !minute || !period) return "";
  let hourValue = Number(hour) % 12;
  if (period === "PM") hourValue += 12;
  return `${String(hourValue).padStart(2, "0")}:${minute}`;
}

function TimeInput({ label, value, onChange }) {
  const [parts, setParts] = useState(() => get12HourParts(value));

  const updateTime = (nextParts) => {
    setParts(nextParts);
    onChange(to24HourValue(nextParts.hour, nextParts.minute, nextParts.period));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}<span className="text-red-500">*</span></label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={parts.hour}
          onChange={(event) => updateTime({ ...parts, hour: event.target.value })}
          required
          className="w-full px-2 py-2 border border-gray-300 rounded-md"
          aria-label={`${label} hour`}
        >
          <option value="">HH</option>
          {Array.from({ length: 12 }, (_, index) => {
            const hour = String(index + 1).padStart(2, "0");
            return <option key={hour} value={hour}>{hour}</option>;
          })}
        </select>
        <select
          value={parts.minute}
          onChange={(event) => updateTime({ ...parts, minute: event.target.value })}
          required
          className="w-full px-2 py-2 border border-gray-300 rounded-md"
          aria-label={`${label} minute`}
        >
          <option value="">MM</option>
          {Array.from({ length: 60 }, (_, index) => {
            const minute = String(index).padStart(2, "0");
            return <option key={minute} value={minute}>{minute}</option>;
          })}
        </select>
        <select
          value={parts.period}
          onChange={(event) => updateTime({ ...parts, period: event.target.value })}
          required
          className="w-full px-2 py-2 border border-gray-300 rounded-md"
          aria-label={`${label} AM or PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

function datesOverlap(firstFrom, firstTo, secondFrom, secondTo) {
  return firstFrom <= secondTo && firstTo >= secondFrom;
}

export default function LeaveManagement() {
  const currentUser = getCurrentUser();
  const canDelete = canDeleteRecords();
  const [deletingId, setDeletingId] = useState(null);

  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ categories: [], totals: {} });
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [form, setForm] = useState({
    categoryId: "",
    fromDate: "",
    toDate: "",
    durationType: "FULL_DAY",
    session: "",
    quarterSlot: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  const categoryBalance = useMemo(() => {
    const categoryId = Number(form.categoryId || 0);
    if (!categoryId) return null;
    return (summary.categories || []).find((item) => Number(item.categoryId) === categoryId) || null;
  }, [form.categoryId, summary.categories]);

  const hasCasualLeaveForMonth = (dateValue) => {
    if (!dateValue) return false;
    const monthStart = `${dateValue.slice(0, 7)}-01`;
    const monthEnd = new Date(
      Number(dateValue.slice(0, 4)),
      Number(dateValue.slice(5, 7)),
      0
    ).toISOString().slice(0, 10);

    return requests.some((item) => (
      item.category?.code === "CASUAL_LEAVE" &&
      ["PENDING", "APPROVED"].includes(String(item.status || "").toUpperCase()) &&
      datesOverlap(item.fromDate, item.toDate, monthStart, monthEnd)
    ));
  };

  const hasCasualLeaveInRange = (fromDate, toDate) => {
    if (!fromDate) return false;
    const endDate = toDate || fromDate;
    let cursor = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    while (cursor <= end) {
      const monthDate = cursor.toISOString().slice(0, 10);
      if (hasCasualLeaveForMonth(monthDate)) return true;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    return false;
  };

  const hasRestrictedDateOverlap = (category, fromDate, toDate) => {
    if (!conflictingLeaveCodes.has(category.code) || !fromDate) return false;
    const endDate = toDate || fromDate;

    return requests.some((item) => (
      conflictingLeaveTypes[category.code]?.includes(item.category?.code) &&
      ["PENDING", "APPROVED"].includes(String(item.status || "").toUpperCase()) &&
      datesOverlap(item.fromDate, item.toDate, fromDate, endDate)
    ));
  };

  const handleDeleteRequest = async (item) => {
    if (!canDelete || deletingId) return;
    if (!window.confirm("Delete this leave request? This action cannot be undone.")) return;
    try {
      setDeletingId(item.id);
      await leaveService.deleteRequest(item.id);
      toast.success("Leave request deleted.");
      await loadPageData();
    } catch (error) {
      toast.error(error?.message || "Unable to delete leave request.");
    } finally {
      setDeletingId(null);
    }
  };

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [summaryRes, categoriesRes, requestsRes] = await Promise.all([
        leaveService.getSummary(),
        leaveService.getCategories(),
        leaveService.getRequests(),
      ]);

      setSummary(summaryRes?.data || { categories: [], totals: {} });
      const categoryList = normalizeList(categoriesRes);
      setCategories(categoryList);
      setRequests(normalizeList(requestsRes));

      if (!form.categoryId && categoryList.length > 0) {
        setForm((prev) => ({ ...prev, categoryId: String(categoryList[0].id) }));
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleApply = async (event) => {
    event.preventDefault();
    const selectedCategory = categories.find((category) => Number(category.id) === Number(form.categoryId));
    if (selectedCategory?.code === "CASUAL_LEAVE" && hasCasualLeaveInRange(form.fromDate, form.toDate)) {
      toast.error("Casual Leave is already booked for this month.");
      return;
    }

    if (selectedCategory && hasRestrictedDateOverlap(selectedCategory, form.fromDate, form.toDate)) {
      toast.error("Another leave type is already booked for an overlapping date.");
      return;
    }

    try {
      const payload = {
        categoryId: Number(form.categoryId),
        fromDate: form.fromDate,
        toDate: form.toDate || form.fromDate,
        durationType: form.durationType,
        session: form.session || undefined,
        quarterSlot: form.quarterSlot ? Number(form.quarterSlot) : undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        reason: form.reason,
      };

      await leaveService.createRequest(payload);
      toast.success("Leave request submitted successfully.");
      setShowApplyModal(false);
      setForm({
        categoryId: categories[0] ? String(categories[0].id) : "",
        fromDate: "",
        toDate: "",
        durationType: "FULL_DAY",
        session: "",
        quarterSlot: "",
        startTime: "",
        endTime: "",
        reason: "",
      });
      await loadPageData();
    } catch (error) {
      toast.error(error?.message || "Unable to submit leave request.");
    }
  };

  const handleApproveReject = async (requestId, status) => {
    try {
      let payload = { status };

      if (status === "REJECTED") {
        const remarks = window.prompt("Please enter rejection reason:", "");
        if (remarks === null) {
          return;
        }

        if (!String(remarks).trim()) {
          toast.error("Rejection reason is required.");
          return;
        }

        payload = {
          status,
          approverRemarks: String(remarks).trim(),
        };
      }

      await leaveService.updateRequestStatus(requestId, payload);
      toast.success(`Leave request ${status.toLowerCase()} successfully.`);
      await loadPageData();
    } catch (error) {
      toast.error(error?.message || "Unable to update leave request status.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500">
            Apply leave, track your request status, and review requests assigned to you
          </p>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "summary"
                ? "border-b-2 border-gray-800 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Leave Summary
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "border-b-2 border-gray-800 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Leave Requests
          </button>
        </div>

        {activeTab === "summary" && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Booked: <span className="font-semibold text-gray-900">{Number(summary?.totals?.totalBookedDays || 0).toFixed(2)} day(s)</span>
                    {Number(summary?.totals?.totalBookedHours || 0) > 0 && (
                      <span> and <span className="font-semibold text-gray-900">{Number(summary?.totals?.totalBookedHours || 0).toFixed(2)} hour(s)</span></span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">User: {currentUser?.firstName || "-"}</p>
                </div>
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                >
                  Apply Leave
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-lg bg-white p-8 text-center text-gray-500">Loading leave summary...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(summary.categories || []).map((item) => (
                  <div key={item.categoryId} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-500">{item.name}</h3>
                    <div className="mt-2 flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-400">Available</p>
                        <p className="text-2xl font-bold text-gray-900">{Number(item.available).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Booked</p>
                        <p className="text-2xl font-bold text-blue-600">{Number(item.booked).toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Allocated: {Number(item.allocated).toFixed(2)} {item.unit === "HOUR" ? "hr" : "day"}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "requests" && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days/Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No leave requests found.</td>
                    </tr>
                  )}
                  {requests.map((item) => {
                    const isPending = String(item.status || "").toUpperCase() === "PENDING";
                    const isDesignatedApprover = Number(item.designatedApproverId) === Number(currentUser?.id);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{item.employeeCode || "-"} {item.employeeName ? `- ${item.employeeName}` : ""}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.category?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.fromDate)} to {formatDate(item.toDate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.category?.unit === "HOUR"
                            ? `${Number(item.requestedHours || 0).toFixed(2)} hr`
                            : `${Number(item.requestedDays || 0).toFixed(2)} day`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                            {String(item.status || "").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setShowViewModal(true);
                              }}
                              title="View"
                              aria-label="View leave request"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                            {isDesignatedApprover && isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveReject(item.id, "APPROVED")}
                                  title="Approve"
                                  aria-label="Approve leave request"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleApproveReject(item.id, "REJECTED")}
                                  title="Reject"
                                  aria-label="Reject leave request"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteRequest(item)}
                                disabled={deletingId === item.id}
                                title="Delete"
                                aria-label="Delete leave request"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={14} />
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
        )}
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowApplyModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Apply Leave</h2>
                  <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">X</button>
                </div>
              </div>
              <div className="px-6 py-6">
                {categoryBalance && (
                  <div className="mb-4 rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
                    <div>Category balance: {categoryBalance.name}</div>
                    <div>Available today: {Number(categoryBalance.available).toFixed(2)} {categoryBalance.unit === "HOUR" ? "hr" : "day"}</div>
                    <div>Taken: {Number(categoryBalance.taken).toFixed(2)} | Pending: {Number(categoryBalance.pending).toFixed(2)}</div>
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave category <span className="text-red-500">*</span></label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => {
                        const categoryId = e.target.value;
                        const category = categories.find((item) => String(item.id) === categoryId);
                        const allowedTypes = getAllowedDurationTypes(category?.code);
                        setForm((prev) => ({
                          ...prev,
                          categoryId,
                          durationType: allowedTypes.includes(prev.durationType) ? prev.durationType : allowedTypes[0],
                        }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => {
                        const clMonthBooked = category.code === "CASUAL_LEAVE" && hasCasualLeaveInRange(form.fromDate, form.toDate);
                        const dateConflict = hasRestrictedDateOverlap(category, form.fromDate, form.toDate);
                        return (
                          <option
                            key={category.id}
                            value={category.id}
                            disabled={clMonthBooked || dateConflict}
                          >
                            {category.name}{clMonthBooked ? " (already booked this month)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From date<span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={form.fromDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To date<span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={form.toDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration type<span className="text-red-500">*</span></label>
                    <select
                      value={form.durationType}
                      onChange={(e) => setForm((prev) => ({ ...prev, durationType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {durationOptions
                        .filter(([value]) => getAllowedDurationTypes(
                          categories.find((category) => String(category.id) === String(form.categoryId))?.code
                        ).includes(value))
                        .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>

                  {form.durationType === "HALF_DAY" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session<span className="text-red-500">*</span></label>
                      <select
                        value={form.session}
                        onChange={(e) => setForm((prev) => ({ ...prev, session: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select session</option>
                        <option value="MORNING">Morning</option>
                        <option value="NOON">Noon</option>
                      </select>
                    </div>
                  )}

                  {form.durationType === "QUARTER_DAY" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quarter slot<span className="text-red-500">*</span></label>
                      <select
                        value={form.quarterSlot}
                        onChange={(e) => setForm((prev) => ({ ...prev, quarterSlot: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select quarter</option>
                        <option value="1">1 Quarter</option>
                        <option value="2">2 Quarter</option>
                        <option value="3">3 Quarter</option>
                        <option value="4">4 Quarter</option>
                      </select>
                    </div>
                  )}

                  {form.durationType === "HOURS" && (
                    <div className="grid grid-cols-2 gap-4">
                      <TimeInput
                        label="Start time"
                        value={form.startTime}
                        onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))}
                      />
                      <TimeInput
                        label="End time"
                        value={form.endTime}
                        onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason<span className="text-red-500">*</span></label>
                    <textarea
                      rows={3}
                      value={form.reason}
                      onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button type="button" onClick={() => setShowApplyModal(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900">Submit</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Leave Request Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">X</button>
              </div>
              <div className="px-6 py-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Employee</p>
                  <p className="text-gray-900">{selectedRequest.employeeName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(selectedRequest.status)}`}>{String(selectedRequest.status || "").toUpperCase()}</span></p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="text-gray-900">{selectedRequest.category?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Period</p>
                  <p className="text-gray-900">{formatDate(selectedRequest.fromDate)} to {formatDate(selectedRequest.toDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Days/Hours</p>
                  <p className="text-gray-900">{selectedRequest.category?.unit === "HOUR" ? `${Number(selectedRequest.requestedHours || 0).toFixed(2)} hr` : `${Number(selectedRequest.requestedDays || 0).toFixed(2)} day`}</p>
                </div>
                <div>
                  <p className="text-gray-500">Requested On</p>
                  <p className="text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Reason</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.reason || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
