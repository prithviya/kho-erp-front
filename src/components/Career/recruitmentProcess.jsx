import React, { useEffect, useState } from 'react';
import { request } from '../../services/apiClient';
import { toast } from 'react-toastify';

const RecruitmentPipeline = () => {
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
      const response = await request('/cif-submissions', {
        method: 'GET',
      });
      console.log( 'Recruitment Applications Response:', response);
      if (response?.success) {
          const shortlistedCandidates = (
            response.data || []
          ).filter((candidate) => {
            // Once recruitment details have been saved, keep the candidate in
            // this pipeline even if the recruitment status changes to Pending
            // or Reject. This lets users reopen and edit the saved record.
            if (candidate.recruitment) {
              return true;
            }

            const currentStatus = (
              candidate.status || candidate.submission?.appliedStatus || ''
            ).toLowerCase();

            return [
              'shortlist',
              'shortlisted',
              'interviewing',
              'selected',
              'hold',
            ].includes(currentStatus);
          });
        console.log( 'Shortlisted Candidates:',  shortlistedCandidates );
        setCandidates(shortlistedCandidates);
      } else {
        toast.error(
          response?.message ||
            'Failed to fetch shortlisted candidates'
        );
      }
    } catch (error) {
      console.error(
        'Fetch Shortlisted Candidates Error:',
        error
      );

      toast.error(
        error?.message ||
          'Failed to fetch shortlisted candidates'
      );
    } finally {
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
    setSelectedCandidateDetails({
      ...selectedCandidateDetails,
      status: e.target.value,
    });
  };

  const handleInputChange = (e, field) => {
    setSelectedCandidateDetails({
      ...selectedCandidateDetails,
      [field]: e.target.value,
    });
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
        toast.error(
          response?.message || 'Failed to save recruitment details'
        );
      }
    } catch (error) {
      console.error('Save Recruitment Details Error:', error);
      toast.error(
        error?.message || 'Failed to save recruitment details'
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Shortlist:'bg-blue-100 text-blue-800',
      Shortlisted:'bg-blue-100 text-blue-800',
      Interviewing:'bg-blue-100 text-blue-800',
      Selected:'bg-green-100 text-green-800',
      Pending:'bg-yellow-100 text-yellow-800',
      Reject:'bg-red-100 text-red-800',
      Rejected:'bg-red-100 text-red-800',
      Hold:'bg-purple-100 text-purple-800',
    };
    return (colors[status] ||'bg-gray-100 text-gray-800');
  };

  const getStatusBadge = (status) => {
    let displayStatus = status;
    if (status === 'Shortlist') {
      displayStatus = 'Shortlist';
    }
    if (status === 'reject') {
      displayStatus = 'reject';
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor( status )}`} >
        {displayStatus || '-'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Recruitment Pipeline
          </h1>
          <p className="text-sm text-gray-500">
            Manage interview schedules, internal review comments,
            and candidate status
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Opening
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interview Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-gray-500"
                    >

                      <div className="flex justify-center items-center">

                        <svg
                          className="animate-spin h-5 w-5 mr-3 text-blue-600"
                          viewBox="0 0 24 24"
                        >

                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />

                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />

                        </svg>

                        Loading shortlisted candidates...

                      </div>

                    </td>

                  </tr>

                ) : candidates.length === 0 ? (

                  /* EMPTY */

                  <tr>

                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No shortlisted candidates found.
                    </td>

                  </tr>

                ) : (

                  /* DATA */

                  candidates.map((candidate) => (

                    <tr
                      key={candidate.cifid}
                      className="hover:bg-gray-50 transition-colors"
                    >

                      {/* CANDIDATE */}

                      <td className="px-4 py-3">

                        <div>

                          <p className="text-sm font-medium text-gray-900">

                            {candidate.fullName || '-'}

                          </p>

                          <p className="text-xs text-gray-500">

                            {candidate.email || '-'}

                          </p>

                          <p className="text-xs text-gray-500">

                            {candidate.phoneNumber || '-'}

                          </p>

                        </div>

                      </td>


                      {/* JOB */}

                      <td className="px-4 py-3">

                        <p className="text-sm text-gray-700">

                          {candidate.opening?.jobTitle ||
                            '-'}

                        </p>

                      </td>


                      {/* INTERVIEW */}

                      <td className="px-4 py-3">

                        {candidate.interviewDate ? (

                          <>
                            <p className="text-sm text-gray-700">
                              {candidate.interviewDate}
                            </p>

                            <p className="text-xs text-gray-500">
                              {candidate.interviewMode ||
                                '-'}
                            </p>
                          </>

                        ) : (

                          <p className="text-sm text-gray-400">
                            Not scheduled
                          </p>

                        )}

                      </td>


                      {/* STATUS */}

                      <td className="px-4 py-3">

                        {getStatusBadge(
                          candidate.appliedStatus
                        )}

                      </td>


                      {/* ACTION */}

                      <td className="px-4 py-3">

                        <button
                          onClick={() =>
                            handleViewDetails(candidate)
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >

                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />

                          </svg>

                        </button>

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

                              <div>

                                <p className="text-sm font-medium text-gray-800">
                                  {item.user || '-'}
                                </p>

                                <p className="text-sm text-gray-600">
                                  {item.action || '-'}
                                </p>

                              </div>

                              <span className="text-xs text-gray-400">
                                {item.date || '-'}
                              </span>

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
