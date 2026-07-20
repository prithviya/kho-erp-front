import { X } from "lucide-react";
import { useState } from "react";

export default function ViewLead({ open, onClose, lead }) {

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


  const handleStatusChange = (e) => {
    setStatus(e.target.value);

    // API call here
    // updateLeadStatus(lead.id, e.target.value)
  };


  if (!open) return null;


  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />


      {/* Offcanvas */}
      <div
        className="
        fixed right-0 top-0 z-50
        flex h-screen w-full max-w-md
        flex-col bg-white shadow-2xl
        "
      >

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-semibold">
            View Lead
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


          <div className="mb-3 flex justify-between">

            <span className="font-medium">
              Lead Status
            </span>

            <span className="text-sm text-gray-500">
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



        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">


          {/* Status Change */}
          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium">
              Change Status
            </label>


            <select
              value={status}
              onChange={handleStatusChange}
              className="
              w-full rounded-lg border
              border-gray-300 px-4 py-2
              "
            >

              <option value="New Lead">
                New Lead
              </option>

              <option value="Contacted">
                Contacted
              </option>

              <option value="Discussion">
                Discussion
              </option>

              <option value="Proposal">
                Proposal
              </option>

              <option value="Negotiation">
                Negotiation
              </option>

              <option value="Converted">
                Converted
              </option>

              <option value="On Hold">
                On Hold
              </option>

            </select>

          </div>



          {/* Company */}
          <ViewField
            label="Company Name"
            value={lead?.company}
          />


          <ViewField
            label="Contact Person"
            value={lead?.name}
          />


          <ViewField
            label="Phone"
            value={lead?.phone}
          />


          <ViewField
            label="Email"
            value={lead?.email}
          />


          <ViewField
            label="Source"
            value={lead?.source}
          />


          <ViewField
            label="Budget"
            value={lead?.budget}
          />


          <ViewField
            label="Follow Up"
            value={lead?.followup}
          />



          <div>

            <label className="mb-2 block text-sm font-medium">
              Notes
            </label>

            <textarea
              readOnly
              value={lead?.notes || ""}
              className="
              w-full rounded-lg border
              bg-gray-100 px-4 py-2
              "
              rows="3"
            />

          </div>


        </div>


      </div>

    </>
  );
}



function ViewField({label,value}){

return (

<div className="mb-4">

<label className="mb-1 block text-sm font-medium text-gray-600">
{label}
</label>

<input
readOnly
value={value || ""}
className="
w-full rounded-lg border
bg-gray-100 px-4 py-2
text-gray-700
"
/>

</div>

)

}
