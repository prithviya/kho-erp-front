import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { request } from '../../services/apiClient';
import employeeService from '../../services/employee.service';
import { canDeleteRecords, hasAnyRole } from '../../utils/auth';
import { parseArrayFromTextarea } from '../../utils/employeeArrayText';
import {CheckCircle2, X, Eye, Edit, Trash } from 'lucide-react'

const API_ROOT_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const getEmployeeDocumentDownloadUrl = (doc) => {
  const rawUrl = String(doc?.fileUrl || doc?.file_url || '').trim();
  const storedName = String(doc?.storedName || '').trim();

  if (!rawUrl && storedName) {
    return `${API_ROOT_URL}/uploads/onboarding-documents/${storedName}`;
  }

  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/')) return `${API_ROOT_URL}${rawUrl}`;

  return `${API_ROOT_URL}/${rawUrl}`;
};

const normalizeJsonArray = (value) => {
  let parsed = value;

  for (let attempt = 0; attempt < 2 && typeof parsed === 'string'; attempt += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  return Array.isArray(parsed) ? parsed : [];
};

const readableKey = (key) => String(key)
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/^./, (character) => character.toUpperCase());

const formatArrayForTextarea = (value) => normalizeJsonArray(value).map((item) => {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return Object.entries(item)
      .map(([key, entryValue]) => `${readableKey(key)}: ${String(entryValue ?? '')}`)
      .join(' | ');
  }

  return String(item ?? '');
}).join('\n');

const formatArrayForView = (value) => {
  const items = normalizeJsonArray(value);
  if (!items.length) return '-';
  const hiddenKeys = new Set(['id', 'candidateid', 'cifid', 'createdat', 'updatedat', 'deletedat']);

  return items.map((item, index) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const visibleEntries = Object.entries(item)
        .filter(([key]) => !hiddenKeys.has(key.toLowerCase()));
      if (!visibleEntries.length) return null;
      return (
        <div key={index} className="rounded-md bg-gray-50 px-3 py-2">
          {visibleEntries.map(([key, entryValue]) => (
            <p key={key} className="text-sm text-gray-700">
              <span className="font-medium text-gray-500">{readableKey(key)}:</span>{' '}
              {typeof entryValue === 'object' && entryValue !== null
                ? formatArrayForView([entryValue])
                : String(entryValue ?? '-')}
            </p>
          ))}
        </div>
      );
    }

    return <p key={index} className="text-sm text-gray-700">{String(item)}</p>;
  });
};

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [claimedEmployeeCodes, setClaimedEmployeeCodes] = useState([]);
  const canDelete = canDeleteRecords('employee');
  const canEdit = hasAnyRole(['MANAGER', 'HR', 'SUPER_ADMIN']);

  const [selectedDepartment, setSelectedDepartment] = useState('All Positions');
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
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
    employeeId: '',
    portfolioLink: '',
    pinCode: '',
    gender: '',
    consent: false,
    education: '[]',
    workExperience: '[]',
    skills: '[]',
    softwareTools: '[]',
    languages: '[]',
    references: '[]',
    joiningDate: '',
    salary: '',
    designation: '',
    departmentId: '',
    resume: null,
  });

  const departments = useMemo(() => {
    const values = employees.map((employee) => employee.department).filter(Boolean);
    return [...new Set(values)].sort();
  }, [employees]);

  const formatDisplayDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatSalary = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '-';

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const mapEmployee = (employee, onboardingData = {}) => ({
    id: employee.id,
    employeeId: employee.employeeCode,
    name: employee.fullName,
    email: employee.email,
    department: employee.jobPosition,
    group: employee.city || '-',
    head: employee.phone || '-',
    dob: formatDisplayDate(employee.dateOfBirth),
    doj: formatDisplayDate(employee.createdAt),
    status: employee.status || 'Onboarding',
    userAccount: false,
    phone: employee.phone,
    city: employee.city,
    salary: formatSalary(Number(onboardingData.currentSalary) * 12),
    salaryValue: onboardingData.currentSalary || '',
    joiningDate: onboardingData.dateOfJoining || '',
    designation: onboardingData.designation || '',
    departmentId: onboardingData.department || '',
    original: employee,
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.list();
      const employeeRecords = Array.isArray(response?.data) ? response.data : [];
      const employeesWithSalary = await Promise.all(employeeRecords.map(async (employee) => {
        const employeeCode = String(employee?.employeeCode || employee?.employeeId || '').trim();
        let onboardingData = {};

        if (employeeCode) {
          try {
            const onboardingResponse = await request(
              `/onboardings/record/employee_code/${encodeURIComponent(employeeCode)}`
            );
            onboardingData = onboardingResponse?.data?.formData || {};
          } catch {
            // The employee may not yet have an onboarding_info record.
          }
        }

        return mapEmployee(employee, onboardingData);
      }));
      setEmployees(employeesWithSalary);
    } catch (error) {
      toast.error(error.message || 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimedEmployeeCodes = async () => {
    try {
      // Same merged source (Employee + in-progress OnboardingInfo drafts) the
      // Onboarding form uses, so an ID flagged as taken there is flagged here too.
      const response = await request('/onboardings/employee-codes', { method: 'GET' });
      const list = Array.isArray(response?.data) ? response.data : [];
      setClaimedEmployeeCodes(list);
    } catch (error) {
      console.error('Error fetching claimed employee codes:', error);
    }
  };

  useEffect(() => {
    loadEmployees();
    fetchClaimedEmployeeCodes();
  }, []);

  const normalizedEditEmployeeId = String(formData.employeeId || '').trim().toUpperCase().replace(/-/g, '');
  const isEditEmployeeIdTaken = Boolean(normalizedEditEmployeeId) && claimedEmployeeCodes.some((entry) => {
    const entryCode = String(entry?.employeeCode || '').trim().toUpperCase().replace(/-/g, '');
    if (entryCode !== normalizedEditEmployeeId) return false;

    const currentEmployee = selectedEmployee?.original;
    const sameEmployeeRow = entry?.employeeRowId != null && currentEmployee?.id != null
      && Number(entry.employeeRowId) === Number(currentEmployee.id);
    const sameEmail = Boolean(currentEmployee?.email) && entry?.email
      && String(entry.email).trim().toLowerCase() === String(currentEmployee.email).trim().toLowerCase();

    return !(sameEmployeeRow || sameEmail);
  });

  const handleDelete = async (employee) => {
    if (!canDelete || deletingId) return;
    if (!window.confirm(`Delete employee "${employee.name || employee.fullName || employee.email}"? This action cannot be undone.`)) return;
    try {
      setDeletingId(employee.id);
      await employeeService.remove(employee.id);
      toast.success('Employee deleted successfully.');
      await loadEmployees();
    } catch (error) {
      toast.error(error.message || 'Unable to delete employee.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'Active'
      ? 'Active' : 'Inactive';
  };

  const fetchEmployeeDocuments = async (employee) => {
    const employeeCode = String(
      employee?.employeeId ||
      employee?.original?.employeeCode ||
      employee?.original?.employeeId ||
      ''
    ).trim();

    if (!employeeCode) {
      setEmployeeDocuments([]);
      return;
    }

    try {
      setLoadingDocuments(true);
      const response = await request(`/onboardings/record/employee_code/${encodeURIComponent(employeeCode)}`);
      const record = response?.data || null;
      const docs = Array.isArray(record?.formData?.documents)
        ? record.formData.documents
        : [];
      setEmployeeDocuments(docs);
    } catch (error) {
      setEmployeeDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleView = async (employee) => {
    setSelectedEmployee(employee);
    setEmployeeDocuments([]);
    setShowViewModal(true);
    await fetchEmployeeDocuments(employee);
  };

  const handleEdit = (employee, index) => {
    if (!canEdit) return;
    const original = employee.original || {};
    setSelectedEmployee(employee);
    setEditIndex(index);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      group: employee.group,
      head: employee.phone || '',
      dob: original.dateOfBirth || '',
      doj: employee.doj,
      status: employee.status,
      userAccount: employee.userAccount,
      employeeId: employee.employeeId,
      portfolioLink: original.portfolioLink || '',
      pinCode: original.pinCode || '',
      gender: original.gender || '',
      consent: Boolean(original.consent),
      education: formatArrayForTextarea(original.education),
      workExperience: formatArrayForTextarea(original.workExperience),
      skills: formatArrayForTextarea(original.skills),
      softwareTools: formatArrayForTextarea(original.softwareTools),
      languages: formatArrayForTextarea(original.languages),
      references: formatArrayForTextarea(original.references),
      joiningDate: employee.joiningDate || '',
      salary: employee.salaryValue || '',
      designation: employee.designation || '',
      departmentId: employee.departmentId || '',
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? e.target.files?.[0] || null : value
    }));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (isEditEmployeeIdTaken) {
      toast.error('This Employee ID is already assigned to an existing employee.');
      return;
    }
    const updateRecord = async () => {
      try {
        const employee = employees[editIndex]?.original;
        if (!employee) return;
        const arrayFields = ['education', 'workExperience', 'skills', 'softwareTools', 'languages', 'references'];
        const parsedArrays = Object.fromEntries(arrayFields.map((field) => [
          field,
          parseArrayFromTextarea(formData[field], field),
        ]));
        await employeeService.update(employee.id, {
          ...employee,
          employeeCode: formData.employeeId,
          fullName: formData.name,
          email: formData.email,
          jobPosition: formData.department,
          city: formData.group,
          dateOfBirth: formData.dob,
          phone: formData.head,
          pinCode: formData.pinCode,
          gender: formData.gender,
          portfolioLink: formData.portfolioLink,
          ...parsedArrays,
          consent: formData.consent,
          status: formData.status,
          joiningDate: formData.joiningDate,
          salary: formData.salary,
          designation: formData.designation,
          departmentId: formData.departmentId,
          resume: formData.resume,
        });
        toast.success('Employee updated successfully.');
        await loadEmployees();
        await fetchClaimedEmployeeCodes();
        setShowEditModal(false);
        setSelectedEmployee(null);
        setEditIndex(null);
      } catch (error) {
        toast.error(error.message || 'Unable to update employee.');
      }
    };

    updateRecord();
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesDepartment = selectedDepartment === 'All Positions' || emp.department === selectedDepartment;
    const term = searchTerm.toLowerCase();
    const matchesSearch = (emp.name || '').toLowerCase().includes(term) ||
      (emp.email || '').toLowerCase().includes(term) ||
      String(emp.employeeId || '').toLowerCase().includes(term);
    return matchesDepartment && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500">Profiles captured from the employee CIF form.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="All Positions">All Positions</option>
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
                  setSelectedDepartment('All Positions');
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position & Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{employee.employeeId}</p>
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
                          <p className="text-xs text-gray-500">City: {employee.group}</p>
                          <p className="text-xs text-gray-500">Phone: {employee.phone || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-700">DOB: {employee.dob}</p>
                          <p className="text-sm text-gray-700">Submitted: {employee.doj}</p>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <p className="text-sm font-medium text-gray-900">
                          {employee.salary}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={getStatusBadge(employee.status)}>
                            {employee.status}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700"
                            title="Already onboarded"
                          >
                            <CheckCircle2 size={13} />
                            Onboarded
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            title="View employee"
                            onClick={() => handleView(employee)}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && <button
                            title="Edit employee"
                            onClick={() => handleEdit(employee, index)}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            <Edit size={16} />
                          </button>}
                          {canDelete && (
                            <button
                              title="Delete employee"
                              onClick={() => handleDelete(employee)}
                              disabled={deletingId === employee.id}
                              className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <Trash size={16} />                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      {loading ? 'Loading employees...' : 'No employees found matching your filters'}
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
                    title="Close"
                    onClick={() => {
                      setShowViewModal(false);
                      setEmployeeDocuments([]);
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.employeeId}</p>
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
                    <label className="text-sm font-medium text-gray-500">Job Position</label>
                    <p className="text-gray-900">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">City</label>
                    <p className="text-gray-900">{selectedEmployee.group}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedEmployee.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">{selectedEmployee.dob}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted On</label>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 mt-6 border-t border-gray-200">
                  {[
                    ['education', 'Education'],
                    ['workExperience', 'Work Experience'],
                    ['softwareTools', 'Software Tools'],
                    ['references', 'References'],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label className="text-sm font-medium text-gray-500">{label}</label>
                      <div className="mt-1 space-y-2">{formatArrayForView(selectedEmployee.original?.[field])}</div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Documents</h3>
                  {loadingDocuments ? (
                    <p className="text-sm text-gray-500">Loading documents...</p>
                  ) : employeeDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {employeeDocuments.map((doc, index) => {
                        const documentName = doc?.fileName || doc?.file_name || `Document ${index + 1}`;
                        const documentType = doc?.documentType || doc?.type || 'Document';
                        const fileUrl = getEmployeeDocumentDownloadUrl(doc);

                        return (
                          <div key={`${documentType}-${documentName}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{documentType}</p>
                              <p className="text-xs text-gray-500">{documentName}</p>
                            </div>
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                download={documentName}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400">No file</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No onboarding documents available for this employee.</p>
                  )}
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setEmployeeDocuments([]);
                    }}
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
                    title="Close"
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
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${isEditEmployeeIdTaken ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'}`}
                      />
                      {isEditEmployeeIdTaken && (
                        <p className="mt-1 text-xs text-red-600">This Employee ID is already assigned to an existing employee.</p>
                      )}
                    </div>
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
                        Job Position <span className="text-red-500">*</span>
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
                        City
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
                        Phone
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
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department ID</label>
                      <input type="number" min="1" name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                      <input type="number" min="0" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                    </div>
                    {[
                      ['pinCode', 'PIN Code'],
                      ['gender', 'Gender'],
                      ['portfolioLink', 'Portfolio Link'],
                    ].map(([name, label]) => (
                      <div key={name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input type="text" name={name} value={formData[name]} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                      </div>
                    ))}
                    {[
                      ['education', 'Education'],
                      ['workExperience', 'Work Experience'],
                      ['skills', 'Skills'],
                      ['softwareTools', 'Software Tools'],
                      ['languages', 'Languages'],
                      ['references', 'References'],
                    ].map(([name, label]) => (
                      <div key={name} className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <textarea name={name} value={formData[name]} onChange={handleInputChange} rows={3} placeholder={`Enter ${label.toLowerCase()}, one item per line`} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm" />
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                      <input type="file" name="resume" onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
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
                      <label className="flex items-center mt-3">
                        <input
                          type="checkbox"
                          name="consent"
                          checked={formData.consent}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-400"
                        />
                        <span className="ml-2 text-sm text-gray-700">Employee consent recorded</span>
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
