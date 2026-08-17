import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { request } from '../../services/apiClient';

const Applied = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, shortlisted, rejected, selected

  // Fetch all applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await request('/cif-submissions', {
        method: 'GET',
      });
      
      console.log('Applications Response:', response);
      
      if (response?.success) {
        setApplications(response.data || []);
      } else {
        toast.error(response?.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Fetch Applications Error:', error);
      toast.error(error?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Update application status
  const updateStatus = async (cifid, status) => {
    try {
      setUpdating(true);
      
      const response = await request(`/cif-submissions/${cifid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (response?.success) {
        toast.success(`Application ${status} successfully`);
        fetchApplications(); // Refresh list
        setShowModal(false);
      } else {
        toast.error(response?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update Status Error:', error);
      toast.error(error?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // View application details
  const viewApplication = async (cifid) => {
    try {
      const response = await request(`/cif-submissions/${cifid}`, {
        method: 'GET',
      });
      
      if (response?.success) {
        setSelectedApplication(response.data);
        setShowModal(true);
      } else {
        toast.error(response?.message || 'Failed to fetch application details');
      }
    } catch (error) {
      console.error('View Application Error:', error);
      toast.error(error?.message || 'Failed to fetch application details');
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      selected: 'bg-green-100 text-green-800',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    if (filterStatus === 'all') return true;
    return app.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  // Status options for dropdown
  const statusOptions = [
    { value: 'all', label: 'All Applications' },
    { value: 'pending', label: 'Pending' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'selected', label: 'Selected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    
          <div className="flex gap-3">
            {/* Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {applications.filter(a => a.status?.toLowerCase() === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Shortlisted</p>
            <p className="text-2xl font-bold text-blue-600">
              {applications.filter(a => a.status?.toLowerCase() === 'shortlisted').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Selected</p>
            <p className="text-2xl font-bold text-green-600">
              {applications.filter(a => a.status?.toLowerCase() === 'selected').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position / jobtitle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    portfolio Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading applications...
                      </div>
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, index) => 
                    (
                    <tr key={app.cifid || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {app.personal?.fullName || app.fullName || '-'}
                        <div className='text-xs text-gray-500'>
                            {app.personal?.email || app.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {app.personal?.phoneNumber || app.phoneNumber || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {app.opening?.appliedPosition || app.appliedPosition || '-'}
                            <div className='text-xs text-gray-500'>
                                {app.jobid?.jobTitle || app.appliedPosition || '-'}
                            </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {app.portfolioLink ? (
                            <a
                            href={app.portfolioLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            >
                            View Portfolio
                            </a>
                        ) : (
                            '-'
                        )}
                        </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(app.createdAt || app.appliedDate)}
                      </td>
                      
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                          {app.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewApplication(app.cifid)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => updateStatus(app.cifid, 'Shortlisted')}
                            disabled={updating}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Shortlist
                          </button>
                         
                          <button
                            onClick={() => updateStatus(app.cifid, 'Rejected')}
                            disabled={updating}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
              <span>
                Showing {filteredApplications.length} of {applications.length} applications
              </span>
              <div className="flex gap-4">
              
                <span>Shortlisted: <span className="font-medium text-blue-600">
                  {applications.filter(a => a.status?.toLowerCase() === 'shortlisted').length}
                </span></span>
               
                <span>Rejected: <span className="font-medium text-red-600">
                  {applications.filter(a => a.status?.toLowerCase() === 'rejected').length}
                </span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Application Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => !updating && setShowModal(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Application Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                {/* Personal Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{selectedApplication.personal?.fullName || selectedApplication.fullName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedApplication.personal?.email || selectedApplication.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedApplication.personal?.phoneNumber || selectedApplication.phoneNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Applied Position</p>
                      <p className="font-medium">{selectedApplication.personal?.appliedPosition || selectedApplication.jobTitle || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedApplication.status)}`}>
                        {selectedApplication.status || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Applied Date</p>
                      <p className="font-medium">{formatDate(selectedApplication.createdAt || selectedApplication.appliedDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                {selectedApplication.academics && selectedApplication.academics.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Education</h3>
                    <div className="space-y-2">
                      {selectedApplication.academics.map((edu, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.university}</p>
                          <p className="text-sm text-gray-500">Year: {edu.graduationYear} | Grade: {edu.grade}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {selectedApplication.experiences && selectedApplication.experiences.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Work Experience</h3>
                    <div className="space-y-2">
                      {selectedApplication.experiences.map((exp, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">{exp.companyName}</p>
                          <p className="text-sm text-gray-600">{exp.role}</p>
                          <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.skills.map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {skill.skillName} - {skill.skillLevel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons in Modal */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      updateStatus(selectedApplication.cifid, 'Shortlisted');
                    }}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => {
                      updateStatus(selectedApplication.cifid, 'Selected');
                    }}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => {
                      updateStatus(selectedApplication.cifid, 'Rejected');
                    }}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
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

export default Applied;