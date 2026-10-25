import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { request } from '../../services/apiClient';
import employeeService from '../../services/employee.service';
import { getCanonicalRoles, getCurrentUser } from '../../utils/auth';

const API_ROOT_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasValue);
  return true;
};

const firstValue = (...values) => values.find(hasValue);

const displayValue = (value) => {
  if (!hasValue(value)) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map(displayValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    return displayValue(firstValue(value.name, value.label, value.value, value.title));
  }
  return String(value);
};

const formatDisplayDate = (value) => {
  if (!hasValue(value)) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatSalary = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

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

const getRecords = (...values) => {
  const records = values.find((value) => Array.isArray(value) && value.some(hasValue)) || [];
  return records
    .map((record) => (typeof record === 'string' ? { value: record } : record))
    .filter((record) => record && typeof record === 'object' && Object.values(record).some(hasValue));
};

const getAddress = (employee, data) => {
  const address = firstValue(data?.currentAddress, data?.address, employee?.address);
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    return [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.pincode,
    ].filter(hasValue).join(', ');
  }
  return [
    employee?.city,
    employee?.state,
    employee?.pinCode,
  ].filter(hasValue).join(', ');
};

function DetailField({ label, value }) {
  const isElement = React.isValidElement(value);
  const formattedValue = isElement ? value : displayValue(value);
  if (!hasValue(formattedValue)) return null;

  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-800">
        {formattedValue}
      </dd>
    </div>
  );
}

function FieldGrid({ fields }) {
  const visibleFields = fields.filter(([, value]) =>
    React.isValidElement(value) || hasValue(value)
  );
  if (!visibleFields.length) return null;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleFields.map(([label, value]) => (
        <DetailField key={label} label={label} value={value} />
      ))}
    </dl>
  );
}

function RecordList({ records, fields, emptyLabel }) {
  const items = records.filter((record) =>
    fields.some(([, getValue]) => hasValue(getValue(record)))
  );
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{emptyLabel}</h3>
      {items.map((record, index) => (
        <div key={`${emptyLabel}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          {items.length > 1 && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {emptyLabel} {index + 1}
            </p>
          )}
          <FieldGrid fields={fields.map(([label, getValue]) => [label, getValue(record)])} />
        </div>
      ))}
    </div>
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();
  const loggedInEmail = currentUser?.email || '';
  const canViewSensitiveOnboarding = getCanonicalRoles(currentUser).includes('HR');

  useEffect(() => {
    const fetchLoggedUserProfile = async () => {
      if (!loggedInEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await employeeService.getMyProfile();
        const currentEmployee = response?.data || null;

        if (!currentEmployee) {
          setProfile(null);
          setOnboardingData(null);
          return;
        }

        setProfile(currentEmployee);
        setOnboardingData(null);

        const employeeCode = String(
          currentEmployee.employeeCode || currentEmployee.employeeId || ''
        ).trim();

        if (employeeCode && canViewSensitiveOnboarding) {
          try {
            const onboardingResponse = await request(
              `/onboardings/record/employee_code/${encodeURIComponent(employeeCode)}`
            );
            setOnboardingData(onboardingResponse?.data?.formData || {});
          } catch (error) {
            if (error?.status !== 404) throw error;
          }
        }
      } catch (error) {
        toast.error(error?.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedUserProfile();
  }, [loggedInEmail, canViewSensitiveOnboarding]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (!loggedInEmail) {
    return <div className="p-8 text-center text-red-500">Please login to view your profile.</div>;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-gray-500">
        No employee details found for <span className="font-semibold">{loggedInEmail}</span>.
      </div>
    );
  }

  const data = onboardingData || {};
  const employeeEducation = getRecords(profile.education);
  const education = getRecords(data.education, employeeEducation);
  const experience = getRecords(data.experience, profile.workExperience);
  const skills = getRecords(profile.skills);
  const softwareTools = getRecords(profile.softwareTools);
  const languages = getRecords(profile.languages);
  const references = getRecords(profile.references);
  const personal = data.icebreaker || {};
  const health = data.health || {};
  const documents = Array.isArray(data.documents) ? data.documents.filter(hasValue) : [];

  const getDocumentItems = (category) => documents.filter((document) => {
    const type = String(document?.documentType || document?.type || '').toLowerCase();
    if (category === 'resume') return type.includes('resume');
    if (category === 'education') return /education|academic|degree/.test(type);
    if (category === 'professional') return /professional|certificate|certification/.test(type) && !/education|academic/.test(type);
    if (category === 'identity') return /identity|aadhar|aadhaar|pan|passport|id proof/.test(type);
    return !/resume|education|academic|degree|professional|certificate|certification|identity|aadhar|aadhaar|pan|passport|id proof/.test(type);
  });

  const renderDocuments = (category, label, includeResume = false) => {
    const matchingDocuments = getDocumentItems(category);
    const resumeUrl = includeResume ? getEmployeeDocumentDownloadUrl({ fileUrl: profile.resumeUrl }) : '';
    const documentRecords = matchingDocuments.map((document, index) => {
      const documentName = document.fileName || document.file_name || document.storedName || `${label} ${index + 1}`;
      const fileUrl = getEmployeeDocumentDownloadUrl(document);
      return {
        documentName,
        documentType: document.documentType || document.type,
        file: fileUrl
          ? <a className="text-blue-600 hover:underline" href={fileUrl} target="_blank" rel="noreferrer">{documentName}</a>
        : '',
      };
    });

    if (includeResume && resumeUrl && !documentRecords.length) {
      documentRecords.push({
        documentName: profile.resumeOriginalName || 'Resume',
        documentType: 'Resume',
        file: <a className="text-blue-600 hover:underline" href={resumeUrl} target="_blank" rel="noreferrer">View resume</a>,
      });
    }

    return (
      <RecordList
        records={documentRecords}
        emptyLabel={label}
        fields={[
          ['Document Name', (record) => record.documentName],
          ['Document Type', (record) => record.documentType],
          ['File', (record) => record.file],
        ]}
      />
    );
  };

  const sections = [
    {
      title: 'PERSONAL INFORMATION',
      hasData: [
        profile.fullName,
        profile.dateOfBirth,
        data.dateOfBirth,
        data.gender,
        profile.gender,
        profile.phone,
        data.personalPhone,
        profile.email,
        data.personalEmail,
        getAddress(profile, data),
      ].some(hasValue),
      content: (
        <FieldGrid fields={[
          ['Full Name', profile.fullName],
          ['Date of Birth', formatDisplayDate(firstValue(profile.dateOfBirth, data.dateOfBirth))],
          ['Gender', firstValue(data.gender, profile.gender)],
          ['Contact Number', firstValue(profile.phone, data.personalPhone)],
          ['Email Address', firstValue(profile.email, data.personalEmail)],
          ['Address', getAddress(profile, data)],
        ]} />
      ),
    },
    {
      title: 'PROFESSIONAL & ACADEMIC',
      hasData: [
        data.designation,
        profile.jobPosition,
        data.organizationName,
        data.companyName,
        profile.organizationName,
        profile.employeeCode,
        profile.status,
        data.dateOfJoining,
        profile.createdAt,
        data.currentSalary,
        data.salary,
      ].some(hasValue) || experience.length > 0 || education.length > 0
        || getRecords(data.certifications, data.professionalCertificates, data.certificates).length > 0,
      content: (
        <div className="space-y-5">
          <FieldGrid fields={[
            ['Current Designation', firstValue(data.designation, profile.jobPosition)],
            ['Organization Name', firstValue(data.organizationName, data.companyName, profile.organizationName)],
            ['Employee Code', profile.employeeCode],
            ['Employment Status', profile.status],
            ['Date of Joining', formatDisplayDate(data.dateOfJoining || profile.createdAt)],
            ['Current Salary', formatSalary(firstValue(data.currentSalary, data.salary))],
          ]} />
          <RecordList
            records={experience}
            emptyLabel="Professional Experience"
            fields={[
              ['Organization Name', (record) => firstValue(record.organization, record.company, record.companyName, record.employer)],
              ['Designation', (record) => firstValue(record.designation, record.role, record.position)],
              ['Experience', (record) => firstValue(record.totalExp, record.totalExperience, record.totalExperienceYears, record.experience)],
              ['Start Date', (record) => formatDisplayDate(record.startDate)],
              ['End Date', (record) => formatDisplayDate(record.endDate)],
            ]}
          />
          <RecordList
            records={education}
            emptyLabel="Educational Qualification"
            fields={[
              ['Educational Qualification', (record) => firstValue(record.qualification, record.degree)],
              ['Institution Name', (record) => firstValue(record.institution, record.university, record.college)],
              ['Graduation Year', (record) => firstValue(record.year, record.graduationYear)],
            ]}
          />
          <RecordList
            records={getRecords(data.certifications, data.professionalCertificates, data.certificates)}
            emptyLabel="Certifications"
            fields={[
              ['Certification Name', (record) => firstValue(record.name, record.certification, record.title, record.value)],
              ['Issuing Institution', (record) => firstValue(record.institution, record.issuer, record.organization)],
              ['Year', (record) => firstValue(record.year, record.date)],
            ]}
          />
        </div>
      ),
    },
    {
      title: 'SKILLS & TRAINING',
      hasData: skills.length > 0
        || getRecords(data.softSkills, data.trainingPrograms, data.trainings, data.workshops, data.additionalQualifications, data.additionalQualification).length > 0,
      content: (
        <div className="space-y-5">
          <RecordList
            records={skills.filter((skill) => !/soft/i.test(String(skill.type || skill.category || skill.skillType || '')))}
            emptyLabel="Technical Skills"
            fields={[
                ['Skill', (record) => firstValue(record.skill, record.skillName, record.name, record.value)],
                ['Proficiency Level', (record) => firstValue(record.level, record.proficiency, record.skillLevel)],
                ['Experience', (record) => firstValue(record.year, record.experience, record.experienceYears)],
            ]}
          />
          <RecordList
            records={getRecords(data.softSkills, skills.filter((skill) => /soft/i.test(String(skill.type || skill.category || skill.skillType || ''))))}
            emptyLabel="Soft Skills"
            fields={[
              ['Skill', (record) => firstValue(record.skill, record.skillName, record.name, record.value)],
              ['Proficiency Level', (record) => firstValue(record.level, record.proficiency, record.skillLevel)],
            ]}
          />
          <RecordList
            records={getRecords(data.trainingPrograms, data.trainings)}
            emptyLabel="Training Programs"
            fields={[
              ['Program Name', (record) => firstValue(record.name, record.program, record.title, record.value)],
              ['Institution', (record) => firstValue(record.institution, record.provider)],
              ['Year', (record) => record.year],
            ]}
          />
          <RecordList
            records={getRecords(data.workshops)}
            emptyLabel="Workshops"
            fields={[
              ['Workshop Name', (record) => firstValue(record.name, record.title, record.value)],
              ['Organizer', (record) => firstValue(record.organizer, record.provider)],
              ['Year', (record) => record.year],
            ]}
          />
          <RecordList
            records={getRecords(data.additionalQualifications, data.additionalQualification)}
            emptyLabel="Additional Qualifications"
            fields={[
              ['Qualification', (record) => firstValue(record.qualification, record.name, record.value)],
              ['Institution', (record) => firstValue(record.institution, record.issuer)],
              ['Year', (record) => record.year],
            ]}
          />
        </div>
      ),
    },
    {
      title: 'SOFTWARE & TOOLS PROFICIENCY',
      hasData: softwareTools.length > 0,
      content: (
        <RecordList
          records={softwareTools}
          emptyLabel="Software & Tools"
          fields={[
            ['Software Name', (record) => firstValue(record.softwareName, record.toolName, record.name)],
            ['Tools Used', (record) => firstValue(record.toolsUsed, record.tools, record.toolName)],
            ['Proficiency Level', (record) => firstValue(record.proficiency, record.level, record.proficiencyLevel)],
            ['Relevant Experience', (record) => firstValue(record.relevantExperience, record.experience, record.years)],
          ]}
        />
      ),
    },
    {
      title: 'LANGUAGE PROFICIENCY',
      hasData: languages.length > 0,
      content: (
        <RecordList
          records={languages}
          emptyLabel="Languages"
          fields={[
            ['Language Name', (record) => firstValue(record.language, record.languageName, record.name)],
            ['Speaking Proficiency', (record) => firstValue(record.speak, record.speaking, record.speakLevel)],
            ['Reading Proficiency', (record) => firstValue(record.read, record.reading, record.readLevel)],
            ['Writing Proficiency', (record) => firstValue(record.write, record.writing, record.writeLevel)],
          ]}
        />
      ),
    },
    {
      title: 'REFERENCE',
      hasData: references.length > 0,
      content: (
        <RecordList
          records={references}
          emptyLabel="References"
          fields={[
            ['Reference Name', (record) => firstValue(record.name, record.referenceName)],
            ['Designation', (record) => record.designation],
            ['Organization', (record) => firstValue(record.organization, record.company)],
            ['Contact Information', (record) => [record.email || record.referenceEmail, record.phone || record.referencePhone].filter(hasValue).join(' • ')],
          ]}
        />
      ),
    },
    {
      title: 'PERSONAL',
      hasData: [
        data.maritalStatus,
        data.nickName,
        personal.favoriteCake,
        personal.favoriteColor,
        personal.favoriteSong,
        personal.favoriteMovie,
        personal.favoriteFood,
        personal.favoriteActor,
        personal.dreamVacation,
        personal.weekendActivity,
        personal.coffeeOrTea,
        personal.favoriteSports,
      ].some(hasValue),
      content: (
        <FieldGrid fields={[
          ['Marital Status', data.maritalStatus],
          ['Nickname', data.nickName],
          ['Favorite Cake', personal.favoriteCake],
          ['Favorite Color', personal.favoriteColor],
          ['Favorite Song', personal.favoriteSong],
          ['Favorite Movie', personal.favoriteMovie],
          ['Favorite Food', personal.favoriteFood],
          ['Favorite Actor', personal.favoriteActor],
          ['Dream Vacation', personal.dreamVacation],
          ['Weekend Activity', personal.weekendActivity],
          ['Coffee or Tea', personal.coffeeOrTea],
          ['Favorite Sports', personal.favoriteSports],
        ]} />
      ),
    },
    {
      title: 'MEDICAL HISTORY',
      hasData: canViewSensitiveOnboarding && [
        health.healthIssues,
        health.allergies,
        data.allergies,
        health.currentMedications,
        data.currentMedications,
        health.anyTablets,
        health.bloodGroup,
        health.medicalAssistance,
        health.emergencyName,
        health.emergencyNumber,
        health.otherMedicalInformation,
        health.otherRelevantInformation,
        health.notes,
        data.otherMedicalInformation,
      ].some(hasValue),
      content: canViewSensitiveOnboarding ? (
        <FieldGrid fields={[
          ['Relevant Medical History', health.healthIssues],
          ['Allergies', firstValue(health.allergies, data.allergies)],
          ['Current Medications', firstValue(health.currentMedications, data.currentMedications)],
          ['Other relevant medical information', firstValue(health.otherMedicalInformation, health.otherRelevantInformation, health.notes, data.otherMedicalInformation)],
          ['Taking Medication', health.anyTablets],
          ['Blood Group', health.bloodGroup],
          ['Medical Assistance Needed', health.medicalAssistance],
          ['Emergency Contact Name', health.emergencyName],
          ['Emergency Contact Number', health.emergencyNumber],
        ]} />
      ) : (
        <p className="text-sm text-gray-500">Access restricted to HR.</p>
      ),
    },
    {
      title: 'DOCUMENT',
      hasData: canViewSensitiveOnboarding && (
        Boolean(profile.resumeUrl)
        || ['resume', 'education', 'professional', 'identity', 'other'].some((category) => getDocumentItems(category).length > 0)
      ),
      content: canViewSensitiveOnboarding ? (
        <div className="space-y-5">
          {renderDocuments('resume', 'Resume', true)}
          {renderDocuments('education', 'Educational Certificates')}
          {renderDocuments('professional', 'Professional Certificates')}
          {renderDocuments('identity', 'Identity Documents')}
          {renderDocuments('other', 'Other Supporting Documents')}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Access restricted to HR.</p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-md">
        <div className="flex items-center gap-4 bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold">
            {profile.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{profile.fullName}</h1>
            <p className="text-sm text-gray-300">
              {displayValue(profile.jobPosition)} <span aria-hidden="true">•</span> {displayValue(profile.employeeCode)}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-6">
          {sections.filter((section) => section.hasData).map((section, index) => (
            <details
              key={section.title}
              open={index === 0}
              className="group rounded-lg border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold tracking-wide text-gray-800 hover:bg-gray-50 sm:px-5">
                {section.title}
                <span className="text-lg text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true">
                  ▾
                </span>
              </summary>
              <div className="border-t border-gray-100 px-4 py-5 sm:px-5">
                {section.content}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
