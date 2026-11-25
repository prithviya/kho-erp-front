import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import SortableHeader from "../common/SortableHeader";
import { sortRows } from "../../utils/tableSorting";
import { Check, ChevronLeft, ChevronRight, Eye, X, Trash2, Calendar, BarChart2, Users, FileText, Pencil } from "lucide-react";
import leaveService from "../../services/leave.service";
import { getCanonicalRoles, getCurrentUser, canDeleteRecords } from "../../utils/auth";

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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toCalendarDateKey(value) {
  if (!value) return "";
  if (value instanceof Date) return toDateKey(value);
  return String(value).slice(0, 10);
}

function getLeaveCalendarLabel(request) {
  const duration = String(request.durationType || "").toUpperCase();
  const partialDay = duration === "HALF_DAY" ? " (½)" : "";
  const onDutyDetails = request.categoryCode === "ON_THE_DUTY"
    ? ` · On The Duty${request.clientName ? ` · Client: ${request.clientName}` : ""}`
    : "";
  return `${request.employeeName}${partialDay}${onDutyDetails}`;
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
  const canonicalRoles = getCanonicalRoles(currentUser);
  const rawRoles = (currentUser?.roles || []).flatMap((role) => [role?.code, role?.name])
    .filter(Boolean)
    .map((role) => String(role).toLowerCase().replace(/[\s_-]+/g, ""));
  const canSeeLeaveReports = canonicalRoles.some((role) => ["HR", "MANAGER", "CEO", "SUPER_ADMIN"].includes(role))
    || rawRoles.some((role) => role.includes("head") || role.includes("teamlead"));
  const canDelete = canDeleteRecords('leave');
  const [deletingId, setDeletingId] = useState(null);

  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarRequests, setCalendarRequests] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [summary, setSummary] = useState({ categories: [], totals: {} });
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestSortConfig, setRequestSortConfig] = useState({ key: "", direction: "asc" });
  const [reportSortConfig, setReportSortConfig] = useState({ key: "", direction: "asc" });
  const [leaveReports, setLeaveReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportFilters, setReportFilters] = useState({
    employeeId: "",
    departmentId: "",
    leaveType: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({
    categoryId: "",
    fromDate: "",
    toDate: "",
    durationType: "FULL_DAY",
    session: "",
    quarterSlot: "",
    startTime: "",
    endTime: "",
    reason: "",
    clientName: "",
    editedReason: "",
  });

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
    clientName: "",
  });

  const selectedCategory = categories.find(
    (category) => Number(category.id) === Number(form.categoryId)
  );
  const isOnDutyLeave = selectedCategory?.code === "ON_THE_DUTY";
  const isPermissionLeave = selectedCategory?.code === "PERMISSION";
  const permissionMonthStats = useMemo(() => {
    const monthKey = (form.fromDate || toDateKey(new Date())).slice(0, 7);
    const monthRequests = requests.filter((request) => (
      Number(request.userId) === Number(currentUser?.id)
      && request.category?.code === "PERMISSION"
      && String(request.fromDate || "").slice(0, 7) === monthKey
      && ["PENDING", "APPROVED"].includes(String(request.status || "").toUpperCase())
    ));
    const usedHours = monthRequests.reduce((sum, request) => (
      String(request.status).toUpperCase() === "APPROVED"
        ? sum + Number(request.requestedHours || 0)
        : sum
    ), 0);
    const pendingHours = monthRequests.reduce((sum, request) => (
      String(request.status).toUpperCase() === "PENDING"
        ? sum + Number(request.requestedHours || 0)
        : sum
    ), 0);
    const bookedHours = usedHours + pendingHours;
    const [startHour, startMinute] = String(form.startTime || "").split(":").map(Number);
    const [endHour, endMinute] = String(form.endTime || "").split(":").map(Number);
    const requestedHours = Number.isFinite(startHour) && Number.isFinite(startMinute)
      && Number.isFinite(endHour) && Number.isFinite(endMinute) && (endHour * 60 + endMinute) > (startHour * 60 + startMinute)
      ? Number((((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60).toFixed(2))
      : 0;
    const toMonthKey = (form.toDate || form.fromDate || "").slice(0, 7);

    return {
      monthKey,
      allocatedHours: Number(summary.categories?.find((item) => item.code === "PERMISSION")?.monthlyBalance?.allocatedHours ?? 6),
      usageLimitHours: 2,
      usedHours: Number(usedHours.toFixed(2)),
      pendingHours: Number(pendingHours.toFixed(2)),
      remainingHours: Number(Math.max(0, 2 - bookedHours).toFixed(2)),
      requestedHours,
      crossesMonth: Boolean(form.fromDate && form.toDate && monthKey !== toMonthKey),
      exceedsLimit: requestedHours > 0 && bookedHours + requestedHours > 2,
    };
  }, [currentUser?.id, form.fromDate, form.startTime, form.endTime, form.toDate, requests, summary.categories]);

  const categoryBalance = useMemo(() => {
    const categoryId = Number(form.categoryId || 0);
    if (!categoryId) return null;
    return (summary.categories || []).find((item) => Number(item.categoryId) === categoryId) || null;
  }, [form.categoryId, summary.categories]);

  const hasCasualLeaveForMonth = (dateValue) => {
    if (!dateValue) return false;
    const [year, month] = dateValue.slice(0, 7).split("-").map(Number);
    const monthStart = `${dateValue.slice(0, 7)}-01`;
    const monthEnd = toDateKey(new Date(year, month, 0));
    const previousMonthDate = new Date(year, month - 2, 1);
    const previousMonthStart = toDateKey(previousMonthDate);
    const previousMonthEnd = toDateKey(new Date(year, month - 1, 0));
    const relevantRequests = requests.filter((item) => (
      Number(item.userId) === Number(currentUser?.id)
      && item.category?.code === "CASUAL_LEAVE"
      && ["PENDING", "APPROVED"].includes(String(item.status || "").toUpperCase())
    ));
    const joiningDate = summary.joiningDate;
    const wasOnboardedInPreviousMonth = !joiningDate || joiningDate <= previousMonthEnd;
    const previousMonthBooked = wasOnboardedInPreviousMonth && relevantRequests.some((item) => (
      datesOverlap(item.fromDate, item.toDate, previousMonthStart, previousMonthEnd)
    ));
    const currentMonthBooked = relevantRequests
      .filter((item) => datesOverlap(item.fromDate, item.toDate, monthStart, monthEnd))
      .reduce((sum, item) => sum + Number(item.requestedDays || 0), 0);
    const monthlyBalance = 1 + (previousMonthBooked ? 0 : 1) - currentMonthBooked;
    return monthlyBalance <= 0;
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
      Number(item.userId) === Number(currentUser?.id) &&
      conflictingLeaveTypes[category.code]?.includes(item.category?.code) &&
      ["PENDING", "APPROVED"].includes(String(item.status || "").toUpperCase()) &&
      datesOverlap(item.fromDate, item.toDate, fromDate, endDate)
    ));
  };

  const loadCalendar = useCallback(async () => {
    try {
      setCalendarLoading(true);
      const response = await leaveService.getCalendar({
        year: calendarMonth.getFullYear(),
        month: calendarMonth.getMonth() + 1,
      });
      setCalendarRequests(normalizeList(response));
    } catch (error) {
      toast.error(error?.message || "Unable to load the leave calendar.");
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const refreshLeaveData = useCallback(async () => {
    try {
      const [requestsResponse, summaryResponse] = await Promise.all([
        leaveService.getRequests(),
        leaveService.getSummary(),
      ]);
      setRequests(normalizeList(requestsResponse));
      setSummary(summaryResponse?.data || { categories: [], totals: {} });
      await loadCalendar();
    } catch (error) {
      toast.error(error?.message || "Unable to refresh leave status.");
    }
  }, [loadCalendar]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshLeaveData();
    };
    const intervalId = window.setInterval(refreshLeaveData, 30000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshLeaveData]);

  const loadLeaveReports = useCallback(async () => {
    setReportLoading(true);
    setReportError("");
    try {
      const response = await leaveService.getReports();
      setLeaveReports(normalizeList(response));
    } catch (error) {
      setLeaveReports([]);
      setReportError(error?.message || "Unable to load leave reports.");
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reports") void loadLeaveReports();
  }, [activeTab, loadLeaveReports]);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = toDateKey(date);
      return {
        date,
        dateKey,
        inCurrentMonth: date.getMonth() === calendarMonth.getMonth(),
        requests: calendarRequests.filter(
          (request) => toCalendarDateKey(request.fromDate) <= dateKey
            && toCalendarDateKey(request.toDate) >= dateKey
        ),
      };
    });
  }, [calendarMonth, calendarRequests]);

  const filteredLeaveReports = useMemo(() => leaveReports.filter((item) => {
    const matchesEmployee = !reportFilters.employeeId || String(item.userId) === reportFilters.employeeId;
    const matchesDepartment = !reportFilters.departmentId || String(item.departmentId) === reportFilters.departmentId;
    const matchesLeaveType = !reportFilters.leaveType || item.leaveTypeCode === reportFilters.leaveType;
    const matchesStatus = !reportFilters.status || item.status === reportFilters.status;
    const matchesFrom = !reportFilters.fromDate || toCalendarDateKey(item.toDate) >= reportFilters.fromDate;
    const matchesTo = !reportFilters.toDate || toCalendarDateKey(item.fromDate) <= reportFilters.toDate;
    return matchesEmployee && matchesDepartment && matchesLeaveType && matchesStatus && matchesFrom && matchesTo;
  }), [leaveReports, reportFilters]);
  const sortedRequests = sortRows(requests, requestSortConfig.key, requestSortConfig.direction, (item) => {
    if (requestSortConfig.key === "employee") return `${item.employeeCode || ""} ${item.employeeName || ""}`;
    if (requestSortConfig.key === "category") return item.category?.name;
    if (requestSortConfig.key === "period") return item.fromDate;
    if (requestSortConfig.key === "amount") return item.category?.unit === "HOUR" ? item.requestedHours : item.requestedDays;
    if (requestSortConfig.key === "status") return item.status;
    if (requestSortConfig.key === "approver") {
      const approver = item.approver || item.designatedApprover;
      return `${approver?.firstName || ""} ${approver?.lastName || ""}` || approver?.email;
    }
    if (requestSortConfig.key === "requestedOn") return item.createdAt;
    return "";
  });
  const sortedLeaveReports = sortRows(filteredLeaveReports, reportSortConfig.key, reportSortConfig.direction, (item) => {
    if (reportSortConfig.key === "employee") return item.employeeName;
    if (reportSortConfig.key === "employeeId") return item.employeeId;
    if (reportSortConfig.key === "department") return item.departmentName;
    if (reportSortConfig.key === "leaveType") return item.leaveType;
    if (reportSortConfig.key === "dates") return item.fromDate;
    if (reportSortConfig.key === "amount") return item.unit === "HOUR" ? item.requestedHours : item.requestedDays;
    if (reportSortConfig.key === "status") return item.status;
    if (reportSortConfig.key === "approver") return item.approverName;
    return "";
  });
  const toggleSort = (setConfig) => (key) => setConfig((current) => ({
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  }));

  const reportEmployees = useMemo(
    () => [...new Map(leaveReports.map((item) => [item.userId, item])).values()],
    [leaveReports]
  );
  const reportDepartments = useMemo(
    () => [...new Map(leaveReports.filter((item) => item.departmentId)
      .map((item) => [item.departmentId, item.departmentName])).entries()],
    [leaveReports]
  );

  const handleDeleteRequest = async (item) => {
    if (!canDelete || deletingId) return;
    if (!window.confirm("Delete this leave request? This action cannot be undone.")) return;
    try {
      setDeletingId(item.id);
      await leaveService.deleteRequest(item.id);
      toast.success("Leave request deleted.");
      await loadPageData();
      await loadCalendar();
    } catch (error) {
      toast.error(error?.message || "Unable to delete leave request.");
    } finally {
      setDeletingId(null);
    }
  };

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [summaryResult, categoriesResult, requestsResult] = await Promise.allSettled([
        leaveService.getSummary(),
        leaveService.getCategories(),
        leaveService.getRequests(),
      ]);

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value?.data || { categories: [], totals: {} });
      } else {
        toast.error(summaryResult.reason?.message || "Failed to load leave summary.");
      }

      let categoryList;
      if (categoriesResult.status === "fulfilled") {
        categoryList = normalizeList(categoriesResult.value);
        setCategories(categoryList);
      } else {
        toast.error(categoriesResult.reason?.message || "Failed to load leave categories.");
      }

      if (requestsResult.status === "fulfilled") {
        setRequests(normalizeList(requestsResult.value));
      } else {
        toast.error(requestsResult.reason?.message || "Failed to load leave requests.");
      }

      if (!form.categoryId && categoryList?.length > 0) {
        setForm((prev) => ({ ...prev, categoryId: String(categoryList[0].id) }));
      }
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
    if (selectedCategory?.code === "ON_THE_DUTY" && !form.clientName.trim()) {
      toast.error("Client name is required for On The Duty leave.");
      return;
    }
    if (selectedCategory?.code === "PERMISSION" && permissionMonthStats.crossesMonth) {
      toast.error("Permission requests must be within one calendar month.");
      return;
    }
    if (selectedCategory?.code === "PERMISSION" && permissionMonthStats.exceedsLimit) {
      toast.error(`Permission exceeds 2 hours per month. Available ${permissionMonthStats.remainingHours.toFixed(2)} hours.`);
      return;
    }
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
        ...(selectedCategory?.code === "ON_THE_DUTY"
          ? { clientName: form.clientName.trim() }
          : {}),
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
        clientName: "",
      });
      await loadPageData();
      await loadCalendar();
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
      await loadCalendar();
    } catch (error) {
      toast.error(error?.message || "Unable to update leave request status.");
    }
  };

  const openEditModal = (item) => {
    setEditingRequest(item);
    setEditForm({
      categoryId: item.categoryId ? String(item.categoryId) : item.category?.id ? String(item.category.id) : "",
      fromDate: item.fromDate || "",
      toDate: item.toDate || item.fromDate || "",
      durationType: item.durationType || "FULL_DAY",
      session: item.session || "",
      quarterSlot: item.quarterSlot ? String(item.quarterSlot) : "",
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      reason: item.reason || "",
      clientName: item.clientName || "",
      editedReason: "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editingRequest) return;

    if (!editForm.fromDate) {
      toast.error("From date is required.");
      return;
    }

    if (!editForm.editedReason || !editForm.editedReason.trim()) {
      toast.error("Reason for editing is mandatory.");
      return;
    }

    const selectedEditCategory = categories.find((c) => Number(c.id) === Number(editForm.categoryId));
    if (selectedEditCategory?.code === "ON_THE_DUTY" && !editForm.clientName?.trim()) {
      toast.error("Client name is required for On The Duty leave.");
      return;
    }

    try {
      const payload = {
        categoryId: Number(editForm.categoryId),
        fromDate: editForm.fromDate,
        toDate: editForm.toDate || editForm.fromDate,
        durationType: editForm.durationType,
        session: editForm.session || undefined,
        quarterSlot: editForm.quarterSlot ? Number(editForm.quarterSlot) : undefined,
        startTime: editForm.startTime || undefined,
        endTime: editForm.endTime || undefined,
        reason: editForm.reason,
        clientName: editForm.clientName?.trim() || undefined,
        editedReason: editForm.editedReason.trim(),
      };

      await leaveService.updateRequest(editingRequest.id, payload);
      toast.success("Leave request updated successfully.");
      setShowEditModal(false);
      setEditingRequest(null);
      await loadPageData();
      await loadCalendar();
    } catch (error) {
      toast.error(error?.message || "Unable to update leave request.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-5">
          <div className="inline-block px-3 py-1 bg-[#7a0c16] text-white text-[10px] font-bold tracking-wider uppercase rounded-full mb-3 shadow-xs">
            Track Leave
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave</h1>
          <p className="text-xs text-gray-500 mt-1">
            Apply leave, track your request status, and renew requests assigned to you
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="inline-flex p-1 bg-white border border-gray-200/80 rounded-full shadow-xs">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                activeTab === "calendar"
                  ? "bg-black text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Calendar size={14} />
              Leave Calendar
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                activeTab === "summary"
                  ? "bg-black text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <BarChart2 size={14} />
              Leave Summary
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                activeTab === "requests"
                  ? "bg-black text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Users size={14} />
              Leave Requests
            </button>
            {canSeeLeaveReports && (
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                  activeTab === "reports"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <FileText size={14} />
                Leave Reports
              </button>
            )}
          </div>
        </div>

        {activeTab === "calendar" && (
          <section className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  title="Previous month"
                  onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="min-w-36 text-center text-base font-semibold text-gray-800">
                  {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </h2>
                <button
                  type="button"
                  aria-label="Next month"
                  title="Next month"
                  onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="rounded-lg bg-[#7a0c16] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#630911] transition-all"
              >
                Apply Leave
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 font-medium text-green-700">Approved leave</span>
              <span className="rounded-full border border-dashed border-amber-400 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-700">Pending leave</span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-7 rounded-t-lg border border-gray-200 bg-gray-50">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="border-r border-gray-200 px-2 py-2 text-xs font-medium text-gray-600 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 overflow-hidden rounded-b-lg border-b border-l border-gray-200">
                  {calendarDays.map((day) => {
                    const isToday = day.dateKey === toDateKey(new Date());
                    return (
                      <div
                        key={day.dateKey}
                        className={`min-h-24 border-r border-t border-gray-200 p-1.5 sm:min-h-28 sm:p-2 ${
                          day.inCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                        } ${isToday ? "ring-2 ring-inset ring-[#7a0c16]" : ""}`}
                      >
                        <p className={`mb-1 text-xs font-medium ${day.inCurrentMonth ? "text-gray-800" : "text-gray-400"}`}>
                          {day.date.getDate()}
                        </p>
                        <div className="space-y-1">
                          {day.requests.map((item) => {
                            const approved = String(item.status).toUpperCase() === "APPROVED";
                            const leaveStatus = approved ? "Approved" : "Pending";
                            return (
                              <div
                                key={`${day.dateKey}-${item.id}`}
                                title={`${item.employeeName} - ${item.categoryName}${item.clientName ? ` - Client: ${item.clientName}` : ""} (${leaveStatus})`}
                                className={`break-words rounded-md px-1.5 py-1 text-[10px] leading-4 sm:text-xs ${
                                  approved
                                    ? "bg-green-100 text-green-800"
                                    : "border border-dashed border-amber-500 bg-amber-50 text-amber-800"
                                }`}
                              >
                                <span className="font-semibold">{getLeaveCalendarLabel(item)}</span>
                                <span className="ml-1 inline-block whitespace-nowrap rounded bg-white/70 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                                  {leaveStatus}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {calendarLoading && (
              <p className="mt-3 text-center text-xs text-gray-500">Loading leave calendar...</p>
            )}
            {!calendarLoading && calendarRequests.length === 0 && (
              <p className="mt-3 text-center text-xs text-gray-500">No approved or pending leave this month.</p>
            )}
          </section>
        )}

        {activeTab === "summary" && (
          <>
            {/* Action & Info Card */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Leave booked: <span className="text-gray-900">{Number(summary?.totals?.totalBookedDays || 0).toFixed(2)} day(s)</span>
                  {Number(summary?.totals?.totalBookedHours || 0) > 0 && (
                    <span> and <span className="font-semibold text-gray-900">{Number(summary?.totals?.totalBookedHours || 0).toFixed(2)} hour(s)</span></span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">User: {currentUser?.firstName || currentUser?.name || "Superadmin"}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-5 py-2 bg-[#7a0c16] text-white rounded-lg text-xs font-semibold hover:bg-[#630911] shadow-xs transition-colors"
              >
                Apply Leave
              </button>
            </div>

            {loading ? (
              <div className="rounded-xl bg-white p-12 text-center text-xs text-gray-500 border border-gray-100 shadow-xs">Loading leave summary...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {(summary.categories || []).map((item) => {
                  if (item.code === "PERMISSION" && item.monthlyBalance) {
                    return (
                      <div key={item.categoryId} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col justify-between">
                        <div className="p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Permission</h3>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              {Number(item.monthlyBalance.allocatedHours).toFixed(2)} hrs
                            </span>
                          </div>
                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Total Allocation</span>
                              <span className="font-semibold text-emerald-600">{Number(item.monthlyBalance.allocatedHours).toFixed(2)} hrs</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Monthly Usage Limit</span>
                              <span className="font-semibold text-orange-600">{Number(item.monthlyBalance.usageLimitHours).toFixed(2)} hr</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Used</span>
                              <span className="font-semibold text-gray-800">{Number(item.monthlyBalance.usedHours).toFixed(2)} hr</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-50">
                              <span className="text-gray-500">Pending</span>
                              <span className="font-semibold text-gray-800">{Number(item.monthlyBalance.pendingHours).toFixed(2)} hr</span>
                            </div>
                          </div>
                        </div>
                        {/* Remaining Pill Bar */}
                        <div className="m-3 p-3 bg-[#7a0c16] text-white rounded-xl flex justify-between items-center text-xs font-medium">
                          <span>Remaining</span>
                          <span className="font-bold text-sm">{Number(item.monthlyBalance.remainingHours).toFixed(2)} hr</span>
                        </div>
                      </div>
                    );
                  }

                  // Config for Circular Gauge per category
                  const isCL = item.code === "CASUAL_LEAVE";
                  const isLOP = item.code === "LEAVE_WITHOUT_PAY";
                  const isOD = item.code === "ON_THE_DUTY";

                  const strokeColor = isCL ? "#f97316" : isLOP ? "#8b5cf6" : "#eab308";
                  const trackColor = isCL ? "#fed7aa" : isLOP ? "#ddd6fe" : "#fef08a";
                  const footerBg = isCL ? "bg-sky-50 text-sky-800" : isLOP ? "bg-indigo-50 text-indigo-700" : "bg-blue-50 text-blue-700";
                  
                  // Compute percentage for donut
                  const allocatedVal = Number(item.allocated || 0);
                  const availableVal = Number(item.available || 0);
                  const percent = item.unlimited ? 75 : allocatedVal > 0 ? Math.min(100, Math.round((availableVal / allocatedVal) * 100)) : 0;
                  const radius = 42;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (percent / 100) * circumference;

                  const footerLabel = isCL
                    ? `Carry-forward from previous month: ${Number(item.carryForwardDays || 0).toFixed(2)} day`
                    : isLOP
                    ? "Leave Without Pay: LOP"
                    : "On the Duty: OD";

                  return (
                    <div key={item.categoryId} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col justify-between">
                      <div className="p-5 pb-3">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                          <button
                            type="button"
                            onClick={() => setActiveTab("requests")}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            View &gt;
                          </button>
                        </div>

                        {/* Circular Donut Gauge */}
                        <div className="relative flex items-center justify-center my-3">
                          <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke={trackColor}
                              strokeWidth="8"
                              fill="none"
                              className="opacity-40"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke={strokeColor}
                              strokeWidth="8"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              fill="none"
                              className="transition-all duration-700 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-lg font-bold text-gray-900 leading-tight">
                              {item.unlimited ? "Unlimited" : String(Math.floor(Number(item.available || 0))).padStart(2, "0")}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">Available</span>
                          </div>
                        </div>

                        {/* Booked and Allocated Details */}
                        <div className="grid grid-cols-2 divide-x divide-gray-100 text-center pt-2">
                          <div>
                            <span className="text-xs font-bold text-gray-900">
                              {String(Math.floor(Number(item.booked || 0))).padStart(2, "0")}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-medium">Booked</span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-600">
                              {item.unlimited ? "No limit" : `${Number(item.allocated).toFixed(2)} day`}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-medium">Allocated</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Badge strip */}
                      {isCL ? (
                        <div className="bg-sky-50/70 border-t border-sky-100 p-3 text-xs text-slate-700">
                          <p className="font-bold text-sky-950 text-[11px] mb-1.5 flex items-center justify-between">
                            <span>Total available:</span>
                            <span className="font-extrabold text-sky-900">
                              {Number(
                                (Number(item.carryForwardDays || 1)) + 1 + 1
                              ).toFixed(2)} days
                            </span>
                          </p>
                          <div className="space-y-1 text-[10px] text-sky-800/90">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                                Carry forward:
                              </span>
                              <span className="font-semibold">{Number(item.carryForwardDays || 1).toFixed(2)} day</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                                Current month:
                              </span>
                              <span className="font-semibold">1.00 day</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                                Upcoming month:
                              </span>
                              <span className="font-semibold">1.00 day</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 text-[11px] font-medium text-center ${footerBg}`}>
                          {footerLabel}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "requests" && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="erp-list-table min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Employee" sortKey="employee" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Category" sortKey="category" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Period" sortKey="period" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Days/Hours" sortKey="amount" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Status" sortKey="status" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Approver" sortKey="approver" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Requested On" sortKey="requestedOn" sortConfig={requestSortConfig} onSort={toggleSort(setRequestSortConfig)} /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No leave requests found.</td>
                    </tr>
                  )}
                  {sortedRequests.map((item) => {
                    const isPending = String(item.status || "").toUpperCase() === "PENDING";
                    const isDesignatedApprover = Number(item.designatedApproverId) === Number(currentUser?.id);
                    const canApprove = isDesignatedApprover
                      || canonicalRoles.some((role) => ["HR", "SUPER_ADMIN"].includes(role));

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>
                            <span className="font-medium text-gray-900">{item.employeeCode || "-"} {item.employeeName ? `- ${item.employeeName}` : ""}</span>
                            {item.editedAt && (
                              <div className="mt-0.5 flex items-center gap-1">
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200" title={`Edited on ${formatDate(item.editedAt)}${item.editor ? ` by ${item.editor.firstName || item.editor.email}` : ""}`}>
                                  Edited
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
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
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {(() => {
                            const approver = item.approver || item.designatedApprover;
                            return approver
                              ? `${approver.firstName || ""} ${approver.lastName || ""}`.trim() || approver.email
                              : "Not assigned";
                          })()}
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
                            {(canApprove || (isPending && Number(item.userId) === Number(currentUser?.id))) && (
                              <button
                                onClick={() => openEditModal(item)}
                                title="Edit leave"
                                aria-label="Edit leave request"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
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

        {activeTab === "reports" && canSeeLeaveReports && (
          <section className="rounded-lg bg-white p-4 shadow-md sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Leave Reports</h2>
                <p className="text-sm text-gray-500">Reports are limited to your assigned team or HR organization access.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadLeaveReports()}
                disabled={reportLoading}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {reportLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <select aria-label="Filter by employee" value={reportFilters.employeeId} onChange={(event) => setReportFilters((current) => ({ ...current, employeeId: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">All employees</option>
                {reportEmployees.map((employee) => <option key={employee.userId} value={employee.userId}>{employee.employeeName} {employee.employeeId ? `(${employee.employeeId})` : ""}</option>)}
              </select>
              <select aria-label="Filter by department" value={reportFilters.departmentId} onChange={(event) => setReportFilters((current) => ({ ...current, departmentId: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">All departments</option>
                {reportDepartments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
              <select aria-label="Filter by leave type" value={reportFilters.leaveType} onChange={(event) => setReportFilters((current) => ({ ...current, leaveType: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">All leave types</option>
                {[...new Map(leaveReports.map((item) => [item.leaveTypeCode, item.leaveType])).entries()].map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
              <select aria-label="Filter by leave status" value={reportFilters.status} onChange={(event) => setReportFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">All statuses</option>
                {["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <input aria-label="Filter from date" type="date" value={reportFilters.fromDate} onChange={(event) => setReportFilters((current) => ({ ...current, fromDate: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input aria-label="Filter to date" type="date" value={reportFilters.toDate} onChange={(event) => setReportFilters((current) => ({ ...current, toDate: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            {reportLoading ? (
              <p className="py-8 text-center text-sm text-gray-500">Loading leave reports...</p>
            ) : reportError ? (
              <p role="alert" className="py-8 text-center text-sm text-red-600">{reportError}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
                <table className="w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-3"><SortableHeader label="Employee" sortKey="employee" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3"><SortableHeader label="Employee ID" sortKey="employeeId" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3"><SortableHeader label="Department" sortKey="department" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3"><SortableHeader label="Leave type" sortKey="leaveType" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3"><SortableHeader label="Leave dates" sortKey="dates" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3"><SortableHeader label="Days / hours" sortKey="amount" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3">Reason</th>
                      <th className="px-3 py-3"><SortableHeader label="Status" sortKey="status" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                      <th className="px-3 py-3"><SortableHeader label="Approver" sortKey="approver" sortConfig={reportSortConfig} onSort={toggleSort(setReportSortConfig)} /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedLeaveReports.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-3 font-medium text-gray-800">{item.employeeName}</td>
                        <td className="px-3 py-3 text-gray-600">{item.employeeId || "-"}</td>
                        <td className="px-3 py-3 text-gray-600">{item.departmentName || "-"}</td>
                        <td className="px-3 py-3 text-gray-600">{item.leaveType}</td>
                        <td className="px-3 py-3 text-gray-600">{formatDate(item.fromDate)} - {formatDate(item.toDate)}</td>
                        <td className="px-3 py-3 text-gray-600">{item.unit === "HOUR" ? `${Number(item.requestedHours).toFixed(2)} hr` : `${Number(item.requestedDays).toFixed(2)} day`}</td>
                        <td className="max-w-56 whitespace-pre-wrap px-3 py-3 text-gray-600">{item.reason || "-"}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span></td>
                        <td className="px-3 py-3 text-gray-600">
                          {item.approverName || "Not assigned"}
                          {item.approverEmail && <div className="text-xs text-gray-400">{item.approverEmail}</div>}
                        </td>
                      </tr>
                    ))}
                    {!filteredLeaveReports.length && (
                      <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-500">No leave report records match these filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setShowApplyModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100">
              <div className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Apply Leave</h2>
                  <p className="text-[11px] text-gray-500">Submit a leave request for review</p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5">
                {categoryBalance && (
                  <div className="mb-5 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-800">
                    <div className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                      <span>Category Balance: {categoryBalance.name}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {categoryBalance.unlimited ? "Unlimited" : `${Number(categoryBalance.available).toFixed(2)} ${categoryBalance.unit === "HOUR" ? "hr" : "day"}`}
                      </span>
                    </div>
                    {isPermissionLeave ? (
                      <div className="space-y-1 text-slate-600 mt-2">
                        <div>Total allocation: <span className="font-semibold text-gray-800">{permissionMonthStats.allocatedHours.toFixed(2)} hr</span></div>
                        <div>Monthly usage limit: <span className="font-semibold text-gray-800">{permissionMonthStats.usageLimitHours.toFixed(2)} hr</span></div>
                        <div>Used: <span className="font-semibold text-gray-800">{permissionMonthStats.usedHours.toFixed(2)} hr</span> | Pending: <span className="font-semibold text-gray-800">{permissionMonthStats.pendingHours.toFixed(2)} hr</span></div>
                        <div className="text-emerald-700 font-bold pt-1">Remaining this month: {permissionMonthStats.remainingHours.toFixed(2)} hr</div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-600 mt-2">
                        <div>Available: <span className="font-semibold text-gray-800">{categoryBalance.unlimited ? "No limit" : `${Number(categoryBalance.available).toFixed(2)} ${categoryBalance.unit === "HOUR" ? "hr" : "day"}`}</span></div>
                        {categoryBalance.code === "CASUAL_LEAVE" && Number(categoryBalance.carryForwardDays || 0) > 0 && (
                          <div className="text-blue-700 font-medium">Carry-forward balance this month: {Number(categoryBalance.carryForwardDays).toFixed(2)} day</div>
                        )}
                        <div>Taken: {Number(categoryBalance.taken).toFixed(2)} | Pending: {Number(categoryBalance.pending).toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Leave Category <span className="text-red-500">*</span></label>
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
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
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

                  {isOnDutyLeave && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.clientName}
                        onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
                        maxLength={200}
                        required
                        placeholder="Enter client or visit location"
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={form.fromDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">To Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={form.toDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Duration Type <span className="text-red-500">*</span></label>
                    <select
                      value={form.durationType}
                      onChange={(e) => setForm((prev) => ({ ...prev, durationType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Session <span className="text-red-500">*</span></label>
                      <select
                        value={form.session}
                        onChange={(e) => setForm((prev) => ({ ...prev, session: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                      >
                        <option value="">Select session</option>
                        <option value="MORNING">Morning</option>
                        <option value="NOON">Noon</option>
                      </select>
                    </div>
                  )}

                  {form.durationType === "QUARTER_DAY" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quarter Slot <span className="text-red-500">*</span></label>
                      <select
                        value={form.quarterSlot}
                        onChange={(e) => setForm((prev) => ({ ...prev, quarterSlot: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
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
                    <div className="grid grid-cols-2 gap-3.5">
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
                  {isPermissionLeave && permissionMonthStats.exceedsLimit && (
                    <p className="text-xs text-red-600 font-medium">
                      This request exceeds the {permissionMonthStats.usageLimitHours.toFixed(2)} hour monthly limit. Remaining: {permissionMonthStats.remainingHours.toFixed(2)} hr.
                    </p>
                  )}
                  {isPermissionLeave && permissionMonthStats.crossesMonth && (
                    <p className="text-xs text-red-600 font-medium">Permission requests must be within one calendar month.</p>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
                    <textarea
                      rows={3}
                      placeholder="Please state the reason for your leave request..."
                      value={form.reason}
                      onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                    />
                  </div>

                  <div className="flex gap-2.5 justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="px-5 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPermissionLeave && (permissionMonthStats.exceedsLimit || permissionMonthStats.crossesMonth)}
                      className="px-6 py-2 text-xs font-semibold bg-[#7a0c16] text-white rounded-xl hover:bg-[#630911] shadow-xs disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    >
                      Submit
                    </button>
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
                {selectedRequest.category?.code === "ON_THE_DUTY" && (
                  <div>
                    <p className="text-gray-500">Client Name</p>
                    <p className="text-gray-900">{selectedRequest.clientName || "-"}</p>
                  </div>
                )}
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
                <div>
                  <p className="text-gray-500">Approved / reviewed by</p>
                  <p className="text-gray-900">
                    {selectedRequest.approver
                      ? `${selectedRequest.approver.firstName || ""} ${selectedRequest.approver.lastName || ""}`.trim() || selectedRequest.approver.email
                      : selectedRequest.designatedApprover
                        ? `${selectedRequest.designatedApprover.firstName || ""} ${selectedRequest.designatedApprover.lastName || ""}`.trim() || selectedRequest.designatedApprover.email
                        : "Not assigned"}
                  </p>
                </div>
                {selectedRequest.approvedAt && (
                  <div>
                    <p className="text-gray-500">Approval date</p>
                    <p className="text-gray-900">{formatDate(selectedRequest.approvedAt)}</p>
                  </div>
                )}
                {selectedRequest.approverRemarks && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Approver remarks</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.approverRemarks}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-gray-500">Reason</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.reason || "-"}</p>
                </div>

                {selectedRequest.editedAt && (
                  <div className="col-span-2 mt-2 rounded-xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-xs text-amber-900">
                    <p className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
                      <span>⚠️ Leave Request Modified</span>
                    </p>
                    <div className="space-y-0.5 text-amber-800">
                      <p>
                        <span className="font-semibold">Modified by:</span>{" "}
                        {selectedRequest.editor
                          ? `${selectedRequest.editor.firstName || ""} ${selectedRequest.editor.lastName || ""}`.trim() || selectedRequest.editor.email
                          : selectedRequest.editedByName || "Manager / HR"}
                      </p>
                      <p>
                        <span className="font-semibold">Modified on:</span>{" "}
                        {new Date(selectedRequest.editedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Reason for edit:</span>{" "}
                        <span className="italic">{selectedRequest.editedReason || "-"}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Leave Request Modal */}
      {showEditModal && editingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setShowEditModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-[#fcfcfd]">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Edit Leave Request</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Modifying leave for <span className="font-semibold text-gray-800">{editingRequest.employeeName || "Employee"}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Leave Type <span className="text-red-500">*</span></label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.unit === "HOUR" ? "Hours" : "Days"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={editForm.fromDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">To Date</label>
                      <input
                        type="date"
                        min={editForm.fromDate || undefined}
                        value={editForm.toDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, toDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/30 focus:border-[#7a0c16] transition-all"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 border border-amber-200/70 p-3.5">
                    <label className="block text-xs font-bold text-amber-950 mb-1.5">
                      Reason for Modification <span className="text-red-500">* (Mandatory)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Specify why this leave is being modified (e.g. Changed to LOP per HR review)..."
                      value={editForm.editedReason}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, editedReason: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-slate-800 placeholder-amber-700/50"
                    />
                    <p className="text-[10px] text-amber-800/80 mt-1">
                      ℹ️ This reason and your timestamp will be permanently logged in the audit record.
                    </p>
                  </div>

                  <div className="flex gap-2.5 justify-end pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-5 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-xs font-semibold bg-[#7a0c16] text-white rounded-xl hover:bg-[#630911] shadow-xs transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
