import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Check, Eye, X } from "lucide-react";
import leaveService from "../../services/leave.service";
import { getCurrentUser, hasAnyRole } from "../../utils/auth";

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

export default function LeaveManagement() {
  const currentUser = getCurrentUser();
  const canApprove = hasAnyRole(["SUPER_ADMIN", "HR", "MANAGER"]);

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
            {canApprove
              ? "Review employee leave balances and approve requests"
              : "Apply leave and track your request status"}
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
                            {canApprove && isPending && (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave category</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                      <input
                        type="date"
                        value={form.fromDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration type</label>
                    <select
                      value={form.durationType}
                      onChange={(e) => setForm((prev) => ({ ...prev, durationType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="FULL_DAY">Full Day</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="QUARTER_DAY">Quarter Day</option>
                      <option value="HOURS">Hours</option>
                    </select>
                  </div>

                  {form.durationType === "HALF_DAY" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quarter slot</label>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
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
