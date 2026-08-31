import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  Building2,
  UserRound,
} from "lucide-react";

import leadService from "../../services/lead.service";
// import ViewLead from "./ViewLead";
function Report() {
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companySearch, setCompanySearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) { return payload.data; }
    return [];
  };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (companySearch.trim()) { params.search = companySearch.trim(); }
      if (statusFilter) { params.leadStatusId = statusFilter; }
      const response = await leadService.getLeads(params);
      const list = normalizeList(response);
      setLeads(list);
    } catch (err) {
      setError(
        err?.message || "Failed to load leads."
      );
      setLeads([]);
    } finally { setLoading(false); }
  }, [companySearch, statusFilter]);

  // Fetch statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await leadService.getLeadStatuses();
        const list = normalizeList(response);
        setStatuses(list);
      } catch (err) {
        console.error("STATUS FETCH ERROR:", err);
      }
    };

    fetchStatuses();
  }, []);

  // Fetch leads
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch { return "-"; }
  };

  // Get contact name
  const getContactName = (lead) => {
    if (lead.client) return lead.client;
    if (lead.contactPerson) return lead.contactPerson;
    if (lead.contactName) return lead.contactName;
    if (lead.phone) return lead.phone;
    if (lead.name) return lead.name;
    if (lead.requirement) return lead.requirement;
    return "-";
  };
  const getCompanyName = (lead) => {
    return (
      lead.company ||
      lead.companyName ||
      lead.company_name ||
      "-"
    );
  };
  const getEmail = (lead) => {
    return (
      lead.email ||
      lead.contactEmail ||
      lead.contact_email ||
      "-"
    );
  };

  const getPhone = (lead) => {
    return lead.phone || "-";
  };

  const getSource = (lead) => {
    return (
      lead.leadSource?.name ||
      lead.source?.name ||
      lead.source ||
      lead.leadSource ||
      "-"
    );
  };
  const getStatus = (lead) => {
    return (
      lead.leadStatus?.name ||
      lead.status?.name ||
      lead.status ||
      "-"
    );
  };
  const getBudget = (lead) => {
    const budget =
      lead.budget ??
      lead.amount ??
      lead.dealValue ??
      lead.deal_value;

    if (
      budget === null ||
      budget === undefined ||
      budget === ""
    ) {
      return "-";
    }

    const number = Number(budget);
    if (Number.isNaN(number)) {
      return budget;
    }

    return number.toLocaleString("en-IN");
  };

  // Filter source/contact on frontend
  const filteredLeads = leads.filter((lead) => {
    const contact = getContactName(lead).toLowerCase();
    const source = getSource(lead).toLowerCase();
    const contactMatch = !contactSearch.trim() || contact.includes(contactSearch.toLowerCase().trim());
    const sourceMatch = !sourceFilter || source === sourceFilter.toLowerCase();
    return contactMatch && sourceMatch;
  });

  const handleSearch = () => { fetchLeads(); };

  const sourceOptions = [
    ...new Set(
      leads
        .map((lead) => getSource(lead))
        .filter(
          (source) =>
            source &&
            source !== "-"
        )
    ),
  ];

  return (
    <div className="p-4">
      <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-1 flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-900">Company Name </label>

            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={companySearch} onChange={(e) =>   setCompanySearch(e.target.value) } onKeyDown={(e) => {   if (e.key === "Enter") {     handleSearch();   } }} placeholder="Search company..." className="w-full rounded-lg border border-gray-300 px-10 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contact Person */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-900"> Contact Person</label>
            <div className="relative">
                <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={contactSearch} onChange={(e) => setContactSearch(e.target.value) }  placeholder="Search contact..." className="w-full rounded-lg border border-gray-300 px-10 py-2.5 text-sm outline-none focus:border-blue-500"  />
            </div>
          </div>

          {/* Lead Status */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-900"> Lead Status </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value) }  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500" > 
                <option value=""> All Statuses </option> {statuses.map((status) => ( <option key={status.id} value={status.id}> {status.name}</option> ))}
            </select>
          </div>

          {/* Lead Source */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase text-gray-600"> Lead Source </label>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value) } className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500" >
              <option value=""> All Sources </option> {sourceOptions.map((source) => ( <option key={source} value={source} > {source} </option> ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <button onClick={handleSearch} disabled={loading} className="flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" >
              <Search size={16} /> {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>


        {/* TABLE */}
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> # </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Lead Name </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Company Name </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Phone No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Email </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Source </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Budget </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Created Date </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Status </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">

                {/* Loading */}
                {loading && (
                    <tr>  
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500" > Loading leads... </td> 
                    </tr>
                )}

                {/* Error */}
                {!loading && error && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-red-500" >
                      {error}
                    </td>
                  </tr>
                )}

                {/* No Data */}
                {!loading && !error && filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500" >
                        No leads found.
                      </td>
                    </tr>
                  )}

                {/* Dynamic Leads */}
                {!loading && !error &&
                  filteredLeads.map((lead, index) => {
                    const company = getCompanyName(lead);
                    const contact = getContactName(lead);
                    const email = getEmail(lead);
                    const phone = getPhone(lead);
                    const source = getSource(lead);
                    const status = getStatus(lead);

                    return (
                      <tr key={ lead.id || lead.leadid || index } className="transition-colors hover:bg-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-700"> {index + 1} </td>
                        <td className="px-4 py-3 text-sm text-gray-700"> {contact}</td>
                        <td className="px-4 py-3 text-sm text-gray-700"> {company} </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-700"> {email} </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700"> {source} </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700"> {getBudget(lead)} </td>
                        <td className="px-4 py-3 text-sm text-gray-700"> { formatDate( lead.createdAt || lead.created_at ) } </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-medium text-lime-700"> {status}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>


        {/* DEBUG */}
        {/* {process.env.NODE_ENV === "development" && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Total leads: {leads.length} | Showing:{" "}
            {filteredLeads.length}
          </div>
        )} */}

      </div>
       
    </div>
  );
}

export default Report;