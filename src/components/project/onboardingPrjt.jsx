import React, { useState } from 'react';
const ProjectOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [teamMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Project Manager' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Senior Developer' },
    { id: 3, name: 'Mike Johnson', email: 'mike@company.com', role: 'Designer' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@company.com', role: 'SEO Specialist' },
    { id: 5, name: 'David Brown', email: 'david@company.com', role: 'Content Writer' },
    { id: 6, name: 'Emily Davis', email: 'emily@company.com', role: 'SMM Expert' },
    { id: 7, name: 'Robert Wilson', email: 'robert@company.com', role: 'Video Editor' },
    { id: 8, name: 'Lisa Anderson', email: 'lisa@company.com', role: 'UI/UX Designer' },
  ]);
  const [formData, setFormData] = useState({
    projectName: '',
    companyName: '',
    projectManager: [],
    spoc: [],
    services: [],
  });
  const [serviceDetails, setServiceDetails] = useState({});
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showSpocDropdown, setShowSpocDropdown] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleManagerSelection = (member) => {
    setFormData(prev => {
      const current = prev.projectManager || [];
      if (current.includes(member)) {
        return { ...prev, projectManager: current.filter(m => m !== member) };
      } else {
        return { ...prev, projectManager: [...current, member] };
      }
    });
  };

  const toggleSpocSelection = (member) => {
    setFormData(prev => {
      const current = prev.spoc || [];
      if (current.includes(member)) {
        return { ...prev, spoc: current.filter(m => m !== member) };
      } else {
        return { ...prev, spoc: [...current, member] };
      }
    });
  };

  const removeManager = (member) => {
    setFormData(prev => ({
      ...prev,
      projectManager: prev.projectManager.filter(m => m !== member)
    }));
  };

  const removeSpoc = (member) => {
    setFormData(prev => ({
      ...prev,
      spoc: prev.spoc.filter(m => m !== member)
    }));
  };
  const handleServiceToggle = (service) => {
    setFormData(prev => {
      const currentServices = prev.services || [];
      if (currentServices.includes(service)) {
        // Remove service and its details
        const newServices = currentServices.filter(s => s !== service);
        setServiceDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          delete newDetails[service];
          return newDetails;
        });
        return { ...prev, services: newServices };
      } else {
        return { ...prev, services: [...currentServices, service] };
      }
    });
  };
  const handleServiceDetailChange = (service, field, value) => {
    setServiceDetails(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value
      }
    }));
  };

  const handlePlatformToggle = (service, platform) => {
    setServiceDetails(prev => {
      const current = prev[service] || {};
      const currentPlatforms = current.platforms || [];
      let newPlatforms;
      if (currentPlatforms.includes(platform)) {
        newPlatforms = currentPlatforms.filter(p => p !== platform);
      } else {
        newPlatforms = [...currentPlatforms, platform];
      }
      return {
        ...prev,
        [service]: {
          ...current,
          platforms: newPlatforms
        }
      };
    });
  };

  const handleSubServiceToggle = (service, subService) => {
    setServiceDetails(prev => {
      const current = prev[service] || {};
      const currentSubs = current.subServices || [];
      let newSubs;
      if (currentSubs.includes(subService)) {
        newSubs = currentSubs.filter(s => s !== subService);
      } else {
        newSubs = [...currentSubs, subService];
      }
      return {
        ...prev,
        [service]: {
          ...current,
          subServices: newSubs
        }
      };
    });
  };
  const renderServiceFields = (service) => {
    const details = serviceDetails[service] || {};
    if (service === 'Website') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technology <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['WordPress', 'Shopify', 'Custom'].map(tech => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleServiceDetailChange(service, 'technology', tech)}
                  className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                    details.technology === tech
                      ? 'border-blue-600 bg-blue-100 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
          {details.technology === 'WordPress' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-1">
                  {['Theme', 'Custom'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleServiceDetailChange(service, 'wpType', type)}
                      className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                        details.wpType === type
                          ? 'border-blue-600 bg-blue-100 text-blue-700 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {details.wpType === 'Theme' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={details.themeName || ''}
                    onChange={(e) => handleServiceDetailChange(service, 'themeName', e.target.value)}
                    placeholder="Enter theme name"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}
              {details.wpType === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customization Details <span className="text-red-500">*</span></label>
                  <textarea
                    value={details.customDetails || ''}
                    onChange={(e) => handleServiceDetailChange(service, 'customDetails', e.target.value)}
                    placeholder="Describe custom features..."
                    rows="2"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}
            </>
          )}
          {details.technology === 'Shopify' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-1">
                  {['Theme', 'Custom'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleServiceDetailChange(service, 'shopifyType', type)}
                      className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                        details.shopifyType === type
                          ? 'border-blue-600 bg-blue-100 text-blue-700 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {details.shopifyType === 'Theme' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={details.shopifyThemeName || ''}
                    onChange={(e) => handleServiceDetailChange(service, 'shopifyThemeName', e.target.value)}
                    placeholder="Enter theme name"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}
              {details.shopifyType === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customization Details <span className="text-red-500">*</span></label>
                  <textarea
                    value={details.shopifyCustomDetails || ''}
                    onChange={(e) => handleServiceDetailChange(service, 'shopifyCustomDetails', e.target.value)}
                    placeholder="Describe custom features..."
                    rows="2"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}
            </>
          )}
          {details.technology === 'Custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={details.techStack || ''}
                  onChange={(e) => handleServiceDetailChange(service, 'techStack', e.target.value)}
                  placeholder="e.g., React + Node.js"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements <span className="text-red-500">*</span></label>
                <textarea
                  value={details.customRequirements || ''}
                  onChange={(e) => handleServiceDetailChange(service, 'customRequirements', e.target.value)}
                  placeholder="Describe requirements..."
                  rows="2"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </>
          )}

          
        </div>
      );
    }
    if (service === 'SEO') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Count <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={details.keywordCount || ''}
                onChange={(e) => handleServiceDetailChange(service, 'keywordCount', e.target.value)}
                placeholder="Keywords"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blog Count <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={details.blogCount || ''}
                onChange={(e) => handleServiceDetailChange(service, 'blogCount', e.target.value)}
                placeholder="Blogs"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      );
    }
    if (service === 'SMM') {
      const subServices = details.subServices || [];
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Services <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border-2 transition-all ${subServices.includes('Reels') ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subServices.includes('Reels')}
                    onChange={() => handleSubServiceToggle(service, 'Reels')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700 text-sm">Reels</span>
                </label>
                {subServices.includes('Reels') && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={details.reelsCount || ''}
                      onChange={(e) => handleServiceDetailChange(service, 'reelsCount', e.target.value)}
                      placeholder="Count"
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>
              <div className={`p-2 rounded-lg border-2 transition-all ${subServices.includes('Poster') ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subServices.includes('Poster')}
                    onChange={() => handleSubServiceToggle(service, 'Poster')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700 text-sm">Poster</span>
                </label>
                {subServices.includes('Poster') && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={details.posterCount || ''}
                      onChange={(e) => handleServiceDetailChange(service, 'posterCount', e.target.value)}
                      placeholder="Count"
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      );
    }
    if (service === 'Ads') {
      const platforms = details.platforms || [];
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-1">
              {['Google', 'Meta', 'LinkedIn'].map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(service, platform)}
                  className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                    platforms.includes(platform)
                      ? 'border-blue-600 bg-blue-100 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
            {platforms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {platforms.map(platform => (
                  <span key={platform} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {platform} ✓
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    if (service === 'Web App') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={details.techStack || ''}
              onChange={(e) => handleServiceDetailChange(service, 'techStack', e.target.value)}
              placeholder="e.g., React, Node.js"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
            <textarea
              value={details.features || ''}
              onChange={(e) => handleServiceDetailChange(service, 'features', e.target.value)}
              placeholder="List key features..."
              rows="2"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      );
    }
    return null;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const fullData = {
      ...formData,
      serviceDetails: serviceDetails
    };
    console.log('Project Data:', fullData);
    alert('Project onboarded successfully!');
  };

  const selectedServicesCount = (formData.services || []).length;

  // Custom Dropdown Component for Project Manager
  const ManagerDropdown = () => (
    <div className="relative">
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px] flex items-center flex-wrap gap-1"
        onClick={() => setShowManagerDropdown(!showManagerDropdown)}
      >
        {formData.projectManager.length > 0 ? (
          formData.projectManager.map((name, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeManager(name);
                }}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">Select Project Manager</span>
        )}
        <span className="ml-auto text-gray-400">▼</span>
      </div>
      
      {showManagerDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {teamMembers.map((member) => (
            <label
              key={member.id}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                formData.projectManager.includes(member.name) ? 'bg-blue-50' : ''
              }`}
              onClick={() => toggleManagerSelection(member.name)}
            >
              <input
                type="checkbox"
                checked={formData.projectManager.includes(member.name)}
                onChange={() => {}}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">{member.name}</div>
                <div className="text-xs text-gray-500">{member.role}</div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  // Custom Dropdown Component for SPOC
  const SpocDropdown = () => (
    <div className="relative">
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px] flex items-center flex-wrap gap-1"
        onClick={() => setShowSpocDropdown(!showSpocDropdown)}
      >
        {formData.spoc.length > 0 ? (
          formData.spoc.map((name, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSpoc(name);
                }}
                className="hover:text-green-900"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">Select SPOC</span>
        )}
        <span className="ml-auto text-gray-400">▼</span>
      </div>
      
      {showSpocDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {teamMembers.map((member) => (
            <label
              key={member.id}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                formData.spoc.includes(member.name) ? 'bg-green-50' : ''
              }`}
              onClick={() => toggleSpocSelection(member.name)}
            >
              <input
                type="checkbox"
                checked={formData.spoc.includes(member.name)}
                onChange={() => {}}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">{member.name}</div>
                <div className="text-xs text-gray-500">{member.role}</div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        {/* <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">🚀 Project Onboarding</h1>
          <p className="text-sm text-gray-500">Onboard new projects with required services</p>
        </div> */}

        <div className="flex gap-4">
          {/* Left Sidebar - Services */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4 max-h-[calc(80vh-100px)] overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Selected Services</h3>
              {formData.services && formData.services.length > 0 ? (
                <div className="space-y-1">
                  {formData.services.map(service => (
                    <div key={service} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-sm text-gray-700">{service}</span>
                      <button
                        type="button"
                        onClick={() => handleServiceToggle(service)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No services selected</p>
              )}
              
              {/* Progress */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{selectedServicesCount}/15</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min((selectedServicesCount / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
                {/* Project Details */}
                <div>
                 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-2 gap-4'>
                    {/* Project Manager */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        👤 Project Manager <span className="text-red-500">*</span>
                    </label>
                    <ManagerDropdown />
                    </div>

                    {/* SPOC */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        📞 SPOC <span className="text-red-500">*</span>
                    </label>
                    <SpocDropdown />
                    </div>
                </div>

                {/* Required Services */}
                <div>
                  <h2 className="text-md font-semibold text-gray-800 mb-3">🛠️ Required Services</h2>
                  
                  {/* Digital Marketing */}
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">📊 Digital Marketing</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {['Website', 'SEO', 'SMM', 'Ads', 'Web App'].map(service => (
                        <label key={service} className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all text-sm ${
                          (formData.services || []).includes(service)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}>
                          <input
                            type="checkbox"
                            checked={(formData.services || []).includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-700">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Media */}
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">🎬 Media</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Videography', 'Video Editing', 'Photography', 'Video Production'].map(service => (
                        <label key={service} className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all text-sm ${
                          (formData.services || []).includes(service)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}>
                          <input
                            type="checkbox"
                            checked={(formData.services || []).includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-700">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Design */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">🎨 Design</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {['Branding Logo', 'Brochure', 'Pamphlet', 'Social Media Designs', 'Marking collateral', 'UI/UX designer'].map(service => (
                        <label key={service} className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all text-sm ${
                          (formData.services || []).includes(service)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}>
                          <input
                            type="checkbox"
                            checked={(formData.services || []).includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-700">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                {formData.services && formData.services.length > 0 && (
                  <div>
                    <h2 className="text-md font-semibold text-gray-800 mb-3">📝 Service Details</h2>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {formData.services
                        .filter(service => ['Website', 'SEO', 'SMM', 'Ads', 'Web App'].includes(service))
                        .map(service => (
                          <div key={service} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                              <h4 className="text-sm font-semibold text-gray-800">{service}</h4>
                              <span className="text-xs text-gray-400">Required</span>
                            </div>
                            <div className="p-3">
                              {renderServiceFields(service)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
                  >
                    <span>🚀</span> Onboard Project
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProjectOnboarding;