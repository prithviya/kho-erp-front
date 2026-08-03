import React, { useState, useEffect } from 'react';
import { 
    X, Building2, User, Phone, Mail, CalendarDays, 
    DollarSign, Pencil, Trash2, Eye, Search, Plus,
    Globe, Camera, Video, Image, FileText, Briefcase
} from 'lucide-react';

const VendorManagement = () => {
    const [vendors, setVendors] = useState([
        {
            id: 1,
            name: 'John Smith',
            email: 'john@webdesign.com',
            phone: '+91 98765 43210',
            companyName: 'WebWorks Studio',
            serviceType: 'website',
            serviceDetails: {
                perPageCost: 5000,
                noOfPages: 5,
                totalCost: 25000
            },
            cost: 25000,
            dueDate: '2026-09-15',
            status: 'Active',
            createdAt: '2026-07-01'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah@photo.com',
            phone: '+91 98765 43211',
            companyName: 'LensMagic Photography',
            serviceType: 'photoshoot',
            serviceDetails: {
                perDayCost: 15000,
                noOfDays: 2,
                totalCost: 30000
            },
            cost: 30000,
            dueDate: '2026-08-20',
            status: 'Active',
            createdAt: '2026-07-05'
        },
        {
            id: 3,
            name: 'Mike Williams',
            email: 'mike@video.com',
            phone: '+91 98765 43212',
            companyName: 'VideoPro Productions',
            serviceType: 'videoshoot',
            serviceDetails: {
                perDayCost: 20000,
                noOfDays: 3,
                totalCost: 60000
            },
            cost: 60000,
            dueDate: '2026-09-10',
            status: 'Pending',
            createdAt: '2026-07-10'
        },
        {
            id: 4,
            name: 'Emily Davis',
            email: 'emily@design.com',
            phone: '+91 98765 43213',
            companyName: 'DesignHub Creative',
            serviceType: 'poster',
            serviceDetails: {
                perPostCost: 3000,
                noOfPosts: 4,
                totalCost: 12000
            },
            cost: 12000,
            dueDate: '2026-07-30',
            status: 'Completed',
            createdAt: '2026-07-12'
        }
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState('');

    const serviceTypes = [
        { value: 'website', label: 'Website', icon: Globe },
        { value: 'photoshoot', label: 'Photoshoot', icon: Camera },
        { value: 'videoshoot', label: 'Videoshoot', icon: Video },
        { value: 'poster', label: 'Poster', icon: Image },
    ];

    const getServiceIcon = (type) => {
        const service = serviceTypes.find(s => s.value === type);
        return service ? service.icon : FileText;
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        serviceType: '',
        cost: '',
        dueDate: '',
        // Service specific fields
        perPageCost: '',
        noOfPages: '',
        perDayCost: '',
        noOfDays: '',
        perPostCost: '',
        noOfPosts: '',
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        serviceType: '',
        cost: '',
        dueDate: '',
        perPageCost: '',
        noOfPages: '',
        perDayCost: '',
        noOfDays: '',
        perPostCost: '',
        noOfPosts: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Auto-calculate cost based on service type
        if (name === 'serviceType') {
            setFormData(prev => ({
                ...prev,
                perPageCost: '',
                noOfPages: '',
                perDayCost: '',
                noOfDays: '',
                perPostCost: '',
                noOfPosts: '',
                cost: ''
            }));
        }
    };

    const handleServiceDetailChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-calculate total cost
            let totalCost = 0;
            if (prev.serviceType === 'website' && updated.perPageCost && updated.noOfPages) {
                totalCost = parseFloat(updated.perPageCost) * parseFloat(updated.noOfPages);
            } else if (prev.serviceType === 'photoshoot' && updated.perDayCost && updated.noOfDays) {
                totalCost = parseFloat(updated.perDayCost) * parseFloat(updated.noOfDays);
            } else if (prev.serviceType === 'videoshoot' && updated.perDayCost && updated.noOfDays) {
                totalCost = parseFloat(updated.perDayCost) * parseFloat(updated.noOfDays);
            } else if (prev.serviceType === 'poster' && updated.perPostCost && updated.noOfPosts) {
                totalCost = parseFloat(updated.perPostCost) * parseFloat(updated.noOfPosts);
            }
            return { ...updated, cost: totalCost || '' };
        });
    };

    const renderServiceFields = (serviceType, formData) => {
        const fields = {
            website: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Page Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perPageCost"
                            value={formData.perPageCost || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 5000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Pages <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfPages"
                            value={formData.noOfPages || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ),
            photoshoot: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Day Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perDayCost"
                            value={formData.perDayCost || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 15000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Days <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfDays"
                            value={formData.noOfDays || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ),
            videoshoot: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Day Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perDayCost"
                            value={formData.perDayCost || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 20000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Days <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfDays"
                            value={formData.noOfDays || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ),
            poster: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Post Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perPostCost"
                            value={formData.perPostCost || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 3000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Posts <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfPosts"
                            value={formData.noOfPosts || ''}
                            onChange={handleServiceDetailChange}
                            placeholder="e.g., 4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )
        };
        return fields[serviceType] || null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newVendor = {
            id: vendors.length + 1,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            companyName: formData.companyName,
            serviceType: formData.serviceType,
            serviceDetails: {
                ...(formData.serviceType === 'website' && {
                    perPageCost: parseFloat(formData.perPageCost),
                    noOfPages: parseInt(formData.noOfPages),
                    totalCost: parseFloat(formData.cost)
                }),
                ...(formData.serviceType === 'photoshoot' && {
                    perDayCost: parseFloat(formData.perDayCost),
                    noOfDays: parseInt(formData.noOfDays),
                    totalCost: parseFloat(formData.cost)
                }),
                ...(formData.serviceType === 'videoshoot' && {
                    perDayCost: parseFloat(formData.perDayCost),
                    noOfDays: parseInt(formData.noOfDays),
                    totalCost: parseFloat(formData.cost)
                }),
                ...(formData.serviceType === 'poster' && {
                    perPostCost: parseFloat(formData.perPostCost),
                    noOfPosts: parseInt(formData.noOfPosts),
                    totalCost: parseFloat(formData.cost)
                })
            },
            cost: parseFloat(formData.cost) || 0,
            dueDate: formData.dueDate,
            status: 'Active',
            createdAt: new Date().toISOString().split('T')[0]
        };
        setVendors([...vendors, newVendor]);
        setShowAddModal(false);
        resetForm();
    };

    const handleEdit = (vendor, index) => {
        setSelectedVendor(vendor);
        setEditIndex(index);
        setEditFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            companyName: vendor.companyName,
            serviceType: vendor.serviceType,
            cost: vendor.cost,
            dueDate: vendor.dueDate,
            perPageCost: vendor.serviceDetails?.perPageCost || '',
            noOfPages: vendor.serviceDetails?.noOfPages || '',
            perDayCost: vendor.serviceDetails?.perDayCost || '',
            noOfDays: vendor.serviceDetails?.noOfDays || '',
            perPostCost: vendor.serviceDetails?.perPostCost || '',
            noOfPosts: vendor.serviceDetails?.noOfPosts || '',
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        const updatedVendors = [...vendors];
        updatedVendors[editIndex] = {
            ...updatedVendors[editIndex],
            name: editFormData.name,
            email: editFormData.email,
            phone: editFormData.phone,
            companyName: editFormData.companyName,
            serviceType: editFormData.serviceType,
            serviceDetails: {
                ...(editFormData.serviceType === 'website' && {
                    perPageCost: parseFloat(editFormData.perPageCost),
                    noOfPages: parseInt(editFormData.noOfPages),
                    totalCost: parseFloat(editFormData.cost)
                }),
                ...(editFormData.serviceType === 'photoshoot' && {
                    perDayCost: parseFloat(editFormData.perDayCost),
                    noOfDays: parseInt(editFormData.noOfDays),
                    totalCost: parseFloat(editFormData.cost)
                }),
                ...(editFormData.serviceType === 'videoshoot' && {
                    perDayCost: parseFloat(editFormData.perDayCost),
                    noOfDays: parseInt(editFormData.noOfDays),
                    totalCost: parseFloat(editFormData.cost)
                }),
                ...(editFormData.serviceType === 'poster' && {
                    perPostCost: parseFloat(editFormData.perPostCost),
                    noOfPosts: parseInt(editFormData.noOfPosts),
                    totalCost: parseFloat(editFormData.cost)
                })
            },
            cost: parseFloat(editFormData.cost) || 0,
            dueDate: editFormData.dueDate,
        };
        setVendors(updatedVendors);
        setShowEditModal(false);
        setSelectedVendor(null);
        setEditIndex(null);
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
            serviceType: '',
            cost: '',
            dueDate: '',
            perPageCost: '',
            noOfPages: '',
            perDayCost: '',
            noOfDays: '',
            perPostCost: '',
            noOfPosts: '',
        });
    };

    const getStatusBadge = (status) => {
        const colors = {
            'Active': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Completed': 'bg-blue-100 text-blue-800',
            'Inactive': 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getServiceLabel = (type) => {
        const service = serviceTypes.find(s => s.value === type);
        return service ? service.label : type;
    };

    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesService = filterService === '' || vendor.serviceType === filterService;
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

    // Edit Form Handler
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditServiceDetailChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => {
            const updated = { ...prev, [name]: value };
            let totalCost = 0;
            if (prev.serviceType === 'website' && updated.perPageCost && updated.noOfPages) {
                totalCost = parseFloat(updated.perPageCost) * parseFloat(updated.noOfPages);
            } else if (prev.serviceType === 'photoshoot' && updated.perDayCost && updated.noOfDays) {
                totalCost = parseFloat(updated.perDayCost) * parseFloat(updated.noOfDays);
            } else if (prev.serviceType === 'videoshoot' && updated.perDayCost && updated.noOfDays) {
                totalCost = parseFloat(updated.perDayCost) * parseFloat(updated.noOfDays);
            } else if (prev.serviceType === 'poster' && updated.perPostCost && updated.noOfPosts) {
                totalCost = parseFloat(updated.perPostCost) * parseFloat(updated.noOfPosts);
            }
            return { ...updated, cost: totalCost || '' };
        });
    };

    const renderEditServiceFields = (serviceType) => {
        const fields = {
            website: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Page Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perPageCost"
                            value={editFormData.perPageCost || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 5000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Pages <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfPages"
                            value={editFormData.noOfPages || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ),
            photoshoot: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Day Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perDayCost"
                            value={editFormData.perDayCost || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 15000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Days <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfDays"
                            value={editFormData.noOfDays || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ),
            videoshoot: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Day Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perDayCost"
                            value={editFormData.perDayCost || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 20000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Days <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfDays"
                            value={editFormData.noOfDays || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            ),
            poster: (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Post Cost (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="perPostCost"
                            value={editFormData.perPostCost || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 3000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Posts <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="noOfPosts"
                            value={editFormData.noOfPosts || ''}
                            onChange={handleEditServiceDetailChange}
                            placeholder="e.g., 4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )
        };
        return fields[serviceType] || null;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">📋 Vendor Management</h1>
                            <p className="text-sm text-gray-500">Manage all vendors and their service details</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                            <select
                                value={filterService}
                                onChange={(e) => setFilterService(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Services</option>
                                {serviceTypes.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <span className="text-sm text-gray-500">
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredVendors.map((vendor, index) => {
                                    const Icon = getServiceIcon(vendor.serviceType);
                                    return (
                                        <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                                                    <p className="text-xs text-gray-500">{vendor.email}</p>
                                                    <p className="text-xs text-gray-500">{vendor.phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-700">{vendor.companyName}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    <Icon size={14} />
                                                    {getServiceLabel(vendor.serviceType)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{formatCurrency(vendor.cost)}</p>
                                                {vendor.serviceDetails && (
                                                    <p className="text-xs text-gray-400">
                                                        {vendor.serviceType === 'website' && `${vendor.serviceDetails.perPageCost} × ${vendor.serviceDetails.noOfPages} pages`}
                                                        {vendor.serviceType === 'photoshoot' && `${vendor.serviceDetails.perDayCost} × ${vendor.serviceDetails.noOfDays} days`}
                                                        {vendor.serviceType === 'videoshoot' && `${vendor.serviceDetails.perDayCost} × ${vendor.serviceDetails.noOfDays} days`}
                                                        {vendor.serviceType === 'poster' && `${vendor.serviceDetails.perPostCost} × ${vendor.serviceDetails.noOfPosts} posts`}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className={`text-sm ${new Date(vendor.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                                    {new Date(vendor.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Vendor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800">Add New Vendor</h2>
                                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Service Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="serviceType"
                                                value={formData.serviceType}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Service Type</option>
                                                {serviceTypes.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {formData.serviceType && (
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                                <h4 className="text-sm font-semibold text-gray-700">Service Details</h4>
                                                {renderServiceFields(formData.serviceType, formData)}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Total Cost (₹) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="cost"
                                                        value={formData.cost}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                                                        readOnly
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Auto-calculated based on service details</p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={formData.dueDate}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
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
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800">Edit Vendor</h2>
                                    <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <form onSubmit={handleUpdate}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Service Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="serviceType"
                                                value={editFormData.serviceType}
                                                onChange={handleEditInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Service Type</option>
                                                {serviceTypes.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {editFormData.serviceType && (
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                                <h4 className="text-sm font-semibold text-gray-700">Service Details</h4>
                                                {renderEditServiceFields(editFormData.serviceType)}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Total Cost (₹) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="cost"
                                                        value={editFormData.cost}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                                                        readOnly
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Auto-calculated based on service details</p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={editFormData.dueDate}
                                                onChange={handleEditInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
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
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800">Vendor Details</h2>
                                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Name</label>
                                            <p className="text-gray-900">{selectedVendor.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Email</label>
                                            <p className="text-gray-900">{selectedVendor.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Phone</label>
                                            <p className="text-gray-900">{selectedVendor.phone}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Company</label>
                                            <p className="text-gray-900">{selectedVendor.companyName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Service Type</label>
                                            <p className="text-gray-900">{getServiceLabel(selectedVendor.serviceType)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Status</label>
                                            <p className="mt-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVendor.status)}`}>
                                                    {selectedVendor.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Cost</label>
                                            <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedVendor.cost)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Due Date</label>
                                            <p className={`${new Date(selectedVendor.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                {new Date(selectedVendor.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedVendor.serviceDetails && (
                                        <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Service Breakdown</h4>
                                            <div className="space-y-2">
                                                {selectedVendor.serviceType === 'website' && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Per Page Cost</span>
                                                            <span className="text-sm font-medium">{formatCurrency(selectedVendor.serviceDetails.perPageCost)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Number of Pages</span>
                                                            <span className="text-sm font-medium">{selectedVendor.serviceDetails.noOfPages}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2">
                                                            <span className="text-sm font-semibold">Total Cost</span>
                                                            <span className="text-sm font-bold text-blue-600">{formatCurrency(selectedVendor.serviceDetails.totalCost)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {(selectedVendor.serviceType === 'photoshoot' || selectedVendor.serviceType === 'videoshoot') && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Per Day Cost</span>
                                                            <span className="text-sm font-medium">{formatCurrency(selectedVendor.serviceDetails.perDayCost)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Number of Days</span>
                                                            <span className="text-sm font-medium">{selectedVendor.serviceDetails.noOfDays}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2">
                                                            <span className="text-sm font-semibold">Total Cost</span>
                                                            <span className="text-sm font-bold text-blue-600">{formatCurrency(selectedVendor.serviceDetails.totalCost)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {selectedVendor.serviceType === 'poster' && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Per Post Cost</span>
                                                            <span className="text-sm font-medium">{formatCurrency(selectedVendor.serviceDetails.perPostCost)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Number of Posts</span>
                                                            <span className="text-sm font-medium">{selectedVendor.serviceDetails.noOfPosts}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2">
                                                            <span className="text-sm font-semibold">Total Cost</span>
                                                            <span className="text-sm font-bold text-blue-600">{formatCurrency(selectedVendor.serviceDetails.totalCost)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setShowViewModal(false)}
                                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                                        >
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