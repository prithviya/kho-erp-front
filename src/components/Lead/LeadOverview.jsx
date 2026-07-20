import {
  Users,
  BadgeCheck,
  Phone,
  MessageSquare,
  FileText,
  Handshake,
  Eye, 
  Pencil } from "lucide-react";
import CreateLead from "./CreateLead";
import EditLead from "./EditLead";
import ViewLead from "./ViewLead";

import { useState } from "react";

export default function LeadStats() {
const [open, setOpen] = useState(false);
const [editOpen, setEditOpen] = useState(false);
const [viewOpen, setViewOpen] = useState(false);
const [selectedLead, setSelectedLead] = useState(null);



  const stats = [
    {
      title: "Total Leads",
      count: 7,
      icon: Users,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      title: "Converted Deals",
      count: 3,
      icon: BadgeCheck,
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      title: "Contacted",
      count: 1,
      icon: Phone,
      bg: "bg-yellow-100",
      color: "text-yellow-600",
    },
    {
      title: "Discussion",
      count: 1,
      icon: MessageSquare,
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
    {
      title: "Proposal",
      count: 1,
      icon: FileText,
      bg: "bg-orange-100",
      color: "text-orange-600",
    },
    {
      title: "Negotiation",
      count: 1,
      icon: Handshake,
      bg: "bg-pink-100",
      color: "text-pink-600",
    },
  ];

  return (
   <div className="p-4">
         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {stats.map((item) => {
            const Icon = item.icon;

            return (
            <div
                key={item.title}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
                <div>
                <p className="text-sm font-medium text-gray-500">
                    {item.title}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                    {item.count}
                </h2>
                </div>

                <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${item.bg}`}
                >
                <Icon className={`h-7 w-7 ${item.color}`} />
                </div>
            </div>
            );
        })}
        </div>
        <div>
            <div className="flex items-center justify-between">
                <h4 className="mt-6 text-lg font-semibold text-gray-900">
                    Lead Pipeline
                </h4>

                <button
                    onClick={() => setOpen(true)}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Add New Lead
                </button>
            </div>


            <div className="overflow-x-auto">
                <table className="mt-6 w-full border-collapse rounded-lg border border-gray-200 text-left text-sm">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 font-semibold text-gray-900">#</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Lead Name</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Phone No</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Source</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">
                        Next Follow-up
                        </th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-900">
                        Action
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">1</td>
                        <td className="px-6 py-4 font-medium text-gray-900">John Doe</td>
                        <td className="px-6 py-4">john.doe@example.com</td>
                        <td className="px-6 py-4">123-456-7890</td>
                        <td className="px-6 py-4">Website</td>
                        <td className="px-6 py-4">
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Contacted
                        </span>
                        </td>
                        <td className="px-6 py-4">2023-07-15</td>
                        <td className="px-6 py-4">
                           <div className="flex justify-center gap-2">

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


            {/* Keep outside layout */}
            <CreateLead
                open={open}
                onClose={() => setOpen(false)}
            />
            <EditLead
                open={editOpen}
                onClose={() => setEditOpen(false)}
                lead={selectedLead}
            />


            <ViewLead
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                lead={selectedLead}
            />


        </div>

           
    </div>
  
  );
}
