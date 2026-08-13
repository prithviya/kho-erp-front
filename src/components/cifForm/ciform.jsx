import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../assets/kho.webp';
import onboardingService from '../../services/onboarding.service';
const ciform = () => {
  const navigate = useNavigate();
  const [personalformData, setpersonalFormData] = useState({
    // Personal Information
    jobPosition: '', fullName: '', email: '', phone: '', dateOfBirth: '', city: '', pinCode: '', gender: 'Prefer not to say', portfolioLink: '', resume: null, consent: false
  });
    // Professional & Academic
    const [educationformData, seteducationFormData] = useState([{ degree: '', university: '', year: '', grade: '', city: '' }]);
    
    // Work Experience
    const [workformData, setworkFormData] = useState([{ employer: '', location: '', jobTitle: '', startDate: '', endDate: '' }]);
    
    // Skills & Training
    const [skillformData, setskillFormData] = useState ([{ skill: '', level: '', year: '', institute: '' }]);
    
    // Software & Tools
    const [toolformData, settoolFormData] = useState ([{ name: '', proficiency: 'Good' }]);
    
    // Language Proficiency
    const [langformData, setlangFormData] = useState ([{ language: '', speak: 'Basic', read: 'Basic', write: 'Basic' }]);
    
    // References
    const [refformData, setrefFormData] = useState ([{ name: '', company: '', designation: '', email: '', phone: '' }]);
  
  const [submitting, setSubmitting] = useState(false);

  console.log('educationformData',educationformData);
  

  const getInitialState = () => ({
    jobPosition: 'Video Editor',
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    city: '',
    pinCode: '',
    gender: 'Prefer not to say',
    portfolioLink: '',
    resume: null,
    education: [{ degree: '', university: '', year: '', grade: '', city: '' }],
    workExperience: [{ employer: '', location: '', jobTitle: '', startDate: '', endDate: '' }],
    skills: [{ skill: '', level: '', year: '', institute: '' }],
    softwareTools: [{ name: '', proficiency: 'Good' }],
    languages: [{ language: '', speak: 'Basic', read: 'Basic', write: 'Basic' }],
    references: [{ name: '', company: '', designation: '', email: '', phone: '' }],
    consent: false,
  }); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setpersonalFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleArrayChange = (section, index, field, value) => {
    const updated = [...personalFormData[section]];
    updated[index][field] = value;
    setpersonalFormData((prev) => ({ ...prev, [section]: updated }));
  };

  const addItem = (section, template) => {
    setpersonalFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], template],
    }));
  };

  const removeItem = (section, index) => {
    if (personalFormData[section].length <= 1) return;
    const updated = personalFormData[section].filter((_, i) => i !== index);
    setpersonalFormData((prev) => ({ ...prev, [section]: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onboardingService.create({
        ...personalformData,
        status: 'Onboarding',
      });
      toast.success('Employee profile submitted successfully.');
      setpersonalFormData(getInitialState());
      navigate('/employee');
    } catch (error) {
      toast.error(error.message || 'Unable to submit employee profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    setpersonalFormData((prev) => ({ ...prev, resume: e.target.files[0] }));
  };

  const renderSection = (title, children) => (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );

  const renderField = (label, name, type = 'text', required = false, placeholder = '') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={personalformData[name] || ''}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-2">
          <img src={Logo} alt="Company Logo" className="mx-auto" style={{ width: '100px', height: '50px' }} />
        </div>

        {/* Important Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 roundedp-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Important Note:</span> This application is used only for the company's interview process. We do not store your personal details unless you are selected and offered a job. All information provided is collected with your full consent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8  overflow-y-auto h-[70vh]">
          {/* PERSONAL INFORMATION */}
          {renderSection('PERSONAL INFORMATION',
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                  JOB POSITION (DESIGNATION) <span className="text-red-500">*</span>
                </label>
                <select
                  name="jobPosition"
                  value={personalformData.jobPosition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Video Editor</option>
                  <option>Graphic Designer</option>
                  <option>Web Developer</option>
                  <option>Digital Marketer</option>
                  <option>Social Media Manager</option>
                </select> */}
              </div>
              {renderField('FULL NAME', 'fullName', 'text', true, 'e.g., Lee Min-ho')}
              {renderField('EMAIL', 'email', 'email', true, 'candidate@example.com')}
              {renderField('PHONE NUMBER', 'phone', 'tel', true, '+44 1234 567890')}
              {renderField('DATE OF BIRTH', 'dateOfBirth', 'date', false, 'dd-mm-yyyy')}
              {renderField('CITY', 'city', 'text', false, 'e.g., London')}
              {renderField('PIN CODE', 'pinCode', 'text', false, 'Postal code')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GENDER</label>
                <select
                  name="gender"
                  value={personalformData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Prefer not to say</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              {renderField('PORTFOLIO LINK', 'portfolioLink', 'url', false, 'behance.net or dribbble.com link')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RESUME
                  <span className="text-xs text-gray-500 ml-2">(PDF, DOC, DOCX (Max 5MB))</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
              </div>
            </div>
          )}

          {/* PROFESSIONAL & ACADEMIC */}
          {renderSection('PROFESSIONAL & ACADEMIC',
            <div>
              {educationformData.map((edu, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem('education', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree / Course</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)}
                      placeholder="e.g., BSc Computer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University / Institute</label>
                    <input
                      type="text"
                      value={edu.university}
                      onChange={(e) => handleArrayChange('education', index, 'university', e.target.value)}
                      placeholder="University name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Graduate</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)}
                      placeholder="2022"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <input
                      type="text"
                      value={edu.grade}
                      onChange={(e) => handleArrayChange('education', index, 'grade', e.target.value)}
                      placeholder="First class / 8.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={edu.city}
                      onChange={(e) => handleArrayChange('education', index, 'city', e.target.value)}
                      placeholder="Manchester"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem('education', { degree: '', university: '', year: '', grade: '', city: '' })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add another degree/course
              </button>
            </div>
          )}

          {/* WORK EXPERIENCE */}
          {renderSection('WORK EXPERIENCE',
            <div>
              {workformData.map((work, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem('workExperience', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                    <input
                      type="text"
                      value={work.employer}
                      onChange={(e) => handleArrayChange('workExperience', index, 'employer', e.target.value)}
                      placeholder="Company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={work.location}
                      onChange={(e) => handleArrayChange('workExperience', index, 'location', e.target.value)}
                      placeholder="City, Country"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={work.jobTitle}
                      onChange={(e) => handleArrayChange('workExperience', index, 'jobTitle', e.target.value)}
                      placeholder="Role"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={work.startDate}
                      onChange={(e) => handleArrayChange('workExperience', index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={work.endDate}
                      onChange={(e) => handleArrayChange('workExperience', index, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem('workExperience', { employer: '', location: '', jobTitle: '', startDate: '', endDate: '' })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add work experience
              </button>
            </div>
          )}

          {/* SKILLS & TRAINING */}
          {renderSection('SKILLS & TRAINING',
            <div>
              <p className="text-sm text-gray-500 mb-4">Skill & Training Achievement(s)</p>
              {skillformData.map((skill, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem('skills', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                    <input
                      type="text"
                      value={skill.skill}
                      onChange={(e) => handleArrayChange('skills', index, 'skill', e.target.value)}
                      placeholder="e.g., Data Analysis, Leadership"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <select
                      value={skill.level}
                      onChange={(e) => handleArrayChange('skills', index, 'level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={skill.year}
                      onChange={(e) => handleArrayChange('skills', index, 'year', e.target.value)}
                      placeholder="2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                    <input
                      type="text"
                      value={skill.institute}
                      onChange={(e) => handleArrayChange('skills', index, 'institute', e.target.value)}
                      placeholder="Institution name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem('skills', { skill: '', level: 'Beginner', year: '', institute: '' })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add skill / training
              </button>
            </div>
          )}

          {/* SOFTWARE & TOOLS */}
          {renderSection('SOFTWARE & TOOLS PROFICIENCY',
            <div>
              <p className="text-sm text-gray-500 mb-4">
                e.g., Photoshop, Illustrator, Canva, Google Ads, Meta Ads Manager, SEO Tools, WordPress, WooCommerce, Shopify, Google Analytics, Google Tag Manager, SEMrush, Ahrefs, HubSpot, Mailchimp, Social Media Scheduling, Premiere Pro, CapCut etc.
              </p>
              {toolformData.map((tool, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative items-end">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem('softwareTools', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Software & Tools</label>
                    <input
                      type="text"
                      value={tool.name}
                      onChange={(e) => handleArrayChange('softwareTools', index, 'name', e.target.value)}
                      placeholder="e.g., Google Analytics"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
                    <select
                      value={tool.proficiency}
                      onChange={(e) => handleArrayChange('softwareTools', index, 'proficiency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Average</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem('softwareTools', { name: '', proficiency: 'Good' })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add software/tool
              </button>
            </div>
          )}

          {/* LANGUAGE PROFICIENCY */}
          {renderSection('LANGUAGE PROFICIENCY',
            <div>
              {langformData.map((lang, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem('languages', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => handleArrayChange('languages', index, 'language', e.target.value)}
                      placeholder="e.g., English, Spanish"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speak</label>
                    <select
                      value={lang.speak}
                      onChange={(e) => handleArrayChange('languages', index, 'speak', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Basic</option>
                      <option>Intermediate</option>
                      <option>Fluent</option>
                      <option>Native</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Read</label>
                    <select
                      value={lang.read}
                      onChange={(e) => handleArrayChange('languages', index, 'read', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Basic</option>
                      <option>Intermediate</option>
                      <option>Fluent</option>
                      <option>Native</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Write</label>
                    <select
                      value={lang.write}
                      onChange={(e) => handleArrayChange('languages', index, 'write', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Basic</option>
                      <option>Intermediate</option>
                      <option>Fluent</option>
                      <option>Native</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem('languages', { language: '', speak: 'Basic', read: 'Basic', write: 'Basic' })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add language
              </button>
            </div>
          )}

          {/* REFERENCES */}
          {renderSection('REFERENCE',
            <div>
              {refformData.map((ref, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4 relative">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem('references', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => handleArrayChange('references', index, 'name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company / Institution</label>
                    <input
                      type="text"
                      value={ref.company}
                      onChange={(e) => handleArrayChange('references', index, 'company', e.target.value)}
                      placeholder="Company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={ref.designation}
                      onChange={(e) => handleArrayChange('references', index, 'designation', e.target.value)}
                      placeholder="Job title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={ref.email}
                      onChange={(e) => handleArrayChange('references', index, 'email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={ref.phone}
                      onChange={(e) => handleArrayChange('references', index, 'phone', e.target.value)}
                      placeholder="Phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              
            </div>
          )}

          {/* Consent */}
          <div className="pt-6 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="consent"
                checked={personalformData.consent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                I confirm that all information provided in this application is accurate and given with my full consent for the purpose of the interview process.
                <br />
                <span className="text-xs text-gray-500">Your data is handled as per the important note above. Only used for interview evaluation.</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="reset"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={!personalformData.consent || submitting}
              className={`px-6 py-2 rounded-md text-white transition-colors duration-200 ${
                personalformData.consent && !submitting
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ciform;