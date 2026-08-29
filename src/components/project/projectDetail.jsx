import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import leadService from "../../services/lead.service";
import userManagementService from "../../services/userManagement.service";
import projectOnboardService from "../../services/projectOnboard.service";

const DETAIL_ENABLED_NAMES = new Set(["website", "seo", "smm", "ads", "web app"]);

const EMPTY_EDIT_FORM = {
  projectName: "",
  companyName: "",
  projectManagerIds: [],
  spocIds: [],
  serviceIds: []
};

const EMPTY_ASSIGN_FORM = {
  assignedToIds: [],
  reportingHeadId: "",
  status: "In Progress"
};

function formatUserName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "-";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().split("T")[0];
}

const MultiUserSelect = ({ users, selectedIds, onChange, placeholder, tone = "blue" }) => {
  const [open, setOpen] = useState(false);

  const selectedUsers = users.filter((u) => selectedIds.includes(Number(u.id)));

  const removeUser = (id) => {
    onChange(selectedIds.filter((item) => Number(item) !== Number(id)));
  };

  const toggleUser = (id) => {
    const numericId = Number(id);
    const next = selectedIds.includes(numericId)
      ? selectedIds.filter((item) => Number(item) !== numericId)
      : [...selectedIds, numericId];
    onChange(next);
  };

  return (
    <div className="relative">
      <div
        className="min-h-10.5 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selectedUsers.length > 0 ? (
            selectedUsers.map((u) => (
              <span
                key={u.id}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                  tone === "blue" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}
              >
                {formatUserName(u)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(u.id);
                  }}
                >
                  x
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
          <span className="ml-auto text-gray-400">▼</span>
        </div>
      </div>

      {open && (
        <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {users.map((u) => {
            const checked = selectedIds.includes(Number(u.id));
            return (
              <label
                key={u.id}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50 ${checked ? "bg-blue-50" : ""}`}
                onClick={() => toggleUser(u.id)}
              >
                <input type="checkbox" checked={checked} readOnly />
                <div>
                  <div className="text-sm font-medium text-gray-700">{formatUserName(u)}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProjectManagement = () => {
  const location = useLocation();
  const refreshAt = location?.state?.refreshAt;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("projects");

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [serviceDetails, setServiceDetails] = useState({});
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGN_FORM);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(Number(u.id), u));
    return map;
  }, [users]);

  const serviceMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      const services = category.services || category.Services || [];
      services.forEach((service) => {
        map.set(Number(service.id), {
          ...service,
          categoryName: category.name
        });
      });
    });
    return map;
  }, [categories]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, userRes, categoryRes] = await Promise.allSettled([
        projectOnboardService.list(),
        userManagementService.getUsers(),
        leadService.getCategoriesWithServices()
      ]);

      if (projectRes.status === "fulfilled") {
        setProjects(projectRes.value?.data || []);
      } else {
        setProjects([]);
        toast.error(projectRes.reason?.message || "Failed to load projects.");
      }

      if (userRes.status === "fulfilled") {
        setUsers(userRes.value?.data || []);
      } else {
        setUsers([]);
      }

      if (categoryRes.status === "fulfilled") {
        setCategories(categoryRes.value?.data || []);
      } else {
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshAt) return;
    fetchData();
  }, [refreshAt, fetchData]);

  const assignedProjects = useMemo(
    () => projects.filter((p) => Array.isArray(p.assignedToIds) && p.assignedToIds.length > 0),
    [projects]
  );

  const getUserNames = (ids = []) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => userMap.get(Number(id)))
      .filter(Boolean)
      .map((u) => formatUserName(u));

  const getServiceNames = (ids = []) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => serviceMap.get(Number(id))?.name)
      .filter(Boolean);

  const openViewModal = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setEditForm({
      projectName: project.projectName || "",
      companyName: project.companyName || "",
      projectManagerIds: Array.isArray(project.projectManagerIds) ? project.projectManagerIds.map(Number) : [],
      spocIds: Array.isArray(project.spocIds) ? project.spocIds.map(Number) : [],
      serviceIds: Array.isArray(project.serviceIds) ? project.serviceIds.map(Number) : []
    });
    setServiceDetails(project.serviceDetails || {});
    setShowEditModal(true);
  };

  const openAssignModal = (project) => {
    const fallbackReportingHeadId = Array.isArray(project.projectManagerIds) && project.projectManagerIds.length
      ? Number(project.projectManagerIds[0])
      : "";

    setSelectedProject(project);
    setAssignForm({
      assignedToIds: Array.isArray(project.assignedToIds) ? project.assignedToIds.map(Number) : [],
      reportingHeadId: project.reportingHeadId ? Number(project.reportingHeadId) : fallbackReportingHeadId,
      status: project.status || "In Progress"
    });
    setShowAssignModal(true);
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedProject(null);
    setEditForm(EMPTY_EDIT_FORM);
    setServiceDetails({});
    setAssignForm(EMPTY_ASSIGN_FORM);
  };

  const updateEditField = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleService = (serviceId) => {
    const id = Number(serviceId);
    setEditForm((prev) => {
      const current = prev.serviceIds || [];
      if (current.includes(id)) {
        setServiceDetails((prevDetails) => {
          const copy = { ...prevDetails };
          delete copy[id];
          return copy;
        });
        return { ...prev, serviceIds: current.filter((item) => item !== id) };
      }
      return { ...prev, serviceIds: [...current, id] };
    });
  };

  const updateServiceDetail = (serviceId, field, value) => {
    setServiceDetails((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };

  const saveProjectUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (!editForm.projectName.trim()) return toast.error("Project name is required.");
    if (!editForm.companyName.trim()) return toast.error("Company name is required.");
    if (!editForm.projectManagerIds.length) return toast.error("Select at least one project manager.");
    if (!editForm.spocIds.length) return toast.error("Select at least one SPOC.");
    if (!editForm.serviceIds.length) return toast.error("Select at least one service.");

    try {
      setSaving(true);
      await projectOnboardService.update(selectedProject.id, {
        projectName: editForm.projectName.trim(),
        companyName: editForm.companyName.trim(),
        projectManagerIds: editForm.projectManagerIds,
        spocIds: editForm.spocIds,
        serviceIds: editForm.serviceIds,
        serviceDetails
      });

      toast.success("Project updated successfully.");
      closeAllModals();
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const saveProjectAssign = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (!assignForm.assignedToIds.length) return toast.error("Select at least one assignee.");
    try {
      setSaving(true);
      await projectOnboardService.assign(selectedProject.id, {
        assignedToIds: assignForm.assignedToIds,
        reportingHeadId: assignForm.reportingHeadId ? Number(assignForm.reportingHeadId) : null,
        status: assignForm.status || "In Progress"
      });

      toast.success("Project assigned successfully.");
      closeAllModals();
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to assign project.");
    } finally {
      setSaving(false);
    }
  };

  const renderProjectRows = (list) => {
    if (!list.length) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
            No projects found
          </td>
        </tr>
      );
    }

    return list.map((project) => {
      const managerNames = getUserNames(project.projectManagerIds);
      const serviceNames = getServiceNames(project.serviceIds);

      return (
        <tr key={project.id} className="transition-colors hover:bg-gray-50">
          <td className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{project.projectName}</p>
          </td>
          <td className="px-4 py-3">
            <p className="text-sm text-gray-700">{project.companyName}</p>
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {managerNames.length ? (
                managerNames.map((name) => (
                  <span key={`${project.id}-${name}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {serviceNames.length ? (
                serviceNames.map((serviceName) => (
                  <span key={`${project.id}-${serviceName}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {serviceName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <p className="text-sm text-gray-700">{formatDate(project.createdAt)}</p>
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openViewModal(project)}
                className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-200"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => openEditModal(project)}
                className="rounded-md bg-orange-200 px-2 py-1 text-xs text-orange-700 transition-colors hover:bg-orange-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => openAssignModal(project)}
                className="rounded-md bg-violet-200 px-2 py-1 text-xs text-violet-700 transition-colors hover:bg-violet-300"
              >
                Assign
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Project Manager</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Services</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading projects...
                  </td>
                </tr>
              ) : activeTab === "projects" ? (
                renderProjectRows(projects)
              ) : (
                renderProjectRows(assignedProjects)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeAllModals} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Project Details</h2>
                <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="px-6 py-6">
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Name</label>
                    <p className="text-gray-900">{selectedProject.projectName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                    <p className="text-gray-900">{selectedProject.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Manager</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getUserNames(selectedProject.projectManagerIds).map((name) => (
                        <span key={name} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{name}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">SPOC</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getUserNames(selectedProject.spocIds).map((name) => (
                        <span key={name} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{name}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{formatDate(selectedProject.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900">{selectedProject.status || "Pending"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getUserNames(selectedProject.assignedToIds).length ? (
                        getUserNames(selectedProject.assignedToIds).map((name) => (
                          <span key={name} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">{name}</span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="mb-3 text-md font-semibold text-gray-800">Services</h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  {getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                    <span key={serviceName} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{serviceName}</span>
                  ))}
                </div>

                <h3 className="mb-3 text-md font-semibold text-gray-800">Service Details</h3>
                <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                  {(selectedProject.serviceIds || []).map((serviceId) => {
                    const service = serviceMap.get(Number(serviceId));
                    if (!service) return null;

                    const serviceName = String(service.name || "");
                    const serviceKey = serviceName.toLowerCase();
                    const details = selectedProject.serviceDetails?.[serviceId] || selectedProject.serviceDetails?.[String(serviceId)] || {};

                    if (!DETAIL_ENABLED_NAMES.has(serviceKey)) return null;

                    return (
                      <div key={`detail-${serviceId}`} className="overflow-hidden rounded-lg border-2 border-gray-200">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                          <h4 className="text-sm font-semibold text-gray-800">{serviceName}</h4>
                        </div>
                        <div className="p-3">
                          {Object.keys(details).length ? (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {Object.entries(details).map(([key, value]) => (
                                <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                  <span className="font-medium">{key}:</span>{" "}
                                  {Array.isArray(value) ? value.join(", ") : String(value)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No details added.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeAllModals} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Edit Project</h2>
                <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="px-6 py-6">
                <form onSubmit={saveProjectUpdate}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Project Name</label>
                        <input
                          type="text"
                          name="projectName"
                          value={editForm.projectName}
                          onChange={updateEditField}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                          type="text"
                          name="companyName"
                          value={editForm.companyName}
                          onChange={updateEditField}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Project Manager</label>
                      <MultiUserSelect
                        users={users}
                        selectedIds={editForm.projectManagerIds}
                        onChange={(ids) => setEditForm((prev) => ({ ...prev, projectManagerIds: ids }))}
                        placeholder="Select Project Manager"
                        tone="blue"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">SPOC</label>
                      <MultiUserSelect
                        users={users}
                        selectedIds={editForm.spocIds}
                        onChange={(ids) => setEditForm((prev) => ({ ...prev, spocIds: ids }))}
                        placeholder="Select SPOC"
                        tone="green"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Services</label>
                      {categories.map((category) => {
                        const services = category.services || category.Services || [];
                        if (!services.length) return null;
                        return (
                          <div key={category.id} className="mb-4">
                            <h4 className="mb-2 text-xs font-medium text-gray-500">{category.name}</h4>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                              {services.map((service) => {
                                const selected = editForm.serviceIds.includes(Number(service.id));
                                return (
                                  <label
                                    key={service.id}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm ${
                                      selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleService(service.id)}
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

                    {editForm.serviceIds.some((serviceId) => {
                      const service = serviceMap.get(Number(serviceId));
                      return DETAIL_ENABLED_NAMES.has(String(service?.name || "").toLowerCase());
                    }) && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Service Details</label>
                        <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                          {editForm.serviceIds.map((serviceId) => {
                            const service = serviceMap.get(Number(serviceId));
                            if (!service) return null;

                            const name = String(service.name || "");
                            const key = name.toLowerCase();
                            if (!DETAIL_ENABLED_NAMES.has(key)) return null;

                            const details = serviceDetails[serviceId] || serviceDetails[String(serviceId)] || {};

                            return (
                              <div key={`edit-${serviceId}`} className="overflow-hidden rounded-lg border-2 border-gray-200">
                                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                                  <h4 className="text-sm font-semibold text-gray-800">{name}</h4>
                                </div>
                                <div className="space-y-2 p-3">
                                  {key === "website" && (
                                    <>
                                      <input
                                        type="text"
                                        value={details.technology || ""}
                                        onChange={(e) => updateServiceDetail(serviceId, "technology", e.target.value)}
                                        placeholder="Technology"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      />
                                      <input
                                        type="text"
                                        value={details.notes || ""}
                                        onChange={(e) => updateServiceDetail(serviceId, "notes", e.target.value)}
                                        placeholder="Notes"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      />
                                    </>
                                  )}

                                  {key === "seo" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="number"
                                        value={details.keywordCount || ""}
                                        onChange={(e) => updateServiceDetail(serviceId, "keywordCount", e.target.value)}
                                        placeholder="Keyword Count"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      />
                                      <input
                                        type="number"
                                        value={details.blogCount || ""}
                                        onChange={(e) => updateServiceDetail(serviceId, "blogCount", e.target.value)}
                                        placeholder="Blog Count"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      />
                                    </div>
                                  )}

                                  {key === "smm" && (
                                    <input
                                      type="text"
                                      value={(details.subServices || []).join(",")}
                                      onChange={(e) =>
                                        updateServiceDetail(
                                          serviceId,
                                          "subServices",
                                          e.target.value
                                            .split(",")
                                            .map((item) => item.trim())
                                            .filter(Boolean)
                                        )
                                      }
                                      placeholder="Sub services (comma separated)"
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                  )}

                                  {key === "ads" && (
                                    <input
                                      type="text"
                                      value={(details.platforms || []).join(",")}
                                      onChange={(e) =>
                                        updateServiceDetail(
                                          serviceId,
                                          "platforms",
                                          e.target.value
                                            .split(",")
                                            .map((item) => item.trim())
                                            .filter(Boolean)
                                        )
                                      }
                                      placeholder="Platforms (comma separated)"
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                  )}

                                  {key === "web app" && (
                                    <>
                                      <input
                                        type="text"
                                        value={details.techStack || ""}
                                        onChange={(e) => updateServiceDetail(serviceId, "techStack", e.target.value)}
                                        placeholder="Tech Stack"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      />
                                      <textarea
                                        rows={2}
                                        value={details.features || ""}
                                        onChange={(e) => updateServiceDetail(serviceId, "features", e.target.value)}
                                        placeholder="Features"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
                    >
                      {saving ? "Updating..." : "Update Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeAllModals} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Assign Project</h2>
                <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="px-6 py-6">
                <form onSubmit={saveProjectAssign}>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">Project Information</h3>
                      <p className="text-sm font-medium text-gray-900">{selectedProject.projectName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                          <span key={serviceName} className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">{serviceName}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Reporting Head</label>
                      <select
                        value={assignForm.reportingHeadId}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, reportingHeadId: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="">Select Reporting Head (Optional)</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {formatUserName(user)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Assign To</label>
                      <MultiUserSelect
                        users={users}
                        selectedIds={assignForm.assignedToIds}
                        onChange={(ids) => setAssignForm((prev) => ({ ...prev, assignedToIds: ids }))}
                        placeholder="Select Team Members"
                        tone="green"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={assignForm.status}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                      {saving ? "Assigning..." : "Assign Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
