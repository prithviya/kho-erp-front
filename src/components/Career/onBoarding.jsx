import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { request } from '../../services/apiClient';
import { toast } from 'react-toastify';
import {Eye, Edit, Rocket} from 'lucide-react';

const API_ROOT_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const EmployeeOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  const [awaitingEmployees, setAwaitingEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [isPermanentAddressSame, setIsPermanentAddressSame] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  const hasText = (value) => Boolean(String(value || '').trim());

  const addressFieldKeys = ['line1', 'line2', 'city', 'state', 'pincode'];

  const areAddressesEqual = (currentAddress, permanentAddress) => {
    return addressFieldKeys.every((key) =>
      String(currentAddress?.[key] || '').trim() === String(permanentAddress?.[key] || '').trim()
    );
  };

  const hasAnyAddressValue = (address) => {
    return addressFieldKeys.some((key) => hasText(address?.[key]));
  };

  const syncPermanentAddressFlag = (data) => {
    const sameAddress =
      areAddressesEqual(data?.currentAddress, data?.permanentAddress) &&
      hasAnyAddressValue(data?.currentAddress);

    setIsPermanentAddressSame(sameAddress);
  };

  const resolveCandidateId = (candidateLike) => {
    const rawId =
      candidateLike?.id ??
      candidateLike?.cifid ??
      candidateLike?.candidateId ??
      candidateLike?.submission?.[0]?.candidateId;

    const parsedId = Number(rawId);
    return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  };

  const hasFieldError = (fieldKey) => validationErrors.includes(fieldKey);

  const getFieldClassName = (baseClassName, fieldKey) => {
    return `${baseClassName} ${hasFieldError(fieldKey) ? 'border-red-500 ring-1 ring-red-500' : ''}`;
  };

  const clearFieldError = (fieldKey) => {
    if (!fieldKey) return;
    setValidationErrors((prev) => prev.filter((item) => item !== fieldKey));
  };

  const RequiredAsterisk = () => <span className="text-red-500">*</span>;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickName: '',
    employeeId: generatedEmployeeId,
    officialEmail: '',
    personalEmail: '',
    personalPhone: '',
    officePhone: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    dateOfJoining: '',
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
    currentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
    permanentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
    experience: [{ company: '', designation: '', startDate: '', endDate: '', totalExp: '', reason: '' }],
    education: [{ qualification: '', institution: '', board: '', year: '', percentage: '' }],
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
    health: {
      anyTablets: '',
      healthIssues: '',
      bloodGroup: '',
      medicalAssistance: '',
      emergencyContact: '',
      emergencyName: '',
      emergencyNumber: '',
    },
    documents: [],
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
    },
    officeTour: {
      reception: false,
      workstation: false,
      meetingRoom: false,
      cafeteria: false,
      hrCabin: false,
    },
    induction: {
      companyIntro: false,
      hrPolicies: false,
      attendanceRules: false,
      leavePolicy: false,
      securityGuidelines: false,
      teamIntro: false,
    },
    kit: {
      laptop: false,
      mouse: false,
      keyboard: false,
      entryCard: false,
      headset: false,
      welcomeKit: false,
    },
  });

  const validateRequiredFields = () => {
    const errors = [];

    const requiredBasicFields = [
      'firstName',
      'lastName',
      'personalEmail',
      'personalPhone',
      'officialEmail',
      'gender',
      'maritalStatus',
      'dateOfBirth',
      'dateOfJoining',
    ];

    requiredBasicFields.forEach((field) => {
      if (!hasText(formData[field])) errors.push(field);
    });

    const requiredEmploymentFields = [
      'employeeType',
      'erpRole',
      'sourceOfHire',
      'department',
      'designation',
      'reportingHead',
      'panNumber',
      'currentSalary',
    ];

    requiredEmploymentFields.forEach((field) => {
      if (!hasText(formData[field])) errors.push(field);
    });

    const addressChecks = [
      ['currentAddress.line1', formData.currentAddress?.line1],
      ['currentAddress.city', formData.currentAddress?.city],
      ['currentAddress.state', formData.currentAddress?.state],
      ['currentAddress.pincode', formData.currentAddress?.pincode],
      ['permanentAddress.line1', formData.permanentAddress?.line1],
      ['permanentAddress.city', formData.permanentAddress?.city],
      ['permanentAddress.state', formData.permanentAddress?.state],
      ['permanentAddress.pincode', formData.permanentAddress?.pincode],
    ];

    addressChecks.forEach(([fieldKey, value]) => {
      if (!hasText(value)) errors.push(fieldKey);
    });

    const validEducation = Array.isArray(formData.education)
      ? formData.education.some(
          (edu) =>
            hasText(edu?.qualification) &&
            (hasText(edu?.institution) || hasText(edu?.board)) &&
            hasText(edu?.year) &&
            hasText(edu?.percentage)
        )
      : false;
    if (!validEducation) errors.push('education');

    const validExperience = Array.isArray(formData.experience)
      ? formData.experience.some(
          (exp) =>
            hasText(exp?.company) &&
            hasText(exp?.designation) &&
            hasText(exp?.startDate) &&
            hasText(exp?.totalExp)
        )
      : false;
    if (!validExperience) errors.push('experience');

    const icebreakerFields = [
      'weekendActivity',
     
    ];
    icebreakerFields.forEach((key) => {
      if (!hasText(formData.icebreaker?.[key])) {
        errors.push(`icebreaker.${key}`);
      }
    });

    return errors;
  };

  const validateCurrentStep = () => {
    const baseErrors = validateRequiredFields();

    if (currentStep === 1) {
      return baseErrors;
    }

    if (currentStep === 2) {
      const healthRequired = [
        'health.anyTablets',
        'health.healthIssues',
        'health.bloodGroup',
        'health.medicalAssistance',
        'health.emergencyName',
        'health.emergencyNumber',
      ];

      return healthRequired.filter((fieldKey) => {
        const [section, key] = fieldKey.split('.');
        return !hasText(formData?.[section]?.[key]);
      });
    }

    if (currentStep === 3) {
      const errors = [];

      if (!Array.isArray(formData.documents) || formData.documents.length === 0) {
        errors.push('documents');
      }

      const bankRequired = [
        'bankDetails.accountHolder',
        'bankDetails.accountNumber',
        'bankDetails.ifscCode',
        'bankDetails.bankName',
        'bankDetails.branchName',
      ];

      bankRequired.forEach((fieldKey) => {
        const [section, key] = fieldKey.split('.');
        if (!hasText(formData?.[section]?.[key])) {
          errors.push(fieldKey);
        }
      });

      return errors;
    }

    return [];
  };

  const currentStepErrors = validateCurrentStep();
  const isNextDisabled = isSaving || currentStepErrors.length > 0;

  useEffect(() => {
    fetchAwaitingEmployees();
    fetchNextEmployeeId();
  }, []);

  const fetchNextEmployeeId = async () => {
    try {
      const response = await request('/onboardings/next-employee-id', { method: 'GET' });
      const backendEmployeeId = response?.data?.employeeId;
      if (backendEmployeeId) {
        setGeneratedEmployeeId(backendEmployeeId);
        return backendEmployeeId;
      }
    } catch (error) {
      console.error('Error fetching next employee ID:', error);
    }

    return generatedEmployeeId;
  };

  const fetchAwaitingEmployees = async () => {
    try {
      setLoading(true);
      const response = await request('/cif-submissions', { method: 'GET' });
      if (response?.success) {
        const selected = (response.data || []).filter((c) => {
          const s = String(c?.status || '').trim().toLowerCase();
          return s === 'selected';
        });

        const mappedEmployees = selected
          .map(c => {
            const candidateId = resolveCandidateId(c);
            if (!candidateId) return null;

            return {
              id: candidateId,
              name: c.fullName || 'N/A',
              designation: c.opening?.jobTitle || 'N/A',
              group: 'N/A',
              email: c.email || 'N/A',
              phone: c.phoneNumber || 'N/A',
              DOB: c.DOB || c.dob || 'N/A',
              department: 'N/A',
              status: 'Awaiting Onboarding',
              rawCandidate: c
            };
          })
          .filter(Boolean);
        
        setAwaitingEmployees(mappedEmployees);
      }
    } catch (error) {
      console.error('Error fetching selected candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFormData = (employeeId = generatedEmployeeId) => ({
    firstName: '',
    lastName: '',
    nickName: '',
    employeeId,
    officialEmail: '',
    personalEmail: '',
    personalPhone: '',
    officePhone: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    dateOfJoining: '',
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
    currentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
    permanentAddress: { line1: '', line2: '', city: '', state: '', pincode: '' },
    experience: [{ company: '', designation: '', startDate: '', endDate: '', totalExp: '', reason: '' }],
    education: [{ qualification: '', institution: '', board: '', year: '', percentage: '' }],
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
    health: {
      anyTablets: '',
      healthIssues: '',
      bloodGroup: '',
      medicalAssistance: '',
      emergencyContact: '',
      emergencyName: '',
      emergencyNumber: '',
    },
    documents: [],
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
    },
    officeTour: {
      reception: false,
      workstation: false,
      meetingRoom: false,
      cafeteria: false,
      hrCabin: false,
    },
    induction: {
      companyIntro: false,
      hrPolicies: false,
      attendanceRules: false,
      leavePolicy: false,
      securityGuidelines: false,
      teamIntro: false,
    },
    kit: {
      laptop: false,
      mouse: false,
      keyboard: false,
      entryCard: false,
      headset: false,
      welcomeKit: false,
    },
  });

  const mapCandidateToFormData = (candidate) => {
    const base = getDefaultFormData();
    const nameParts = candidate?.fullName ? candidate.fullName.split(' ') : [];

    return {
      ...base,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      personalEmail: candidate?.email || '',
      personalPhone: candidate?.phoneNumber || '',
      designation: candidate?.opening?.jobTitle || '',
    };
  };

  const loadOnboardingRecord = async (employee, fallbackData) => {
    const candidateId = resolveCandidateId(employee);
    if (!candidateId) {
      if (fallbackData) {
        setFormData(fallbackData);
        syncPermanentAddressFlag(fallbackData);
      }
      return;
    }

    try {
      const response = await request(`/onboardings/record/${candidateId}`, { method: 'GET' });
      if (response?.success && response?.data?.formData) {
        setHasExistingRecord(true);
        const mergedData = { ...(fallbackData || {}), ...response.data.formData };
        setFormData(mergedData);
        syncPermanentAddressFlag(mergedData);
        return;
      }
    } catch (error) {
      console.error('No existing onboarding record found:', error);
    }

    if (fallbackData) {
      setFormData(fallbackData);
      syncPermanentAddressFlag(fallbackData);
    }
  };

  const saveOnboardingRecord = async (status) => {
    if (!selectedEmployee?.id) {
      alert('Please select a candidate first.');
      return false;
    }

    if (status === 'FINAL') {
      const requiredErrors = validateRequiredFields();
      if (requiredErrors.length > 0) {
        setValidationErrors(requiredErrors);
        toast.error(formatMissingFieldsSummary(requiredErrors));
        return false;
      }
    }

    try {
      setIsSaving(true);
      const isUpdate = hasExistingRecord;
      await request(isUpdate ? `/onboardings/record/${selectedEmployee.id}` : '/onboardings/record', {
        method: isUpdate ? 'PUT' : 'POST',
        body: JSON.stringify({
          cifid: selectedEmployee.id,
          status,
          formData,
        }),
      });
      setHasExistingRecord(true);
      return true;
    } catch (error) {
      const validationFields = Array.isArray(error?.errors)
        ? error.errors.map((item) => item?.field).filter(Boolean)
        : [];

      if (status === 'FINAL' && validationFields.length > 0) {
        setValidationErrors(validationFields);
        toast.error(formatMissingFieldsSummary(validationFields));
        return false;
      }

      toast.error(error?.message || 'Failed to save onboarding details.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const formatFieldLabel = (field) => {
    if (!field) return '';

    let label = String(field).trim();
    label = label
      .replace(/^Employment Information: /, '')
      .replace(/^Address Section: /, '')
      .replace(/^Education Details: /, '')
      .replace(/^Experience Details: /, '')
      .replace(/^Basic Details: /, '')
      .replace(/^Icebreaker: /, '')
      .replace(/^Health: /, '')
      .replace(/^Bank Details: /, '')
      .replace(/currentAddress\./g, 'Current Address > ')
      .replace(/permanentAddress\./g, 'Permanent Address > ')
      .replace(/reportingHead/g, 'Reporting Head')
      .replace(/uanNumber/g, 'UAN Number')
      .replace(/panNumber/g, 'PAN Number')
      .replace(/currentSalary/g, 'Current Salary')
      .replace(/favoriteCake/g, 'Favorite Cake')
      .replace(/favoriteColor/g, 'Favorite Color')
      .replace(/favoriteSong/g, 'Favorite Song')
      .replace(/favoriteMovie/g, 'Favorite Movie')
      .replace(/favoriteFood/g, 'Favorite Food')
      .replace(/favoriteActor/g, 'Favorite Actor')
      .replace(/dreamVacation/g, 'Dream Vacation')
      .replace(/weekendActivity/g, 'Weekend Activity')
      .replace(/coffeeOrTea/g, 'Coffee or Tea')
      .replace(/favoriteSports/g, 'Favorite Sports')
      .replace(/anyTablets/g, 'Any Tablets Taking Currently')
      .replace(/healthIssues/g, 'Any Health Issues')
      .replace(/bloodGroup/g, 'Blood Group')
      .replace(/medicalAssistance/g, 'Medical Assistance Needed')
      .replace(/emergencyName/g, 'Emergency Contact Name')
      .replace(/emergencyNumber/g, 'Emergency Contact Number')
      .replace(/accountHolder/g, 'Account Holder Name')
      .replace(/accountNumber/g, 'Account Number')
      .replace(/ifscCode/g, 'IFSC Code')
      .replace(/bankName/g, 'Bank Name')
      .replace(/branchName/g, 'Branch Name')
      .replace(/education/g, 'Education')
      .replace(/experience/g, 'Experience')
      .replace(/qualification/g, 'Qualification')
      .replace(/institution/g, 'Institution')
      .replace(/board/g, 'Board / University')
      .replace(/year/g, 'Year')
      .replace(/percentage/g, 'Percentage')
      .replace(/company/g, 'Company')
      .replace(/designation/g, 'Designation')
      .replace(/startDate/g, 'Start Date')
      .replace(/totalExp/g, 'Total Experience')
      .replace(/line1/g, 'Line 1')
      .replace(/city/g, 'City')
      .replace(/state/g, 'State')
      .replace(/pincode/g, 'Pincode')
      .replace(/\./g, ' > ')
      .replace(/\s+>\s+/g, ' > ')
      .replace(/\s+/g, ' ')
      .trim();

    return label;
  };

  const formatMissingFieldsSummary = (errors) => {
    if (!Array.isArray(errors) || errors.length === 0) return 'Please complete the required fields.';

    const normalized = [...new Set(
      errors
        .map((field) => formatFieldLabel(field))
        .filter(Boolean)
    )];

    if (normalized.length === 0) {
      return 'Please complete the required fields.';
    }

    return `Missing required fields: ${normalized.join(', ')}`;
  };

  const handleNext = async () => {
    const stepErrors = validateCurrentStep();
    if (stepErrors.length > 0) {
      setValidationErrors(stepErrors);
      toast.error(formatMissingFieldsSummary(stepErrors));
      return;
    }

    setValidationErrors([]);
    const saved = await saveOnboardingRecord('DRAFT');
    if (saved && currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSaveAsDraft = async () => {
    const saved = await saveOnboardingRecord('DRAFT');
    if (saved) {
      alert('Draft saved successfully.');
    }
  };

  const handleFinalSubmit = async () => {
    const requiredErrors = validateRequiredFields();
    if (requiredErrors.length > 0) {
      setValidationErrors(requiredErrors);
      toast.error(formatMissingFieldsSummary(requiredErrors));
      return;
    }

    const saved = await saveOnboardingRecord('FINAL');
    if (!saved) {
      return;
    }

    alert('Onboarding submitted successfully.');
    setShowOnboardingForm(false);
    setIsViewMode(false);
    setCurrentStep(1);
    setSelectedEmployee(null);
    setHasExistingRecord(false);
    setIsPermanentAddressSame(false);
    const nextEmployeeId = await fetchNextEmployeeId();
    setFormData(getDefaultFormData(nextEmployeeId));
    await fetchAwaitingEmployees();
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.candidateData) {
      const candidate = location.state.candidateData;
      const candidateFormData = mapCandidateToFormData(candidate);
      const candidateId = resolveCandidateId(candidate);

      setFormData(candidateFormData);
      syncPermanentAddressFlag(candidateFormData);

      if (!candidateId) {
        toast.error('Candidate ID is missing. Please open onboarding from selected candidates list again.');
        return;
      }
      
      const employee = {
        id: candidateId,
        name: candidate.fullName,
        email: candidate.email,
        phone: candidate.phoneNumber
      };

      setSelectedEmployee(employee);
      setShowOnboardingForm(true);
      loadOnboardingRecord(employee, candidateFormData);
      
      // Clean up the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const steps = [
    { id: 1, name: 'Personal', progress: 32 },
    { id: 2, name: 'Medical History', progress: 48 },
    { id: 3, name: 'Document', progress: 48 },
    { id: 4, name: 'Office Tour', progress: 64 },
    { id: 5, name: 'Induction', progress: 80 },
    { id: 6, name: 'Welcome Kit', progress: 96 },
  ];

  const handleInputChange = (e, section, subSection) => {
    if (isViewMode) return;
    const { name, value, type, checked } = e.target;
    
    if (section) {
      if (subSection) {
        clearFieldError(`${section}.${subSection}.${name}`);
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
        clearFieldError(`${section}.${name}`);
        setFormData(prev => {
          const incomingValue = type === 'checkbox' ? checked : value;
          const normalizedValue =
            (section === 'currentAddress' || section === 'permanentAddress') && name === 'pincode'
              ? String(incomingValue || '').replace(/\D/g, '').slice(0, 6)
              : incomingValue;

          const nextSectionValues = {
            ...prev[section],
            [name]: normalizedValue
          };

          const nextState = {
            ...prev,
            [section]: nextSectionValues
          };

          if (section === 'currentAddress' && isPermanentAddressSame) {
            nextState.permanentAddress = {
              ...nextSectionValues,
            };
          }

          return nextState;
        });
      }
    } else {
      clearFieldError(name);
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePermanentAddressSameToggle = (checked) => {
    setIsPermanentAddressSame(checked);

    if (!checked) return;

    setFormData((prev) => ({
      ...prev,
      permanentAddress: {
        ...prev.currentAddress,
      },
    }));

    setValidationErrors((prev) =>
      prev.filter((key) => !String(key).startsWith('permanentAddress.'))
    );
  };

  const handleArrayChange = (section, index, field, value) => {
    if (isViewMode) return;
    clearFieldError(section);
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

  const handleAddDocument = async () => {
    if (isViewMode) return;
    if (!selectedDocumentType || !selectedDocumentFile) return;

    const fileName = selectedDocumentFile.name || '';
    if (!fileName) return;

    try {
      const uploadPayload = new FormData();
      uploadPayload.append('document', selectedDocumentFile);
      uploadPayload.append('documentType', selectedDocumentType);
      if (selectedEmployee?.id) {
        uploadPayload.append('cifid', String(selectedEmployee.id));
      }

      const response = await request('/onboardings/upload-document', {
        method: 'POST',
        body: uploadPayload,
      });

      const uploadedDoc = response?.data || {};
      const uploadedFileName = uploadedDoc.fileName || fileName;
      const uploadedFileUrl = uploadedDoc.fileUrl || uploadedDoc.file_url || '';
      const uploadedStoredName = uploadedDoc.storedName || '';

      const incomingKey = `${String(selectedDocumentType).toLowerCase()}::${String(uploadedFileName).toLowerCase()}`;

      setFormData(prev => {
        const existingDocs = Array.isArray(prev.documents) ? prev.documents : [];
        const duplicateIndex = existingDocs.findIndex((doc) => {
          const docType = String(doc?.documentType || '').toLowerCase();
          const docName = String(doc?.fileName || '').toLowerCase();
          return `${docType}::${docName}` === incomingKey;
        });

        if (duplicateIndex >= 0) {
          const nextDocs = [...existingDocs];
          nextDocs[duplicateIndex] = {
            ...nextDocs[duplicateIndex],
            fileUrl: uploadedFileUrl || nextDocs[duplicateIndex]?.fileUrl || '',
            file_url: uploadedFileUrl || nextDocs[duplicateIndex]?.file_url || '',
            storedName: uploadedStoredName || nextDocs[duplicateIndex]?.storedName || '',
          };

          return {
            ...prev,
            documents: nextDocs,
          };
        }

        return {
          ...prev,
          documents: [
            ...existingDocs,
            {
              documentType: selectedDocumentType,
              fileName: uploadedFileName,
              fileUrl: uploadedFileUrl,
              file_url: uploadedFileUrl,
              storedName: uploadedStoredName,
            },
          ],
        };
      });

      setSelectedDocumentType('');
      setSelectedDocumentFile(null);
    } catch (error) {
      alert(error?.message || 'Failed to upload document.');
    }
  };

  const removeDocument = (index) => {
    if (isViewMode) return;
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter((_, i) => i !== index),
    }));
  };

  const getDocumentDownloadUrl = (doc) => {
    const rawUrl = String(doc?.fileUrl || doc?.file_url || '').trim();
    const storedName = String(doc?.storedName || '').trim();

    if (!rawUrl && storedName) {
      return `${API_ROOT_URL}/uploads/onboarding-documents/${storedName}`;
    }

    if (!rawUrl) return '';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    if (rawUrl.startsWith('/')) {
      return `${API_ROOT_URL}${rawUrl}`;
    }

    return `${API_ROOT_URL}/${rawUrl}`;
  };

  const handleViewEmployee = (employee) => {
    if (!resolveCandidateId(employee)) {
      toast.error('Candidate ID is missing for this row. Please refresh and try again.');
      return;
    }

    setSelectedEmployee(employee);
    setIsViewMode(true);
    setShowOnboardingForm(true);
    setCurrentStep(1);
    const fallbackData = {
      ...getDefaultFormData(),
      firstName: employee.name.split(' ')[0] || '',
      lastName: employee.name.split(' ').slice(1).join(' ') || '',
      personalEmail: employee.email,
      personalPhone: employee.phone || '',
      dateOfBirth: employee.DOB || '',
      department: employee.department || '',
    };
    setFormData(fallbackData);
    syncPermanentAddressFlag(fallbackData);
    loadOnboardingRecord(employee, fallbackData);
  };

  const handleEditEmployee = (employee) => {
    if (!resolveCandidateId(employee)) {
      toast.error('Candidate ID is missing for this row. Please refresh and try again.');
      return;
    }

    setSelectedEmployee(employee);
    setIsViewMode(false);
    setShowOnboardingForm(true);
    setCurrentStep(1);
    const fallbackData = {
      ...getDefaultFormData(),
      firstName: employee.name.split(' ')[0] || '',
      lastName: employee.name.split(' ').slice(1).join(' ') || '',
      personalEmail: employee.email,
      personalPhone: employee.phone || '',
      dateOfBirth: employee.DOB || '',
      department: employee.department || '',
    };
    setFormData(fallbackData);
    syncPermanentAddressFlag(fallbackData);
    loadOnboardingRecord(employee, fallbackData);
  };

  const handleAddEmployee = (employee) => {
    if (!resolveCandidateId(employee)) {
      toast.error('Candidate ID is missing for this row. Please refresh and try again.');
      return;
    }

    setSelectedEmployee(employee);
    setIsViewMode(false);
    setShowOnboardingForm(true);
    setCurrentStep(1);
    const fallbackData = {
      ...getDefaultFormData(),
      firstName: employee.name.split(' ')[0] || '',
      lastName: employee.name.split(' ').slice(1).join(' ') || '',
      personalEmail: employee.email,
      personalPhone: employee.phone || '',
      department: employee.department || '',
      designation: employee.designation || '',
    };
    setFormData(fallbackData);
    syncPermanentAddressFlag(fallbackData);
    loadOnboardingRecord(employee, fallbackData);
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
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Please fill all highlighted required fields before moving to next step.
        </div>
      )}

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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'firstName')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'lastName')}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID <span className="text-red-500">*</span></label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="officialEmail"
              value={formData.officialEmail}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'officialEmail')}
              placeholder="official@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="personalEmail"
              value={formData.personalEmail}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'personalEmail')}
              placeholder="personal@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Phone <RequiredAsterisk />
            </label>
            <input
              type="tel"
              name="personalPhone"
              value={formData.personalPhone}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'personalPhone')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'officePhone')}
              placeholder="Enter office phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'gender')}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status <span className="text-red-500">*</span></label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'maritalStatus')}
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'dateOfBirth')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'dateOfJoining')}
            />
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Information </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type <span className="text-red-500">*</span></label>
            <select
              name="employeeType"
              value={formData.employeeType}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'employeeType')}
            >
              <option value="">Select Type</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Probation">Probation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ERP Role <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="erpRole"
              value={formData.erpRole}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'erpRole')}
              placeholder="Enter ERP role"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source of Hire <span className="text-red-500">*</span></label>
            <select
              name="sourceOfHire"
              value={formData.sourceOfHire}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'sourceOfHire')}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'department')}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'designation')}
              placeholder="Enter designation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Head <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="reportingHead"
              value={formData.reportingHead}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'reportingHead')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'uanNumber')}
              placeholder="Enter UAN number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'panNumber')}
              placeholder="Enter PAN number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="currentSalary"
              value={formData.currentSalary}
              onChange={handleInputChange}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'currentSalary')}
              placeholder="Enter current salary"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-800">Current Address <span className="text-red-500">*</span></h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="line1"
                  value={formData.currentAddress.line1}
                  onChange={(e) => handleInputChange(e, 'currentAddress')}
                  disabled={isViewMode}
                  className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'currentAddress.line1')}
                  placeholder="Address Line 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="line2"
                  value={formData.currentAddress.line2}
                  onChange={(e) => handleInputChange(e, 'currentAddress')}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                  placeholder="Address Line 2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={formData.currentAddress.city}
                  onChange={(e) => handleInputChange(e, 'currentAddress')}
                  disabled={isViewMode}
                  className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'currentAddress.city')}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="state"
                  value={formData.currentAddress.state}
                  onChange={(e) => handleInputChange(e, 'currentAddress')}
                  disabled={isViewMode}
                  className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'currentAddress.state')}
                  placeholder="State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="pincode"
                value={formData.currentAddress.pincode}
                onChange={(e) => handleInputChange(e, 'currentAddress')}
                disabled={isViewMode}
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                className={getFieldClassName(`w-40 max-w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'currentAddress.pincode')}
                placeholder="6-digit"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-md font-semibold text-gray-800">Permanent Address</h4>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPermanentAddressSame}
                  onChange={(e) => handlePermanentAddressSameToggle(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-400"
                />
                Same as current address
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="line1"
                  value={formData.permanentAddress.line1}
                  onChange={(e) => handleInputChange(e, 'permanentAddress')}
                  disabled={isViewMode || isPermanentAddressSame}
                  className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${(isViewMode || isPermanentAddressSame) ? 'bg-gray-50' : ''}`, 'permanentAddress.line1')}
                  placeholder="Address Line 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="line2"
                  value={formData.permanentAddress.line2}
                  onChange={(e) => handleInputChange(e, 'permanentAddress')}
                  disabled={isViewMode || isPermanentAddressSame}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${(isViewMode || isPermanentAddressSame) ? 'bg-gray-50' : ''}`}
                  placeholder="Address Line 2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={formData.permanentAddress.city}
                  onChange={(e) => handleInputChange(e, 'permanentAddress')}
                  disabled={isViewMode || isPermanentAddressSame}
                  className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${(isViewMode || isPermanentAddressSame) ? 'bg-gray-50' : ''}`, 'permanentAddress.city')}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="state"
                  value={formData.permanentAddress.state}
                  onChange={(e) => handleInputChange(e, 'permanentAddress')}
                  disabled={isViewMode || isPermanentAddressSame}
                  className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${(isViewMode || isPermanentAddressSame) ? 'bg-gray-50' : ''}`, 'permanentAddress.state')}
                  placeholder="State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="pincode"
                value={formData.permanentAddress.pincode}
                onChange={(e) => handleInputChange(e, 'permanentAddress')}
                disabled={isViewMode || isPermanentAddressSame}
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                className={getFieldClassName(`w-40 max-w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${(isViewMode || isPermanentAddressSame) ? 'bg-gray-50' : ''}`, 'permanentAddress.pincode')}
                placeholder="6-digit"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Experience Details */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Experience Details</h3>
        {hasFieldError('experience') && (
          <p className="mb-3 text-sm text-red-600">
            Add at least one complete experience entry (company, designation, start date, total experience).
          </p>
        )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Experience <RequiredAsterisk />
              </label>
              <input
                type="text"
                value={exp.totalExp}
                onChange={(e) => handleArrayChange('experience', index, 'totalExp', e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`}
                placeholder="e.g., 2 years"
              />
            </div>
            <div>
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
        {hasFieldError('education') && (
          <p className="mb-3 text-sm text-red-600">
            Add at least one complete education entry (qualification, institution/board, year, percentage).
          </p>
        )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution Name <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board / University <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year of Passing <RequiredAsterisk />
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage / CGPA <RequiredAsterisk />
              </label>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Cake</label>
            <input
              type="text"
              name="favoriteCake"
              value={formData.icebreaker.favoriteCake}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteCake')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteColor')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteSong')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteMovie')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteFood')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteActor')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.dreamVacation')}
              placeholder="Dream vacation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekend Activity <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="weekendActivity"
              value={formData.icebreaker.weekendActivity}
              onChange={(e) => handleInputChange(e, 'icebreaker')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.weekendActivity')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.coffeeOrTea')}
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
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'icebreaker.favoriteSports')}
              placeholder="Favorite sports"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealthDetails = () => (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Please complete all required health details before continuing.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Any tablets taking currently? <RequiredAsterisk />
          </label>
          <select
            name="anyTablets"
            value={formData.health.anyTablets}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'health.anyTablets')}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Any Health Issues? <RequiredAsterisk />
          </label>
          <select
            name="healthIssues"
            value={formData.health.healthIssues}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'health.healthIssues')}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blood Group <RequiredAsterisk />
          </label>
          <input
            type="text"
            name="bloodGroup"
            value={formData.health.bloodGroup}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'health.bloodGroup')}
            placeholder="e.g., O+"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medical assistance needed? <RequiredAsterisk />
          </label>
          <select
            name="medicalAssistance"
            value={formData.health.medicalAssistance}
            onChange={(e) => handleInputChange(e, 'health')}
            disabled={isViewMode}
            className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'health.medicalAssistance')}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Name <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="emergencyName"
              value={formData.health.emergencyName}
              onChange={(e) => handleInputChange(e, 'health')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'health.emergencyName')}
              placeholder="Emergency contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Number <RequiredAsterisk />
            </label>
            <input
              type="tel"
              name="emergencyNumber"
              value={formData.health.emergencyNumber}
              onChange={(e) => handleInputChange(e, 'health')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'health.emergencyNumber')}
              placeholder="Emergency contact number"
            />
          </div>
        </div>
      </div>
      </div>
  );

  const renderDocumentBankDetails = () => (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Please complete all required document and bank details before continuing.
        </div>
      )}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-4">Documents</h4>
        <p className="text-sm text-gray-500 mb-4">Allowed formats: PDF, JPG, PNG. Max file size: 5MB per file</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type <RequiredAsterisk />
            </label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className={getFieldClassName("w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent", 'documents')}
              disabled={isViewMode}
            >
            <option value="">Select Document Type</option>
            <option value="Aadhar">Aadhar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="Passport">Passport</option>
            <option value="Driving License">Driving License</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Bank Passbook">Bank Passbook</option>
            <option value="Salary Statement">Salary Statement</option>
            <option value="Relieving Letter">Relieving Letter</option>
            <option value="Passport Photo">Passport Photo</option>
            <option value="Degree Certificate">Degree Certificate</option>
            <option value="Experience Letter">Experience Letter</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File <RequiredAsterisk />
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedDocumentFile(e.target.files?.[0] || null)}
              disabled={isViewMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 ${isViewMode ? 'bg-gray-50' : ''}`}
            />
          </div>
          {!isViewMode && (
            <div className="self-end">
              <button
                type="button"
                onClick={handleAddDocument}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">Max size: 2MB. Formats: PDF, JPG, PNG</p>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(formData.documents || []).length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                    No documents uploaded yet
                  </td>
                </tr>
              ) : (
                (formData.documents || []).map((doc, index) => (
                  <tr key={`${doc.documentType}-${doc.fileName}-${index}`}>
                    <td className="px-4 py-3 text-sm text-gray-700">{doc.documentType || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getDocumentDownloadUrl(doc) ? (
                        <a
                          href={getDocumentDownloadUrl(doc)}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.fileName || true}
                          className="text-blue-700 hover:text-blue-900 hover:underline"
                          title="Download file"
                        >
                          {doc.fileName || '-'}
                        </a>
                      ) : (
                        doc.fileName || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        {getDocumentDownloadUrl(doc) ? (
                          <a
                            href={getDocumentDownloadUrl(doc)}
                            target="_blank"
                            rel="noreferrer"
                            download={doc.fileName || true}
                            className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-400">No file URL</span>
                        )}
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Bank Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="accountHolder"
              value={formData.bankDetails.accountHolder}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'bankDetails.accountHolder')}
              placeholder="Account holder name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'bankDetails.accountNumber')}
              placeholder="Account number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="ifscCode"
              value={formData.bankDetails.ifscCode}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'bankDetails.ifscCode')}
              placeholder="IFSC code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankDetails.bankName}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'bankDetails.bankName')}
              placeholder="Bank name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name <RequiredAsterisk />
            </label>
            <input
              type="text"
              name="branchName"
              value={formData.bankDetails.branchName}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              disabled={isViewMode}
              className={getFieldClassName(`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isViewMode ? 'bg-gray-50' : ''}`, 'bankDetails.branchName')}
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
          { key: 'workstation', label: 'Workstation/Seat' },
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
          { key: 'OfficialSim', label: 'Official Phone Number' },
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
          { key: 'PC', label: 'PC' },
          { key: 'entryCard', label: 'ID Card/Biometric' },
          { key: 'headset', label: 'Headset' },
           { key: 'OfficialSim', label: 'Official Phone Number' },
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
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md hover:bg-gray-900 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleAddEmployee(employee)}
                            className="px-3 py-1 bg-green-700 text-white text-xs rounded-md hover:bg-green-800 transition-colors"
                          >
                            <Rocket size={16} />
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
                        onClick={handleSaveAsDraft}
                        disabled={isSaving}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Save as Draft
                      </button>
                      {currentStep < 6 ? (
                        <div className="flex flex-col items-end gap-1">
                          {currentStepErrors.length > 0 && (
                            <p className="text-xs text-red-600">
                              Fill all required fields in this step to continue.
                            </p>
                          )}
                          <button
                            onClick={handleNext}
                            disabled={isNextDisabled}
                            className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Next'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleFinalSubmit}
                          disabled={isSaving}
                          className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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