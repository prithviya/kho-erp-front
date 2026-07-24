import React, { useState } from 'react';

const RecruitmentPipeline = () => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  
  const [candidates] = useState([
    {
      id: 1,
      name: 'Steffi S',
      email: 'steffi@gmail.com',
      phone: '98765 43210',
      jobTitle: 'Senior Content Writer',
      jobOpening: 'Content Writer',
      interviewDate: '02 Dec 2024, 03:38 PM',
      interviewMode: 'Offline',
      status: 'Interviewing',
    },
    {
      id: 2,
      name: 'Shri Atshayasujana M',
      email: 'dummy@gmail.com',
      phone: '9876543210',
      jobTitle: 'Operations Executive',
      jobOpening: 'Operations Executive',
      interviewDate: '22 Jan 2025, 06:11 PM',
      interviewMode: 'Offline',
      status: 'Selected',
    },
    {
      id: 3,
      name: 'Prabu NS',
      email: 'prabuns@gmail.com',
      phone: '9894295095',
      jobTitle: 'Managing Director',
      jobOpening: 'Managing Director',
      interviewDate: '01 Oct 2024, 06:04 PM',
      interviewMode: 'Offline',
      status: 'Pending',
    },
    {
      id: 4,
      name: 'Vignesh Arumugam',
      email: 'vignesharumugam92@gmail.com',
      phone: '9876543210',
      jobTitle: 'Senior Media Executive',
      jobOpening: 'Senior Media Executive',
      interviewDate: '01 Oct 2024, 05:06 PM',
      interviewMode: 'Offline',
      status: 'Rejected',
    },
    {
      id: 5,
      name: 'Ralmanurikkirhan',
      email: 'ralmanurikkirhan@gmail.com',
      phone: '9876543210',
      jobTitle: 'Content Writer',
      jobOpening: 'Content Writer',
      interviewDate: '15 Nov 2024, 10:00 AM',
      interviewMode: 'Online',
      status: 'Interviewing',
    },
  ]);

  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState({
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
    history: [
      { action: 'Status changed from Selected to Interviewing', date: '21 Jul 2026, 05:46 PM', user: 'System Admin' },
      { action: 'Status changed from Hold to Selected', date: '20 Jul 2026, 05:24 PM', user: 'System Admin' },
      { action: 'Status changed from Selected to Hold', date: '20 Jul 2026, 05:23 PM', user: 'System Admin' },
    ]
  });

  const handleViewDetails = (candidate) => {
    setSelectedCandidateDetails({
      ...selectedCandidateDetails,
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      jobTitle: candidate.jobTitle,
      interviewDate: candidate.interviewDate,
      interviewMode: candidate.interviewMode,
      status: candidate.status,
    });
    setSelectedCandidateId(candidate.id);
    setShowDetailsModal(true);
  };

  const handleStatusChange = (e) => {
    setSelectedCandidateDetails({
      ...selectedCandidateDetails,
      status: e.target.value
    });
  };

  const handleInputChange = (e, field) => {
    setSelectedCandidateDetails({
      ...selectedCandidateDetails,
      [field]: e.target.value
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Interviewing': 'bg-blue-100 text-blue-800',
      'Selected': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Hold': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recruitment Pipeline</h1>
          <p className="text-sm text-gray-500">Manage interview schedules, internal review comments, and candidate status</p>
        </div>

        {/* Table View */}
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
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                        <p className="text-xs text-gray-500">{candidate.email}</p>
                        <p className="text-xs text-gray-500">{candidate.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{candidate.jobTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{candidate.interviewDate}</p>
                      <p className="text-xs text-gray-500">{candidate.interviewMode}</p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(candidate)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Stats */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
              <span>Total Candidates: {candidates.length}</span>
              <div className="flex flex-wrap gap-4">
                <span>Interviewing: <span className="font-medium text-blue-600">{candidates.filter(c => c.status === 'Interviewing').length}</span></span>
                <span>Selected: <span className="font-medium text-green-600">{candidates.filter(c => c.status === 'Selected').length}</span></span>
                <span>Pending: <span className="font-medium text-yellow-600">{candidates.filter(c => c.status === 'Pending').length}</span></span>
                <span>Rejected: <span className="font-medium text-red-600">{candidates.filter(c => c.status === 'Rejected').length}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity"
            onClick={() => setShowDetailsModal(false)}
          ></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Manage Recruitment Process</h2>
                    <p className="text-sm text-gray-500">Update interview schedules, internal reviews, and candidate status.</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                {/* Candidate Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCandidateDetails.name}</h3>
                  <p className="text-gray-600">
                    {selectedCandidateDetails.email} • {selectedCandidateDetails.phone}
                  </p>
                </div>

                {/* 1. Interview Details */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">1. Interview Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date & Time
                      </label>
                      <input
                        type="text"
                        value={selectedCandidateDetails.interviewDate}
                        onChange={(e) => handleInputChange(e, 'interviewDate')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Mode
                      </label>
                      <select
                        value={selectedCandidateDetails.interviewMode}
                        onChange={(e) => handleInputChange(e, 'interviewMode')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Offline">Offline (In-Person)</option>
                        <option value="Online">Online (Video Call)</option>
                        <option value="Phone">Phone Interview</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Internal Feedback & Review Process */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">2. Internal Feedback & Review Process</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step 1 - HR
                      </label>
                      <textarea
                        value={selectedCandidateDetails.hrFeedback}
                        onChange={(e) => handleInputChange(e, 'hrFeedback')}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="HR screening feedback..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step 2 - Technical Interview Feedback
                      </label>
                      <textarea
                        value={selectedCandidateDetails.technicalFeedback}
                        onChange={(e) => handleInputChange(e, 'technicalFeedback')}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Technical assessment feedback..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step 3 - MD Feedback
                      </label>
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

                {/* 3. Final Decision */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">3. Final Decision</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recruitment Status
                      </label>
                      <select
                        value={selectedCandidateDetails.status}
                        onChange={handleStatusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Interviewing">Interviewing</option>
                        <option value="Selected">Selected</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status Change Note (Optional)
                      </label>
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

                {/* 4. Interview History */}
                <div className="pb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">4. Interview History</h4>
                  <div className="space-y-3">
                    {selectedCandidateDetails.history.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.user}</p>
                            <p className="text-sm text-gray-600">{item.action}</p>
                          </div>
                          <span className="text-xs text-gray-400">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
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
                    onClick={() => {
                      console.log('Saved:', selectedCandidateDetails);
                      setShowDetailsModal(false);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save Recruitment Details
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