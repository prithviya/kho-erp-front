import React, { useState } from 'react';

const Employee = () => {
  const [employees, setEmployees] = useState([
    {
      id: 'KHO-015',
      name: 'Anthony Franklin',
      email: 'gowtham134@gmail.com',
      department: 'Content',
      group: 'Accusamus expedita i',
      head: 'Prabu NS',
      dob: '25 Feb 2022',
      doj: '04 Sep 2015',
      status: 'Active',
      userAccount: false,
    },
    {
      id: 'KHO-016',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      department: 'Designer',
      group: 'Creative Team',
      head: 'Michael Chen',
      dob: '15 Mar 1990',
      doj: '12 Jan 2020',
      status: 'Active',
      userAccount: true,
    },
    {
      id: 'KHO-017',
      name: 'David Williams',
      email: 'david.w@company.com',
      department: 'Development',
      group: 'Tech Squad',
      head: 'Robert Kim',
      dob: '08 Jul 1988',
      doj: '20 Mar 2019',
      status: 'Onboarding',
      userAccount: false,
    },
    {
      id: 'KHO-018',
      name: 'Emily Davis',
      email: 'emily.d@company.com',
      department: 'Operations',
      group: 'Operations Team',
      head: 'Lisa Wong',
      dob: '12 Nov 1992',
      doj: '05 Jun 2021',
      status: 'Active',
      userAccount: true,
    },
    {
      id: 'KHO-019',
      name: 'Michael Brown',
      email: 'michael.b@company.com',
      department: 'Marketing',
      group: 'Marketing Team',
      head: 'Jennifer Lee',
      dob: '30 Jan 1985',
      doj: '18 Aug 2018',
      status: 'Active',
      userAccount: true,
    },
    {
      id: 'KHO-020',
      name: 'Jessica Wilson',
      email: 'jessica.w@company.com',
      department: 'HR',
      group: 'HR Team',
      head: 'Thomas Moore',
      dob: '22 Sep 1991',
      doj: '10 Nov 2020',
      status: 'Onboarding',
      userAccount: false,
    },
  ]);

  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    group: '',
    head: '',
    dob: '',
    doj: '',
    status: 'Active',
    userAccount: false,
  });

  const departments = ['Content', 'Designer', 'Development', 'Operations', 'Marketing', 'HR'];

  const getStatusBadge = (status) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEdit = (employee, index) => {
    setSelectedEmployee(employee);
    setEditIndex(index);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      group: employee.group,
      head: employee.head,
      dob: employee.dob,
      doj: employee.doj,
      status: employee.status,
      userAccount: employee.userAccount,
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedEmployees = [...employees];
    updatedEmployees[editIndex] = {
      id: employees[editIndex].id,
      ...formData,
    };
    setEmployees(updatedEmployees);
    setShowEditModal(false);
    setSelectedEmployee(null);
    setEditIndex(null);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesDepartment = selectedDepartment === 'All Departments' || emp.department === selectedDepartment;
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500">List of all active and onboarding employees.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="All Departments">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              />
            </div>
            <div className="flex-1 w-full sm:w-auto flex items-end">
              <button
                onClick={() => {
                  setSelectedDepartment('All Departments');
                  setSearchTerm('');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Hierarchy</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{employee.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {employee.userAccount ? (
                              <span className="text-green-600">✓ User account linked</span>
                            ) : (
                              <span className="text-gray-400">No user account linked</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-700">{employee.department}</p>
                          <p className="text-xs text-gray-500">Group: {employee.group}</p>
                          <p className="text-xs text-gray-500">Head: {employee.head}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-700">DOB: {employee.dob}</p>
                          <p className="text-sm text-gray-700">DOJ: {employee.doj}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadge(employee.status)}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(employee)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(employee, index)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No employees found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Stats */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
              <span>Total Employees: {filteredEmployees.length}</span>
              <div className="flex flex-wrap gap-4">
                <span>Active: <span className="font-medium text-green-600">{filteredEmployees.filter(e => e.status === 'Active').length}</span></span>
                <span>Onboarding: <span className="font-medium text-yellow-600">{filteredEmployees.filter(e => e.status === 'Onboarding').length}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowViewModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Employee Details</h2>
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
                    <p className="text-gray-900 font-medium">{selectedEmployee.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">{getStatusBadge(selectedEmployee.status)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="text-gray-900">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Group</label>
                    <p className="text-gray-900">{selectedEmployee.group}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reporting Head</label>
                    <p className="text-gray-900">{selectedEmployee.head}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">{selectedEmployee.dob}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Joining</label>
                    <p className="text-gray-900">{selectedEmployee.doj}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Account</label>
                    <p className="text-gray-900">
                      {selectedEmployee.userAccount ? (
                        <span className="text-green-600">✓ Linked</span>
                      ) : (
                        <span className="text-gray-400">Not linked</span>
                      )}
                    </p>
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
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              setShowEditModal(false);
              setSelectedEmployee(null);
              setEditIndex(null);
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEmployee(null);
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group
                      </label>
                      <input
                        type="text"
                        name="group"
                        value={formData.group}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reporting Head
                      </label>
                      <input
                        type="text"
                        name="head"
                        value={formData.head}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Onboarding">Onboarding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="dd mmm yyyy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Joining
                      </label>
                      <input
                        type="text"
                        name="doj"
                        value={formData.doj}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        placeholder="dd mmm yyyy"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="userAccount"
                          checked={formData.userAccount}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-400"
                        />
                        <span className="ml-2 text-sm text-gray-700">User account linked</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedEmployee(null);
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
                      Update Employee
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

export default Employee;