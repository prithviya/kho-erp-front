import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import leadService from "../../services/lead.service";
import employeeService from "../../services/employee.service";
import userManagementService from "../../services/userManagement.service";
import projectOnboardService from "../../services/projectOnboard.service";
import { canDeleteRecords, isSuperAdmin } from "../../utils/auth";
import { filterEmployeeOptions } from "../../utils/employeeOptions";
import ServiceDetailFields, { hasServiceDetails } from "./ServiceDetailFields";

// Human-readable labels for the keys written by the onboarding form
// (includes legacy keys so older records still display).
const DETAIL_LABELS = {
  technology: "Technology",
  wpType: "WordPress Type",
  themeName: "Theme",
  customDetails: "Customization",
  shopifyType: "Shopify Type",
  shopifyThemeName: "Theme",
  shopifyCustomDetails: "Customization",
  customType: "Custom Type",
  techStack: "Tech Stack",
  features: "Features",
  notes: "Notes",
  keywordCount: "Keywords",
  blogCount: "Blogs",
  subServices: "Sub Services",
  posterCount: "Posters",
  videoCount: "Videos",
  videoproductionCount: "Video Production",
  storiesCount: "Stories",
  "Stories Count": "Stories",
  bannersCount: "Banners",
  BannersCount: "Banners",
  platforms: "Platforms",
  designCount: "Designs"
};

const parseStoredValue = (value, fallback = value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getArrayValue = (value) => {
  const parsedValue = parseStoredValue(value);
  if (Array.isArray(parsedValue)) return parsedValue;
  return parsedValue === null || parsedValue === undefined || parsedValue === "" ? [] : [parsedValue];
};

const getEmployeeList = (response) => {
  const data = parseStoredValue(response?.data, response?.data);
  if (Array.isArray(data)) return data;
  return getArrayValue(data?.employees || data?.Employees || data?.rows || data?.items);
};

const normalizeEmployee = (employee) => ({
  ...employee,
  id: employee?.id ?? employee?.employeeId,
  fullName: employee?.fullName || employee?.name || `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim()
});

const getSelectedValues = (project, primaryKey, relationKeys) => {
  const primaryValues = getArrayValue(project?.[primaryKey]);
  if (primaryValues.length) return primaryValues;

  for (const key of relationKeys) {
    const values = getArrayValue(project?.[key]);
    if (values.length) return values;
  }

  return [];
};

const getValueId = (value, fallbackToValue = true) => {
  if (value && typeof value === "object") {
    return value.id ?? value.userId ?? value.serviceId ?? value.value ?? value;
  }
  return fallbackToValue ? value : null;
};

const normalizeProject = (project) => ({
  ...project,
  projectManagerIds: getSelectedValues(project, "projectManagerIds", ["projectManagerIds", "projectManagers", "projectManager", "reportingHeadIds", "reportingHeads", "reportingHead"])
    .map((value) => getValueId(value))
    .filter((value) => value !== null && value !== undefined),
  spocIds: getSelectedValues(project, "spocIds", ["spocIds", "spocUserIds", "spocs", "SPOCs", "spoc", "spocUser"])
    .map((value) => getValueId(value))
    .filter((value) => value !== null && value !== undefined),
  serviceIds: getSelectedValues(project, "serviceIds", ["services", "Services"])
    .map((value) => value && typeof value === "object" ? value.id ?? value.serviceId ?? value.name : value)
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== ""),
  assignedToIds: getArrayValue(project?.assignedToIds)
    .map((value) => getValueId(value))
    .filter((value) => value !== null && value !== undefined),
  serviceDetails: parseStoredValue(project?.serviceDetails, {})
});

const getProjectServiceIds = (project, resolveService) => {
  const ids = getArrayValue(project?.serviceIds);
  const serviceDetails = parseStoredValue(project?.serviceDetails, {});
  const detailIds = serviceDetails && !Array.isArray(serviceDetails)
    ? Object.keys(serviceDetails)
    : [];

  const seen = new Set();
  return [...ids, ...detailIds].filter((value) => {
    if (String(value).trim() === "" || Number(value) === 0) return false;

    const service = resolveService?.(value);
    const identity = service?.id ?? service?.name ?? value;
    const key = String(identity).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getServiceDetails = (serviceDetails, serviceId, service) => {
  const storedDetails = parseStoredValue(serviceDetails, {});
  if (!storedDetails || Array.isArray(storedDetails)) return {};

  const directDetails = storedDetails[serviceId] || storedDetails[String(serviceId)];
  if (directDetails) return directDetails;

  const matchingKey = Object.keys(storedDetails).find((key) => {
    const normalizedKey = key.trim().toLowerCase();
    return normalizedKey === String(service?.name || "").trim().toLowerCase()
      || normalizedKey === String(service?.id || "").trim().toLowerCase();
  });

  return matchingKey ? storedDetails[matchingKey] : {};
};

const ServiceDetailSummary = ({ details, resolveValue = (value) => value }) => {
  const displayValue = (value) => {
    const parsedValue = parseStoredValue(value, value);
    if (Array.isArray(parsedValue)) return parsedValue.map(resolveValue).join(", ");
    return resolveValue(parsedValue);
  };

  const entries = Object.entries(details || {}).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

  if (!entries.length) {
    return <p className="text-sm text-gray-500">No details added.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="font-medium">{DETAIL_LABELS[key] || key}:</span>{" "}
          {displayValue(value)}
        </div>
      ))}
    </div>
  );
};

const EMPTY_EDIT_FORM = {
  projectName: "",
  companyName: "",
  projectManagerIds: [],
  spocIds: [],
  serviceIds: [],
  serviceDetails: {}
};

const EMPTY_ASSIGN_FORM = {
  assignedToIds: [],
  reportingHeadId: ""
};

function formatUserName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.fullName || user?.email || "-";
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

  const [projects, setProjects] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const canDelete = canDeleteRecords();
  const superAdmin = isSuperAdmin();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGN_FORM);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(Number(u.id), u));
    return map;
  }, [users]);

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => map.set(Number(employee.id), employee));
    return map;
  }, [employees]);

  const serviceMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      const services = category.services || category.Services || [];
      services.forEach((service) => {
        const normalizedService = {
          ...service,
          categoryName: category.name
        };
        map.set(Number(service.id), normalizedService);
        if (service.name) map.set(String(service.name).trim().toLowerCase(), normalizedService);
      });
    });
    return map;
  }, [categories]);

  const handleDeleteProject = async (project) => {
    if (!canDelete || deletingId) return;
    if (!window.confirm(`Delete project "${project.projectName || `#${project.id}`}"? This action cannot be undone.`)) return;
    try {
      setDeletingId(project.id);
      await projectOnboardService.remove(project.id);
      toast.success("Project deleted successfully.");
      await fetchData();
    } catch (error) {
      toast.error(error?.message || "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, userRes, employeeRes, categoryRes] = await Promise.allSettled([
        projectOnboardService.list(),
        userManagementService.getUsers(),
        employeeService.list(),
        leadService.getCategoriesWithServices()
      ]);

      if (projectRes.status === "fulfilled") {
        setProjects(getArrayValue(projectRes.value?.data).map(normalizeProject));
      } else {
        setProjects([]);
        toast.error(projectRes.reason?.message || "Failed to load projects.");
      }

      if (userRes.status === "fulfilled") {
        setUsers(filterEmployeeOptions(userRes.value?.data || []));
      } else {
        setUsers([]);
      }

      if (employeeRes.status === "fulfilled") {
        // Employees are a separate table from Users (no shared id space), so the
        // super-admin-user exclusion in filterEmployeeOptions does not apply here.
        setEmployees(getEmployeeList(employeeRes.value).map(normalizeEmployee).filter((employee) => employee.id));
      } else {
        setEmployees([]);
        toast.error(employeeRes.reason?.message || "Failed to load employees.");
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

  const getUserNames = (ids = []) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => typeof id === "object" ? id : userMap.get(Number(id)) || id)
      .filter(Boolean)
      .map((user) => typeof user === "object" ? formatUserName(user) : String(user));

  const getEmployeeNames = (ids = []) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => employeeMap.get(Number(id)) || userMap.get(Number(id)))
      .filter(Boolean)
      .map((person) => formatUserName(person));

  const getServiceNames = (ids = []) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => {
        if (id && typeof id === "object") return id.name || id.serviceName;
        return serviceMap.get(Number(id))?.name || serviceMap.get(String(id))?.name || id;
      })
      .filter(Boolean);

  const getService = (serviceId) => {
    if (serviceId && typeof serviceId === "object") return serviceId;
    return serviceMap.get(Number(serviceId)) || serviceMap.get(String(serviceId).trim().toLowerCase());
  };

  const resolveDetailValue = (value) => {
    if (value && typeof value === "object") return value.name || value.serviceName || value.label || String(value.id ?? value);
    return getService(value)?.name || String(value);
  };

  const hydrateSelectedProject = async (project) => {
    if (!project?.id) return;

    try {
      const response = await projectOnboardService.getById(project.id);
      const details = response?.data;
      if (details) {
        setSelectedProject((current) => current?.id === project.id ? { ...current, ...normalizeProject(details) } : current);
      }
    } catch (error) {
      console.error("Failed to load project details:", error);
    }
  };

  const openViewModal = (project) => {
    setSelectedProject(project);
    setShowViewModal(true);
    hydrateSelectedProject(project);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setEditForm({
      projectName: project.projectName || "",
      companyName: project.companyName || "",
      projectManagerIds: Array.isArray(project.projectManagerIds) ? project.projectManagerIds.map(Number) : [],
      spocIds: Array.isArray(project.spocIds) ? project.spocIds.map(Number) : [],
      serviceIds: Array.isArray(project.serviceIds) ? project.serviceIds.map((id) => Number(id)).filter(Number.isFinite) : [],
      serviceDetails: project.serviceDetails && typeof project.serviceDetails === "object" ? project.serviceDetails : {}
    });
    setShowEditModal(true);
    hydrateSelectedProject(project);
  };

  const handleEditServiceToggle = (serviceId) => {
    const id = Number(serviceId);
    setEditForm((prev) => {
      const current = prev.serviceIds || [];
      if (current.includes(id)) {
        const nextDetails = { ...prev.serviceDetails };
        delete nextDetails[id];
        return { ...prev, serviceIds: current.filter((s) => s !== id), serviceDetails: nextDetails };
      }
      return { ...prev, serviceIds: [...current, id] };
    });
  };

  const handleEditServiceDetailChange = (serviceId, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      serviceDetails: {
        ...prev.serviceDetails,
        [serviceId]: {
          ...prev.serviceDetails[serviceId],
          [field]: value
        }
      }
    }));
  };

  const handleEditServiceListToggle = (serviceId, field, value) => {
    setEditForm((prev) => {
      const current = prev.serviceDetails[serviceId] || {};
      const list = current[field] || [];
      const exists = list.includes(value);
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [serviceId]: {
            ...current,
            [field]: exists ? list.filter((x) => x !== value) : [...list, value]
          }
        }
      };
    });
  };

  const openAssignModal = (project) => {
    const fallbackReportingHeadId = Array.isArray(project.projectManagerIds) && project.projectManagerIds.length
      ? Number(project.projectManagerIds[0])
      : "";

    setSelectedProject(project);
    setAssignForm({
      assignedToIds: Array.isArray(project.assignedToIds) ? project.assignedToIds.map(Number) : [],
      reportingHeadId: project.reportingHeadId ? Number(project.reportingHeadId) : fallbackReportingHeadId
    });
    setShowAssignModal(true);
    hydrateSelectedProject(project);
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedProject(null);
    setEditForm(EMPTY_EDIT_FORM);
    setAssignForm(EMPTY_ASSIGN_FORM);
  };

  const saveProjectUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (!editForm.spocIds.length) return toast.error("Select at least one SPOC.");

    const payload = superAdmin
      ? {
          projectName: editForm.projectName.trim(),
          companyName: editForm.companyName.trim(),
          projectManagerIds: editForm.projectManagerIds,
          spocIds: editForm.spocIds,
          serviceIds: editForm.serviceIds,
          serviceDetails: editForm.serviceDetails || {}
        }
      : {
          // Non-super-admins may only change the SPOC; the rest is sent back unchanged.
          projectName: selectedProject.projectName,
          companyName: selectedProject.companyName,
          projectManagerIds: Array.isArray(selectedProject.projectManagerIds) ? selectedProject.projectManagerIds : [],
          spocIds: editForm.spocIds,
          serviceIds: Array.isArray(selectedProject.serviceIds) ? selectedProject.serviceIds : [],
          serviceDetails: selectedProject.serviceDetails || {}
        };

    if (superAdmin) {
      if (!payload.projectName) return toast.error("Project name is required.");
      if (!payload.companyName) return toast.error("Company name is required.");
      if (!payload.projectManagerIds.length) return toast.error("Select at least one reporting head.");
      if (!payload.serviceIds.length) return toast.error("Select at least one service.");
    }

    try {
      setSaving(true);
      await projectOnboardService.update(selectedProject.id, payload);

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

    const validAssignedToIds = (assignForm.assignedToIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && employeeMap.has(id));

    if (!validAssignedToIds.length) return toast.error("Select at least one valid assignee.");

    try {
      setSaving(true);
      await projectOnboardService.assign(selectedProject.id, {
        assignedToIds: validAssignedToIds,
        reportingHeadId: assignForm.reportingHeadId ? Number(assignForm.reportingHeadId) : null
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
          <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
            No projects found
          </td>
        </tr>
      );
    }

    return list.map((project) => {
      const managerNames = getUserNames(project.projectManagerIds);
      const serviceNames = getServiceNames(project.serviceIds);
      const spocNames = getUserNames(project.spocIds);

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
            <div className="flex flex-wrap gap-1">
              {spocNames.length ? (
                spocNames.map((name) => (
                  <span key={`${project.id}-spoc-${name}`} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {name}
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
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDeleteProject(project)}
                  disabled={deletingId === project.id}
                  className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reporting Head</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Required Services</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SPOC</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading projects...
                  </td>
                </tr>
              ) : (
                renderProjectRows(projects)
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
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="text-md font-medium text-gray-900">Project Name</label>
                    <p className="text-gray-500 text-sm">{selectedProject.projectName}</p>
                  </div>
                  <div>
                    <label className="text-md font-medium text-gray-900">Company Name</label>
                    <p className="text-gray-500 text-sm">{selectedProject.companyName}</p>
                  </div>
                  <div>
                    <label className="text-md font-medium text-gray-900">Reporting Head</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getUserNames(selectedProject.projectManagerIds).map((name) => (
                        <span key={name} className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-500 text-xs">{name}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-md font-medium text-gray-900">SPOC</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getUserNames(selectedProject.spocIds).map((name) => (
                        <span key={name} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-md font-medium text-gray-900">Assigned To</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getEmployeeNames(selectedProject.assignedToIds).length ? (
                        getEmployeeNames(selectedProject.assignedToIds).map((name) => (
                          <span key={name} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">{name}</span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-md font-medium text-gray-900 ">Created</label>
                    <p className="text-gray-500 text-sm">{formatDate(selectedProject.createdAt)}</p>
                  </div>
                </div>

                <h3 className="mb-3 text-md font-semibold text-gray-800">Services</h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  {getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                    <span key={serviceName} className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">{serviceName}</span>
                  ))}
                </div>

                <h3 className="mb-3 text-md font-semibold text-gray-800">Service Details</h3>
                <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                  {getProjectServiceIds(selectedProject, getService).map((serviceId) => {
                    const service = getService(serviceId);

                    return (
                      <div key={`detail-${serviceId}`} className="overflow-hidden rounded-lg border-2 border-gray-200">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                          <h4 className="text-sm font-semibold text-gray-800">{service?.name || `Service ${serviceId}`}</h4>
                        </div>
                        <div className="p-3">
                          <ServiceDetailSummary details={getServiceDetails(selectedProject.serviceDetails, serviceId, service)} resolveValue={resolveDetailValue} />
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
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      {superAdmin
                        ? "As a Super Admin you can edit every field on this project."
                        : "Only the SPOC can be changed here. Project name, company, reporting head, and services are locked after onboarding."}
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Project Name</label>
                        {superAdmin ? (
                          <input
                            type="text"
                            value={editForm.projectName}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, projectName: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        ) : (
                          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            {selectedProject.projectName || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Company Name</label>
                        {superAdmin ? (
                          <input
                            type="text"
                            value={editForm.companyName}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        ) : (
                          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            {selectedProject.companyName || "-"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Reporting Head</label>
                      {superAdmin ? (
                        <MultiUserSelect
                          users={users}
                          selectedIds={editForm.projectManagerIds}
                          onChange={(ids) => setEditForm((prev) => ({ ...prev, projectManagerIds: ids }))}
                          placeholder="Select reporting head(s)"
                          tone="blue"
                        />
                      ) : (
                        <div className="flex min-h-10.5 flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          {getUserNames(selectedProject.projectManagerIds).length ? (
                            getUserNames(selectedProject.projectManagerIds).map((name) => (
                              <span key={`edit-pm-${name}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      )}
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
                      {superAdmin ? (
                        <div className="space-y-3">
                          {categories.map((category) => {
                            const services = category.services || category.Services || [];
                            if (!services.length) return null;
                            return (
                              <div key={category.id}>
                                <h4 className="mb-1 text-xs font-medium text-gray-500">{category.name}</h4>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {services.map((service) => {
                                    const checked = editForm.serviceIds.includes(Number(service.id));
                                    return (
                                      <label
                                        key={service.id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm ${
                                          checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => handleEditServiceToggle(service.id)}
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
                      ) : (
                        <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          {getServiceNames(selectedProject.serviceIds).length ? (
                            getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                              <span key={`edit-svc-${serviceName}`} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                                {serviceName}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">No services</span>
                          )}
                        </div>
                      )}
                    </div>

                    {superAdmin ? (
                      editForm.serviceIds.filter((id) => hasServiceDetails(getService(id))).length > 0 && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Service Details</label>
                          <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                            {editForm.serviceIds.filter((id) => hasServiceDetails(getService(id))).map((serviceId) => {
                              const service = getService(serviceId);
                              return (
                                <div key={`edit-detail-${serviceId}`} className="overflow-hidden rounded-lg border-2 border-gray-200">
                                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                                    <h4 className="text-sm font-semibold text-gray-800">{service?.name || `Service ${serviceId}`}</h4>
                                  </div>
                                  <div className="p-3">
                                    <ServiceDetailFields
                                      service={service}
                                      details={editForm.serviceDetails[serviceId] || {}}
                                      onDetailChange={(field, value) => handleEditServiceDetailChange(serviceId, field, value)}
                                      onListToggle={(field, value) => handleEditServiceListToggle(serviceId, field, value)}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    ) : (
                      getProjectServiceIds(selectedProject, getService).length > 0 && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Service Details</label>
                          <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                            {getProjectServiceIds(selectedProject, getService).map((serviceId) => {
                              const service = getService(serviceId);

                              return (
                                <div key={`edit-${serviceId}`} className="overflow-hidden rounded-lg border-2 border-gray-200">
                                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                                    <h4 className="text-sm font-semibold text-gray-800">{service?.name || `Service ${serviceId}`}</h4>
                                  </div>
                                  <div className="p-3">
                                    <ServiceDetailSummary details={getServiceDetails(selectedProject.serviceDetails, serviceId, service)} resolveValue={resolveDetailValue} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
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
                      {saving ? "Updating..." : superAdmin ? "Update Project" : "Update SPOC"}
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
                    <div className="rounded-lg bg-gray-50">
                      <h3 className="mb-2 text-sm font-semibold text-gray-900">Project Information</h3>
                      <p className="text-sm font-medium text-gray-700">{selectedProject.projectName}</p>
                      <p className="mt-1 text-xs text-gray-500">{selectedProject.companyName}</p>

                      <div className="mt-3">
                        <p className="mb-2 text-sm font-semibold text-gray-900">Reporting Head</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {getUserNames(selectedProject.projectManagerIds).length ? (
                            getUserNames(selectedProject.projectManagerIds).map((name) => (
                              <span key={`assign-pm-${name}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="mb-2 text-sm font-semibold text-gray-900">Services</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {getServiceNames(selectedProject.serviceIds).length ? (
                            getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                              <span key={`assign-svc-${serviceName}`} className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">{serviceName}</span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No services</span>
                          )}
                        </div>
                      </div>

                      {getProjectServiceIds(selectedProject, getService).length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-sm font-semibold text-gray-900">Service Details</p>
                          <div className="mt-1 max-h-48 space-y-2 overflow-y-auto pr-1">
                            {getProjectServiceIds(selectedProject, getService).map((serviceId) => {
                              const service = getService(serviceId);

                              return (
                                <div key={`assign-detail-${serviceId}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-1.5">
                                    <h4 className="text-xs font-semibold text-gray-800">{service?.name || `Service ${serviceId}`}</h4>
                                  </div>
                                  <div className="p-2">
                                    <ServiceDetailSummary details={getServiceDetails(selectedProject.serviceDetails, serviceId, service)} resolveValue={resolveDetailValue} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Reporting Head</label>
                      <select
                        value={assignForm.reportingHeadId || ""}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, reportingHeadId: e.target.value ? Number(e.target.value) : "" }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Select reporting head</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{formatUserName(u)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Assign To</label>
                      <MultiUserSelect
                        users={employees}
                        selectedIds={assignForm.assignedToIds}
                        onChange={(ids) => setAssignForm((prev) => ({ ...prev, assignedToIds: ids }))}
                        placeholder="Select Employees"
                        tone="green"
                      />
                      {!employees.length && <p className="mt-1 text-xs text-gray-500">No employees available.</p>}
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
