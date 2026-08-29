import React, { useState } from 'react';

const AssignTask = () => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

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

  // Assigned projects data
  const [assignedProjects, setAssignedProjects] = useState([
    {
      id: 1,
      projectName: 'E-Commerce Website',
      companyName: 'Tech Solutions Pvt Ltd',
      projectManager: ['John Doe', 'Jane Smith'],
      spoc: ['Sarah Williams'],
      services: ['Website', 'SEO', 'SMM'],
      serviceDetails: {
        'Website': {
          technology: 'WordPress',
          wpType: 'Theme',
          themeName: 'Astra',
          pages: '5'
        },
        'SEO': {
          keywordCount: '50',
          blogCount: '10'
        },
        'SMM': {
          subServices: ['Reels', 'Poster'],
          reelsCount: '20',
          posterCount: '15',
        }
      },
      createdAt: '2026-07-20',
      assignedTo: ['Emily Davis', 'David Brown'],
      reportingHead: 'John Doe'
    },
    {
      id: 2,
      projectName: 'Mobile App Development',
      companyName: 'Innovate Labs',
      projectManager: ['Mike Johnson'],
      spoc: ['Emily Davis', 'Lisa Anderson'],
      services: ['Web App', 'UI/UX designer'],
      serviceDetails: {
        'Web App': {
          techStack: 'React Native, Node.js',
          features: 'User Authentication, Push Notifications, Payment Integration'
        },
        'UI/UX designer': {}
      },
      createdAt: '2026-07-15',
      assignedTo: ['Robert Wilson'],
      reportingHead: 'Mike Johnson'
    },
    {
      id: 3,
      projectName: 'Branding Campaign',
      companyName: 'Creative Agency',
      projectManager: ['Jane Smith'],
      spoc: ['David Brown'],
      services: ['Branding Logo', 'Brochure', 'Social Media Designs'],
      serviceDetails: {},
      createdAt: '2026-07-10',
      assignedTo: ['Lisa Anderson'],
      reportingHead: 'Jane Smith'
    }
  ]);

  const [formData, setFormData] = useState({
    projectName: '',
    companyName: '',
    projectManager: [],
    spoc: [],
    services: [],
    assignedTo: [],
    reportingHead: '',
  });

  const [serviceDetails, setServiceDetails] = useState({});
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showSpocDropdown, setShowSpocDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

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

  const toggleAssignSelection = (member) => {
    setFormData(prev => {
      const current = prev.assignedTo || [];
      if (current.includes(member)) {
        return { ...prev, assignedTo: current.filter(m => m !== member) };
      } else {
        return { ...prev, assignedTo: [...current, member] };
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

  const removeAssign = (member) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.filter(m => m !== member)
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => {
      const currentServices = prev.services || [];
      if (currentServices.includes(service)) {
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

  const renderServiceFields = (service, isView = false) => {
    const details = isView ? selectedProject?.serviceDetails?.[service] || {} : serviceDetails[service] || {};
    
    if (service === 'Website') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
            <div className="grid grid-cols-3 gap-1">
              {['WordPress', 'Shopify', 'Custom'].map(tech => (
                <div key={tech} className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium text-center ${
                  details.technology === tech
                    ? 'border-blue-600 bg-blue-100 text-blue-700'
                    : 'border-gray-300 bg-gray-50 text-gray-500'
                }`}>
                  {tech}
                </div>
              ))}
            </div>
          </div>
          {details.technology === 'WordPress' && details.wpType && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-1">
                  <div className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium text-center ${
                    details.wpType === 'Theme'
                      ? 'border-blue-600 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-gray-50 text-gray-500'
                  }`}>
                    Theme
                  </div>
                  <div className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium text-center ${
                    details.wpType === 'Custom'
                      ? 'border-blue-600 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-gray-50 text-gray-500'
                  }`}>
                    Custom
                  </div>
                </div>
              </div>
              {details.wpType === 'Theme' && details.themeName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.themeName}</div>
                </div>
              )}
              {details.wpType === 'Custom' && details.customDetails && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customization Details</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm whitespace-pre-wrap">{details.customDetails}</div>
                </div>
              )}
            </>
          )}
          {details.technology === 'Shopify' && details.shopifyType && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-1">
                  <div className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium text-center ${
                    details.shopifyType === 'Theme'
                      ? 'border-blue-600 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-gray-50 text-gray-500'
                  }`}>
                    Theme
                  </div>
                  <div className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium text-center ${
                    details.shopifyType === 'Custom'
                      ? 'border-blue-600 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-gray-50 text-gray-500'
                  }`}>
                    Custom
                  </div>
                </div>
              </div>
              {details.shopifyType === 'Theme' && details.shopifyThemeName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.shopifyThemeName}</div>
                </div>
              )}
              {details.shopifyType === 'Custom' && details.shopifyCustomDetails && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customization Details</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm whitespace-pre-wrap">{details.shopifyCustomDetails}</div>
                </div>
              )}
            </>
          )}
          {details.technology === 'Custom' && (
            <>
              {details.techStack && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technology Stack</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.techStack}</div>
                </div>
              )}
              {details.customRequirements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Requirements</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm whitespace-pre-wrap">{details.customRequirements}</div>
                </div>
              )}
            </>
          )}
          {details.pages && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pages</label>
              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.pages}</div>
            </div>
          )}
        </div>
      );
    }

    if (service === 'SEO') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Count</label>
              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.keywordCount || '0'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blog Count</label>
              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.blogCount || '0'}</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Services</label>
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border-2 ${subServices.includes('Reels') ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 text-sm">Reels</span>
                  {subServices.includes('Reels') && <span className="text-xs text-blue-600">✓</span>}
                </div>
                {subServices.includes('Reels') && details.reelsCount && (
                  <div className="mt-1 text-sm text-gray-600">Count: {details.reelsCount}</div>
                )}
              </div>
              <div className={`p-2 rounded-lg border-2 ${subServices.includes('Poster') ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 text-sm">Poster</span>
                  {subServices.includes('Poster') && <span className="text-xs text-blue-600">✓</span>}
                </div>
                {subServices.includes('Poster') && details.posterCount && (
                  <div className="mt-1 text-sm text-gray-600">Count: {details.posterCount}</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
            <div className="flex flex-wrap gap-1">
              {['Google', 'Meta', 'LinkedIn'].map(platform => (
                <div key={platform} className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium ${
                  platforms.includes(platform)
                    ? 'border-blue-600 bg-blue-100 text-blue-700'
                    : 'border-gray-300 bg-gray-50 text-gray-500'
                }`}>
                  {platform} {platforms.includes(platform) && '✓'}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (service === 'Web App') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {details.techStack && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technology Stack</label>
              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm">{details.techStack}</div>
            </div>
          )}
          {details.features && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm whitespace-pre-wrap">{details.features}</div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderServiceFieldsEdit = (service) => {
    const details = serviceDetails[service] || {};
    
    if (service === 'Website') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technology <span className="text-red-500">*</span></label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pages <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={details.pages || ''}
              onChange={(e) => handleServiceDetailChange(service, 'pages', e.target.value)}
              placeholder="Enter pages"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
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

  const handleView = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleEdit = (project, index) => {
    setSelectedProject(project);
    setEditIndex(index);
    setFormData({
      projectName: project.projectName,
      companyName: project.companyName,
      projectManager: project.projectManager || [],
      spoc: project.spoc || [],
      services: project.services || [],
      assignedTo: project.assignedTo || [],
      reportingHead: project.reportingHead || '',
    });
    setServiceDetails(project.serviceDetails || {});
    setShowEditModal(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedProjects = [...assignedProjects];
    updatedProjects[editIndex] = {
      ...updatedProjects[editIndex],
      projectName: formData.projectName,
      companyName: formData.companyName,
      projectManager: formData.projectManager,
      spoc: formData.spoc,
      services: formData.services,
      serviceDetails: serviceDetails,
      assignedTo: formData.assignedTo,
      reportingHead: formData.reportingHead,
    };
    setAssignedProjects(updatedProjects);
    setShowEditModal(false);
    setSelectedProject(null);
    setEditIndex(null);
  };

  // Custom Dropdown Component for Project Manager
  const ManagerDropdown = ({ value, onChange, onRemove }) => (
    <div className="relative">
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px] flex items-center flex-wrap gap-1"
        onClick={() => setShowManagerDropdown(!showManagerDropdown)}
      >
        {value && value.length > 0 ? (
          value.map((name, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(name);
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
                value && value.includes(member.name) ? 'bg-blue-50' : ''
              }`}
              onClick={() => onChange(member.name)}
            >
              <input
                type="checkbox"
                checked={value && value.includes(member.name)}
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
  const SpocDropdown = ({ value, onChange, onRemove }) => (
    <div className="relative">
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px] flex items-center flex-wrap gap-1"
        onClick={() => setShowSpocDropdown(!showSpocDropdown)}
      >
        {value && value.length > 0 ? (
          value.map((name, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(name);
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
                value && value.includes(member.name) ? 'bg-green-50' : ''
              }`}
              onClick={() => onChange(member.name)}
            >
              <input
                type="checkbox"
                checked={value && value.includes(member.name)}
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

  // Custom Dropdown Component for Assign To
  const AssignDropdown = ({ value, onChange, onRemove }) => (
    <div className="relative">
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white min-h-[42px] flex items-center flex-wrap gap-1"
        onClick={() => setShowAssignDropdown(!showAssignDropdown)}
      >
        {value && value.length > 0 ? (
          value.map((name, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              {name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(name);
                }}
                className="hover:text-purple-900"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">Select Team Members</span>
        )}
        <span className="ml-auto text-gray-400">▼</span>
      </div>
      
      {showAssignDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {teamMembers.map((member) => (
            <label
              key={member.id}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                value && value.includes(member.name) ? 'bg-purple-50' : ''
              }`}
              onClick={() => onChange(member.name)}
            >
              <input
                type="checkbox"
                checked={value && value.includes(member.name)}
                onChange={() => {}}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}
          >
            All Tasks
          </button>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporting Head</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SPOC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedProjects
                  .filter(project => {
                    if (activeTab === 'all') return true;
                    return true;
                  })
                  .map((project, index) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{project.projectName}</p>
                        <p className="text-xs text-gray-500">{project.companyName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {project.assignedTo && project.assignedTo.map((name, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{project.reportingHead || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {project.spoc && project.spoc.map((name, i) => (
                            <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              {name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {project.services && project.services.map((service, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                              {service}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(project)}
                            className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(project, index)}
                            className="px-3 py-1 bg-orange-200 text-orange-700 text-xs rounded-md hover:bg-orange-300 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {assignedProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900">No tasks assigned</h3>
              <p className="text-sm text-gray-500">You don't have any assigned projects yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowViewModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">📋 Task Details</h2>
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
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Name</label>
                    <p className="text-gray-900 font-medium">{selectedProject.projectName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                    <p className="text-gray-900">{selectedProject.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Manager</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProject.projectManager && selectedProject.projectManager.map((name, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">SPOC</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProject.spoc && selectedProject.spoc.map((name, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reporting Head</label>
                    <p className="text-gray-900">{selectedProject.reportingHead || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProject.assignedTo && selectedProject.assignedTo.map((name, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-gray-900">{selectedProject.createdAt}</p>
                  </div>
                </div>

                <h3 className="text-md font-semibold text-gray-800 mb-3">🛠️ Services</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedProject.services && selectedProject.services.map((service, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {service}
                    </span>
                  ))}
                </div>

                <h3 className="text-md font-semibold text-gray-800 mb-3">📝 Service Details</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedProject.services
                    .filter(service => ['Website', 'SEO', 'SMM', 'Ads', 'Web App'].includes(service))
                    .map(service => (
                      <div key={service} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-800">{service}</h4>
                        </div>
                        <div className="p-3">
                          {renderServiceFields(service, true)}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
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
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              setShowEditModal(false);
              setSelectedProject(null);
              setEditIndex(null);
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">✏️ Edit Task</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProject(null);
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
                  <div className="space-y-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👤 Project Manager <span className="text-red-500">*</span>
                      </label>
                      <ManagerDropdown 
                        value={formData.projectManager}
                        onChange={toggleManagerSelection}
                        onRemove={removeManager}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📞 SPOC <span className="text-red-500">*</span>
                      </label>
                      <SpocDropdown 
                        value={formData.spoc}
                        onChange={toggleSpocSelection}
                        onRemove={removeSpoc}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👥 Assigned To <span className="text-red-500">*</span>
                      </label>
                      <AssignDropdown 
                        value={formData.assignedTo}
                        onChange={toggleAssignSelection}
                        onRemove={removeAssign}
                      />
                      <p className="text-xs text-gray-400 mt-1">💡 Select team members assigned to this project</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📋 Reporting Head <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="reportingHead"
                        value={formData.reportingHead}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Reporting Head</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.name}>{member.name} - {member.role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🛠️ Services</label>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Digital Marketing</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                            {['Website', 'SEO', 'SMM', 'Ads', 'Web App'].map(service => (
                              <label key={service} className={`flex items-center gap-1 px-2 py-1 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all text-xs ${
                                (formData.services || []).includes(service)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={(formData.services || []).includes(service)}
                                  onChange={() => handleServiceToggle(service)}
                                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-medium text-gray-700">{service}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Media</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                            {['Videography', 'Video Editing', 'Photography', 'Video Production'].map(service => (
                              <label key={service} className={`flex items-center gap-1 px-2 py-1 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all text-xs ${
                                (formData.services || []).includes(service)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={(formData.services || []).includes(service)}
                                  onChange={() => handleServiceToggle(service)}
                                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-medium text-gray-700">{service}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Design</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
                            {['Branding Logo', 'Brochure', 'Pamphlet', 'Social Media Designs', 'Marking collateral', 'UI/UX designer'].map(service => (
                              <label key={service} className={`flex items-center gap-1 px-2 py-1 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all text-xs ${
                                (formData.services || []).includes(service)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={(formData.services || []).includes(service)}
                                  onChange={() => handleServiceToggle(service)}
                                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-medium text-gray-700">{service}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {formData.services && formData.services.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📝 Service Details</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {formData.services
                            .filter(service => ['Website', 'SEO', 'SMM', 'Ads', 'Web App'].includes(service))
                            .map(service => (
                              <div key={service} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-800">{service}</h4>
                                </div>
                                <div className="p-2">
                                  {renderServiceFieldsEdit(service)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedProject(null);
                        setEditIndex(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                    >
                      Update Task
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

export default AssignTask;