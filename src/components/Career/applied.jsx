import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { request } from '../../services/apiClient';
import { RefreshCcw, X, Eye, Check, FileUser, Trash2 } from 'lucide-react'
import { canDeleteRecords } from '../../utils/auth';
import SortableHeader from '../common/SortableHeader';
import { sortRows } from '../../utils/tableSorting';

const Applied = () => {
  const [applications, setApplications] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const canDelete = canDeleteRecords('applied');

  const deleteApplication = async (cifid, name) => {
    if (!canDelete || deletingId) return;
    if (!window.confirm(`Delete application${name ? ` of "${name}"` : ''}? This action cannot be undone.`)) return;
    try {
      setDeletingId(cifid);
      const response = await request(`/cif-submissions/${cifid}`, { method: 'DELETE' });
      if (response?.success) {
        toast.success('Application deleted successfully');
        await fetchApplications();
      } else {
        toast.error(response?.message || 'Failed to delete application');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };
  const [resumeUrlToView, setResumeUrlToView] = useState('');

  const [filterStatus, setFilterStatus] = useState('all');

  const resolveCandidateId = (application) => (
    application?.id ?? application?.cifid ?? application?.candidateId
  );

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const response = await request('/cif-submissions', { method: 'GET', });
      if (response?.success) {
        setApplications(response.data || []);
      } else {
        toast.error( response?.message || 'Failed to fetch applications' );
      }
    } catch (error) {
      console.error('Fetch Applications Error:', error);

      toast.error( error?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);


  const updateStatus = async (cifid, status) => {
    try {
      setUpdating(true);

      const response = await request(`/cif-submissions/${cifid}/status`,
        {
          method: 'PATCH', body: JSON.stringify({ status }),
        }
      );

      if (response?.success) {
        
        toast.success( `Application ${status} successfully` );
        await fetchApplications();
        setShowModal(false);
      } else {
        toast.error( response?.message ||'Failed to update status' );
      }
    } catch (error) {
      console.error('Update Status Error:', error);

      toast.error( error?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const viewApplication = async (cifid) => {
    try {
      const response = await request( `/cif-submissions/${cifid}`,
        {
          method: 'GET',
        }
      );

      if (response?.success) {
        setSelectedApplication(response.data);
        setShowModal(true);
      } else {
        toast.error( response?.message || 'Failed to fetch application details' );
      }
    } catch (error) {
        toast.error( error?.message || 'Failed to fetch application details' );
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      selected: 'bg-green-100 text-green-800',
    };
    return statusMap[String(status || '').trim().toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const normalizeStatus = (status) => {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const lookup = {
      pending: 'pending',
      shortlist: 'shortlisted',
      shortlisted: 'shortlisted',
      reject: 'rejected',
      rejected: 'rejected',
      selected: 'selected',
    };
    return lookup[normalizedStatus] || normalizedStatus;
  };

  const resolveResumeUrl = (record) => {
    const seen = new Set();

    const walk = (value) => {
      if (!value || typeof value !== 'object') {
        if (typeof value === 'string') {
          const stringValue = value.trim();
          if (!stringValue) return null;
          if (stringValue.startsWith('data:')) return stringValue;
          if (stringValue.startsWith('http://') || stringValue.startsWith('https://')) return stringValue;
          if (stringValue.startsWith('/')) return `${window.location.origin}${stringValue}`;
          
          // If it's just a filename, assume it's in the backend's assets/resume folder
          const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
          return `${baseUrl}/assets/resume/${stringValue}`;
        }
        return null;
      }

      if (seen.has(value)) return null;
      seen.add(value);

      if (Array.isArray(value)) {
        for (const item of value) {
          const found = walk(item);
          if (found) return found;
        }
        return null;
      }

      const keys = Object.keys(value);

      for (const key of keys) {
        const normalizedKey = String(key).toLowerCase();
        const lowerValue = value[key];

        if (/(resume|cv|document|file)/.test(normalizedKey)) {
          const found = walk(lowerValue);
          if (found) return found;
        }

        if (typeof lowerValue === 'object') {
          const found = walk(lowerValue);
          if (found) return found;
        }
      }

      return null;
    };

    const directResumeValues = [
      record?.resumeUrl,
      record?.resume,
      record?.resumeStoredName,
      record?.personal?.resumeUrl,
      record?.personal?.resume,
    ];

    for (const value of directResumeValues) {
      const found = walk(value);
      if (found) return found;
    }

    return walk(record);
  };

  const openResume = async (record) => {
    const resumeUrl = resolveResumeUrl(record);

    if (!resumeUrl) {
      toast.error('No resume uploaded for this candidate.');
      return;
    }

    try {
      const response = await fetch(resumeUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resume (${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setResumeUrlToView(objectUrl);
      setShowResumeModal(true);
    } catch (error) {
      console.error('Resume preview error:', error);
      setResumeUrlToView(resumeUrl);
      setShowResumeModal(true);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const getJobTitle = (app) => {
      return ( 
      app?.jobTitle || app?.jobtitle ||app?.opening?.jobTitle ||
      app?.opening?.jobtitle ||
      app?.opening?.appliedPosition ||
      app?.appliedPosition ||
      '-'
    );
  };
  
  const filteredApplications =
    applications.filter((app) => {
      if (filterStatus === 'all') {
        return true;
      }

      return normalizeStatus(app.status) === filterStatus.toLowerCase();
    });
  const sortedApplications = sortRows(filteredApplications, sortConfig.key, sortConfig.direction, (app) => {
    if (sortConfig.key === 'name') return app.personal?.fullName || app.fullName;
    if (sortConfig.key === 'phone') return app.personal?.phoneNumber || app.phoneNumber;
    if (sortConfig.key === 'position') return getJobTitle(app);
    if (sortConfig.key === 'appliedDate') return app.createdAt || app.appliedDate;
    if (sortConfig.key === 'status') return app.status;
    return '';
  });
  const toggleSort = (key) => setSortConfig((current) => ({
    key,
    direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
  }));

  const applicationPersonal = selectedApplication?.personal || selectedApplication || {};
  const applicationValue = (...keys) => {
    for (const key of keys) {
      const value = applicationPersonal?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
    return '-';
  };

  const applicationArray = (...keys) => {
    for (const key of keys) {
      if (Array.isArray(selectedApplication?.[key])) {
        return selectedApplication[key];
      }
    }
    return [];
  };

  const academics = applicationArray('academics', 'education');
  const skills = applicationArray('skills');
  const softwares = applicationArray('softwares', 'softwareTools');
  const languages = applicationArray('languages');
  const references = applicationArray('references');

  const statusOptions = [
    {
      value: 'all', label: 'All Applications',
    },
    {
      value: 'pending', label: 'Pending',
    },
    {
      value: 'shortlisted', label: 'Shortlisted',
    },
    {
      value: 'selected', label: 'Selected',
    },
    {
      value: 'rejected', label: 'Rejected',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex gap-3">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value) }
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} > {option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500"> Total Applications </p>
            <p className="text-2xl font-bold text-gray-900"> {applications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500"> Pending </p>
            <p className="text-2xl font-bold text-yellow-600">
              {
                applications.filter( (a) => a.status?.toLowerCase() === 'pending' ).length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500"> Shortlisted </p>
            <p className="text-2xl font-bold text-blue-600">
              { applications.filter( (a) => normalizeStatus(a.status) === 'shortlisted' ).length }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500"> Selected </p>
            <p className="text-2xl font-bold text-green-600">
              { applications.filter( (a) => normalizeStatus(a.status) === 'selected' ).length }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500"> Rejected </p>
            <p className="text-2xl font-bold text-red-600">
              { applications.filter( (a) => normalizeStatus(a.status) === 'rejected' ).length }
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="erp-list-table min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Candidate Name" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Phone" sortKey="phone" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Applied Position" sortKey="position" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio Link</th>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Applied Date" sortKey="appliedDate" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-left align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider"><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={toggleSort} /></th>
                  <th className="px-4 py-3 text-center align-middle whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500" >
                      <div className="flex justify-center items-center"> <RefreshCcw />  Loading applications... </div>
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500" >No applications found.</td>
                  </tr>
                ) : (
                  sortedApplications.map(
                    (app, index) => {
                      const candidateId = resolveCandidateId(app);

                      return (
                      <tr key={ candidateId || index } className="hover:bg-gray-50 transition-colors" >
                        <td className="px-4 py-3 text-sm text-gray-500"> {index + 1} </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900"> 
                          { app.personal ?.fullName || app.fullName || '-' }
                          <div className="text-xs text-gray-500">
                            { app.personal ?.email || app.email || '-' } 
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700"> { app.personal ?.phoneNumber || app.phoneNumber || '-' } </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">
                              {app.opening?.jobTitle || '-'}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">
                              Skills:{' '} {app.skills?.length > 0 ? app.skills.map((skill) => skill.skillName).join(', ') : '-'}
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          { app.portfolioLink ? (
                            <a href={app.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" > View Portfolio </a> ) : ( '-') 
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate( app.createdAt || app.appliedDate)} </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge( app.status )}`} >
                            {app.status || 'Pending'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => viewApplication(candidateId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                              title="View application"
                              aria-label="View application"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openResume(app)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                              title="View Resume"
                              aria-label="View resume"
                            >
                              <FileUser size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(candidateId, 'Shortlisted')}
                              disabled={updating || ['shortlisted', 'rejected', 'selected'].includes(normalizeStatus(app.status))}
                              title="Shortlist"
                              aria-label="Shortlist"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                            >
                              <Check size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(candidateId, 'Rejected')}
                              disabled={updating || ['rejected', 'selected'].includes(normalizeStatus(app.status))}
                              title="Reject"
                              aria-label="Reject"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                            >
                              <X size={15} />
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteApplication(candidateId, app.personal?.fullName || app.fullName)}
                                disabled={deletingId === candidateId}
                                title="Delete"
                                aria-label="Delete application"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
              <span> Showing {filteredApplications.length} {' '} of {applications.length} {' '} applications </span>
            </div>
          </div>
        </div>
      </div>

      {showModal &&selectedApplication && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={() => !updating && setShowModal(false) } />
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800"> Application Details</h2>
                      <button title="Close" aria-label="Close" onClick={() => setShowModal(false) } className="text-gray-400 hover:text-gray-600">
                        <X size={16}/>
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">PERSONAL INFORMATION</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-700">JOB POSITION (DESIGNATION)</p>
                          <p className="text-sm text-gray-500">{getJobTitle(selectedApplication)}</p>
                        </div> 
                        <div>
                          <p className="text-sm text-gray-700">FULL NAME</p>
                          <p className="text-sm text-gray-500">{applicationValue('fullName')}</p>
                        </div>  
                        <div>
                          <p className="text-sm text-gray-700">EMAIL</p>
                          <p className="text-sm text-gray-500">{applicationValue('email')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">PHONE NUMBER</p>
                          <p className="text-sm text-gray-500">{applicationValue('phoneNumber', 'phone')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">DATE OF BIRTH</p>
                          <p className="text-sm text-gray-500">{applicationValue('DOB', 'dob')}</p>
                        </div> 
                        <div>
                          <p className="text-sm text-gray-700">ADDRESS</p>
                          <p className="text-sm text-gray-500">{applicationValue('address', 'currentAddress')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">CITY</p>
                          <p className="text-sm text-gray-500">{applicationValue('city', 'currentCity')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">STATE</p>
                          <p className="text-sm text-gray-500">{applicationValue('state', 'currentState')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">PIN CODE</p>
                          <p className="text-sm text-gray-500">{applicationValue('pinCode', 'pincode', 'currentPincode')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">MARITAL STATUS</p>
                          <p className="text-sm text-gray-500">{applicationValue('maritalStatus', 'maritualStatus')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">GENDER</p>
                          <p className="text-sm text-gray-500">{applicationValue('gender')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">PORTFOLIO LINK</p>
                            <a href={applicationValue('portfolioLink') === '-' ? '#' : applicationValue('portfolioLink')} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 break-all" > 
                              {applicationValue('portfolioLink')}
                            </a>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">RESUME</p>
                          <p className="text-sm text-gray-500">
                            {applicationValue('resumeOriginalName', 'resumeName', 'resume') === '-' ? 'Not uploaded' : applicationValue('resumeOriginalName', 'resumeName', 'resume')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">STATUS</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge( selectedApplication.status )}`} > { selectedApplication.status || 'Pending' }
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">APPLIED DATE</p>
                          <p className="text-gray-500 text-sm">{formatDate(selectedApplication.createdAt || selectedApplication.appliedDate)}</p>
                        </div>
                      </div>
                    </div>

                    {academics.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">PROFESSIONAL &amp; ACADEMIC</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {academics.map(
                            (edu, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-700 text-sm">{edu.degree || edu.qualification || '-'}</p>
                                <p className="text-sm text-gray-600">{edu.university || edu.institution || '-'}</p>
                                <p className="text-sm text-gray-500">Year: {edu.graduationYear || edu.year || '-'} | Grade: {edu.grade || edu.percentage || '-'}</p>
                                {edu.city && <p className="text-sm text-gray-500">City: {edu.city}</p>}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {selectedApplication.experiences && selectedApplication.experiences.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">WORK EXPERIENCE</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedApplication.experiences.map((exp, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3" >
                              <p className="text-black-500 text-sm"> {exp.companyName} </p>
                              <p className="text-sm text-gray-600"> {exp.role} </p>
                              <p className="text-sm text-gray-500"> {exp.startDate} | {exp.endDate || 'Present'} </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {skills.length > 0 && (
                      <div className="mb-6 ">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          SKILLS &amp; TRAINING
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {skills.map((skill, idx) => (
                            <div
                              key={idx}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <p className="text-sm text-gray-800">
                                <span className="font-semibold">Skill Name:</span>{" "}
                                {skill.skillName}
                              </p>

                              <p className="text-sm text-gray-800">
                                <span className="font-semibold">Skill Level:</span>{" "}
                                {skill.skillLevel}
                              </p>

                              <p className="text-sm text-gray-800">
                                <span className="font-semibold">Provider:</span>{" "}
                                {skill.provider}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {softwares.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">SOFTWARE &amp; TOOLS PROFICIENCY</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {softwares.map((tool, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-800">{tool.tools || tool.name || '-'}</p>
                              <p className="text-sm text-gray-500">Proficiency: {tool.levels || tool.proficiency || '-'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {languages.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">LANGUAGE PROFICIENCY</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {languages.map((language, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-800">{language.language || '-'}</p>
                              <p className="text-sm text-gray-500">Speak: {language.Speak || language.speak || '-'}</p>
                              <p className="text-sm text-gray-500">Read: {language.Read || language.read || '-'}</p>
                              <p className="text-sm text-gray-500">Write: {language.Write || language.write || '-'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {references.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">REFERENCE</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {references.map((reference, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-800">{reference.referenceName || reference.name || '-'}</p>
                              <p className="text-sm text-gray-500">{reference.referenceEmail || reference.email || '-'}</p>
                              <p className="text-sm text-gray-500">{reference.referencePhone || reference.phone || '-'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      {resolveResumeUrl(selectedApplication) ? (
                        <button
                          onClick={() => openResume(selectedApplication)}
                          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
                        >
                          View Resume
                        </button>
                      ) : (
                        <span className="px-4 py-2 text-sm text-gray-500">No resume uploaded</span>
                      )}
                      <button onClick={ () => setShowModal(false) } className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">  Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

      {showResumeModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowResumeModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Resume Preview</h2>
                <div className="flex items-center gap-3">
                  <a
                    href={resumeUrlToView}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Open in New Tab
                  </a>
                  <button
                    title="Close"
                    onClick={() => {
                      if (resumeUrlToView?.startsWith('blob:')) {
                        URL.revokeObjectURL(resumeUrlToView);
                      }
                      setShowResumeModal(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-0 overflow-hidden relative">
                <iframe
                  src={resumeUrlToView}
                  title="Resume"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applied;