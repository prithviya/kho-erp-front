import React, { useEffect, useState } from 'react';
import { request } from '../../services/apiClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Rocket, Eye, X, Trash2 } from 'lucide-react';
import { canDeleteRecords } from '../../utils/auth';

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

  const resolveCandidateId = (candidate) => (
    candidate?.id ?? candidate?.cifid ?? candidate?.candidateId
  );

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const canDelete = canDeleteRecords();

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900"> Recruitment Pipeline </h1>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email id</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Opening</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
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
                  candidates.map((candidate) => (
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
                      <td className="px-4 py-3 flex items-center space-x-3">
                        <button onClick={() => handleViewDetails(candidate)} className="text-blue-600 hover:text-blue-800 transition-colors" title="View Details">
                          <Eye size={'16'} />
                        </button>
                        {candidate.appliedStatus === 'Selected' && (
                          <button onClick={() => handleLaunchToOnboarding(candidate)} className="text-green-600 hover:text-green-800 transition-colors" title="Launch to Onboarding">
                            <Rocket size={'16'} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteCandidate(candidate)} disabled={deletingId === resolveCandidateId(candidate)} className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50" title="Delete">
                            <Trash2 size={'16'} />
                          </button>
                        )}
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity" onClick={() => setShowDetailsModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Manage Recruitment Process</h2>
                    <p className="text-sm text-gray-500">Update interview schedules, internal reviews, and candidate status.</p>
                  </div>
                  <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCandidateDetails.name || '-'}</h3>
                  <p className="text-gray-600">
                    {selectedCandidateDetails.email || '-'} {' • '} {selectedCandidateDetails.phone || '-'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{selectedCandidateDetails.jobTitle || '-'}</p>
                </div>

                {/* 1. INTERVIEW DETAILS (12-Hour Format & Mandatory) */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">1. Interview Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date & Time <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={selectedCandidateDetails.interviewDateOnly}
                          onChange={(e) => handleInputChange(e, 'interviewDateOnly')}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={selectedCandidateDetails.interviewTime12.split(':')[0] || ''}
                          onChange={(e) => handleInterviewTimeChange('hour', e.target.value)}
                          className="w-1/6 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          aria-label="Interview hour"
                        >
                          <option value="">HH</option>
                          {hourOptions.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                        </select>
                        <select
                          value={selectedCandidateDetails.interviewTime12.split(':')[1] || ''}
                          onChange={(e) => handleInterviewTimeChange('minute', e.target.value)}
                          className="w-1/6 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          aria-label="Interview minute"
                        >
                          <option value="">MM</option>
                          {minuteOptions.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                        </select>
                        <select
                          value={selectedCandidateDetails.interviewPeriod}
                          onChange={(e) => handleInputChange(e, 'interviewPeriod')}
                          className="w-1/4 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedCandidateDetails.interviewMode}
                        onChange={(e) => handleInputChange(e, 'interviewMode')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select Interview Mode</option>
                        <option value="Offline">Offline (In-Person)</option>
                        <option value="Online">Online (Video Call)</option>
                        <option value="Phone">Phone Interview</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. INTERNAL FEEDBACK */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">2. Internal Feedback & Review Process</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Step 1 - HR</label>
                      <textarea
                        value={selectedCandidateDetails.hrFeedback}
                        onChange={(e) => handleInputChange(e, 'hrFeedback')}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="HR screening feedback..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Step 2 - Technical Interview Feedback</label>
                      <textarea
                        value={selectedCandidateDetails.technicalFeedback}
                        onChange={(e) => handleInputChange(e, 'technicalFeedback')}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Technical assessment feedback..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Step 3 - MD Feedback</label>
                      <textarea
                        value={selectedCandidateDetails.mdFeedback}
                        onChange={(e) => handleInputChange(e, 'mdFeedback')}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Final management review feedback..."
                      />
                    </div>
                  </div>
                </div>

                {/* 3. FINAL DECISION */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">3. Final Decision</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recruitment Status</label>
                      <select
                        value={selectedCandidateDetails.status}
                        onChange={handleStatusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status Change Note (Optional)</label>
                      <input
                        type="text"
                        value={selectedCandidateDetails.statusNote}
                        onChange={(e) => handleInputChange(e, 'statusNote')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Cleared round 1"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. INTERVIEW HISTORY */}
                <div className="pb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">4. Interview History</h4>
                  <div className="space-y-4 max-h-[30vh] overflow-y-auto">
                    {selectedCandidateDetails.history && selectedCandidateDetails.history.length > 0 ? (
                      [...selectedCandidateDetails.history]
                        .sort((secondItem, firstItem) => {
                          // Sort mathematically descending: largest (newest) number to the top
                          const firstDate = getSortableTime(getHistoryModifiedDateTime(firstItem));
                          const secondDate = getSortableTime(getHistoryModifiedDateTime(secondItem));
                          return secondDate - firstDate;
                        })
                        .map((item, index) => {
                        // Parse the interview date specifically saved for this history record
                        const historyInterviewParts = getInterviewParts(item.interviewDateTime || item.interviewDate);
                        
                        // Parse the last modified/edit date for this record
                        const modifiedParts = getInterviewParts(getHistoryModifiedDateTime(item));
                        
                        return (
                          <div key={index} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 transition-all hover:shadow-md">
                            {/* Header: Interview Info & Modified Date */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                              <div>
                                <h5 className="text-sm font-bold text-gray-700 mb-1">Interview Schedule</h5>
                                <p className="text-sm text-gray-600">
                                  {historyInterviewParts ? (
                                    <span className="font-medium text-blue-600">
                                      {historyInterviewParts.date} {historyInterviewParts.time} {historyInterviewParts.period}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">Not scheduled</span>
                                  )}
                                  <span className="mx-2 text-gray-300">|</span>
                                  <span className="text-sm text-gray-600">Mode: <span className="font-medium">{getInterviewModeFromHistory(item)}</span></span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Modified</span>
                                {modifiedParts ? (
                                  <span className="block text-xs font-medium text-gray-600">
                                    {modifiedParts.date} {modifiedParts.time} {modifiedParts.period}
                                  </span>
                                ) : (
                                  <span className="block text-xs text-gray-400">-</span>
                                )}
                                <span className="block text-xs text-gray-400 mt-1">{item.user || 'System User'} {item.action ? `(${item.action})` : ''}</span>
                              </div>
                            </div>

                            {/* Body: Feedbacks */}
                            <div className="space-y-2 mb-3">
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-semibold text-gray-700 block mb-1">Step 1 (HR Feedback):</span> 
                                {item.hrFeedback || item.hrScreeningFeedback || '-'}
                              </p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-semibold text-gray-700 block mb-1">Step 2 (Technical Feedback):</span> 
                                {item.technicalFeedback || item.technicalInterviewFeedback || '-'}
                              </p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-semibold text-gray-700 block mb-1">Step 3 (MD Feedback):</span> 
                                {item.mdFeedback || '-'}
                              </p>
                            </div>
                          </div>
                        );
                        })
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-sm text-gray-500 text-center border border-dashed border-gray-300">
                        No interview history available yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecruitment}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {saving ? 'Saving...' : 'Save Recruitment Details'}
                  </button>
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