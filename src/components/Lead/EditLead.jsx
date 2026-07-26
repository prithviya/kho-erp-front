import { X } from "lucide-react";
import { useState } from "react";
export default function EditLead({ open, onClose, lead }) {
  const [status, setStatus] = useState(
    lead?.status || "New Lead"
  );
  const progress = {
    "New Lead": 10,
    "Contacted": 30,
    "Discussion": 50,
    "Proposal": 70,
    "Negotiation": 85,
    "Converted": 100,
    "On Hold": 20,
  };
  if (!open) return null;
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="
          fixed inset-0 z-40 
          bg-black/50
          transition-opacity
        "
      />
      {/* Offcanvas */}
      <div
        className="
          fixed right-0 top-0 z-50
          h-screen w-full max-w-md
          bg-white shadow-2xl
          flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            Edit Lead
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20}/>
          </button>
        </div>
        {/* Status Progress */}
        <div className="border-b px-6 py-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">
              Lead Status
            </span>
            <span className="text-gray-500">
              {status}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="
                h-2 rounded-full 
                bg-blue-600
                transition-all duration-500
              "
              style={{
                width:`${progress[status]}%`
              }}
            />
          </div>
        </div>
        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form className="space-y-5 p-6">
            {/* Company */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Company Name
              </label>
              <input
                type="text"
                defaultValue={lead?.company || ""}
                className="
                w-full rounded-lg border 
                border-gray-300 px-4 py-2
                "
              />
            </div>
            {/* Contact */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Contact Person
              </label>
              <input
                type="text"
                defaultValue={lead?.name || ""}
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Phone Number
              </label>
              <input
                type="text"
                defaultValue={lead?.phone || ""}
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                defaultValue={lead?.email || ""}
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>
              <select
                value={status}
                onChange={(e)=>setStatus(e.target.value)}
                className="w-full rounded-lg border px-4 py-2"
              >
                <option>New Lead</option>
                <option>Contacted</option>
                <option>Discussion</option>
                <option>Proposal</option>
                <option>Negotiation</option>
                <option>Converted</option>
                <option>On Hold</option>
              </select>
            </div>
            {/* Budget */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Estimated Budget
              </label>
              <input
                type="number"
                defaultValue={lead?.budget || ""}
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            {/* Followup */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Next Follow-up Date
              </label>
              <input
                type="date"
                defaultValue={lead?.followup || ""}
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Notes
              </label>
              <textarea
                rows="3"
                defaultValue={lead?.notes || ""}
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-5 py-2"
              >
                Cancel
              </button>
              <button
                className="
                rounded-lg bg-blue-600 
                px-5 py-2 text-white
                hover:bg-blue-700
                "
              >
                Update Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
