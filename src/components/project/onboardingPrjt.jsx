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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleMultiSelect = (e, field) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, [field]: selected }));
  };
  const handleServiceToggle = (service) => {
    setFormData(prev => {
      const currentServices = prev.services || [];
      if (currentServices.includes(service)) {
        return { ...prev, services: currentServices.filter(s => s !== service) };
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
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technology <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'technology', 'WordPress')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.technology === 'WordPress'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
                  </svg>
                  WordPress
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'technology', 'Shopify')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.technology === 'Shopify'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
                  </svg>
                  Shopify
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'technology', 'Custom')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.technology === 'Custom'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
                  </svg>
                  Custom
                </div>
              </button>
            </div>
          </div>
          {details.technology === 'WordPress' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleServiceDetailChange(service, 'wpType', 'Theme')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    details.wpType === 'Theme'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">Theme</span>
                    <span className="text-xs text-gray-500">Use pre-built theme</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleServiceDetailChange(service, 'wpType', 'Custom')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    details.wpType === 'Custom'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">Custom</span>
                    <span className="text-xs text-gray-500">Custom theme development</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          {details.technology === 'WordPress' && details.wpType === 'Theme' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={details.themeName || ''}
                onChange={(e) => handleServiceDetailChange(service, 'themeName', e.target.value)}
                placeholder="Enter theme name (e.g., Astra, Divi, GeneratePress)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {details.technology === 'WordPress' && details.wpType === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customization Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={details.customDetails || ''}
                onChange={(e) => handleServiceDetailChange(service, 'customDetails', e.target.value)}
                placeholder="Describe the custom features and functionality needed..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {details.technology === 'Shopify' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleServiceDetailChange(service, 'shopifyType', 'Theme')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    details.shopifyType === 'Theme'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">Theme</span>
                    <span className="text-xs text-gray-500">Use pre-built theme</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleServiceDetailChange(service, 'shopifyType', 'Custom')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    details.shopifyType === 'Custom'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">Custom</span>
                    <span className="text-xs text-gray-500">Custom development</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          {details.technology === 'Shopify' && details.shopifyType === 'Theme' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={details.shopifyThemeName || ''}
                onChange={(e) => handleServiceDetailChange(service, 'shopifyThemeName', e.target.value)}
                placeholder="Enter theme name (e.g., Dawn, Brooklyn, Debut)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {details.technology === 'Shopify' && details.shopifyType === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customization Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={details.shopifyCustomDetails || ''}
                onChange={(e) => handleServiceDetailChange(service, 'shopifyCustomDetails', e.target.value)}
                placeholder="Describe the custom features and functionality needed..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {details.technology === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technology Stack <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={details.techStack || ''}
                onChange={(e) => handleServiceDetailChange(service, 'techStack', e.target.value)}
                placeholder="e.g., React + Node.js, PHP + MySQL, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {details.technology === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                value={details.customRequirements || ''}
                onChange={(e) => handleServiceDetailChange(service, 'customRequirements', e.target.value)}
                placeholder="Describe the project requirements, features, and functionality..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {/* Pages Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Pages <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={details.pages || ''}
              onChange={(e) => handleServiceDetailChange(service, 'pages', e.target.value)}
              placeholder="Enter number of pages"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      );
    }
    if (service === 'SEO') {
      return (
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keyword Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={details.keywordCount || ''}
                onChange={(e) => handleServiceDetailChange(service, 'keywordCount', e.target.value)}
                placeholder="Number of keywords"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blog Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={details.blogCount || ''}
                onChange={(e) => handleServiceDetailChange(service, 'blogCount', e.target.value)}
                placeholder="Number of blogs"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Locations (Optional)</label>
            <input
              type="text"
              value={details.locations || ''}
              onChange={(e) => handleServiceDetailChange(service, 'locations', e.target.value)}
              placeholder="e.g., Chennai, India, Worldwide"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      );
    }
    if (service === 'SMM') {
      const subServices = details.subServices || [];
      return (
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Services <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 transition-all ${subServices.includes('Reels') ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subServices.includes('Reels')}
                    onChange={() => handleSubServiceToggle(service, 'Reels')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Reels</span>
                </label>
                {subServices.includes('Reels') && (
                  <div className="mt-3 ml-8">
                    <input
                      type="number"
                      value={details.reelsCount || ''}
                      onChange={(e) => handleServiceDetailChange(service, 'reelsCount', e.target.value)}
                      placeholder="Number of Reels"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              <div className={`p-4 rounded-lg border-2 transition-all ${subServices.includes('Poster') ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subServices.includes('Poster')}
                    onChange={() => handleSubServiceToggle(service, 'Poster')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Poster</span>
                </label>
                {subServices.includes('Poster') && (
                  <div className="mt-3 ml-8">
                    <input
                      type="number"
                      value={details.posterCount || ''}
                      onChange={(e) => handleServiceDetailChange(service, 'posterCount', e.target.value)}
                      placeholder="Number of Posters"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platforms</label>
            <select
              value={details.platforms || ''}
              onChange={(e) => handleServiceDetailChange(service, 'platforms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="YouTube">YouTube</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="All">All Platforms</option>
            </select>
          </div>
        </div>
      );
    }
    if (service === 'Ads') {
      return (
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'platform', 'Google Ads')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.platform === 'Google Ads'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Google Ads
              </button>
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'platform', 'Meta Ads')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.platform === 'Meta Ads'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Meta Ads
              </button>
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'platform', 'Both')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.platform === 'Both'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Both
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input
              type="text"
              value={details.budget || ''}
              onChange={(e) => handleServiceDetailChange(service, 'budget', e.target.value)}
              placeholder="Enter budget amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      );
    }
    if (service === 'Web App') {
      return (
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'appType', 'Web Application')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.appType === 'Web Application'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Web App
              </button>
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'appType', 'Mobile App')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.appType === 'Mobile App'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Mobile App
              </button>
              <button
                type="button"
                onClick={() => handleServiceDetailChange(service, 'appType', 'PWA')}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  details.appType === 'PWA'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                PWA
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technology Stack <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={details.techStack || ''}
              onChange={(e) => handleServiceDetailChange(service, 'techStack', e.target.value)}
              placeholder="e.g., React, Node.js, MongoDB"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
            <textarea
              value={details.features || ''}
              onChange={(e) => handleServiceDetailChange(service, 'features', e.target.value)}
              placeholder="List key features..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      );
    }
    // Media Services
    if (['Videography', 'Video Editing', 'Photography', 'Video Production'].includes(service)) {
      const icons = {
        'Videography': '🎥',
        'Video Editing': '✂️',
        'Photography': '📸',
        'Video Production': '🎬'
      };
      return (
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {icons[service]} Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={details.description || ''}
              onChange={(e) => handleServiceDetailChange(service, 'description', e.target.value)}
              placeholder={`Enter ${service} details...`}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={details.duration || ''}
                onChange={(e) => handleServiceDetailChange(service, 'duration', e.target.value)}
                placeholder="e.g., 2 weeks"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Deliverables</label>
              <input
                type="number"
                value={details.deliverables || ''}
                onChange={(e) => handleServiceDetailChange(service, 'deliverables', e.target.value)}
                placeholder="Number of deliverables"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      );
    }
    // Design Services
    if (['Branding Logo', 'Brochure', 'Pamphlet', 'Social Media Designs', 'Marking collateral', 'UI/UX designer'].includes(service)) {
      const icons = {
        'Branding Logo': '🎨',
        'Brochure': '📄',
        'Pamphlet': '📃',
        'Social Media Designs': '📱',
        'Marking collateral': '📋',
        'UI/UX designer': '🖌️'
      };
      return (
        <div className="space-y-4 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {icons[service]} Number of Designs <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={details.count || ''}
              onChange={(e) => handleServiceDetailChange(service, 'count', e.target.value)}
              placeholder="Number of designs needed"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['PDF', 'JPG', 'PNG', 'AI', 'PSD'].map(format => (
                <button
                  key={format}
                  type="button"
                  onClick={() => handleServiceDetailChange(service, 'format', format)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    details.format === format
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={details.notes || ''}
              onChange={(e) => handleServiceDetailChange(service, 'notes', e.target.value)}
              placeholder="Additional requirements..."
              rows="2"
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    // Reset form or navigate
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Project Onboarding</h1>
          <p className="text-sm text-gray-500">Onboard new projects with required services</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
            {/* Project Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📋 Project Details
              </h2>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
            </div>
            {/* Project Manager - Multi Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👤 Project Manager <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                value={formData.projectManager}
                onChange={(e) => handleMultiSelect(e, 'projectManager')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
              >
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">💡 Hold Ctrl/Cmd to select multiple</p>
              {formData.projectManager.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.projectManager.map(name => (
                    <span key={name} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* SPOC - Multi Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📞 SPOC (Single Point of Contact) <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                value={formData.spoc}
                onChange={(e) => handleMultiSelect(e, 'spoc')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
              >
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">💡 Hold Ctrl/Cmd to select multiple</p>
              {formData.spoc.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.spoc.map(name => (
                    <span key={name} className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Required Services */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                🛠️ Required Services
              </h2>
              {/* Digital Marketing */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                  📊 Digital Marketing
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {['Website', 'SEO', 'SMM', 'Ads', 'Web App'].map(service => (
                    <label key={service} className={`flex items-center gap-2 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
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
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Media */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                  🎬 Media
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Videography', 'Video Editing', 'Photography', 'Video Production'].map(service => (
                    <label key={service} className={`flex items-center gap-2 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
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
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Design */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                  🎨 Design
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {['Branding Logo', 'Brochure', 'Pamphlet', 'Social Media Designs', 'Marking collateral', 'UI/UX designer'].map(service => (
                    <label key={service} className={`flex items-center gap-2 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
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
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Service Details - Dynamic Fields */}
              {formData.services && formData.services.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📝 Service Details
                  </h3>
                  <div className="space-y-4">
                    {formData.services.map(service => (
                      <div key={service} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-800">{service}</h4>
                        </div>
                        <div className="p-4">
                          {renderServiceFields(service)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center gap-2"
              >
                <span>🚀</span> Onboard Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProjectOnboarding;