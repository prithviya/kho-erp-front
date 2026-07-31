import React, { useState } from "react";
import AddRole from "./AddRole";
import { Eye, Pencil } from "lucide-react";
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
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="text-left">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr className="hover:bg-gray-100 transition-colors"> 
                                <td className="px-4 py-3 text-sm text-gray-700">1</td>
                                <td className="px-4 py-3 text-sm text-gray-700">Emp</td>
                                <td className="px-4 py-3 text-sm text-gray-700">Emp@example.com</td>
                                <td className="px-4 py-3 text-sm text-gray-700">admin</td>
                                <td className="px-4 py-3 text-sm text-gray-700">Team Member</td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    <span className="rounded-full bg-green-200 px-3 py-1 text-sm text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    <div className="flex justify-left gap-2">
                                        {/* Edit Button */}
                                        <button
                                            className="rounded-md bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        {/* View Button */}
                                        <button
                                            className="rounded-md bg-green-100 p-2 text-green-600 hover:bg-green-200"
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setViewOpen(true);
                                            }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <AddRole
                openModal={openModal}
                setOpenModal={setOpenModal}
            />
            </div>
            <div>
                <p>Services</p>
                <div></div>
            </div>
        </div>
    );
}
export default UserRole;
