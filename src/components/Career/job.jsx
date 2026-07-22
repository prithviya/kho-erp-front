import React, { useState } from 'react';

const JobOpenings = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  
  const [jobOpenings, setJobOpenings] = useState([
    {
      code: 'CO002',
      jobTitle: 'Content Writer',
      department: 'Content',
      requiredSkills: 'Creative Writing Skill',
      minExp: '3',
      openings: 1,
      status: 'Inactive',
      applyLink: '-',
    },
    {
      code: 'CO001',
      jobTitle: 'Senior Content Writer',
      department: 'Content',
      requiredSkills: 'creative writer',
      minExp: '3',
      openings: 2,
      status: 'Inactive',
      applyLink: '-',
    },
    {
      code: 'OP002',
      jobTitle: 'Operations Executive',
      department: 'Operations',
      requiredSkills: 'MBA',
      minExp: '3 yrs',
      openings: 10,
      status: 'Inactive',
      applyLink: '-',
    },
    {
      code: 'OP001',
      jobTitle: 'Managing Director',
      department: 'Operations',
      requiredSkills: 'MBA',
      minExp: '10',
      openings: 10,
      status: 'Active',
      applyLink: 'http://localhost:808...',
    },
    {
      code: 'ME001',
      jobTitle: 'Senior Media Executive',
      department: 'Media',
      requiredSkills: 'video editor photo shoot premiere pro',
      minExp: '3 yrs',
      openings: 1,
      status: 'Active',
      applyLink: 'http://localhost:808...',
    },
    {
      code: 'DE002',
      jobTitle: 'Senior Graphic designer',
      department: 'Designer',
      requiredSkills: 'Photoshop Illustrator',
      minExp: '5',
      openings: 1,
      status: 'Active',
      applyLink: 'http://localhost:808...',
    },
  ]);

  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    openingCount: '',
    dm: '1',
    openingCode: '',
    minExp: '',
    requiredSkills: '',
    jobDetails: '',
    status: 'Active',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newJob = {
      code: formData.openingCode || `JOB${String(jobOpenings.length + 1).padStart(3, '0')}`,
      jobTitle: formData.jobTitle,
      department: formData.department,
      requiredSkills: formData.requiredSkills,
      minExp: formData.minExp,
      openings: parseInt(formData.openingCount) || 1,
      status: formData.status,
      applyLink: '-',
    };
    setJobOpenings([...jobOpenings, newJob]);
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (index) => {
    const job = jobOpenings[index];
    setFormData({
      jobTitle: job.jobTitle,
      department: job.department,
      openingCount: job.openings.toString(),
      dm: '1',
      openingCode: job.code,
      minExp: job.minExp,
      requiredSkills: job.requiredSkills,
      jobDetails: '',
      status: job.status,
    });
    setEditIndex(index);
    setShowEditModal(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedJob = {
      code: formData.openingCode,
      jobTitle: formData.jobTitle,
      department: formData.department,
      requiredSkills: formData.requiredSkills,
      minExp: formData.minExp,
      openings: parseInt(formData.openingCount) || 1,
      status: formData.status,
      applyLink: jobOpenings[editIndex].applyLink || '-',
    };
    const updated = [...jobOpenings];
    updated[editIndex] = updatedJob;
    setJobOpenings(updated);
    resetForm();
    setShowEditModal(false);
    setEditIndex(null);
  };

  const resetForm = () => {
    setFormData({
      jobTitle: '',
      department: '',
      openingCount: '',
      dm: '1',
      openingCode: '',
      minExp: '',
      requiredSkills: '',
      jobDetails: '',
      status: 'Active',
    });
  };

  const toggleStatus = (index) => {
    const updated = [...jobOpenings];
    updated[index].status = updated[index].status === 'Active' ? 'Inactive' : 'Active';
    setJobOpenings(updated);
  };

  const deleteJob = (index) => {
    if (window.confirm('Are you sure you want to delete this job opening?')) {
      setJobOpenings(jobOpenings.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Current Openings</h1>
            <p className="text-sm text-gray-500">Manage job postings and requirements</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Opening
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CODE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JOB TITLE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DEPARTMENT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REQUIRED SKILLS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MIN. EXP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPENINGS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APPLY LINK</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobOpenings.map((job, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{job.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{job.jobTitle}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{job.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={job.requiredSkills}>
                      {job.requiredSkills}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{job.minExp}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{job.openings}</td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(job.status)}>{job.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-600 hover:text-blue-800">
                      {job.applyLink !== '-' ? (
                        <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Apply Link
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(index)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            job.status === 'Active'
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {job.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteJob(index)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
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

          {/* Table Footer Stats */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
              <span>Total Openings: {jobOpenings.length}</span>
              <div className="flex gap-4">
                <span>Active: <span className="font-medium text-green-600">{jobOpenings.filter(j => j.status === 'Active').length}</span></span>
                <span>Inactive: <span className="font-medium text-gray-600">{jobOpenings.filter(j => j.status === 'Inactive').length}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Opening Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Add New Opening</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        <option value="Content">Content</option>
                        <option value="Operations">Operations</option>
                        <option value="Media">Media</option>
                        <option value="Designer">Designer</option>
                        <option value="Development">Development</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Count <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="openingCount"
                        value={formData.openingCount}
                        onChange={handleChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of openings"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DM
                      </label>
                      <input
                        type="text"
                        name="dm"
                        value={formData.dm}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Department Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Code
                      </label>
                      <input
                        type="text"
                        name="openingCode"
                        value={formData.openingCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                        placeholder="Auto generated by department"
                        disabled
                      />
                      <p className="text-xs text-gray-400 mt-1">Auto generated by department</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min. Experience <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="minExp"
                        value={formData.minExp}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2 Years"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Skills <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="requiredSkills"
                        value={formData.requiredSkills}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., PHP, React, MySQL"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Details / Description
                      </label>
                      <textarea
                        name="jobDetails"
                        value={formData.jobDetails}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detailed job description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Save Opening
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              setShowEditModal(false);
              resetForm();
              setEditIndex(null);
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Edit Opening</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        <option value="Content">Content</option>
                        <option value="Operations">Operations</option>
                        <option value="Media">Media</option>
                        <option value="Designer">Designer</option>
                        <option value="Development">Development</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Count <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="openingCount"
                        value={formData.openingCount}
                        onChange={handleChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of openings"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DM
                      </label>
                      <input
                        type="text"
                        name="dm"
                        value={formData.dm}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Department Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Code
                      </label>
                      <input
                        type="text"
                        name="openingCode"
                        value={formData.openingCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                        disabled
                      />
                      <p className="text-xs text-gray-400 mt-1">Auto generated by department</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min. Experience <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="minExp"
                        value={formData.minExp}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2 Years"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Skills <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="requiredSkills"
                        value={formData.requiredSkills}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., PHP, React, MySQL"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Details / Description
                      </label>
                      <textarea
                        name="jobDetails"
                        value={formData.jobDetails}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detailed job description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                        setEditIndex(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Update Opening
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

export default JobOpenings;