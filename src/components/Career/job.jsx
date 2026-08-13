import React, { useEffect, useState } from "react";
import jobOpeningServices from "../../services/opening.service";
import departmentService from "../../services/department.service";

const JobOpenings = () => {
    const [jobOpenings, setJobOpenings] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [showAddModal, setShowAddModal] = useState(false);

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
    });
    const fetchOpenings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await jobOpeningServices.getOpenings();
            console.log("Opening API Response:",response);
            console.log("Opening DB Data:",response?.data);

            if (response?.success) {
              setJobOpenings(response.data || []);
            } else {
                setError(response?.message ||"Failed to fetch openings.");
            }

        } catch (error) {
            console.error("Opening API Error:",error);

            setError(error?.message || "Failed to fetch openings." );

        } finally {
            setLoading(false);

        }
    };
    const fetchDepartments = async () => {

        try {

            setDepartmentLoading(true);
            setDepartmentError("");

            const response =await departmentService.getDepartments();

            console.log("Department API Response:",response);

            console.log(
                "Department Data:",
                response?.data
            );

            if (response?.success) {

                setDepartments(
                    response.data || []
                );

            } else {

                setDepartmentError(
                    response?.message ||
                    "Failed to fetch departments."
                );
            }

        } catch (error) {

            console.error(
                "Department API Error:",
                error
            );

            setDepartmentError(
                error?.message ||
                "Failed to fetch departments."
            );

        } finally {

            setDepartmentLoading(false);

        }
    };
    useEffect(() => {

        fetchOpenings();
        fetchDepartments();

    }, []);
    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

    };
    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            // -----------------------------
            // VALIDATION
            // -----------------------------

            if (!formData.jobTitle.trim()) {

                alert(
                    "Please enter job title."
                );

                return;
            }


            if (!formData.departmentId) {

                alert(
                    "Please select a department."
                );

                return;
            }


            if (!formData.openingCount) {

                alert(
                    "Please enter opening count."
                );

                return;
            }


            if (!formData.minExp && formData.minExp !== 0) {

                alert(
                    "Please enter minimum experience."
                );

                return;
            }


            if (!formData.requiredSkills.trim()) {

                alert(
                    "Please enter required skills."
                );

                return;
            }


            // -----------------------------
            // REQUEST DATA
            // -----------------------------

            const newOpening = {

                code:
                    formData.openingCode ||
                    `JOB${String(
                        jobOpenings.length + 1
                    ).padStart(3, "0")}`,

                jobTitle:
                    formData.jobTitle.trim(),

                departmentId:
                    Number(
                        formData.departmentId
                    ),

                openingCount:
                    Number(
                        formData.openingCount
                    ),

                requiredSkills:
                    formData.requiredSkills.trim(),

                minExperience:
                    Number(
                        formData.minExp
                    ),

                jobDescription:
                    formData.jobDetails.trim(),

                isActive:
                    formData.status === "Active",
            };


            console.log(
                "Sending Opening:",
                newOpening
            );
            setSaving(true);

            const response =
                await jobOpeningServices.createOpening(
                    newOpening
                );


            console.log(
                "Create Opening Response:",
                response
            );
            if (response?.success) {

                alert(
                    "Opening created successfully."
                );
                await fetchOpenings();
                setFormData({

                    jobTitle: "",

                    departmentId: "",

                    openingCount: "",

                    openingCode: "",

                    minExp: "",

                    requiredSkills: "",

                    jobDetails: "",

                    status: "Active",

                });


                // Close modal
                setShowAddModal(false);

            } else {

                alert(
                    response?.message ||
                    "Failed to create opening."
                );
            }


        } catch (error) {

            console.error(
                "Create Opening Error:",
                error
            );

            alert(
                error?.message ||
                "Failed to create opening."
            );

        } finally {

            setSaving(false);

        }

    };
    const toggleStatus = (index) => {

        const updated =
            [...jobOpenings];

        updated[index] = {

            ...updated[index],

            isActive:
                !updated[index].isActive,

        };

        setJobOpenings(updated);

    };
    const deleteJob = (index) => {

        if (
            window.confirm(
                "Are you sure you want to delete this job opening?"
            )
        ) {

            setJobOpenings(
                jobOpenings.filter(
                    (_, i) =>
                        i !== index
                )
            );

        }

    };
    const getStatusBadge = (
        isActive
    ) => {

        return isActive

            ? "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"

            : "bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium";
    };
    return (

        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">

            <div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

                    <div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Current Openings
                        </h1>

                        <p className="text-sm text-gray-500">
                            Manage job postings and requirements
                        </p>

                    </div>


                    <button
                        onClick={() =>
                            setShowAddModal(true)
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                    >

                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />

                        </svg>

                        Add New Opening

                    </button>

                </div>


                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && (

                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">

                        {error}

                    </div>

                )}


                {/* =====================================================
                    TABLE
                ====================================================== */}

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200">

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

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            Loading openings...
                                        </td>

                                    </tr>

                                ) : jobOpenings.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            No openings found.
                                        </td>

                                    </tr>

                                ) : (

                                    jobOpenings.map(
                                        (job, index) => (

                                            <tr
                                                key={
                                                    job.jobid ||
                                                    index
                                                }
                                                className="hover:bg-gray-50 transition-colors"
                                            >

                                                {/* CODE */}

                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {job.code}
                                                </td>


                                                {/* JOB TITLE */}

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {job.jobTitle}
                                                </td>


                                                {/* DEPARTMENT */}

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {job.department?.name || "-"}

                                                </td>


                                                {/* REQUIRED SKILLS */}

                                                <td
                                                    className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate"
                                                    title={
                                                        job.requiredSkills
                                                    }
                                                >

                                                    {
                                                        job.requiredSkills
                                                    }

                                                </td>


                                                {/* EXPERIENCE */}

                                                <td className="px-4 py-3 text-sm text-gray-700">

                                                    {
                                                        job.minExperience
                                                    }{" "}
                                                    Years

                                                </td>


                                                {/* OPENINGS */}

                                                <td className="px-4 py-3 text-sm text-gray-700 text-center">

                                                    {
                                                        job.openingCount
                                                    }

                                                </td>


                                                {/* STATUS */}

                                                <td className="px-4 py-3">

                                                    <span
                                                        className={getStatusBadge(
                                                            job.isActive
                                                        )}
                                                    >

                                                        {
                                                            job.isActive
                                                                ? "Active"
                                                                : "Inactive"
                                                        }

                                                    </span>

                                                </td>


                                                {/* APPLY LINK */}

                                                <td className="px-4 py-3 text-sm text-blue-600 hover:text-blue-800">

                                                    {job.applyLink ? (

                                                        <a
                                                            href={
                                                                job.applyLink
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:underline"
                                                        >
                                                            Apply Link
                                                        </a>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            -
                                                        </span>

                                                    )}

                                                </td>


                                                {/* ACTIONS */}

                                                <td className="px-4 py-3">

                                                    <div className="flex gap-2">

                                                        <button
                                                            onClick={() =>
                                                                toggleStatus(
                                                                    index
                                                                )
                                                            }
                                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                                                job.isActive
                                                                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                                            }`}
                                                        >

                                                            {
                                                                job.isActive
                                                                    ? "Deactivate"
                                                                    : "Activate"
                                                            }

                                                        </button>


                                                        <button
                                                            onClick={() =>
                                                                deleteJob(
                                                                    index
                                                                )
                                                            }
                                                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">

                            <span>
                                Total Openings:{" "}
                                {jobOpenings.length}
                            </span>


                            <div className="flex gap-4">

                                <span>

                                    Active:{" "}

                                    <span className="font-medium text-green-600">

                                        {
                                            jobOpenings.filter(
                                                (j) =>
                                                    j.isActive
                                            ).length
                                        }

                                    </span>

                                </span>


                                <span>

                                    Inactive:{" "}

                                    <span className="font-medium text-gray-600">

                                        {
                                            jobOpenings.filter(
                                                (j) =>
                                                    !j.isActive
                                            ).length
                                        }

                                    </span>

                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================================
                ADD NEW OPENING MODAL
            ========================================================== */}

            {showAddModal && (

                <div className="fixed inset-0 z-50 overflow-y-auto">

                    {/* BACKDROP */}

                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() =>
                            !saving &&
                            setShowAddModal(false)
                        }
                    />


                    {/* MODAL */}

                    <div className="flex min-h-full items-center justify-center p-4">

                        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">


                            {/* MODAL HEADER */}

                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">

                                <div className="flex justify-between items-center">

                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Add New Opening
                                    </h2>


                                    <button
                                        onClick={() =>
                                            !saving &&
                                            setShowAddModal(
                                                false
                                            )
                                        }
                                        className="text-gray-400 hover:text-gray-600"
                                    >

                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />

                                        </svg>

                                    </button>

                                </div>

                            </div>


                            {/* MODAL BODY */}

                            <div className="px-6 py-6">

                                <form
                                    onSubmit={
                                        handleSubmit
                                    }
                                >

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                                        {/* JOB TITLE */}

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 mb-1">

                                                Job Title{" "}

                                                <span className="text-red-500">
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                type="text"
                                                name="jobTitle"
                                                value={
                                                    formData.jobTitle
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., Senior Developer"
                                            />

                                        </div>


                                        {/* DEPARTMENT */}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Department{" "}
                                                <span className="text-red-500">*</span>
                                            </label>

                                            <select
                                                name="departmentId"
                                                value={formData.departmentId}
                                                onChange={handleChange}
                                                required
                                                disabled={departmentLoading}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">
                                                    {departmentLoading
                                                        ? "Loading departments..."
                                                        : "Select Department"}
                                                </option>

                                                {departments.map((department) => (
    <option key={department.id} value={department.id}>
        {department.name}
    </option>
))}
                                            </select>

                                            {departmentError && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {departmentError}
                                                </p>
                                            )}
                                        </div>


                                        {/* OPENING COUNT */}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Opening Count{" "}
                                                 <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>


                                            <input type="number" name="openingCount"
                                                value={
                                                    formData.openingCount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Number of openings"
                                            />

                                        </div>


                                        {/* OPENING CODE */}

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Opening Code
                                            </label>


                                            <input
                                                type="text"
                                                name="openingCode"
                                                value={
                                                    formData.openingCode
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                                placeholder="Auto generated"
                                                disabled
                                            />


                                            <p className="text-xs text-gray-400 mt-1">
                                                Auto generated by system
                                            </p>

                                        </div>


                                        {/* MIN EXPERIENCE */}

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 mb-1">

                                                Min. Experience{" "}

                                                <span className="text-red-500">
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                type="number"
                                                name="minExp"
                                                value={
                                                    formData.minExp
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., 2"
                                            />

                                        </div>


                                        {/* REQUIRED SKILLS */}

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 mb-1">

                                                Required Skills{" "}

                                                <span className="text-red-500">
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                type="text"
                                                name="requiredSkills"
                                                value={
                                                    formData.requiredSkills
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., PHP, React, MySQL"
                                            />

                                        </div>


                                        {/* JOB DESCRIPTION */}

                                        <div className="md:col-span-2">

                                            <label className="block text-sm font-medium text-gray-700 mb-1">

                                                Job Details / Description

                                            </label>


                                            <textarea
                                                name="jobDetails"
                                                value={
                                                    formData.jobDetails
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Detailed job description..."
                                            />

                                        </div>


                                        {/* STATUS */}

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>


                                            <select
                                                name="status"
                                                value={
                                                    formData.status
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >

                                                <option value="Active">
                                                    Active
                                                </option>

                                                <option value="Inactive">
                                                    Inactive
                                                </option>

                                            </select>

                                        </div>

                                    </div>


                                    {/* MODAL FOOTER */}

                                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t border-gray-200">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAddModal(
                                                    false
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>


                                        <button
                                            type="submit"
                                            disabled={
                                                saving ||
                                                departmentLoading
                                            }
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        >

                                            {saving
                                                ? "Saving..."
                                                : "Save Opening"}

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