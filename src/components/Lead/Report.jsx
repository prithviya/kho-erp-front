import React from 'react';
import {
  Eye, 
  Pencil } from "lucide-react";


function Report() {
  return (
    <div className="p-4">
       <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-1 flex items-end gap-4">

                {/* Company Name */}
                <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-900">
                        Company Name
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            🏢
                        </span>
                        <input
                            type="text"
                            placeholder="Search company..."
                            className="w-full rounded-lg border border-gray-300 px-10 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Contact Person */}
                <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-900">
                        Contact Person
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ♙
                        </span>
                        <input
                            type="text"
                            placeholder="Search contact..."
                            className="w-full rounded-lg border border-gray-300 px-10 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Lead Status */}
                <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-900">
                        Lead Status
                    </label>

                    <select className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                        <option>All Statuses</option>
                        <option>New Lead</option>
                        <option>Contacted</option>
                        <option>Discussion</option>
                        <option>Proposal</option>
                        <option>Negotiation</option>
                        <option>Converted</option>
                        <option>On Hold</option>
                    </select>
                </div>

                {/* Lead Source */}
                <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-600">
                        Lead Source
                    </label>

                    <select className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                        <option>All Sources</option>
                        <option>Website</option>
                        <option>Referral</option>
                        <option>Instagram</option>
                        <option>Facebook</option>
                        <option>Google</option>
                    </select>
                </div>

                {/* Search Button */}
                <div>
                    <button
                        className="flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        🔍 Search
                    </button>
                </div>

            </div>
       
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mt-3">
                <div className="overflow-x-auto">
                    {/* Display the filtered leads in a table */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                
                            <tr className="hover:bg-gray-100 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-700">1</td>
                                <td className="px-4 py-3 text-sm text-gray-700">John Doe</td>
                                <td className="px-4 py-3 text-sm text-gray-700">john.doe@example.com</td>
                                <td className="px-4 py-3 text-sm text-gray-700">Website</td>
                                <td className="px-4 py-3 text-sm text-gray-700"> <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">Contacted</span></td>
                                <td className="px-4 py-3 text-sm text-gray-700"> 5000</td>
                                <td className="px-4 py-3 text-sm text-gray-700">2023-07-15</td>
                                <td className="px-4 py-3 text-sm text-gray-700 flex gap-2">
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
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Report