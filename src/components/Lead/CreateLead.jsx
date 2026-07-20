import { X } from "lucide-react";

export default function LeadOffcanvas({ open, onClose }) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
      <div
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Add New Lead</h2>

                <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100"
                >
                <X size={20} />
                </button>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto">
                <form className="space-y-5 p-6">
                    {/* Company */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Company Name
                        </label>
                        <input
                        type="text"
                        placeholder="Company Ltd"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Contact Person
                        </label>
                        <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Phone Number
                        </label>
                        <input
                        type="tel"
                        placeholder="+91 9876543210"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Email
                        </label>
                        <input
                        type="email"
                        placeholder="contact@email.com"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                    </div>

                    {/* Lead Source */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Lead Source
                        </label>
                        <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                        <option>Website</option>
                        <option>Referral</option>
                        <option>Instagram</option>
                        <option>Facebook</option>
                        <option>Google</option>
                        </select>
                    </div>

                    {/* Services */}
                    <div>
                        <label className="mb-3 block text-sm font-medium">
                        Required Services
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                        {[
                            "Website",
                            "SEO",
                            "SMM",
                            "Ads",
                            "Web App",
                            "Videography",
                            "Photography",
                            "Video Editing",
                            "Branding Logo",
                            "Brochure",
                            "Pamphlet",
                            "UI/UX",
                        ].map((service) => (
                            <label
                            key={service}
                            className="flex items-center gap-2 rounded-lg border p-2 hover:bg-gray-50"
                            >
                            <input type="checkbox" />
                            <span>{service}</span>
                            </label>
                        ))}
                        </div>
                    </div>

                    {/* Budget */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Estimated Budget
                        </label>
                        <input
                        type="number"
                        placeholder="₹0"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                    </div>

                    {/* Follow Up */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Next Follow-up Date
                        </label>
                        <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                    </div>

                    {/* Project */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Project Name
                        </label>
                        <textarea
                        rows={3}
                        placeholder="Project Name"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        />
                    </div>

                    {/* CRM Executive */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Assigned CRM Executive
                        </label>
                        <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                        <option>John</option>
                        <option>David</option>
                        <option>Sarah</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                        Internal Notes
                        </label>
                        <textarea
                        rows={3}
                        placeholder="Private notes..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
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
                        type="submit"
                        className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                        >
                        Save Lead
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </>
  );
}
