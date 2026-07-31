import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import leadService from "../../services/lead.service";
import userManagementService from "../../services/userManagement.service";
import projectOnboardService from "../../services/projectOnboard.service";

const DETAIL_ENABLED_NAMES = new Set(["website", "seo", "smm", "ads", "web app"]);

const INITIAL_FORM = {
  projectName: "",
  companyName: "",
  projectManagerIds: [],
  spocIds: [],
  serviceIds: []
};

const INITIAL_SERVICE_DETAILS = {};

export default function ProjectOnboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const leadIdFromState = location?.state?.leadId || null;
  const userIdFromState = location?.state?.userId || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showSpocDropdown, setShowSpocDropdown] = useState(false);

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [serviceDetails, setServiceDetails] = useState(INITIAL_SERVICE_DETAILS);

  useEffect(() => {
    let mounted = true;

    async function loadSetup() {
      try {
        setLoading(true);
        const tasks = [
          userManagementService.getUsers(),
          leadService.getCategoriesWithServices()
        ];
        if (leadIdFromState) {
          tasks.push(leadService.getLeadById(leadIdFromState));
        }

        const [usersRes, categoriesRes, leadRes] = await Promise.all(tasks);
        if (!mounted) return;

        const allUsers = usersRes?.data || [];
        const activeUsers = allUsers.filter((u) => u.isActive && !u.deletedAt);
        setUsers(activeUsers);

        setCategories(categoriesRes?.data || []);

        const lead = leadRes?.data || null;
        setFormData((prev) => ({
          ...prev,
          companyName: lead?.companyName || prev.companyName,
          projectName: lead?.requirement || prev.projectName,
          projectManagerIds: userIdFromState ? [Number(userIdFromState)] : prev.projectManagerIds,
          spocIds: userIdFromState ? [Number(userIdFromState)] : prev.spocIds,
          serviceIds: Array.isArray(lead?.services)
            ? lead.services.map((s) => Number(s.id)).filter((id) => Number.isFinite(id))
            : Array.isArray(lead?.serviceIds)
              ? lead.serviceIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
              : prev.serviceIds
        }));
      } catch (err) {
        toast.error(err.message || "Failed to load onboarding setup.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSetup();
    return () => {
      mounted = false;
    };
  }, [leadIdFromState, userIdFromState]);

  const serviceMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      const services = cat.services || cat.Services || [];
      services.forEach((svc) => {
        map.set(Number(svc.id), {
          ...svc,
          categoryName: cat.name,
          categoryColor: cat.color || "#2563EB"
        });
      });
    });
    return map;
  }, [categories]);

  const selectedServices = useMemo(() => {
    return (formData.serviceIds || [])
      .map((id) => serviceMap.get(Number(id)))
      .filter(Boolean);
  }, [formData.serviceIds, serviceMap]);

  const selectedServicesCount = selectedServices.length;

  const userName = (user) => `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

  const selectedManagers = users.filter((u) => formData.projectManagerIds.includes(u.id));
  const selectedSpocs = users.filter((u) => formData.spocIds.includes(u.id));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId) => {
    const id = Number(serviceId);
    setFormData((prev) => {
      const current = prev.serviceIds || [];
      if (current.includes(id)) {
        setServiceDetails((prevDetails) => {
          const copy = { ...prevDetails };
          delete copy[id];
          return copy;
        });
        return { ...prev, serviceIds: current.filter((s) => s !== id) };
      }
      return { ...prev, serviceIds: [...current, id] };
    });
  };

  const handleServiceDetailChange = (serviceId, field, value) => {
    setServiceDetails((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };

  const handleListToggle = (serviceId, field, value) => {
    setServiceDetails((prev) => {
      const current = prev[serviceId] || {};
      const list = current[field] || [];
      const exists = list.includes(value);
      return {
        ...prev,
        [serviceId]: {
          ...current,
          [field]: exists ? list.filter((x) => x !== value) : [...list, value]
        }
      };
    });
  };

  const renderServiceFields = (service) => {
    const id = Number(service.id);
    const key = service.name?.toLowerCase() || "";
    const details = serviceDetails[id] || {};

    if (!DETAIL_ENABLED_NAMES.has(key)) return null;

    if (key === "website") {
      return (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Technology</label>
            <div className="grid grid-cols-3 gap-2">
              {["WordPress", "Shopify", "Custom"].map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleServiceDetailChange(id, "technology", tech)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${details.technology === tech ? "border-blue-600 bg-blue-100 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={details.notes || ""}
            onChange={(e) => handleServiceDetailChange(id, "notes", e.target.value)}
            placeholder="Additional website notes"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      );
    }

    if (key === "seo") {
      return (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <input
            type="number"
            value={details.keywordCount || ""}
            onChange={(e) => handleServiceDetailChange(id, "keywordCount", e.target.value)}
            placeholder="Keyword count"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={details.blogCount || ""}
            onChange={(e) => handleServiceDetailChange(id, "blogCount", e.target.value)}
            placeholder="Blog count"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      );
    }

    if (key === "smm") {
      const subs = details.subServices || [];
      return (
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          {["Reels", "Poster"].map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={subs.includes(item)}
                onChange={() => handleListToggle(id, "subServices", item)}
              />
              {item}
            </label>
          ))}
        </div>
      );
    }

    if (key === "ads") {
      const platforms = details.platforms || [];
      return (
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-gray-700">Platform</p>
          <div className="flex flex-wrap gap-2">
            {["Google", "Meta", "LinkedIn"].map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => handleListToggle(id, "platforms", platform)}
                className={`rounded-lg border px-3 py-1 text-xs ${platforms.includes(platform) ? "border-blue-600 bg-blue-100 text-blue-700" : "border-gray-300 bg-white text-gray-700"}`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (key === "web app") {
      return (
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <input
            type="text"
            value={details.techStack || ""}
            onChange={(e) => handleServiceDetailChange(id, "techStack", e.target.value)}
            placeholder="Tech stack"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            rows={2}
            value={details.features || ""}
            onChange={(e) => handleServiceDetailChange(id, "features", e.target.value)}
            placeholder="Features"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      );
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectName.trim()) return toast.error("Project name is required.");
    if (!formData.companyName.trim()) return toast.error("Company name is required.");
    if (!formData.projectManagerIds.length) return toast.error("Select at least one project manager.");
    if (!formData.spocIds.length) return toast.error("Select at least one SPOC.");
    if (!formData.serviceIds.length) return toast.error("Select at least one service.");

    try {
      setSaving(true);
      await projectOnboardService.create({
        leadId: leadIdFromState,
        projectName: formData.projectName.trim(),
        companyName: formData.companyName.trim(),
        projectManagerIds: formData.projectManagerIds,
        spocIds: formData.spocIds,
        serviceIds: formData.serviceIds,
        serviceDetails
      });

      toast.success("Project onboarded successfully.");
      setFormData((prev) => ({
        ...INITIAL_FORM,
        companyName: prev.companyName,
        projectName: ""
      }));
      setServiceDetails(INITIAL_SERVICE_DETAILS);
      navigate("/prjt-details", {
        state: { refreshAt: Date.now() }
      });
    } catch (err) {
      toast.error(err.message || "Failed to onboard project.");
    } finally {
      setSaving(false);
    }
  };

  const UserSelect = ({ selected, setSelected, show, setShow, placeholder, tone = "blue" }) => (
    <div className="relative">
      <div
        className="min-h-10.5 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2"
        onClick={() => setShow(!show)}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selected.length > 0 ? (
            selected.map((u) => (
              <span key={u.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${tone === "blue" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {userName(u)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(selected.filter((x) => x.id !== u.id));
                  }}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
          <span className="ml-auto text-gray-400">▼</span>
        </div>
      </div>

      {show && (
        <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {users.map((u) => {
            const checked = selected.some((x) => x.id === u.id);
            return (
              <label
                key={u.id}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50 ${checked ? "bg-blue-50" : ""}`}
                onClick={() => {
                  const nextSelected = checked
                    ? selected.filter((x) => x.id !== u.id)
                    : [...selected, u];
                  setSelected(nextSelected);
                }}
              >
                <input type="checkbox" readOnly checked={checked} />
                <div>
                  <div className="text-sm font-medium text-gray-700">{userName(u)}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading onboarding setup...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex gap-4">
        <div className="w-64 shrink-0">
          <div className="sticky top-4 max-h-[calc(80vh-100px)] overflow-y-auto rounded-xl bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Selected Services</h3>
            {selectedServices.length > 0 ? (
              <div className="space-y-1">
                {selectedServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700">{service.name}</span>
                    <button type="button" onClick={() => handleServiceToggle(service.id)} className="text-gray-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">No services selected</p>
            )}

            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{selectedServicesCount}/15</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min((selectedServicesCount / 15) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 rounded-xl bg-white p-6 shadow-lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Project Manager <span className="text-red-500">*</span></label>
                  <UserSelect
                    selected={selectedManagers}
                    setSelected={(members) => setFormData((prev) => ({ ...prev, projectManagerIds: members.map((m) => m.id) }))}
                    show={showManagerDropdown}
                    setShow={setShowManagerDropdown}
                    placeholder="Select Project Manager"
                    tone="blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">SPOC <span className="text-red-500">*</span></label>
                  <UserSelect
                    selected={selectedSpocs}
                    setSelected={(members) => setFormData((prev) => ({ ...prev, spocIds: members.map((m) => m.id) }))}
                    show={showSpocDropdown}
                    setShow={setShowSpocDropdown}
                    placeholder="Select SPOC"
                    tone="green"
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-md font-semibold text-gray-800">Required Services</h2>
                {categories.map((category) => {
                  const services = category.services || category.Services || [];
                  if (!services.length) return null;
                  return (
                    <div key={category.id} className="mb-4">
                      <h3 className="mb-2 text-sm font-medium text-gray-600">{category.name}</h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                        {services.map((service) => {
                          const selected = formData.serviceIds.includes(Number(service.id));
                          return (
                            <label
                              key={service.id}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => handleServiceToggle(service.id)}
                              />
                              <span className="font-medium text-gray-700">{service.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedServices.some((s) => DETAIL_ENABLED_NAMES.has(String(s.name || "").toLowerCase())) && (
                <div>
                  <h2 className="mb-3 text-md font-semibold text-gray-800">Service Details</h2>
                  <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                    {selectedServices.map((service) => {
                      const detailsUI = renderServiceFields(service);
                      if (!detailsUI) return null;
                      return (
                        <div key={service.id} className="overflow-hidden rounded-lg border-2 border-gray-200">
                          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                            <h4 className="text-sm font-semibold text-gray-800">{service.name}</h4>
                            <span className="text-xs text-gray-400">Required</span>
                          </div>
                          <div className="p-3">{detailsUI}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-gray-200 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
                >
                  <span>🚀</span>
                  {saving ? "Saving..." : "Onboard Project"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
