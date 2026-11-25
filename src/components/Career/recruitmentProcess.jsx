import React, { useEffect, useState } from 'react';
import { request } from '../../services/apiClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Rocket, Eye, X, Trash2, User, MessageSquare, FileCheck, History, Calendar, ChevronDown } from 'lucide-react';
import { canDeleteRecords } from '../../utils/auth';
import SortableHeader from '../common/SortableHeader';
import { sortRows } from '../../utils/tableSorting';

const getInterviewParts = (dateTime, time) => {
  if (!dateTime) return null;

  let dateString = time ? `${dateTime} ${time}` : dateTime;

  // Standardize backend date strings to ensure correct timezone parsing
  if (typeof dateString === 'string') {
    // Replace spaces with 'T' (e.g., "2026-09-02 07:30:00" -> "2026-09-02T07:30:00")
    dateString = dateString.replace(' ', 'T');

    // If it has a time ('T') but lacks a timezone indicator ('Z' or '+/-HH:MM'), assume UTC and append 'Z'
    if (dateString.includes('T') && !dateString.endsWith('Z') && !/([+-]\d{2}:?\d{2})$/.test(dateString)) {
      dateString += 'Z';
    }
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const hours24 = parsedDate.getHours();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return {
    date: `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`,
    time: `${String(hours12).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`,
    period,
  };
};

const getInterviewDateTime = (candidate) => (
  candidate?.interviewDateTime
  ?? candidate?.interviewDate
  ?? candidate?.recruitment?.interviewDateTime
  ?? candidate?.recruitment?.interviewDate
);

const getInterviewMode = (candidate) => (
  candidate?.interviewMode ?? candidate?.recruitment?.interviewMode ?? ''
);

const getInterviewModeFromHistory = (item) => (
  item?.interviewMode ?? item?.mode ?? item?.interviewType ?? '-'
);

const getHistoryModifiedDateTime = (item) => (
  item?.updatedAt
  ?? item?.modifiedAt
  ?? item?.changedAt
  ?? item?.createdAt
  ?? item?.timestamp
  ?? item?.actionDate
  ?? item?.dateTime
  ?? item?.date
);

// Safe time parser for accurate sorting (Newest first)
const getSortableTime = (dateString) => {
  if (!dateString) return 0;
  let str = dateString;
  if (typeof str === 'string') {
    str = str.replace(' ', 'T');
    if (str.includes('T') && !str.endsWith('Z') && !/([+-]\d{2}:?\d{2})$/.test(str)) {
      str += 'Z';
    }
  }
  const time = new Date(str).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

const RecruitmentPipeline = () => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('interview');

  const resolveCandidateId = (candidate) => (
    candidate?.id ?? candidate?.cifid ?? candidate?.candidateId
  );

  const [candidates, setCandidates] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const canDelete = canDeleteRecords('recruitment');

  const handleDeleteCandidate = async (candidate) => {
    const cifid = resolveCandidateId(candidate);
    if (!canDelete || deletingId || !cifid) return;
    if (!window.confirm(`Delete candidate "${candidate.fullName || candidate.email || cifid}" from the recruitment pipeline? This removes their application and cannot be undone.`)) return;
    try {
      setDeletingId(cifid);
      const response = await request(`/cif-submissions/${cifid}`, { method: 'DELETE' });
      if (response?.success) {
        toast.success('Candidate deleted successfully');
        await fetchShortlistedCandidates();
      } else {
        toast.error(response?.message || 'Failed to delete candidate');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to delete candidate');
    } finally {
      setDeletingId(null);
    }
  };
  const [saving, setSaving] = useState(false);

  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    interviewDateOnly: '',
    interviewTime12: '',
    interviewPeriod: 'AM',
    interviewMode: '',
    status: '',
    statusNote: '',
    hrFeedback: '',
    technicalFeedback: '',
    mdFeedback: '',
    history: [],
  });

  // Combine Date + 12-Hour Time to Standard Datetime String
  const getCombinedDateTime = (date, time12, period) => {
    if (!date || !time12) return '';
    let [hours, minutes] = time12.split(':');
    hours = parseInt(hours, 10);

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const formattedHours = String(hours).padStart(2, '0');
    
    // Create a local Date object and convert to a UTC ISO string
    const localDate = new Date(`${date}T${formattedHours}:${minutes}:00`);
    
    // Fallback if the date is invalid for any reason
    if (Number.isNaN(localDate.getTime())) {
      return `${date}T${formattedHours}:${minutes}:00Z`;
    }

    return localDate.toISOString();
  };

  const fetchShortlistedCandidates = async () => {
    try {
      setLoading(true);
      const response = await request('/cif-submissions', { method: 'GET' });
      if (response?.success) {
        const shortlistedCandidates = (response.data || []).filter((candidate) => {
          if (candidate.recruitment) { return true; }
          const currentStatus = (candidate.status || candidate.submission?.appliedStatus || '').toLowerCase();
          return ['shortlist', 'shortlisted', 'interviewing', 'selected', 'hold'].includes(currentStatus);
        });
        setCandidates(shortlistedCandidates);
      } else {
        toast.error(response?.message || 'Failed to fetch shortlisted candidates');
      }
    } catch (error) {
      console.error('Fetch Shortlisted Candidates Error:', error);
      toast.error(error?.message || 'Failed to fetch shortlisted candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlistedCandidates();
  }, []);

  const handleViewDetails = (candidate) => {
    const candidateId = resolveCandidateId(candidate);

    let dateOnly = '';
    let time12 = '';
    let period = 'AM';

    const interviewParts = getInterviewParts(getInterviewDateTime(candidate));
    if (interviewParts) {
      dateOnly = interviewParts.date;
      time12 = interviewParts.time;
      period = interviewParts.period;
    }

    setSelectedCandidateDetails({
      id: candidateId,
      name: candidate.fullName || '',
      email: candidate.email || '',
      phone: candidate.phoneNumber || '',
      jobTitle: candidate.opening?.jobTitle || '',
      interviewDateOnly: dateOnly,
      interviewTime12: time12,
      interviewPeriod: period,
      interviewMode: getInterviewMode(candidate),
      status: candidate.appliedStatus || candidate.recruitment?.recruitmentStatus || 'Shortlist',
      statusNote: candidate.statusNote || candidate.recruitment?.statusChangeNote || '',
      hrFeedback: candidate.hrFeedback || candidate.recruitment?.hrScreeningFeedback || '',
      technicalFeedback: candidate.technicalFeedback || candidate.recruitment?.technicalInterviewFeedback || '',
      mdFeedback: candidate.mdFeedback || candidate.recruitment?.mdFeedback || '',
      history: candidate.history || candidate.recruitment?.history || [],
    });
    setSelectedCandidateId(candidateId);
    setActiveModalTab('interview');
    setShowDetailsModal(true);
  };

  const handleStatusChange = (e) => {
    setSelectedCandidateDetails({ ...selectedCandidateDetails, status: e.target.value });
  };

  const handleInputChange = (e, field) => {
    setSelectedCandidateDetails({ ...selectedCandidateDetails, [field]: e.target.value });
  };

  const handleInterviewTimeChange = (part, value) => {
    const [currentHour = '01', currentMinute = '00'] = selectedCandidateDetails.interviewTime12.split(':');
    const nextTime = part === 'hour'
      ? `${value}:${currentMinute}`
      : `${currentHour}:${value}`;
    setSelectedCandidateDetails({ ...selectedCandidateDetails, interviewTime12: nextTime });
  };

  const handleSaveRecruitment = async () => {
    // 1. Candidate ID Check
    if (!selectedCandidateDetails?.id) {
      toast.error('A candidate must be selected before saving recruitment details.');
      return;
    }

    // 2. Mandatory Validation: Interview Date & Time
    if (!selectedCandidateDetails.interviewDateOnly || !selectedCandidateDetails.interviewTime12) {
      toast.error('Interview Date and Time are mandatory!');
      return;
    }

    if (!/^(0[1-9]|1[0-2]):[0-5]\d$/.test(selectedCandidateDetails.interviewTime12)) {
      toast.error('Enter interview time in 12-hour format (hh:mm).');
      return;
    }

    // 3. Mandatory Validation: Interview Mode
    if (!selectedCandidateDetails.interviewMode) {
      toast.error('Interview Mode is mandatory!');
      return;
    }

    const fullDateTime = getCombinedDateTime(
      selectedCandidateDetails.interviewDateOnly,
      selectedCandidateDetails.interviewTime12,
      selectedCandidateDetails.interviewPeriod
    );

    try {
      setSaving(true);

      const response = await request('/recruitments', {
        method: 'POST',
        body: JSON.stringify({
          cifid: selectedCandidateDetails.id,
          interviewDateTime: fullDateTime,
          interviewMode: selectedCandidateDetails.interviewMode,
          hrScreeningFeedback: selectedCandidateDetails.hrFeedback,
          technicalInterviewFeedback: selectedCandidateDetails.technicalFeedback,
          mdFeedback: selectedCandidateDetails.mdFeedback,
          recruitmentStatus: selectedCandidateDetails.status,
          statusChangeNote: selectedCandidateDetails.statusNote,
        }),
      });

      if (response?.success) {
        toast.success('Recruitment details saved successfully');
        await fetchShortlistedCandidates();
        setShowDetailsModal(false);
      } else {
        toast.error(response?.message || 'Failed to save recruitment details');
      }
    } catch (error) {
      console.error('Save Recruitment Details Error:', error);
      toast.error(error?.message || 'Failed to save recruitment details');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Shortlist: 'bg-blue-100 text-blue-800',
      Shortlisted: 'bg-blue-100 text-blue-800',
      Interviewing: 'bg-blue-100 text-blue-800',
      Selected: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Reject: 'bg-red-100 text-red-800',
      Rejected: 'bg-red-100 text-red-800',
      Hold: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleLaunchToOnboarding = (candidate) => {
    navigate('/onboarding', { state: { candidateData: candidate } });
  };

  const getStatusBadge = (status) => {
    let displayStatus = status;
    if (status === 'Shortlist') { displayStatus = 'Shortlist'; }
    if (status === 'reject') { displayStatus = 'reject'; }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {displayStatus || '-'}
      </span>
    );
  };

  const sortedCandidates = sortRows(candidates, sortConfig.key, sortConfig.direction, (candidate) => {
    if (sortConfig.key === 'name') return candidate.fullName;
    if (sortConfig.key === 'phone') return candidate.phoneNumber;
    if (sortConfig.key === 'email') return candidate.email;
    if (sortConfig.key === 'opening') return candidate.opening?.jobTitle;
    if (sortConfig.key === 'interview') return getInterviewDateTime(candidate);
    if (sortConfig.key === 'status') return candidate.appliedStatus;
    return '';
  });
  const toggleSort = (key) => setSortConfig((current) => ({
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900"> Recruitment Pipeline </h1>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="erp-list-table min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Candidate Name" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Phone No" sortKey="phone" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Email id" sortKey="email" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Job Opening" sortKey="opening" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Interview Info" sortKey="interview" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Current Status" sortKey="status" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex justify-center items-center">Loading shortlisted candidates...</div>
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No shortlisted candidates found.</td>
                  </tr>
                ) : (
                  sortedCandidates.map((candidate) => (
                    <tr key={candidate.cifid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{candidate.fullName || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500">{candidate.phoneNumber || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500">{candidate.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{candidate.opening?.jobTitle || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {getInterviewParts(getInterviewDateTime(candidate)) ? (
                          <>
                            <p className="text-sm text-gray-700">
                              {getInterviewParts(getInterviewDateTime(candidate)).date}{' '}
                              {getInterviewParts(getInterviewDateTime(candidate)).time}{' '}
                              {getInterviewParts(getInterviewDateTime(candidate)).period}
                            </p>
                            <p className="text-xs text-gray-500">{getInterviewMode(candidate) || '-'}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">Not scheduled</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(candidate.appliedStatus)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(candidate)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                          title="View Details"
                          aria-label="View candidate details"
                        >
                          <Eye size={16} />
                        </button>
                        {candidate.appliedStatus === 'Selected' && (
                          <button
                            type="button"
                            onClick={() => handleLaunchToOnboarding(candidate)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                            title="Launch to Onboarding"
                            aria-label="Launch candidate to onboarding"
                          >
                            <Rocket size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCandidate(candidate)}
                            disabled={deletingId === resolveCandidateId(candidate)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                            title="Delete"
                            aria-label="Delete candidate"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
              <span>
                Shortlisted Candidates:{' '}
                <span className="font-medium text-blue-600">{candidates.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setShowDetailsModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-gray-100">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-gray-100 px-7 py-5 rounded-t-3xl z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Manage Recruitment Process</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Update interview schedules, internal reviews, and candidate status.</p>
                </div>
                <button
                  type="button"
                  title="Close"
                  aria-label="Close"
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-7">
                {/* Candidate Black Info Banner */}
                <div className="bg-[#111111] text-white rounded-2xl p-5 mb-7 shadow-xs">
                  <h3 className="text-base font-bold text-white tracking-tight">{selectedCandidateDetails.name || '-'}</h3>
                  <p className="text-xs text-gray-300 mt-0.5 font-medium">
                    {selectedCandidateDetails.email || '-'} &bull; {selectedCandidateDetails.phone || '-'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-normal">{selectedCandidateDetails.jobTitle || '-'}</p>
                </div>

                {/* 2-Column Layout: Left Tab Menu, Right Step Form */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
                  {/* Left Tabs */}
                  <div className="md:col-span-4 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('interview')}
                      className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                        activeModalTab === 'interview'
                          ? 'bg-blue-50/80 border border-blue-200 text-blue-700 shadow-xs'
                          : 'bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <User size={15} className={activeModalTab === 'interview' ? 'text-blue-600' : 'text-gray-400'} />
                      <span>Interview Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModalTab('feedback')}
                      className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                        activeModalTab === 'feedback'
                          ? 'bg-blue-50/80 border border-blue-200 text-blue-700 shadow-xs'
                          : 'bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <MessageSquare size={15} className={activeModalTab === 'feedback' ? 'text-blue-600' : 'text-gray-400'} />
                      <span>Internal Feedback & Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModalTab('decision')}
                      className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                        activeModalTab === 'decision'
                          ? 'bg-blue-50/80 border border-blue-200 text-blue-700 shadow-xs'
                          : 'bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FileCheck size={15} className={activeModalTab === 'decision' ? 'text-blue-600' : 'text-gray-400'} />
                      <span>Final Decision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModalTab('history')}
                      className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                        activeModalTab === 'history'
                          ? 'bg-blue-50/80 border border-blue-200 text-blue-700 shadow-xs'
                          : 'bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <History size={15} className={activeModalTab === 'history' ? 'text-blue-600' : 'text-gray-400'} />
                      <span>Interview History</span>
                    </button>
                  </div>

                  {/* Right Form Content */}
                  <div className="md:col-span-8 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs min-h-[380px] flex flex-col justify-between">
                    {/* TAB 1: Interview Details */}
                    {activeModalTab === 'interview' && (
                      <div className="space-y-5">
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">Interview Details</h4>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Interview Date & Time <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-12 sm:col-span-6 relative">
                              <input
                                type="date"
                                value={selectedCandidateDetails.interviewDateOnly}
                                onChange={(e) => handleInputChange(e, 'interviewDateOnly')}
                                className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all"
                              />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                              <select
                                value={selectedCandidateDetails.interviewTime12.split(':')[0] || ''}
                                onChange={(e) => handleInterviewTimeChange('hour', e.target.value)}
                                className="w-full px-2.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all"
                                aria-label="Interview hour"
                              >
                                <option value="">HH</option>
                                {hourOptions.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                              </select>
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                              <select
                                value={selectedCandidateDetails.interviewTime12.split(':')[1] || ''}
                                onChange={(e) => handleInterviewTimeChange('minute', e.target.value)}
                                className="w-full px-2.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all"
                                aria-label="Interview minute"
                              >
                                <option value="">MM</option>
                                {minuteOptions.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                              </select>
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                              <select
                                value={selectedCandidateDetails.interviewPeriod}
                                onChange={(e) => handleInputChange(e, 'interviewPeriod')}
                                className="w-full px-2.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all"
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Interview Mode <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedCandidateDetails.interviewMode}
                            onChange={(e) => handleInputChange(e, 'interviewMode')}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all"
                          >
                            <option value="">Select Interview Mode</option>
                            <option value="Offline">Offline (In-Person)</option>
                            <option value="Online">Online (Video Call)</option>
                            <option value="Phone">Phone Interview</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Internal Feedback & Review Process */}
                    {activeModalTab === 'feedback' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">Internal Feedback & Review Process</h4>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Step 1 - HR</label>
                          <textarea
                            value={selectedCandidateDetails.hrFeedback}
                            onChange={(e) => handleInputChange(e, 'hrFeedback')}
                            rows={2}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all placeholder:text-gray-400"
                            placeholder="HR screening feedback.."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Step 2 - Technical Interview Feedback</label>
                          <textarea
                            value={selectedCandidateDetails.technicalFeedback}
                            onChange={(e) => handleInputChange(e, 'technicalFeedback')}
                            rows={2}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all placeholder:text-gray-400"
                            placeholder="Technical assessment feedback.."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Step 3 - MD Feedback</label>
                          <textarea
                            value={selectedCandidateDetails.mdFeedback}
                            onChange={(e) => handleInputChange(e, 'mdFeedback')}
                            rows={2}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all placeholder:text-gray-400"
                            placeholder="Final management review feedback.."
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Final Decision */}
                    {activeModalTab === 'decision' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">Final Decision</h4>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Recruitment Status</label>
                          <select
                            value={selectedCandidateDetails.status}
                            onChange={handleStatusChange}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all"
                          >
                            <option value="Shortlist">Shortlisted</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Selected">Selected</option>
                            <option value="Pending">Pending</option>
                            <option value="Reject">Rejected</option>
                            <option value="Hold">Hold</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status Change Note (Optional)</label>
                          <textarea
                            rows={3}
                            value={selectedCandidateDetails.statusNote}
                            onChange={(e) => handleInputChange(e, 'statusNote')}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7a0c16]/20 focus:border-[#7a0c16] transition-all placeholder:text-gray-400"
                            placeholder="eg. Cleared round 1"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Interview History */}
                    {activeModalTab === 'history' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-gray-900 tracking-tight">Interview History</h4>
                          <span className="text-xs font-semibold text-gray-500">
                            Current Status: <span className="text-gray-900">{selectedCandidateDetails.status || 'Shortlisted'}</span>
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                          {selectedCandidateDetails.history && selectedCandidateDetails.history.length > 0 ? (
                            [...selectedCandidateDetails.history]
                              .sort((secondItem, firstItem) => {
                                const firstDate = getSortableTime(getHistoryModifiedDateTime(firstItem));
                                const secondDate = getSortableTime(getHistoryModifiedDateTime(secondItem));
                                return secondDate - firstDate;
                              })
                              .map((item, index) => {
                                const historyInterviewParts = getInterviewParts(item.interviewDateTime || item.interviewDate);
                                const modifiedParts = getInterviewParts(getHistoryModifiedDateTime(item));
                                return (
                                  <div key={index} className="bg-gray-50/60 border border-gray-200/80 rounded-xl p-3.5 text-xs transition-all">
                                    <div className="flex justify-between items-start border-b border-gray-200/50 pb-2 mb-2">
                                      <div>
                                        <p className="font-semibold text-gray-800">
                                          {historyInterviewParts ? (
                                            <span className="text-blue-600 font-bold">
                                              {historyInterviewParts.date} {historyInterviewParts.time} {historyInterviewParts.period}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">Not scheduled</span>
                                          )}
                                          <span className="mx-2 text-gray-300">|</span>
                                          <span className="text-gray-600">Mode: {getInterviewModeFromHistory(item)}</span>
                                        </p>
                                      </div>
                                      <div className="text-right text-[11px] text-gray-400">
                                        {modifiedParts ? `${modifiedParts.date} ${modifiedParts.time} ${modifiedParts.period}` : '-'}
                                      </div>
                                    </div>
                                    <div className="space-y-1 text-gray-600 text-[11px]">
                                      {(item.hrFeedback || item.hrScreeningFeedback) && (
                                        <p><span className="font-medium text-gray-700">HR:</span> {item.hrFeedback || item.hrScreeningFeedback}</p>
                                      )}
                                      {(item.technicalFeedback || item.technicalInterviewFeedback) && (
                                        <p><span className="font-medium text-gray-700">Tech:</span> {item.technicalFeedback || item.technicalInterviewFeedback}</p>
                                      )}
                                      {item.mdFeedback && (
                                        <p><span className="font-medium text-gray-700">MD:</span> {item.mdFeedback}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="bg-gray-50/50 rounded-2xl p-10 text-xs text-gray-400 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[180px]">
                              No interview history available yet.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step Action Buttons */}
                    <div className="flex justify-end items-center gap-2.5 pt-5 mt-4 border-t border-gray-100">
                      {activeModalTab === 'interview' && (
                        <button
                          type="button"
                          onClick={() => setActiveModalTab('feedback')}
                          className="px-6 py-2 text-xs font-semibold bg-[#7a0c16] text-white rounded-xl shadow-xs hover:bg-[#630911] transition-all"
                        >
                          Next
                        </button>
                      )}

                      {activeModalTab === 'feedback' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowDetailsModal(false)}
                            className="px-5 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModalTab('decision')}
                            className="px-6 py-2 text-xs font-semibold bg-[#7a0c16] text-white rounded-xl shadow-xs hover:bg-[#630911] transition-all"
                          >
                            Next
                          </button>
                        </>
                      )}

                      {activeModalTab === 'decision' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowDetailsModal(false)}
                            className="px-5 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModalTab('history')}
                            className="px-6 py-2 text-xs font-semibold bg-[#7a0c16] text-white rounded-xl shadow-xs hover:bg-[#630911] transition-all"
                          >
                            Next
                          </button>
                        </>
                      )}

                      {activeModalTab === 'history' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowDetailsModal(false)}
                            className="px-5 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveRecruitment}
                            disabled={saving}
                            className="px-6 py-2 text-xs font-semibold bg-[#7a0c16] text-white rounded-xl shadow-xs hover:bg-[#630911] disabled:opacity-50 transition-all"
                          >
                            {saving ? 'Saving...' : 'Save Recruitment Details'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentPipeline;