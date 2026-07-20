import React from 'react'

function Report() {
  return (
    <div className="p-4">
       <div className="mb-6 flex items-end gap-4">

    {/* Company Name */}
    <div className="flex-1">
        <label className="mb-2 block text-xs font-semibold uppercase text-gray-600">
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
        <label className="mb-2 block text-xs font-semibold uppercase text-gray-600">
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
        <label className="mb-2 block text-xs font-semibold uppercase text-gray-600">
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

        <div>
            {/* Display the filtered leads in a table */}
            <table className="mt-6 w-full border-collapse rounded-lg border border-gray-200 text-left text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-6 py-3 font-semibold text-gray-900">#</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Lead Name</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Source</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 font-semibold text-gray-900">
                    Budget
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900">
                    Created Date
                    </th>
                </tr>
                </thead>

                <tbody>
                <tr className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">1</td>
                    <td className="px-6 py-4 font-medium text-gray-900">John Doe</td>
                    <td className="px-6 py-4">john.doe@example.com</td>
                    <td className="px-6 py-4">Website</td>
                    <td className="px-6 py-4">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        Contacted
                    </span>
                    </td>
                    <td>
                        5000
                    </td>
                    <td className="px-6 py-4">2023-07-15</td>
                   
                </tr>
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default Report