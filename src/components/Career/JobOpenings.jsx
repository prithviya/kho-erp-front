import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';  
import { PlusSquare, Trash2, Edit3, X, Link2, Link2Off  } from 'lucide-react';
import jobOpeningServices from "../../services/opening.service";
import departmentService from "../../services/department.service";

const JobOpenings = () => {
    const navigate = useNavigate();
    const [jobOpenings, setJobOpenings] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // New states for Editing
    const [isEditing, setIsEditing] = useState(false);
    const [currentJobId, setCurrentJobId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [departmentLoading, setDepartmentLoading] = useState(false);

    const [error, setError] = useState("");
    const [departmentError, setDepartmentError] = useState("");

    const [formData, setFormData] = useState({
        jobTitle: "",
        departmentId: "",
        openingCount: "",
        openingCode: "",
        minExp: "",
        requiredSkills: "",
        jobDetails: "",
        status: "Active",
        jobOpeningUrl: ""
    });

    const fetchOpenings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await jobOpeningServices.getOpenings();
            if (response?.success) {
                setJobOpenings(response.data || []);
            } else {
                setError(response?.message || "Failed to fetch openings.");
            }
        } catch (error) {
            setError(error?.message || "Failed to fetch openings.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            setDepartmentLoading(true);
            const response = await departmentService.getDepartments();
            if (response?.success) {
                setDepartments(response.data || []);
            } else {
                setDepartmentError(response?.message || "Failed to fetch departments.");
            }
        } catch (error) {
            setDepartmentError(error?.message || "Failed to fetch departments.");
        } finally {
            setDepartmentLoading(false);
        }
    };

    useEffect(() => {
        fetchOpenings();
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleStatus = async (jobId, currentStatus) => {
        try {
            setSaving(true);
            const response = await jobOpeningServices.updateStatus(jobId, !currentStatus);
            if (response?.success) {
                toast.success(`Opening ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
                await fetchOpenings();
            } else {
                toast.error(response?.message || 'Failed to update status.');
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to update status.');
        } finally {
            setSaving(false);
        }
    };

    // Updated Edit Logic
    const editJob = (job) => {
        setIsEditing(true);
        setCurrentJobId(job.jobid);
        setFormData({
            jobTitle: job.jobTitle,
            departmentId: job.departmentId,
            openingCount: job.openingCount,
            openingCode: job.code,
            minExp: job.minExperience,
            requiredSkills: job.requiredSkills,
            jobDetails: job.jobDescription || "",
            status: job.isActive ? "Active" : "Inactive",
            jobOpeningUrl: job.jobOpeningUrl || ""
        });
        setShowAddModal(true);
    };

    const deleteJob = async (jobId) => {
        if (window.confirm("Are you sure you want to delete this job opening?")) {
            try {
                setSaving(true);
                const response = await jobOpeningServices.deleteOpening(jobId);
                if (response?.success) {
                    toast.success("Opening deleted successfully.");
                    await fetchOpenings();
                } else {
                    toast.error(response?.message || "Failed to delete opening.");
                }
            } catch (error) {
                toast.error(error?.message || "Failed to delete opening.");
            } finally {
                setSaving(false);
            }
        }
    };

    const getDepartmentPrefix = (departmentId) => {
        const departmentMap = { 1: 'DM', 2: 'OP', 3: 'WD', 4: 'CO' };
        return departmentMap[departmentId] || 'GEN';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const departmentId = Number(formData.departmentId);
            
            // Only generate new code if it's a new entry
            let code = formData.openingCode;
            if (!isEditing) {
                const prefix = getDepartmentPrefix(departmentId);
                const existingCount = jobOpenings.filter(job => job.code && job.code.startsWith(prefix)).length;
                code = `${prefix}-${String(existingCount + 1).padStart(3, '0')}`;
            }

            const payload = {
                code: code,
                jobTitle: formData.jobTitle.trim(),
                departmentId: departmentId,
                openingCount: Number(formData.openingCount),
                requiredSkills: formData.requiredSkills.trim(),
                minExperience: Number(formData.minExp),
                jobDescription: formData.jobDetails.trim(),
                isActive: formData.status === "Active",
            };

            let response;
            if (isEditing) {
                response = await jobOpeningServices.updateOpening(currentJobId, payload);
            } else {
                response = await jobOpeningServices.createOpening(payload);
            }

            if (response?.success) {
                toast.success(isEditing ? "Updated successfully" : "Created successfully");
                setShowAddModal(false);
                setIsEditing(false);
                await fetchOpenings();
                setFormData({
                    jobTitle: "", departmentId: "", openingCount: "", openingCode: "",
                    minExp: "", requiredSkills: "", jobDetails: "", status: "Active",
                });
            } else {
                toast.error(response?.message || "Operation failed.");
            }
        } catch (error) {
            toast.error(error?.message || "Error saving opening.");
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (isActive) => {
        return isActive ? "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium": "bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium";
    };

    const copyJobOpeningUrl = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Apply URL copied.");
        } catch (error) {
            toast.error("Unable to copy apply URL.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900"> Current Openings </h1>
                        <p className="text-sm text-gray-500"> Manage job postings and requirements </p>
                    </div>
                    <button onClick={() => { setIsEditing(false); setFormData({jobTitle: "", departmentId: "", openingCount: "", openingCode: "", minExp: "", requiredSkills: "", jobDetails: "", status: "Active"}); setShowAddModal(true); }} className="px-3 py-2 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors duration-200 flex items-center gap-2"><PlusSquare size={'20'}/> Add</button>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-275 w-full table-fixed divide-y divide-gray-200">
                            <colgroup>
                                <col className="w-[8%]" /><col className="w-[17%]" /><col className="w-[14%]" />
                                <col className="w-[18%]" /><col className="w-[9%]" /><col className="w-[8%]" />
                                <col className="w-[8%]" /><col className="w-[16%]" /><col className="w-[22%]" />
                            </colgroup>
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CODE
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        JOB TITLE
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        DEPARTMENT
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        REQUIRED SKILLS
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        MIN. EXP
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        OPENINGS
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        STATUS
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        APPLY LINK
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">Loading openings...</td></tr>
                                ) : jobOpenings.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500"> No openings found. </td>
                                    </tr>
                                ) : (
                                    jobOpenings.map((job) => (
                                        <tr key={job.jobid} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900"> {job.code} </td>
                                            <td className="px-4 py-3 text-sm text-gray-700"> {job.jobTitle} </td>
                                            <td className="px-4 py-3 text-sm text-gray-700"> {job.department?.name || "-"} </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={job.requiredSkills}> {job.requiredSkills} </td>
                                            <td className="px-4 py-3 text-sm text-gray-700"> {job.minExperience} Years </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 text-center"> {job.openingCount} </td>
                                            <td className="px-4 py-3"> <span className={getStatusBadge(job.isActive)}> {job.isActive ? "Active" : "Inactive"} </span> </td>
                                            
                                            {/* APPLY LINK COLUMN - KEPT AS ORIGINAL */}
                                            <td className="px-4 py-3 text-sm text-blue-600"> 
                                                {job.jobOpeningUrl || job.jobid ? (
                                                    (() => {
                                                        const url = job.jobOpeningUrl || `${window.location.origin}/cif-form?jobid=${job.jobid}`;
                                                        const displayUrl = url.length > 20 ? `${url.slice(0, 20)}...` : url;
                                                        return ( 
                                                            <button type="button" onClick={() => copyJobOpeningUrl(url)} title={url} className="max-w-55 truncate text-left hover:underline">
                                                                {displayUrl}
                                                            </button>
                                                        );
                                                    })()
                                                ) : (<span className="text-gray-400">-</span>)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => toggleStatus(job.jobid, job.isActive)} disabled={saving} title={job.isActive ? "Deactivate" : "Activate"} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${ job.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200" }`}>
                                                        {job.isActive ? ( <Link2Off size={16} /> ) : (
                                                            <Link2 size={16} />
                                                        )}
                                                        </button>
                                                    <button onClick={() => editJob(job)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">
                                                        <Edit3 size={'14px'}/>
                                                    </button>
                                                    <button onClick={() => deleteJob(job.jobid)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">
                                                       <Trash2 size={'14px'}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
                            <span> Total Openings: {jobOpenings.length} </span>
                            <div className="flex gap-4">
                                <span> Active: <span className="font-medium text-green-600">{jobOpenings.filter(j => j.isActive).length}</span></span>
                                <span> Inactive: <span className="font-medium text-gray-600">{jobOpenings.filter(j => !j.isActive).length}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !saving && setShowAddModal(false)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800">{isEditing ? "Edit Opening" : "Add New Opening"}</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                            </div>

                            <div className="px-6 py-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                                            <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Senior Developer" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                            <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                <option value="">{departmentLoading ? "Loading..." : "Select Department"}</option>
                                                {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Count *</label>
                                            <input type="number" name="openingCount" value={formData.openingCount} onChange={handleChange} required min="1" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Code</label>
                                            <input type="text" name="openingCode" value={formData.openingCode} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" placeholder="Auto generated" disabled />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min. Experience *</label>
                                            <input type="number" name="minExp" value={formData.minExp} onChange={handleChange} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills *</label>
                                            <input type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Details</label>
                                            <textarea name="jobDetails" value={formData.jobDetails} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                            {saving ? "Saving..." : isEditing ? "Update Opening" : "Save Opening"}
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

export default JobOpenings;