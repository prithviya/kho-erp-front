import React, { useState } from 'react';
import { Search, Globe, Camera, Video, Image, CheckCircle, XCircle, Clock } from 'lucide-react';

function VendorAssigned() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    const [assignedVendors] = useState([
        {
            id: 1,
            vendorName: 'John Smith',
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
            status: 'In Progress',
            projectName: 'E-Commerce Website',
            spoc: 'Sarah Williams',
            reportingHead: 'John Doe',
            assignedDate: '2026-07-01',
            completion: 60
        },
        {
            id: 2,
            vendorName: 'Sarah Johnson',
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
            status: 'Completed',
            projectName: 'Product Photography',
            spoc: 'Emily Davis',
            reportingHead: 'Jane Smith',
            assignedDate: '2026-07-05',
            completion: 100
        },
        {
            id: 3,
            vendorName: 'Mike Williams',
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
            projectName: 'Corporate Video',
            spoc: 'David Brown',
            reportingHead: 'Mike Johnson',
            assignedDate: '2026-07-10',
            completion: 20
        },
        {
            id: 4,
            vendorName: 'Emily Davis',
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
            status: 'On Hold',
            projectName: 'Branding Campaign',
            spoc: 'Lisa Anderson',
            reportingHead: 'Robert Wilson',
            assignedDate: '2026-07-12',
            completion: 45
        }
    ]);

    const serviceTypes = [
        { value: 'website', label: 'Website', icon: Globe },
        { value: 'photoshoot', label: 'Photoshoot', icon: Camera },
        { value: 'videoshoot', label: 'Videoshoot', icon: Video },
        { value: 'poster', label: 'Poster', icon: Image },
    ];

    const getServiceIcon = (type) => {
        const service = serviceTypes.find(s => s.value === type);
        return service ? service.icon : Globe;
    };

    const getServiceLabel = (type) => {
        const service = serviceTypes.find(s => s.value === type);
        return service ? service.label : type;
    };

    const getStatusBadge = (status) => {
        const colors = {
            'In Progress': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'On Hold': 'bg-orange-100 text-orange-800',
            'Cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        if (status === 'Completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
        if (status === 'Pending') return <Clock className="w-4 h-4 text-yellow-600" />;
        if (status === 'On Hold') return <XCircle className="w-4 h-4 text-orange-600" />;
        return <Clock className="w-4 h-4 text-blue-600" />;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredVendors = assignedVendors.filter(vendor => {
        const matchesSearch = vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.projectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === '' || vendor.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getCompletionColor = (completion) => {
        if (completion >= 80) return 'bg-green-500';
        if (completion >= 50) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="">
                {/* Header */}
                <div className="mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">📋 Vendor Assigned Projects</h1>
                        <p className="text-sm text-gray-500">View all vendors assigned to projects</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <p className="text-sm text-gray-500">Total Assigned</p>
                        <p className="text-2xl font-bold text-gray-900">{assignedVendors.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <p className="text-sm text-gray-500">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {assignedVendors.filter(v => v.status === 'In Progress').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                            {assignedVendors.filter(v => v.status === 'Completed').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {assignedVendors.filter(v => v.status === 'Pending').length}
                        </p>
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
                                    placeholder="Search by vendor, company or project..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="On Hold">On Hold</option>
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
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
                                                    <p className="text-sm font-medium text-gray-900">{vendor.vendorName}</p>
                                                    <p className="text-xs text-gray-500">{vendor.companyName}</p>
                                                    <p className="text-xs text-gray-400">{vendor.email}</p>
                                                    <p className="text-xs text-gray-400">{vendor.phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{vendor.projectName}</p>
                                                    <div className="mt-1 space-y-0.5 text-xs">
                                                        <p className="text-gray-600">
                                                            <span className="font-medium">SPOC:</span> {vendor.spoc}
                                                        </p>
                                                        <p className="text-gray-600">
                                                            <span className="font-medium">Reporting Head:</span> {vendor.reportingHead}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Assigned: {new Date(vendor.assignedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    <Icon size={14} />
                                                    {getServiceLabel(vendor.serviceType)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{formatCurrency(vendor.cost)}</p>
                                                <p className="text-xs text-gray-400">Due: {new Date(vendor.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${getCompletionColor(vendor.completion)} transition-all duration-500`}
                                                            style={{ width: `${vendor.completion}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600">{vendor.completion}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>
                                                    {getStatusIcon(vendor.status)}
                                                    {vendor.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => { setSelectedVendor(vendor); setShowViewModal(true); }}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {showViewModal && selectedVendor && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800">📋 Vendor Assignment Details</h2>
                                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-6">
                                <div className="space-y-6">
                                    {/* Vendor Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">🏢 Vendor Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Vendor Name</label>
                                                <p className="text-sm font-medium text-gray-900">{selectedVendor.vendorName}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Company/Agency</label>
                                                <p className="text-sm text-gray-900">{selectedVendor.companyName}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Email</label>
                                                <p className="text-sm text-gray-900">{selectedVendor.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Phone</label>
                                                <p className="text-sm text-gray-900">{selectedVendor.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Information */}
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">📁 Project Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Project Name</label>
                                                <p className="text-sm font-semibold text-gray-900">{selectedVendor.projectName}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">SPOC</label>
                                                <p className="text-sm text-gray-900">{selectedVendor.spoc}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Reporting Head</label>
                                                <p className="text-sm text-gray-900">{selectedVendor.reportingHead}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Assigned Date</label>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(selectedVendor.assignedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Details */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">🛠️ Service Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Service Type</label>
                                                <p className="text-sm font-medium text-gray-900">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                        {getServiceIcon(selectedVendor.serviceType)({ size: 14 })}
                                                        {getServiceLabel(selectedVendor.serviceType)}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Status</label>
                                                <p className="mt-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVendor.status)}`}>
                                                        {getStatusIcon(selectedVendor.status)}
                                                        {selectedVendor.status}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <h5 className="text-xs font-semibold text-gray-600 mb-2">Cost Breakdown</h5>
                                            <div className="space-y-2">
                                                {selectedVendor.serviceType === 'website' && (
                                                    <>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Per Page Cost</span>
                                                            <span className="font-medium">{formatCurrency(selectedVendor.serviceDetails.perPageCost)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Number of Pages</span>
                                                            <span className="font-medium">{selectedVendor.serviceDetails.noOfPages}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm border-t pt-2">
                                                            <span className="font-semibold">Total Cost</span>
                                                            <span className="font-bold text-blue-600">{formatCurrency(selectedVendor.serviceDetails.totalCost)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {(selectedVendor.serviceType === 'photoshoot' || selectedVendor.serviceType === 'videoshoot') && (
                                                    <>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Per Day Cost</span>
                                                            <span className="font-medium">{formatCurrency(selectedVendor.serviceDetails.perDayCost)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Number of Days</span>
                                                            <span className="font-medium">{selectedVendor.serviceDetails.noOfDays}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm border-t pt-2">
                                                            <span className="font-semibold">Total Cost</span>
                                                            <span className="font-bold text-blue-600">{formatCurrency(selectedVendor.serviceDetails.totalCost)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {selectedVendor.serviceType === 'poster' && (
                                                    <>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Per Post Cost</span>
                                                            <span className="font-medium">{formatCurrency(selectedVendor.serviceDetails.perPostCost)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Number of Posts</span>
                                                            <span className="font-medium">{selectedVendor.serviceDetails.noOfPosts}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm border-t pt-2">
                                                            <span className="font-semibold">Total Cost</span>
                                                            <span className="font-bold text-blue-600">{formatCurrency(selectedVendor.serviceDetails.totalCost)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress & Due Date */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500">Progress</label>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${getCompletionColor(selectedVendor.completion)} transition-all duration-500`}
                                                        style={{ width: `${selectedVendor.completion}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{selectedVendor.completion}%</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500">Due Date</label>
                                            <p className={`text-sm font-medium mt-2 ${new Date(selectedVendor.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                                                {new Date(selectedVendor.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                {new Date(selectedVendor.dueDate) < new Date() && (
                                                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Overdue</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

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
}

export default VendorAssigned;