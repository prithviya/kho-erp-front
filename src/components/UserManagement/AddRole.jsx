import React from "react";
function AddRole({ openModal, setOpenModal, employees = [] }) {
    if (!openModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Add User
                    </h2>
                    <button
                        onClick={() => setOpenModal(false)}
                        className="text-2xl text-gray-500 hover:text-red-500"
                    >
                        ×
                    </button>
                </div>
                {/* Form */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Role */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Role Name
                        </label>
                        <select className="w-full rounded-lg border p-2">
                            <option value="">Select Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Team Member">Team Member</option>
                        </select>
                    </div>
                    {/* Username */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            User Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            className="w-full rounded-lg border p-2"
                        />
                    </div>
                    {/* Password */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            className="w-full rounded-lg border p-2"
                        />
                    </div>
                    {/* Employee */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Link to Employee Record
                        </label>
                        <select className="w-full rounded-lg border p-2">
                            <option value="">Select Employee</option>
                            {employees.map((employee) => (
                                <option
                                    key={employee.id}
                                    value={employee.id}
                                >
                                    {employee.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* Footer */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => setOpenModal(false)}
                        className="rounded-lg border px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
export default AddRole;
