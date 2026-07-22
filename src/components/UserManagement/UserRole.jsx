import React, { useState } from "react";
import AddRole from "./AddRole";

function UserRole() {
    const [openModal, setOpenModal] = useState(false);

    return (
        <div className="p-6">
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    User Role Management
                </h1>

                <button
                    onClick={() => setOpenModal(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    + Add ERP Role
                </button>
            </div>

            <table className="w-full border">
                <thead className="bg-gray-100">
                    <tr className="text-left">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Full Name</th>
                        <th className="px-6 py-3">Email </th>
                        <th className="px-6 py-3">Username</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    <tr className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">1</td>
                        <td className="px-6 py-4">Emp</td>
                        <td className="px-6 py-4">Emp@example.com</td>
                        <td className="px-6 py-4">admin</td>
                        <td className="px-6 py-4">Team Member</td>
                        <td className="px-6 py-4">
                            <span className="rounded-full bg-green-200 px-3 py-1 text-sm text-green-800">
                                Active
                            </span>
                        </td>

                        <td className="px-6 py-4">
                            <button className="text-blue-600">
                                Edit
                            </button>

                            <button className="ml-4 text-red-600">
                                Delete
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <AddRole
                openModal={openModal}
                setOpenModal={setOpenModal}
            />
            </div>
        </div>
    );
}

export default UserRole;
