import React, { useState } from 'react';
const LeaveManagement = () => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [leaveSummary] = useState({
    casualLeave: { available: 5, booked: 5 },
    leaveWithoutPay: { available: 12, booked: 0 },
    permission: { available: 2, booked: 7.75 },
    onTheDuty: { available: 0, booked: 0 },
    totalBooked: 17,
    totalHours: 7.75,
    absent: 0,
  });
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'Casual Leave',
      type: 'Paid',
      leavePeriod: '20-Apr-2026 - 22-Apr-2026',
      daysTaken: '3 Day(s)',
      dateOfRequest: '14-Apr-2026',
      status: 'Approved',
      reason: 'Family function',
      leaveDuration: null,
      session: null,
      quarter: null,
      startTime: null,
      endTime: null,
    },
    {
      id: 2,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'Permission',
      type: 'Paid',
      leavePeriod: '15-Apr-2026 - 15-Apr-2026',
      daysTaken: '0.75 Hour(s)',
      dateOfRequest: '14-Apr-2026',
      status: 'Approved',
      reason: 'Doctor appointment',
      leaveDuration: null,
      session: null,
      quarter: null,
      startTime: '14:30',
      endTime: '15:30',
    },
    {
      id: 3,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'Permission',
      type: 'Paid',
      leavePeriod: '23-Mar-2026 - 23-Mar-2026',
      daysTaken: '0.58 Hour(s)',
      dateOfRequest: '23-Mar-2026',
      status: 'Approved',
      reason: 'Personal work',
      leaveDuration: null,
      session: null,
      quarter: null,
      startTime: '10:00',
      endTime: '11:00',
    },
    {
      id: 4,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'On The Duty',
      type: 'Paid',
      leavePeriod: '12-Mar-2026 (Morning)',
      daysTaken: '0.5 Day(s)',
      dateOfRequest: '12-Mar-2026',
      status: 'Approved',
      reason: 'Bank work',
      leaveDuration: 'Half Day',
      session: 'Morning',
      quarter: null,
      startTime: null,
      endTime: null,
    },
    {
      id: 5,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'Leave Without Pay',
      type: 'Unpaid',
      leavePeriod: '05-Mar-2026 - 05-Mar-2026',
      daysTaken: '1 Day(s)',
      dateOfRequest: '05-Mar-2026',
      status: 'Pending',
      reason: 'Urgent work',
      leaveDuration: 'Full Day',
      session: null,
      quarter: null,
      startTime: null,
      endTime: null,
    },
    {
      id: 6,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'On The Duty',
      type: 'Paid',
      leavePeriod: '04-Mar-2026 (2 Quarter)',
      daysTaken: '0.25 Day(s)',
      dateOfRequest: '04-Mar-2026',
      status: 'Rejected',
      reason: 'Personal errand',
      leaveDuration: 'Quarter Day',
      session: null,
      quarter: '2 Quarter',
      startTime: null,
      endTime: null,
    },
    {
      id: 7,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'Casual Leave',
      type: 'Paid',
      leavePeriod: '23-Feb-2026 - 23-Feb-2026',
      daysTaken: '1 Day(s)',
      dateOfRequest: '20-Feb-2026',
      status: 'Approved',
      reason: 'Vacation',
      leaveDuration: 'Full Day',
      session: null,
      quarter: null,
      startTime: null,
      endTime: null,
    },
    {
      id: 8,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'Casual Leave',
      type: 'Paid',
      leavePeriod: '15-Feb-2026 (Noon)',
      daysTaken: '0.5 Day(s)',
      dateOfRequest: '14-Feb-2026',
      status: 'Approved',
      reason: 'Personal work',
      leaveDuration: 'Half Day',
      session: 'Noon',
      quarter: null,
      startTime: null,
      endTime: null,
    },
    {
      id: 9,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: 'On The Duty',
      type: 'Paid',
      leavePeriod: '10-Jan-2026 (1 Quarter)',
      daysTaken: '0.25 Day(s)',
      dateOfRequest: '09-Jan-2026',
      status: 'Approved',
      reason: 'Personal work',
      leaveDuration: 'Quarter Day',
      session: null,
      quarter: '1 Quarter',
      startTime: null,
      endTime: null,
    },
  ]);
  const [formData, setFormData] = useState({
    leaveType: '',
    date: '',
    teamEmail: '',
    reason: '',
    leaveDuration: '',
    session: '',
    quarter: '',
    startTime: '',
    endTime: '',
  });
  const [editFormData, setEditFormData] = useState({
    leaveType: '',
    date: '',
    teamEmail: '',
    reason: '',
    status: '',
    leaveDuration: '',
    session: '',
    quarter: '',
    startTime: '',
    endTime: '',
  });
  const getStatusBadge = (status) => {
    const colors = {
      'Approved': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  const getDurationLabel = (duration) => {
    const labels = {
      'Full Day': 'Full Day',
      'Half Day': 'Half Day',
      'Quarter Day': 'Quarter Day',
    };
    return labels[duration] || duration;
  };
  const getDaysTaken = (leaveType, duration, session, quarter) => {
    if (leaveType === 'Permission') return null;
    if (leaveType === 'On The Duty') {
      if (duration === 'Full Day') return '1 Day(s)';
      if (duration === 'Half Day') return '0.5 Day(s)';
      if (duration === 'Quarter Day') return '0.25 Day(s)';
    }
    if (leaveType === 'Casual Leave' || leaveType === 'Leave Without Pay') {
      if (duration === 'Full Day') return '1 Day(s)';
      if (duration === 'Half Day') return '0.5 Day(s)';
    }
    return '1 Day(s)';
  };
  const getLeavePeriod = (date, leaveType, duration, session, quarter, startTime, endTime) => {
    if (leaveType === 'Permission') {
      return `${date} (${startTime} - ${endTime})`;
    }
    if (leaveType === 'Casual Leave' || leaveType === 'Leave Without Pay') {
      if (duration === 'Half Day') {
        return `${date} (${session})`;
      }
      return date;
    }
    if (leaveType === 'On The Duty') {
      if (duration === 'Half Day') {
        return `${date} (${session})`;
      }
      if (duration === 'Quarter Day') {
        return `${date} (${quarter})`;
      }
      return date;
    }
    return date;
  };
  const handleApplyLeave = (e) => {
    e.preventDefault();
    const daysTaken = getDaysTaken(formData.leaveType, formData.leaveDuration, formData.session, formData.quarter);
    const leavePeriod = getLeavePeriod(
      formData.date, 
      formData.leaveType, 
      formData.leaveDuration, 
      formData.session, 
      formData.quarter,
      formData.startTime,
      formData.endTime
    );
    const newLeave = {
      id: leaveRequests.length + 1,
      employeeId: 'KHO026',
      employeeName: 'Geetha Lakshmi',
      leaveType: formData.leaveType,
      type: formData.leaveType === 'Leave Without Pay' ? 'Unpaid' : 'Paid',
      leavePeriod: leavePeriod,
      daysTaken: daysTaken,
      dateOfRequest: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Pending',
      reason: formData.reason,
      leaveDuration: formData.leaveDuration,
      session: formData.session,
      quarter: formData.quarter,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };
    setLeaveRequests([newLeave, ...leaveRequests]);
    setShowApplyModal(false);
    setFormData({ 
      leaveType: '', 
      date: '', 
      teamEmail: '', 
      reason: '',
      leaveDuration: '',
      session: '',
      quarter: '',
      startTime: '',
      endTime: '',
    });
  };
  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    const diff = (endTime - startTime) / (1000 * 60 * 60);
    return Math.round(diff * 100) / 100;
  };
  const handleView = (leave) => {
    setSelectedLeave(leave);
    setShowViewModal(true);
  };
  const handleEdit = (leave, index) => {
    setSelectedLeave(leave);
    setEditIndex(index);
    setEditFormData({
      leaveType: leave.leaveType,
      date: leave.leavePeriod,
      teamEmail: '',
      reason: leave.reason || '',
      status: leave.status,
      leaveDuration: leave.leaveDuration || '',
      session: leave.session || '',
      quarter: leave.quarter || '',
      startTime: leave.startTime || '',
      endTime: leave.endTime || '',
    });
    setShowEditModal(true);
  };
  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedLeaves = [...leaveRequests];
    const daysTaken = getDaysTaken(editFormData.leaveType, editFormData.leaveDuration, editFormData.session, editFormData.quarter);
    const leavePeriod = getLeavePeriod(
      editFormData.date, 
      editFormData.leaveType, 
      editFormData.leaveDuration, 
      editFormData.session, 
      editFormData.quarter,
      editFormData.startTime,
      editFormData.endTime
    );
    updatedLeaves[editIndex] = {
      ...updatedLeaves[editIndex],
      leaveType: editFormData.leaveType,
      leavePeriod: leavePeriod,
      daysTaken: daysTaken,
      reason: editFormData.reason,
      status: editFormData.status,
      type: editFormData.leaveType === 'Leave Without Pay' ? 'Unpaid' : 'Paid',
      leaveDuration: editFormData.leaveDuration,
      session: editFormData.session,
      quarter: editFormData.quarter,
      startTime: editFormData.startTime,
      endTime: editFormData.endTime,
    };
    setLeaveRequests(updatedLeaves);
    setShowEditModal(false);
    setSelectedLeave(null);
    setEditIndex(null);
  };
  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      setLeaveRequests(leaveRequests.filter((_, i) => i !== index));
    }
  };
  const renderDurationFields = (leaveType) => {
    if (leaveType === 'On The Duty') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveDuration"
              value={formData.leaveDuration}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="">Select Duration</option>
              <option value="Full Day">Full Day</option>
              <option value="Half Day">Half Day</option>
              <option value="Quarter Day">Quarter Day</option>
            </select>
          </div>
          {formData.leaveDuration === 'Half Day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                name="session"
                value={formData.session}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Session</option>
                <option value="Morning">Morning</option>
                <option value="Noon">Noon</option>
              </select>
            </div>
          )}
          {formData.leaveDuration === 'Quarter Day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarter <span className="text-red-500">*</span>
              </label>
              <select
                name="quarter"
                value={formData.quarter}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Quarter</option>
                <option value="1 Quarter">1 Quarter</option>
                <option value="2 Quarter">2 Quarter</option>
                <option value="3 Quarter">3 Quarter</option>
                <option value="4 Quarter">4 Quarter</option>
              </select>
            </div>
          )}
        </div>
      );
    }
    if (leaveType === 'Casual Leave' || leaveType === 'Leave Without Pay') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveDuration"
              value={formData.leaveDuration}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="">Select Duration</option>
              <option value="Full Day">Full Day</option>
              <option value="Half Day">Half Day</option>
            </select>
          </div>
          {formData.leaveDuration === 'Half Day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                name="session"
                value={formData.session}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Session</option>
                <option value="Morning">Morning</option>
                <option value="Noon">Noon</option>
              </select>
            </div>
          )}
        </div>
      );
    }
    if (leaveType === 'Permission') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
        </div>
      );
    }
    return null;
  };
  const renderEditDurationFields = (leaveType) => {
    if (leaveType === 'On The Duty') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveDuration"
              value={editFormData.leaveDuration}
              onChange={handleEditInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="">Select Duration</option>
              <option value="Full Day">Full Day</option>
              <option value="Half Day">Half Day</option>
              <option value="Quarter Day">Quarter Day</option>
            </select>
          </div>
          {editFormData.leaveDuration === 'Half Day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                name="session"
                value={editFormData.session}
                onChange={handleEditInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Session</option>
                <option value="Morning">Morning</option>
                <option value="Noon">Noon</option>
              </select>
            </div>
          )}
          {editFormData.leaveDuration === 'Quarter Day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarter <span className="text-red-500">*</span>
              </label>
              <select
                name="quarter"
                value={editFormData.quarter}
                onChange={handleEditInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Quarter</option>
                <option value="1 Quarter">1 Quarter</option>
                <option value="2 Quarter">2 Quarter</option>
                <option value="3 Quarter">3 Quarter</option>
                <option value="4 Quarter">4 Quarter</option>
              </select>
            </div>
          )}
        </div>
      );
    }
    if (leaveType === 'Casual Leave' || leaveType === 'Leave Without Pay') {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveDuration"
              value={editFormData.leaveDuration}
              onChange={handleEditInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="">Select Duration</option>
              <option value="Full Day">Full Day</option>
              <option value="Half Day">Half Day</option>
            </select>
          </div>
          {editFormData.leaveDuration === 'Half Day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                name="session"
                value={editFormData.session}
                onChange={handleEditInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Session</option>
                <option value="Morning">Morning</option>
                <option value="Noon">Noon</option>
              </select>
            </div>
          )}
        </div>
      );
    }
    if (leaveType === 'Permission') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="startTime"
              value={editFormData.startTime}
              onChange={handleEditInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="endTime"
              value={editFormData.endTime}
              onChange={handleEditInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
        </div>
      );
    }
    return null;
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500">Manage leave requests and summary</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'border-b-2 border-gray-800 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Leave Summary
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'border-b-2 border-gray-800 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Leave Requests
          </button>
        </div>
        {/* Leave Summary Tab */}
        {activeTab === 'summary' && (
          <>
            {/* Summary Cards */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Leave booked this year: <span className="font-semibold text-gray-900">{leaveSummary.totalBooked} day(s)</span>
                    {leaveSummary.totalHours > 0 && (
                      <span> and <span className="font-semibold text-gray-900">{leaveSummary.totalHours} hour(s)</span></span>
                    )}
                    <span className="mx-2">|</span>
                    Absent: <span className="font-semibold text-gray-900">{leaveSummary.absent}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">01-Jan-2026 - 31-Dec-2026</p>
                </div>
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                >
                  Apply Leave
                </button>
              </div>
            </div>
            {/* Leave Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">Casual Leave</h3>
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveSummary.casualLeave.available}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Booked</p>
                    <p className="text-2xl font-bold text-blue-600">{leaveSummary.casualLeave.booked}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">Leave Without Pay</h3>
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveSummary.leaveWithoutPay.available}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Booked</p>
                    <p className="text-2xl font-bold text-blue-600">{leaveSummary.leaveWithoutPay.booked}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">Permission</h3>
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveSummary.permission.available}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Booked</p>
                    <p className="text-2xl font-bold text-blue-600">{leaveSummary.permission.booked}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">On The Duty</h3>
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-gray-900">{leaveSummary.onTheDuty.available}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Booked</p>
                    <p className="text-2xl font-bold text-blue-600">{leaveSummary.onTheDuty.booked}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Leave Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days/Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Request</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveRequests.map((leave, index) => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{leave.employeeId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{leave.employeeName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{leave.leaveType}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{leave.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{leave.leavePeriod}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{leave.daysTaken}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{leave.dateOfRequest}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleView(leave)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(leave, index)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowApplyModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Apply Leave</h2>
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleApplyLeave}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Leave type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="leaveType"
                        value={formData.leaveType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Leave Without Pay">Leave Without Pay (LOP)</option>
                        <option value="Permission">Permission</option>
                        <option value="On The Duty">On The Duty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        placeholder="dd-MMM-yyyy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    {/* Dynamic Fields based on leave type */}
                    {renderDurationFields(formData.leaveType)}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Email ID
                      </label>
                      <input
                        type="email"
                        name="teamEmail"
                        value={formData.teamEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="team@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for leave
                      </label>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="Enter reason for leave..."
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
      {/* View Modal */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowViewModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Leave Details</h2>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-gray-900">{selectedLeave.employeeId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLeave.status)}`}>
                        {selectedLeave.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee Name</label>
                    <p className="text-gray-900">{selectedLeave.employeeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Leave Type</label>
                    <p className="text-gray-900">{selectedLeave.leaveType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-gray-900">{selectedLeave.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Leave Period</label>
                    <p className="text-gray-900">{selectedLeave.leavePeriod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Days/Hours Taken</label>
                    <p className="text-gray-900">{selectedLeave.daysTaken}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Request</label>
                    <p className="text-gray-900">{selectedLeave.dateOfRequest}</p>
                  </div>
                  {selectedLeave.leaveDuration && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-gray-900">{selectedLeave.leaveDuration}</p>
                    </div>
                  )}
                  {selectedLeave.session && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Session</label>
                      <p className="text-gray-900">{selectedLeave.session}</p>
                    </div>
                  )}
                  {selectedLeave.quarter && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quarter</label>
                      <p className="text-gray-900">{selectedLeave.quarter}</p>
                    </div>
                  )}
                  {selectedLeave.startTime && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Start Time</label>
                        <p className="text-gray-900">{selectedLeave.startTime}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">End Time</label>
                        <p className="text-gray-900">{selectedLeave.endTime}</p>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Reason</label>
                    <p className="text-gray-900">{selectedLeave.reason || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && selectedLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              setShowEditModal(false);
              setSelectedLeave(null);
              setEditIndex(null);
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Edit Leave</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedLeave(null);
                      setEditIndex(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleUpdate}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Leave type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="leaveType"
                        value={editFormData.leaveType}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Leave Without Pay">Leave Without Pay (LOP)</option>
                        <option value="Permission">Permission</option>
                        <option value="On The Duty">On The Duty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="date"
                        value={editFormData.date}
                        onChange={handleEditInputChange}
                        required
                        placeholder="dd-MMM-yyyy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    {/* Dynamic Edit Fields based on leave type */}
                    {renderEditDurationFields(editFormData.leaveType)}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for leave
                      </label>
                      <textarea
                        name="reason"
                        value={editFormData.reason}
                        onChange={handleEditInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="Enter reason for leave..."
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedLeave(null);
                        setEditIndex(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Update Leave
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
};
export default LeaveManagement;