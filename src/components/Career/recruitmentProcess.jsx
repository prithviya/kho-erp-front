import React, { useEffect, useState } from 'react';
import { request } from '../../services/apiClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Rocket, Eye } from 'lucide-react';
const RecruitmentPipeline = () => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedCandidateDetails, setSelectedCandidateDetails] =
    useState({
      id: null,
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      interviewDate: '',
      interviewMode: '',
      status: '',
      statusNote: '',
      hrFeedback: '',
      technicalFeedback: '',
      mdFeedback: '',
      history: [],
    });

 
  const fetchShortlistedCandidates = async () => {
    try {
      setLoading(true);
      const response = await request('/cif-submissions', { method: 'GET',  });
      // console.log( 'Recruitment Applications Response:', response);
      if (response?.success) {
          const shortlistedCandidates = ( response.data || [] ).filter((candidate) => {
            if (candidate.recruitment) { return true; }
            const currentStatus = ( candidate.status || candidate.submission?.appliedStatus || '' ).toLowerCase();
            return [ 'shortlist','shortlisted','interviewing','selected','hold', ].includes(currentStatus);
          });
        // console.log( 'Shortlisted Candidates:',  shortlistedCandidates );
        setCandidates(shortlistedCandidates);
      } else {
        toast.error( response?.message || 'Failed to fetch shortlisted candidates' );
      }
    } catch (error) {console.error('Fetch Shortlisted Candidates Error:', error );
      toast.error( error?.message || 'Failed to fetch shortlisted candidates' );
    } 
    finally { 
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlistedCandidates();
  }, []);

  const handleViewDetails = (candidate) => {
    setSelectedCandidateDetails({
      id: candidate.cifid,
      name: candidate.fullName || '',
      email: candidate.email || '',
      phone: candidate.phoneNumber || '',
      jobTitle:
        candidate.opening?.jobTitle || '',
      interviewDate:
        candidate.interviewDate || '',
      interviewMode:
        candidate.interviewMode || 'Offline',
      status:
        candidate.appliedStatus || 'Shortlist',
      statusNote:
        candidate.statusNote || '',
      hrFeedback:
        candidate.hrFeedback || '',
      technicalFeedback:
        candidate.technicalFeedback || '',
      mdFeedback:
        candidate.mdFeedback || '',
      history:
        candidate.history || [],
    });
    setSelectedCandidateId(candidate.cifid);
    setShowDetailsModal(true);
  };
  const handleStatusChange = (e) => {
    setSelectedCandidateDetails({ ...selectedCandidateDetails, status: e.target.value, });
  };
  const handleInputChange = (e, field) => {
    setSelectedCandidateDetails({ ...selectedCandidateDetails, [field]: e.target.value, });
  };
  const handleSaveRecruitment = async () => {
    try {
      setSaving(true);

      const response = await request('/recruitments', {
        method: 'POST',
        body: JSON.stringify({
          cifid: selectedCandidateDetails.id,
          interviewDateTime: selectedCandidateDetails.interviewDate,
          interviewMode: selectedCandidateDetails.interviewMode,
          hrScreeningFeedback: selectedCandidateDetails.hrFeedback,
          technicalInterviewFeedback:
          selectedCandidateDetails.technicalFeedback,
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
        toast.error( response?.message || 'Failed to save recruitment details' );
      }
    } catch (error) {
      console.error('Save Recruitment Details Error:', error);
      toast.error( error?.message || 'Failed to save recruitment details' );
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Shortlist:'bg-blue-100 text-blue-800', Shortlisted:'bg-blue-100 text-blue-800', Interviewing:'bg-blue-100 text-blue-800', Selected:'bg-green-100 text-green-800', Pending:'bg-yellow-100 text-yellow-800', Reject:'bg-red-100 text-red-800', Rejected:'bg-red-100 text-red-800', Hold:'bg-purple-100 text-purple-800',
    };
    return (colors[status] ||'bg-gray-100 text-gray-800');
  };

  const handleLaunchToOnboarding = (candidate) => {
    navigate('/onboarding', { state: { candidateData: candidate } });
  };

  const getStatusBadge = (status) => {
    let displayStatus = status;
    if (status === 'Shortlist') { displayStatus = 'Shortlist'; }
    if (status === 'reject') { displayStatus = 'reject'; }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor( status )}`} > {displayStatus || '-'} </span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Opening </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview Info </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex justify-center items-center">Loading shortlisted candidates... </div>
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500" >  No shortlisted candidates found.</td>
                </tr>
                ) : (
                    candidates.map((candidate) => (
                      <tr key={candidate.cifid} className="hover:bg-gray-50 transition-colors" >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900"> {candidate.fullName || '-'} </p>
                          <p className="text-xs text-gray-500"> {candidate.email || '-'} </p>
                          <p className="text-xs text-gray-500"> {candidate.phoneNumber || '-'} </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700"> {candidate.opening?.jobTitle || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                         {candidate.interviewDate ? (
                          <>
                            <p className="text-sm text-gray-700"> {candidate.interviewDate} </p>
                            <p className="text-xs text-gray-500"> {candidate.interviewMode || '-'} </p>
                          </>
                          ) : (
                            <p className="text-sm text-gray-400"> Not scheduled </p>
                          )
                        }
                      </td>
                      <td className="px-4 py-3">

                        {getStatusBadge(
                          candidate.appliedStatus
                        )}

                      </td>


                      {/* ACTION */}

                      <td className="px-4 py-3 flex items-center space-x-3">

                        <button
                          onClick={() =>
                            handleViewDetails(candidate)
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <Eye size={'16'} />

                        </button>

                        {candidate.appliedStatus === 'Selected' && (
                          <button
                            onClick={() => handleLaunchToOnboarding(candidate)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Launch to Onboarding"
                          >
                            <Rocket size={'16'} />
                          </button>
                        )}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>


          {/* ====================================================
              TABLE FOOTER
          ==================================================== */}

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">

              <span>
                Shortlisted Candidates:{' '}
                <span className="font-medium text-blue-600">
                  {candidates.length}
                </span>
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* ========================================================
          CANDIDATE DETAILS MODAL
      ======================================================== */}

      {showDetailsModal && (

        <div className="fixed inset-0 z-50 overflow-y-auto">

          {/* BACKDROP */}

          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity"
            onClick={() =>
              setShowDetailsModal(false)
            }
          />

          <div className="flex min-h-full items-center justify-center p-4">

            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

              {/* ==================================================
                  MODAL HEADER
              ================================================== */}

              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">

                <div className="flex justify-between items-center">

                  <div>

                    <h2 className="text-xl font-semibold text-gray-800">
                      Manage Recruitment Process
                    </h2>

                    <p className="text-sm text-gray-500">
                      Update interview schedules, internal reviews,
                      and candidate status.
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setShowDetailsModal(false)
                    }
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >

                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />

                    </svg>

                  </button>

                </div>

              </div>


              {/* ==================================================
                  MODAL BODY
              ================================================== */}

              <div className="px-6 py-6">

                {/* CANDIDATE INFO */}

                <div className="bg-blue-50 rounded-lg p-4 mb-6">

                  <h3 className="text-lg font-semibold text-gray-900">

                    {selectedCandidateDetails.name || '-'}

                  </h3>

                  <p className="text-gray-600">

                    {selectedCandidateDetails.email || '-'}
                    {' • '}
                    {selectedCandidateDetails.phone || '-'}

                  </p>

                  <p className="text-sm text-gray-500 mt-1">

                    {selectedCandidateDetails.jobTitle || '-'}

                  </p>

                </div>


                {/* ==================================================
                    1. INTERVIEW DETAILS
                ================================================== */}

                <div className="border-b border-gray-200 pb-6 mb-6">

                  <h4 className="text-md font-semibold text-gray-800 mb-4">
                    1. Interview Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* DATE */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date & Time
                      </label>

                      <input
                          type="datetime-local"
                          value={selectedCandidateDetails.interviewDate}
                          onChange={(e) =>
                            handleInputChange(e, 'interviewDate')
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />


                    </div>


                    {/* MODE */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Mode
                      </label>

                      <select
                        value={
                          selectedCandidateDetails.interviewMode
                        }
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            'interviewMode'
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >

                        <option value="">
                          Select Interview Mode
                        </option>

                        <option value="Offline">
                          Offline (In-Person)
                        </option>

                        <option value="Online">
                          Online (Video Call)
                        </option>

                        <option value="Phone">
                          Phone Interview
                        </option>

                      </select>

                    </div>

                  </div>

                </div>


                {/* ==================================================
                    2. INTERNAL FEEDBACK
                ================================================== */}

                <div className="border-b border-gray-200 pb-6 mb-6">

                  <h4 className="text-md font-semibold text-gray-800 mb-4">
                    2. Internal Feedback & Review Process
                  </h4>

                  <div className="space-y-4">

                    {/* HR */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step 1 - HR
                      </label>

                      <textarea
                        value={
                          selectedCandidateDetails.hrFeedback
                        }
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            'hrFeedback'
                          )
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="HR screening feedback..."
                      />

                    </div>


                    {/* TECHNICAL */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step 2 - Technical Interview Feedback
                      </label>

                      <textarea
                        value={
                          selectedCandidateDetails.technicalFeedback
                        }
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            'technicalFeedback'
                          )
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Technical assessment feedback..."
                      />

                    </div>


                    {/* MD */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step 3 - MD Feedback
                      </label>

                      <textarea
                        value={
                          selectedCandidateDetails.mdFeedback
                        }
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            'mdFeedback'
                          )
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Final management review feedback..."
                      />

                    </div>

                  </div>

                </div>


                {/* ==================================================
                    3. FINAL DECISION
                ================================================== */}

                <div className="border-b border-gray-200 pb-6 mb-6">

                  <h4 className="text-md font-semibold text-gray-800 mb-4">
                    3. Final Decision
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* STATUS */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recruitment Status
                      </label>

                      <select
                        value={
                          selectedCandidateDetails.status
                        }
                        onChange={handleStatusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >

                        <option value="Shortlist">
                          Shortlisted
                        </option>

                        <option value="Interviewing">
                          Interviewing
                        </option>

                        <option value="Selected">
                          Selected
                        </option>

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Reject">
                          Rejected
                        </option>

                        <option value="Hold">
                          Hold
                        </option>

                      </select>

                    </div>


                    {/* NOTE */}

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status Change Note (Optional)
                      </label>

                      <input
                        type="text"
                        value={
                          selectedCandidateDetails.statusNote
                        }
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            'statusNote'
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Cleared round 1"
                      />

                    </div>

                  </div>

                </div>


                {/* ==================================================
                    4. INTERVIEW HISTORY
                ================================================== */}

                <div className="pb-6">

                  <h4 className="text-md font-semibold text-gray-800 mb-4">
                    4. Interview History
                  </h4>

                  <div className="space-y-3">

                    {selectedCandidateDetails.history &&
                    selectedCandidateDetails.history.length > 0 ? (

                      selectedCandidateDetails.history.map(
                        (item, index) => (

                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3"
                          >

                            <div className="flex justify-between items-start">

                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 mb-2">
                                  {item.user || '-'} - {item.action || '-'}
                                </p>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Step 1 (HR Feedback):</span> {item.hrFeedback || '-'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Step 2 (Technical Feedback):</span> {item.technicalFeedback || '-'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Step 3 (MD Feedback):</span> {item.mdFeedback || '-'}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-2">
                                    <span className="font-semibold">Status Change Note:</span> {item.statusNote || '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right ml-4">
                                <span className="block text-xs text-gray-400">
                                  {item.interviewMode || 'Offline'}
                                </span>
                                <span className="block text-xs text-gray-400 mt-1">
                                  {item.date || '-'} {item.time || ''}
                                </span>
                              </div>

                            </div>

                          </div>

                        )

                      )

                    ) : (

                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                        No interview history available.
                      </div>

                    )}

                  </div>

                </div>


                {/* ==================================================
                    MODAL FOOTER
                ================================================== */}

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">

                  <button
                    type="button"
                    onClick={() =>
                      setShowDetailsModal(false)
                    }
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
