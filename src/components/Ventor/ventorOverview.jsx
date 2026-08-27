import React, { useState, useEffect } from 'react';
import { 
    X, Building2, User, Phone, Mail, DollarSign, 
    Pencil, Trash2, Eye, Search, Plus,
    Globe, Camera, Video, Image, FileText, Briefcase,
    Layers, Code, Palette, TrendingUp, Megaphone,
    CheckCircle, Clock, Circle, Layout, Monitor,
    Hash, BookOpen, BarChart, Settings, Award,
    ChevronDown, Filter, List, ShoppingBag, Target
} from 'lucide-react';

const VendorManagement = () => {
    // Service Categories with Sub-Services
    const serviceCategories = [
        {
            id: 'dm',
            label: 'DM',
            icon: Megaphone,
            color: 'purple',
            services: [
                { id: 'dm_website', name: 'Website', hasDetails: true, icon: Globe },
                { id: 'dm_seo', name: 'SEO', hasDetails: true, icon: TrendingUp },
                { id: 'dm_smm', name: 'SMM', hasDetails: true, icon: Image }
            ]
        },
        {
            id: 'designer',
            label: 'Designer',
            icon: Palette,
            color: 'pink',
            services: [
                { id: 'designer_graphics', name: 'Graphics Designer', hasDetails: false, icon: FileText }
            ]
        },
        {
            id: 'website',
            label: 'Website',
            icon: Globe,
            color: 'blue',
            services: [
                { id: 'website_design', name: 'Website Design', hasDetails: true, icon: Layout },
                { id: 'website_development', name: 'Website Development', hasDetails: true, icon: Code },
                { id: 'website_maintenance', name: 'Website Maintenance', hasDetails: true, icon: Settings }
            ]
        },
        {
            id: 'seo',
            label: 'SEO',
            icon: TrendingUp,
            color: 'green',
            services: [
                { id: 'seo_onpage', name: 'On-Page SEO', hasDetails: true, icon: BookOpen },
                { id: 'seo_offpage', name: 'Off-Page SEO', hasDetails: true, icon: BarChart },
                { id: 'seo_technical', name: 'Technical SEO', hasDetails: true, icon: Settings }
            ]
        },
        {
            id: 'smm',
            label: 'SMM',
            icon: Image,
            color: 'pink',
            services: [
                { id: 'smm_shoot', name: 'Shoot', hasDetails: true, icon: Camera, pricingType: 'per_day' },
                { id: 'smm_poster', name: 'Poster', hasDetails: true, icon: Image, pricingType: 'per_post' },
                { id: 'smm_reels', name: 'Reels', hasDetails: true, icon: Video, pricingType: 'per_post' },
                { id: 'smm_stories', name: 'Stories', hasDetails: true, icon: Camera, pricingType: 'per_post' }
            ]
        },
        {
            id: 'ads',
            label: 'Ads',
            icon: TrendingUp,
            color: 'orange',
            services: [
                { id: 'ads_google', name: 'Google Ads', hasDetails: true, icon: Globe },
                { id: 'ads_meta', name: 'Meta Ads', hasDetails: true, icon: Globe },
                { id: 'ads_linkedin', name: 'LinkedIn Ads', hasDetails: true, icon: Globe }
            ]
        },
        {
            id: 'webapp',
            label: 'Web App',
            icon: Code,
            color: 'indigo',
            services: [
                { id: 'webapp_development', name: 'Web App Development', hasDetails: true, icon: Code },
                { id: 'webapp_maintenance', name: 'Web App Maintenance', hasDetails: true, icon: Settings }
            ]
        }
    ];

    const [vendors, setVendors] = useState([
        {
            id: 1,
            name: 'John Smith',
            email: 'john@webdesign.com',
            phone: '+91 98765 43210',
            companyName: 'WebWorks Studio',
            selectedServices: ['dm_website', 'dm_seo'],
            serviceDetails: {
                dm_website: { technology: 'WordPress', notes: 'E-commerce website' },
                dm_seo: { keywordCount: 50, blogCount: 10 }
            },
            servicePricing: {
                dm_website: { price: 50000 },
                dm_seo: { price: 25000 }
            },
            totalCost: 75000,
            status: 'Active',
            createdAt: '2026-07-01'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah@photo.com',
            phone: '+91 98765 43211',
            companyName: 'LensMagic Photography',
            selectedServices: ['smm_shoot', 'smm_poster'],
            serviceDetails: {
                smm_shoot: { quantity: 2, platform: 'Instagram', notes: 'Product shoot' },
                smm_poster: { quantity: 5, platform: 'Facebook', notes: 'Campaign posters' }
            },
            servicePricing: {
                smm_shoot: { price: 30000 },
                smm_poster: { price: 15000 }
            },
            totalCost: 45000,
            status: 'Active',
            createdAt: '2026-07-05'
        }
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        selectedServices: [],
        serviceDetails: {},
        servicePricing: {}
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        selectedServices: [],
        serviceDetails: {},
        servicePricing: {}
    });

    const getServiceDetails = (serviceId) => {
        for (const cat of serviceCategories) {
            const found = cat.services.find(s => s.id === serviceId);
            if (found) return found;
        }
        return null;
    };

    const getCategoryForService = (serviceId) => {
        for (const cat of serviceCategories) {
            const found = cat.services.find(s => s.id === serviceId);
            if (found) return cat;
        }
        return null;
    };

    const getServiceIcon = (serviceId) => {
        const service = getServiceDetails(serviceId);
        return service?.icon || FileText;
    };

    const handleServiceToggle = (serviceId) => {
        setFormData(prev => {
            const current = prev.selectedServices || [];
            const exists = current.includes(serviceId);
            
            let newSelected;
            let newDetails = { ...prev.serviceDetails };
            let newPricing = { ...prev.servicePricing };
            
            if (exists) {
                newSelected = current.filter(id => id !== serviceId);
                delete newDetails[serviceId];
                delete newPricing[serviceId];
            } else {
                newSelected = [...current, serviceId];
                newDetails[serviceId] = {};
                newPricing[serviceId] = { price: '' };
            }
            
            return {
                ...prev,
                selectedServices: newSelected,
                serviceDetails: newDetails,
                servicePricing: newPricing
            };
        });
    };

    const handleServiceDetailChange = (serviceId, field, value) => {
        setFormData(prev => ({
            ...prev,
            serviceDetails: {
                ...prev.serviceDetails,
                [serviceId]: {
                    ...prev.serviceDetails[serviceId],
                    [field]: value
                }
            }
        }));
    };

    const handlePricingChange = (serviceId, value) => {
        setFormData(prev => ({
            ...prev,
            servicePricing: {
                ...prev.servicePricing,
                [serviceId]: {
                    ...prev.servicePricing[serviceId],
                    price: value
                }
            }
        }));
    };

    const getTotalCost = (selectedServices, servicePricing) => {
        let total = 0;
        selectedServices.forEach(serviceId => {
            const pricing = servicePricing[serviceId];
            if (pricing && pricing.price) {
                total += parseFloat(pricing.price) || 0;
            }
        });
        return total;
    };

    const renderServiceDetailsForm = (serviceId, details, onChange, prefix = '') => {
        const service = getServiceDetails(serviceId);
        if (!service) return null;

        // Website services - Technology options
        if (serviceId === 'dm_website' || serviceId === 'website_design' || serviceId === 'website_development') {
            return (
                <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Technology</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'wordpress', label: 'WordPress', icon: Globe },
                                { id: 'shopify', label: 'Shopify', icon: ShoppingBag },
                                { id: 'custom', label: 'Custom', icon: Code }
                            ].map((tech) => (
                                <button
                                    key={tech.id}
                                    type="button"
                                    onClick={() => onChange(serviceId, 'technology', tech.label)}
                                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                                        details?.technology === tech.label 
                                            ? "border-blue-600 bg-blue-100 text-blue-700 shadow-sm" 
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <tech.icon size={14} />
                                    {tech.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={details?.notes || ''}
                            onChange={(e) => onChange(serviceId, 'notes', e.target.value)}
                            placeholder="Additional website notes"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            );
        }

        // SEO services
        if (serviceId === 'dm_seo' || serviceId === 'seo_onpage' || serviceId === 'seo_offpage') {
            return (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="relative">
                        <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            value={details?.keywordCount || ''}
                            onChange={(e) => onChange(serviceId, 'keywordCount', e.target.value)}
                            placeholder="Keyword count"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="relative">
                        <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            value={details?.blogCount || ''}
                            onChange={(e) => onChange(serviceId, 'blogCount', e.target.value)}
                            placeholder="Blog count"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            );
        }

        // SMM services
        if (serviceId === 'dm_smm' || serviceId === 'smm_shoot' || serviceId === 'smm_poster' || 
            serviceId === 'smm_reels' || serviceId === 'smm_stories') {
            return (
                <div className="space-y-3 rounded-lg border border-pink-200 bg-pink-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                value={details?.quantity || ''}
                                onChange={(e) => onChange(serviceId, 'quantity', e.target.value)}
                                placeholder="Number of posts/videos"
                                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="relative">
                            <Monitor size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={details?.platform || ''}
                                onChange={(e) => onChange(serviceId, 'platform', e.target.value)}
                                placeholder="Platform (e.g., Instagram)"
                                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={details?.notes || ''}
                            onChange={(e) => onChange(serviceId, 'notes', e.target.value)}
                            placeholder="Additional notes"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            );
        }

        // Ads services
        if (serviceId === 'ads_google' || serviceId === 'ads_meta' || serviceId === 'ads_linkedin') {
            return (
                <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                value={details?.budget || ''}
                                onChange={(e) => onChange(serviceId, 'budget', e.target.value)}
                                placeholder="Daily budget"
                                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="relative">
                            <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={details?.target || ''}
                                onChange={(e) => onChange(serviceId, 'target', e.target.value)}
                                placeholder="Target audience"
                                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={details?.notes || ''}
                            onChange={(e) => onChange(serviceId, 'notes', e.target.value)}
                            placeholder="Additional notes"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            );
        }

        // Default: simple notes field
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="relative">
                    <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={details?.notes || ''}
                        onChange={(e) => onChange(serviceId, 'notes', e.target.value)}
                        placeholder="Additional details"
                        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.phone) {
            alert('Please fill all required fields');
            return;
        }

        if (!formData.selectedServices || formData.selectedServices.length === 0) {
            alert('Please select at least one service');
            return;
        }

        // Check if all selected services have pricing
        for (const serviceId of formData.selectedServices) {
            const pricing = formData.servicePricing[serviceId];
            if (!pricing || !pricing.price) {
                alert(`Please enter cost for ${getServiceDetails(serviceId)?.name || serviceId}`);
                return;
            }
        }

        const totalCost = getTotalCost(formData.selectedServices, formData.servicePricing);
        
        const newVendor = {
            id: vendors.length + 1,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            companyName: formData.companyName || '',
            selectedServices: formData.selectedServices,
            serviceDetails: formData.serviceDetails,
            servicePricing: formData.servicePricing,
            totalCost: totalCost,
            status: 'Active',
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        setVendors([...vendors, newVendor]);
        setShowAddModal(false);
        resetForm();
        alert('Vendor added successfully!');
    };

    const handleEdit = (vendor, index) => {
        setSelectedVendor(vendor);
        setEditIndex(index);
        setEditFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            companyName: vendor.companyName || '',
            selectedServices: [...vendor.selectedServices],
            serviceDetails: { ...vendor.serviceDetails },
            servicePricing: { ...vendor.servicePricing }
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        
        if (!editFormData.name || !editFormData.email || !editFormData.phone) {
            alert('Please fill all required fields');
            return;
        }

        if (!editFormData.selectedServices || editFormData.selectedServices.length === 0) {
            alert('Please select at least one service');
            return;
        }

        // Check if all selected services have pricing
        for (const serviceId of editFormData.selectedServices) {
            const pricing = editFormData.servicePricing[serviceId];
            if (!pricing || !pricing.price) {
                alert(`Please enter cost for ${getServiceDetails(serviceId)?.name || serviceId}`);
                return;
            }
        }

        const totalCost = getTotalCost(editFormData.selectedServices, editFormData.servicePricing);
        
        const updatedVendors = [...vendors];
        updatedVendors[editIndex] = {
            ...updatedVendors[editIndex],
            name: editFormData.name,
            email: editFormData.email,
            phone: editFormData.phone,
            companyName: editFormData.companyName || '',
            selectedServices: editFormData.selectedServices,
            serviceDetails: editFormData.serviceDetails,
            servicePricing: editFormData.servicePricing,
            totalCost: totalCost
        };
        
        setVendors(updatedVendors);
        setShowEditModal(false);
        setSelectedVendor(null);
        setEditIndex(null);
        alert('Vendor updated successfully!');
    };

    const handleDelete = (index) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            setVendors(vendors.filter((_, i) => i !== index));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            companyName: '',
            selectedServices: [],
            serviceDetails: {},
            servicePricing: {}
        });
    };

    // Edit form handlers
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditServiceToggle = (serviceId) => {
        setEditFormData(prev => {
            const current = prev.selectedServices || [];
            const exists = current.includes(serviceId);
            
            let newSelected;
            let newDetails = { ...prev.serviceDetails };
            let newPricing = { ...prev.servicePricing };
            
            if (exists) {
                newSelected = current.filter(id => id !== serviceId);
                delete newDetails[serviceId];
                delete newPricing[serviceId];
            } else {
                newSelected = [...current, serviceId];
                newDetails[serviceId] = {};
                newPricing[serviceId] = { price: '' };
            }
            
            return {
                ...prev,
                selectedServices: newSelected,
                serviceDetails: newDetails,
                servicePricing: newPricing
            };
        });
    };

    const handleEditServiceDetailChange = (serviceId, field, value) => {
        setEditFormData(prev => ({
            ...prev,
            serviceDetails: {
                ...prev.serviceDetails,
                [serviceId]: {
                    ...prev.serviceDetails[serviceId],
                    [field]: value
                }
            }
        }));
    };

    const handleEditPricingChange = (serviceId, value) => {
        setEditFormData(prev => ({
            ...prev,
            servicePricing: {
                ...prev.servicePricing,
                [serviceId]: {
                    ...prev.servicePricing[serviceId],
                    price: value
                }
            }
        }));
    };

    const getStatusBadge = (status) => {
        const colors = {
            'Active': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Completed': 'bg-blue-100 text-blue-800',
            'Inactive': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Active': return <CheckCircle size={14} className="text-green-600" />;
            case 'Pending': return <Clock size={14} className="text-yellow-600" />;
            case 'Completed': return <Award size={14} className="text-blue-600" />;
            default: return <Circle size={14} className="text-gray-400" />;
        }
    };

    const getCategoryColor = (color) => {
        const colors = {
            purple: 'border-purple-200 bg-purple-50',
            blue: 'border-blue-200 bg-blue-50',
            green: 'border-green-200 bg-green-50',
            pink: 'border-pink-200 bg-pink-50',
            orange: 'border-orange-200 bg-orange-50',
            indigo: 'border-indigo-200 bg-indigo-50'
        };
        return colors[color] || 'border-gray-200 bg-gray-50';
    };

    const getServiceLabel = (serviceId) => {
        const service = getServiceDetails(serviceId);
        return service ? service.name : serviceId;
    };

    const allServices = serviceCategories.flatMap(cat => 
        cat.services.map(s => ({ ...s, categoryLabel: cat.label }))
    );

    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesService = filterService === '' || vendor.selectedServices.includes(filterService);
        return matchesSearch && matchesService;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase size={28} className="text-blue-600" />
                                Vendor Management
                            </h1>
                            <p className="text-sm text-gray-500">Manage vendors and their service assignments</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={18} />
                            Add Vendor
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search vendors..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterService}
                                    onChange={(e) => setFilterService(e.target.value)}
                                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                >
                                    <option value="">All Services</option>
                                    {allServices.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.categoryLabel} - {s.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <List size={14} />
                            {filteredVendors.length} vendors found
                        </span>
                    </div>
                </div>

                {/* Vendor Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredVendors.length > 0 ? (
                                    filteredVendors.map((vendor, index) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                        <User size={14} className="text-gray-400" />
                                                        {vendor.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail size={12} className="text-gray-400" />
                                                        {vendor.email}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {vendor.phone}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-700 flex items-center gap-1">
                                                    <Building2 size={14} className="text-gray-400" />
                                                    {vendor.companyName || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {vendor.selectedServices.map(serviceId => {
                                                        const Icon = getServiceIcon(serviceId);
                                                        return (
                                                            <span 
                                                                key={serviceId} 
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                                                            >
                                                                <Icon size={12} />
                                                                {getServiceLabel(serviceId)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                                    <DollarSign size={14} className="text-gray-400" />
                                                    {formatCurrency(vendor.totalCost)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>
                                                    {getStatusIcon(vendor.status)}
                                                    {vendor.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedVendor(vendor); setShowViewModal(true); }}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(vendor, index)}
                                                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(index)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                            No vendors found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Vendor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <User size={20} className="text-blue-600" />
                                        Add New Vendor
                                    </h2>
                                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        {/* Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <User size={14} />
                                                    Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Vendor name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Mail size={14} />
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="vendor@email.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Phone size={14} />
                                                    Phone <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Building2 size={14} />
                                                    Company / Agency Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="companyName"
                                                    value={formData.companyName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Company name"
                                                />
                                            </div>
                                        </div>

                                        {/* Required Services */}
                                        <div>
                                            <h2 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <Layers size={18} className="text-blue-600" />
                                                Required Services
                                            </h2>
                                            <div className="space-y-4">
                                                {serviceCategories.map(category => {
                                                    const Icon = category.icon;
                                                    return (
                                                        <div key={category.id} className={`border rounded-lg p-3 ${getCategoryColor(category.color)}`}>
                                                            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                                                <Icon size={16} />
                                                                {category.label}
                                                            </h3>
                                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                                                {category.services.map(service => {
                                                                    const ServiceIcon = service.icon;
                                                                    return (
                                                                        <label
                                                                            key={service.id}
                                                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                                                                                formData.selectedServices.includes(service.id)
                                                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                                                    : "border-gray-200 bg-white hover:bg-gray-50"
                                                                            }`}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={formData.selectedServices.includes(service.id)}
                                                                                onChange={() => handleServiceToggle(service.id)}
                                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <ServiceIcon size={14} className="text-gray-500" />
                                                                            <span className="font-medium text-gray-700">{service.name}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Service Details */}
                                        {formData.selectedServices.length > 0 && (
                                            <div>
                                                <h2 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                    <FileText size={18} className="text-green-600" />
                                                    Service Details
                                                </h2>
                                                <div className="max-h-75 space-y-3 overflow-y-auto pr-1">
                                                    {formData.selectedServices.map(serviceId => {
                                                        const service = getServiceDetails(serviceId);
                                                        if (!service) return null;
                                                        const Icon = service.icon;
                                                        
                                                        return (
                                                            <div key={serviceId} className="overflow-hidden rounded-lg border-2 border-gray-200">
                                                                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                                                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                                        <Icon size={16} />
                                                                        {service.name}
                                                                    </h4>
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Circle size={10} className="text-blue-500 fill-blue-500" />
                                                                        Required
                                                                    </span>
                                                                </div>
                                                                <div className="p-3">
                                                                    {renderServiceDetailsForm(
                                                                        serviceId, 
                                                                        formData.serviceDetails[serviceId] || {},
                                                                        handleServiceDetailChange
                                                                    )}
                                                                    
                                                                    <div className="mt-3">
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                                            <DollarSign size={14} />
                                                                            Cost (₹) <span className="text-red-500">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={formData.servicePricing[serviceId]?.price || ''}
                                                                            onChange={(e) => handlePricingChange(serviceId, e.target.value)}
                                                                            placeholder="Enter cost"
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                <div className="mt-4 flex justify-end">
                                                    <div className="bg-blue-50 rounded-lg px-4 py-2 flex items-center gap-2">
                                                        <DollarSign size={18} className="text-blue-600" />
                                                        <span className="text-sm text-gray-600">Total Cost:</span>
                                                        <span className="text-lg font-bold text-blue-600">
                                                            {formatCurrency(getTotalCost(formData.selectedServices, formData.servicePricing))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            Add Vendor
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedVendor && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Pencil size={20} className="text-green-600" />
                                        Edit Vendor
                                    </h2>
                                    <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <form onSubmit={handleUpdate}>
                                    <div className="space-y-4">
                                        {/* Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <User size={14} />
                                                    Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editFormData.name}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Mail size={14} />
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={editFormData.email}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Phone size={14} />
                                                    Phone <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={editFormData.phone}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Building2 size={14} />
                                                    Company / Agency Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="companyName"
                                                    value={editFormData.companyName}
                                                    onChange={handleEditInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Required Services */}
                                        <div>
                                            <h2 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <Layers size={18} className="text-blue-600" />
                                                Required Services
                                            </h2>
                                            <div className="space-y-4">
                                                {serviceCategories.map(category => {
                                                    const Icon = category.icon;
                                                    return (
                                                        <div key={category.id} className={`border rounded-lg p-3 ${getCategoryColor(category.color)}`}>
                                                            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                                                <Icon size={16} />
                                                                {category.label}
                                                            </h3>
                                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                                                {category.services.map(service => {
                                                                    const ServiceIcon = service.icon;
                                                                    return (
                                                                        <label
                                                                            key={service.id}
                                                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                                                                                editFormData.selectedServices.includes(service.id)
                                                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                                                    : "border-gray-200 bg-white hover:bg-gray-50"
                                                                            }`}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editFormData.selectedServices.includes(service.id)}
                                                                                onChange={() => handleEditServiceToggle(service.id)}
                                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <ServiceIcon size={14} className="text-gray-500" />
                                                                            <span className="font-medium text-gray-700">{service.name}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Service Details */}
                                        {editFormData.selectedServices.length > 0 && (
                                            <div>
                                                <h2 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                    <FileText size={18} className="text-green-600" />
                                                    Service Details
                                                </h2>
                                                <div className="max-h-75 space-y-3 overflow-y-auto pr-1">
                                                    {editFormData.selectedServices.map(serviceId => {
                                                        const service = getServiceDetails(serviceId);
                                                        if (!service) return null;
                                                        const Icon = service.icon;
                                                        
                                                        return (
                                                            <div key={serviceId} className="overflow-hidden rounded-lg border-2 border-gray-200">
                                                                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                                                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                                        <Icon size={16} />
                                                                        {service.name}
                                                                    </h4>
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Circle size={10} className="text-blue-500 fill-blue-500" />
                                                                        Required
                                                                    </span>
                                                                </div>
                                                                <div className="p-3">
                                                                    {renderServiceDetailsForm(
                                                                        serviceId, 
                                                                        editFormData.serviceDetails[serviceId] || {},
                                                                        handleEditServiceDetailChange
                                                                    )}
                                                                    
                                                                    <div className="mt-3">
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                                            <DollarSign size={14} />
                                                                            Cost (₹) <span className="text-red-500">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={editFormData.servicePricing[serviceId]?.price || ''}
                                                                            onChange={(e) => handleEditPricingChange(serviceId, e.target.value)}
                                                                            placeholder="Enter cost"
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                <div className="mt-4 flex justify-end">
                                                    <div className="bg-blue-50 rounded-lg px-4 py-2 flex items-center gap-2">
                                                        <DollarSign size={18} className="text-blue-600" />
                                                        <span className="text-sm text-gray-600">Total Cost:</span>
                                                        <span className="text-lg font-bold text-blue-600">
                                                            {formatCurrency(getTotalCost(editFormData.selectedServices, editFormData.servicePricing))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                        >
                                            <Pencil size={16} />
                                            Update Vendor
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedVendor && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Eye size={20} className="text-blue-600" />
                                        Vendor Details
                                    </h2>
                                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                                <User size={14} />
                                                Name
                                            </label>
                                            <p className="text-gray-900 font-medium">{selectedVendor.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                                <Mail size={14} />
                                                Email
                                            </label>
                                            <p className="text-gray-900">{selectedVendor.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                                <Phone size={14} />
                                                Phone
                                            </label>
                                            <p className="text-gray-900">{selectedVendor.phone}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                                <Building2 size={14} />
                                                Company
                                            </label>
                                            <p className="text-gray-900">{selectedVendor.companyName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                                <CheckCircle size={14} />
                                                Status
                                            </label>
                                            <p className="mt-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVendor.status)}`}>
                                                    {getStatusIcon(selectedVendor.status)}
                                                    {selectedVendor.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                                <DollarSign size={14} />
                                                Total Cost
                                            </label>
                                            <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedVendor.totalCost)}</p>
                                        </div>
                                    </div>

                                    {/* Services & Pricing Breakdown */}
                                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Layers size={16} />
                                            Service Breakdown
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedVendor.selectedServices.map(serviceId => {
                                                const service = getServiceDetails(serviceId);
                                                const category = getCategoryForService(serviceId);
                                                const details = selectedVendor.serviceDetails[serviceId] || {};
                                                const pricing = selectedVendor.servicePricing[serviceId] || {};
                                                const Icon = service?.icon || FileText;
                                                
                                                if (!service || !category) return null;
                                                
                                                return (
                                                    <div key={serviceId} className="border-b border-gray-200 pb-3 last:border-0">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Icon size={14} className="text-blue-600" />
                                                                <span className="text-sm font-medium text-gray-700">{service.name}</span>
                                                                <span className="text-xs text-gray-400">({category.label})</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-900">
                                                                {formatCurrency(pricing.price || 0)}
                                                            </span>
                                                        </div>
                                                        {details && Object.keys(details).length > 0 && (
                                                            <div className="mt-1 ml-6 text-xs text-gray-500 space-y-0.5">
                                                                {details.technology && <div>🔧 {details.technology}</div>}
                                                                {details.keywordCount && <div>🔑 {details.keywordCount} keywords</div>}
                                                                {details.blogCount && <div>📝 {details.blogCount} blogs</div>}
                                                                {details.quantity && <div>📊 {details.quantity} items</div>}
                                                                {details.platform && <div>📱 {details.platform}</div>}
                                                                {details.budget && <div>💰 Budget: {formatCurrency(details.budget)}</div>}
                                                                {details.notes && <div>📝 {details.notes}</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                                                <span className="text-sm font-semibold text-gray-800">Total</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    {formatCurrency(selectedVendor.totalCost)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setShowViewModal(false)}
                                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorManagement;