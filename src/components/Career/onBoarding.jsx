import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { request } from '../../services/apiClient';

const EmployeeOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  const [awaitingEmployees, setAwaitingEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAwaitingEmployees();
  }, []);

  const fetchAwaitingEmployees = async () => {
    try {
      setLoading(true);
      const response = await request('/cif-submissions', { method: 'GET' });
      if (response?.success) {
        const selected = (response.data || []).filter(c => c.status === 'Selected');
        
        const mappedEmployees = selected.map(c => ({
          id: c.cifid,
          name: c.fullName || 'N/A',
          designation: c.opening?.jobTitle || 'N/A',
          group: 'N/A',
          email: c.email || 'N/A',
          phone: c.phoneNumber || 'N/A',
          DOB: c.DOB || 'N/A',
          department: 'N/A',
          status: 'Awaiting Onboarding',
          rawCandidate: c
        }));
        
        setAwaitingEmployees(mappedEmployees);
      }
    } catch (error) {
      console.error('Error fetching selected candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    // Basic Details
    firstName: '',
    lastName: '',
    nickName: '',
    employeeId: 'KHO-015',
    officialEmail: '',
    personalEmail: 'gowtham134@gmail.com1',
    personalPhone: '',
    officePhone: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    dateOfJoining: '',
    
    // Employment Information
    employeeType: '',
    erpRole: '',
    sourceOfHire: '',
    department: '',
    permanent: '',
    manager: '',
    referral: '',
    designation: '',
    reportingHead: '',
    uanNumber: '',
    panNumber: '',
    currentSalary: '',
    systemAdmin: 'System Admin',
    superAdmin: 'Super_admin',
    
    // Address
    currentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
    permanentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
    
    // Experience
    experience: [{ company: '', designation: '', startDate: '', endDate: '', totalExp: '', reason: '' }],
    
    // Education
    education: [{ qualification: '', institution: '', board: '', year: '', percentage: '' }],
    
    // Icebreaker
    icebreaker: {
      favoriteCake: '',
      favoriteColor: '',
      favoriteSong: '',
      favoriteMovie: '',
      favoriteFood: '',
      favoriteActor: '',
      dreamVacation: '',
      weekendActivity: '',
      coffeeOrTea: '',
      favoriteSports: '',
    },
    
    // Health
    health: {
      anyTablets: '',
      healthIssues: '',
      bloodGroup: '',
      medicalAssistance: '',
      emergencyContact: '',
      emergencyName: '',
      emergencyNumber: '',
    },
    
    // Documents
    documents: [],
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
    },
    
    // Office Tour
    officeTour: {
      reception: false,
      workstation: false,
      meetingRoom: false,
      cafeteria: false,
      hrCabin: false,
    },
    
    // Induction
    induction: {
      companyIntro: false,
      hrPolicies: false,
      attendanceRules: false,
      leavePolicy: false,
      securityGuidelines: false,
      teamIntro: false,
    },
    
    // Kit
    kit: {
      laptop: false,
      mouse: false,
      keyboard: false,
      entryCard: false,
      headset: false,
      welcomeKit: false,
    },
  });

  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.candidateData) {
      const candidate = location.state.candidateData;
      const nameParts = candidate.fullName ? candidate.fullName.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        personalEmail: candidate.email || '',
        personalPhone: candidate.phoneNumber || '',
        designation: candidate.opening?.jobTitle || '',
      }));
      
      setSelectedEmployee({
        id: candidate.cifid,
        name: candidate.fullName,
        email: candidate.email,
        phone: candidate.phoneNumber
      });
      setShowOnboardingForm(true);
      
      // Clean up the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const steps = [
    { id: 1, name: 'Personal', progress: 32 },
    { id: 2, name: 'Health', progress: 48 },
    { id: 3, name: 'Document', progress: 48 },
    { id: 4, name: 'Office Tour', progress: 64 },
    { id: 5, name: 'Induction', progress: 80 },
    { id: 6, name: 'Kit', progress: 96 },
  ];

  const handleInputChange = (e, section, subSection) => {
    if (isViewMode) return;
    const { name, value, type, checked } = e.target;
    
    if (section) {
      if (subSection) {
        setFormData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [subSection]: {
              ...prev[section][subSection],
              [name]: type === 'checkbox' ? checked : value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [name]: type === 'checkbox' ? checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (section, index, field, value) => {
    if (isViewMode) return;
    const updated = [...formData[section]];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const addItem = (section, template) => {
    if (isViewMode) return;
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], template],
    }));
  };

  const removeItem = (section, index) => {
    if (isViewMode) return;
    if (formData[section].length <= 1) return;
    const updated = formData[section].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewMode(true);
    setShowOnboardingForm(true);
    setCurrentStep(1);
    // Populate form with employee data for viewing
    setFormData(prev => ({
      ...prev,
      firstName: employee.name.split(' ')[0] || '',
      lastName: employee.name.split(' ').slice(1).join(' ') || '',
      personalEmail: employee.email,
      personalPhone: employee.phone || '',
      dateOfBirth: employee.DOB || '',
      department: employee.department || '',
    }));
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewMode(false);
    setShowOnboardingForm(true);
    setCurrentStep(1);
    // Populate form with employee data for editing
    setFormData(prev => ({
      ...prev,
      firstName: employee.name.split(' ')[0] || '',
      lastName: employee.name.split(' ').slice(1).join(' ') || '',
      personalEmail: employee.email,
      personalPhone: employee.phone || '',
      dateOfBirth: employee.DOB || '',
      department: employee.department || '',
    }));
  };

  const handleAddEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewMode(false);
    setShowOnboardingForm(true);
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveOnboarding = async (status) => {
    if (!selectedEmployee?.id) {
      alert('Select an employee before saving onboarding details.');
      return false;
    }

    try {
      setLoading(true);
      const response = await request('/onboardings/record', {
        method: 'POST',
        body: JSON.stringify({
          cifid: selectedEmployee.id,
          formData,
          status,
        }),
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Unable to save onboarding details.');
      }

      alert(status === 'FINAL' ? 'Onboarding submitted successfully.' : 'Onboarding draft saved successfully.');
      return true;
    } catch (error) {
      console.error('Save onboarding error:', error);
      alert(error?.message || 'Unable to save onboarding details.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (await saveOnboarding('DRAFT')) {
      nextStep();
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return renderPersonalDetails();
      case 2:
        return renderHealthDetails();
      case 3:
        return renderDocumentBankDetails();
      case 4:
        return renderOfficeTour();
      case 5:
        return renderInduction();
      case 6:
        return renderKitAllocation();
      default:
        return null;
    }
  };

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      {/* Basic Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nick Name</label>
            <input
              type="text"
              name="nickName"
              value={formData.nickName}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter nick name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
            <input
              type="email"
              name="officialEmail"
              value={formData.officialEmail}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="official@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
            <input
              type="email"
              name="personalEmail"
              value={formData.personalEmail}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="personal@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Phone</label>
            <input
              type="tel"
              name="personalPhone"
              value={formData.personalPhone}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Office Phone</label>
            <input
              type="tel"
              name="officePhone"
              value={formData.officePhone}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter office phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
            <select
              name="employeeType"
              value={formData.employeeType}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Type</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Probation">Probation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ERP Role</label>
            <input
              type="text"
              name="erpRole"
              value={formData.erpRole}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter ERP role"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source of Hire</label>
            <select
              name="sourceOfHire"
              value={formData.sourceOfHire}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Source</option>
              <option value="Referral">Referral</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Naukri">Naukri</option>
              <option value="Company Website">Company Website</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select Department</option>
              <option value="Content">Content</option>
              <option value="Operations">Operations</option>
              <option value="Media">Media</option>
              <option value="Designer">Designer</option>
              <option value="Development">Development</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter designation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Head</label>
            <input
              type="text"
              name="reportingHead"
              value={formData.reportingHead}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter reporting head"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UAN Number</label>
            <input
              type="text"
              name="uanNumber"
              value={formData.uanNumber}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter UAN number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter PAN number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
            <input
              type="text"
              name="currentSalary"
              value={formData.currentSalary}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Enter current salary"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Current Address</h4>
            <div className="space-y-3">
              <input
                type="text"
                name="line1"
                value={formData.currentAddress.line1}
                onChange={(e) => handleInputChange(e, 'currentAddress')}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Address Line 1"
              />
              <input
                type="text"
                name="line2"
                value={formData.currentAddress.line2}
                onChange={(e) => handleInputChange(e, 'currentAddress')}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Address Line 2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="city"
                  value={formData.currentAddress.city}
                  onChange={(e) => handleInputChange(e, 'currentAddress')}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                  placeholder="City"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.currentAddress.state}
                  onChange={(e) => handleInputChange(e, 'currentAddress')}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                  placeholder="State"
                />
              </div>
              <input
                type="text"
                name="pincode"
                value={formData.currentAddress.pincode}
                onChange={(e) => handleInputChange(e, 'currentAddress')}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Pincode"
              />
            </div>
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Permanent Address</h4>
            <div className="space-y-3">
              <input
                type="text"
                name="line1"
                value={formData.permanentAddress.line1}
                onChange={(e) => handleInputChange(e, 'permanentAddress')}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Address Line 1"
              />
              <input
                type="text"
                name="line2"
                value={formData.permanentAddress.line2}
                onChange={(e) => handleInputChange(e, 'permanentAddress')}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Address Line 2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="city"
                  value={formData.permanentAddress.city}
                  onChange={(e) => handleInputChange(e, 'permanentAddress')}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                  placeholder="City"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.permanentAddress.state}
                  onChange={(e) => handleInputChange(e, 'permanentAddress')}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                  placeholder="State"
                />
              </div>
              <input
                type="text"
                name="pincode"
                value={formData.permanentAddress.pincode}
                onChange={(e) => handleInputChange(e, 'permanentAddress')}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Pincode"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Experience Details */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Experience Details</h3>
        {formData.experience.map((exp, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
            {index > 0 && !isViewMode && (
              <button
                type="button"
                onClick={() => removeItem('experience', index)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={exp.designation}
                onChange={(e) => handleArrayChange('experience', index, 'designation', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Designation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={exp.startDate}
                onChange={(e) => handleArrayChange('experience', index, 'startDate', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={exp.endDate}
                onChange={(e) => handleArrayChange('experience', index, 'endDate', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Experience</label>
              <input
                type="text"
                value={exp.totalExp}
                onChange={(e) => handleArrayChange('experience', index, 'totalExp', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="e.g., 2 years"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
              <input
                type="text"
                value={exp.reason}
                onChange={(e) => handleArrayChange('experience', index, 'reason', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Reason for leaving"
              />
            </div>
          </div>
        ))}
        {!isViewMode && (
          <button
            type="button"
            onClick={() => addItem('experience', { company: '', designation: '', startDate: '', endDate: '', totalExp: '', reason: '' })}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            + Add Experience
          </button>
        )}
      </div>

      {/* Education Details */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Education Details</h3>
        {formData.education.map((edu, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
            {index > 0 && !isViewMode && (
              <button
                type="button"
                onClick={() => removeItem('education', index)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                value={edu.qualification}
                onChange={(e) => handleArrayChange('education', index, 'qualification', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="e.g., B.Sc Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => handleArrayChange('education', index, 'institution', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Institution name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board / University</label>
              <input
                type="text"
                value={edu.board}
                onChange={(e) => handleArrayChange('education', index, 'board', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="Board or University"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passing</label>
              <input
                type="text"
                value={edu.year}
                onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="2022"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Percentage / CGPA</label>
              <input
                type="text"
                value={edu.percentage}
                onChange={(e) => handleArrayChange('education', index, 'percentage', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="85% or 8.5 CGPA"
              />
            </div>
          </div>
        ))}
        {!isViewMode && (
          <button
            type="button"
            onClick={() => addItem('education', { qualification: '', institution: '', board: '', year: '', percentage: '' })}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            + Add Education
          </button>
        )}
      </div>

      {/* Icebreaker */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Icebreaker (Fun Questions)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Cake</label>
            <input
              type="text"
              name="favoriteCake"
              value={formData.icebreaker.favoriteCake}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite cake"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Color</label>
            <input
              type="text"
              name="favoriteColor"
              value={formData.icebreaker.favoriteColor}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite color"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Song</label>
            <input
              type="text"
              name="favoriteSong"
              value={formData.icebreaker.favoriteSong}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite song"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Movie</label>
            <input
              type="text"
              name="favoriteMovie"
              value={formData.icebreaker.favoriteMovie}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite movie"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Food</label>
            <input
              type="text"
              name="favoriteFood"
              value={formData.icebreaker.favoriteFood}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite food"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Actor</label>
            <input
              type="text"
              name="favoriteActor"
              value={formData.icebreaker.favoriteActor}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite actor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dream Vacation</label>
            <input
              type="text"
              name="dreamVacation"
              value={formData.icebreaker.dreamVacation}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Dream vacation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekend Activity</label>
            <input
              type="text"
              name="weekendActivity"
              value={formData.icebreaker.weekendActivity}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Weekend activity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coffee or Tea</label>
            <select
              name="coffeeOrTea"
              value={formData.icebreaker.coffeeOrTea}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select</option>
              <option value="Coffee">Coffee</option>
              <option value="Tea">Tea</option>
              <option value="Both">Both</option>
              <option value="Neither">Neither</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Sports</label>
            <input
              type="text"
              name="favoriteSports"
              value={formData.icebreaker.favoriteSports}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Favorite sports"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealthDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Any tablets taking currently?</label>
          <select
            name="anyTablets"
            value={formData.health.anyTablets}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Any Health Issues?</label>
          <select
            name="healthIssues"
            value={formData.health.healthIssues}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
          <input
            type="text"
            name="bloodGroup"
            value={formData.health.bloodGroup}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
            placeholder="e.g., O+"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medical assistance needed?</label>
          <select
            name="medicalAssistance"
            value={formData.health.medicalAssistance}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
            <input
              type="text"
              name="emergencyName"
              value={formData.health.emergencyName}
              onChange={(e) => handleInputChange(e, 'health')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
            <input
              type="tel"
              name="emergencyNumber"
              value={formData.health.emergencyNumber}
              onChange={(e) => handleInputChange(e, 'health')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Emergency contact number"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentBankDetails = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-4">Documents</h4>
        <p className="text-sm text-gray-500 mb-4">Allowed formats: PDF, JPG, PNG. Max file size: 5MB per file</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent" disabled={isViewMode}>
            <option value="">Select Document Type</option>
            <option value="Aadhar">Aadhar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="Passport">Passport</option>
            <option value="Driving License">Driving License</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Degree Certificate">Degree Certificate</option>
            <option value="Experience Letter">Experience Letter</option>
          </select>
          <input
            type="file"
            disabled={isViewMode}
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 ${isViewMode ? 'bg-gray-50' : ''}`}
          />
          {!isViewMode && (
            <button className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors">
              Add
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">Max size: 2MB. Formats: PDF, JPG, PNG</p>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                  No documents uploaded yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Bank Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
            <input
              type="text"
              name="accountHolder"
              value={formData.bankDetails.accountHolder}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Account holder name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              name="accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Account number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              value={formData.bankDetails.ifscCode}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="IFSC code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={formData.bankDetails.bankName}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Bank name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <input
              type="text"
              name="branchName"
              value={formData.bankDetails.branchName}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
              placeholder="Branch name"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderOfficeTour = () => (
    <div className="space-y-6">
      <h4 className="text-md font-semibold text-gray-800 mb-4">Office Tour Completion</h4>
      <p className="text-sm text-gray-500 mb-4">Please check the areas the employee has been shown.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'reception', label: 'Reception' },
          { key: 'workstation', label: 'Workstation/Sheet' },
          { key: 'meetingRoom', label: 'Meeting Room' },
          { key: 'cafeteria', label: 'Cafeteria' },
          { key: 'hrCabin', label: 'HR Cabin' },
        ].map((item) => (
          <label key={item.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name={item.key}
              checked={formData.officeTour[item.key]}
              onChange={(e) => handleInputChange(e, 'officeTour')}
              disabled={isViewMode}
              className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="ml-3 text-sm text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderInduction = () => (
    <div className="space-y-6">
      <h4 className="text-md font-semibold text-gray-800 mb-4">Induction Completion</h4>
      <p className="text-sm text-gray-500 mb-4">Please check the topics that have been discussed with the employee.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'companyIntro', label: 'Company Introduction' },
          { key: 'hrPolicies', label: 'HR Policies' },
          { key: 'attendanceRules', label: 'Attendance Rules' },
          { key: 'leavePolicy', label: 'Leave Policy' },
          { key: 'securityGuidelines', label: 'Security Guidelines' },
          { key: 'teamIntro', label: 'Team Introduction' },
        ].map((item) => (
          <label key={item.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name={item.key}
              checked={formData.induction[item.key]}
              onChange={(e) => handleInputChange(e, 'induction')}
              disabled={isViewMode}
              className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="ml-3 text-sm text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderKitAllocation = () => (
    <div className="space-y-6">
      <h4 className="text-md font-semibold text-gray-800 mb-4">Asset & Welcome Kit Allocation</h4>
      <p className="text-sm text-gray-500 mb-4">Please check the items that have been provided to the employee.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'laptop', label: 'Laptop' },
          { key: 'mouse', label: 'Mouse' },
          { key: 'keyboard', label: 'Keyboard' },
          { key: 'entryCard', label: 'Entry Card/Recognition' },
          { key: 'headset', label: 'Headset' },
          { key: 'welcomeKit', label: 'Welcome Kit' },
        ].map((item) => (
          <label key={item.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name={item.key}
              checked={formData.kit[item.key]}
              onChange={(e) => handleInputChange(e, 'kit')}
              disabled={isViewMode}
              className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-400"
            />
            <span className="ml-3 text-sm text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-1 sm:px-6 lg:px-4">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Awaiting Onboarding</h1>
          {/* <p className="text-sm text-gray-500">
            These candidates were marked as selected and require salary and bank details to activate.
          </p> */}
        </div>

        {/* Awaiting Onboarding Table */}
        {!showOnboardingForm ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {awaitingEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{employee.designation}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{employee.group}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{employee.email}</p>
                        {employee.phone && (
                          <p className="text-xs text-gray-500">{employee.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewEmployee(employee)}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md hover:bg-gray-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAddEmployee(employee)}
                            className="px-3 py-1 bg-green-700 text-white text-xs rounded-md hover:bg-green-800 transition-colors"
                          >
                            Onboard
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Onboarding Form */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 ${isViewMode ? 'bg-gray-600' : 'bg-gray-800'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <button
                    onClick={() => {
                      setShowOnboardingForm(false);
                      setIsViewMode(false);
                    }}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                  </button>
                  <h2 className="text-xl font-semibold text-white mt-2">
                    {isViewMode ? 'View' : 'Onboarding'}: {selectedEmployee?.name || 'Employee'}
                  </h2>
                  {isViewMode && (
                    <p className="text-sm text-gray-300 mt-1">View-only mode - All fields are disabled</p>
                  )}
                </div>
                <div className="text-white text-right">
                  <p className="text-2xl font-bold">{steps[currentStep - 1]?.progress || 0}%</p>
                  <p className="text-sm opacity-80">Completion</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentStep === step.id
                        ? isViewMode ? 'bg-gray-600 text-white' : 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {step.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={prevStep}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isViewMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => saveOnboarding('DRAFT')}
                        disabled={loading}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Save as Draft
                      </button>
                      {currentStep < 6 ? (
                        <button
                          onClick={handleNext}
                          disabled={loading}
                          className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => saveOnboarding('FINAL')}
                          disabled={loading}
                          className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors disabled:opacity-50"
                        >
                          Final Submit
                        </button>
                      )}
                    </>
                  )}
                  {isViewMode && (
                    <button
                      onClick={() => {
                        setShowOnboardingForm(false);
                        setIsViewMode(false);
                      }}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeOnboarding;