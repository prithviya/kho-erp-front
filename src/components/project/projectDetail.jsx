import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Eye, Pencil, UserPlus, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import leadService from "../../services/lead.service";
import employeeService from "../../services/employee.service";
import userManagementService from "../../services/userManagement.service";
import projectOnboardService from "../../services/projectOnboard.service";
import vendorService from "../../services/vendor.service";
import { canDeleteRecords } from "../../utils/auth";
import { filterEmployeeOptions } from "../../utils/employeeOptions";
import SortableHeader from "../common/SortableHeader";
import { sortRows } from "../../utils/tableSorting";

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

const normalizeRoleCode = (value) => String(value || "").trim().toUpperCase().replace(/[\s_-]+/g, "");

const hasRole = (user, expectedRole) => (Array.isArray(user?.roles) ? user.roles : [])
  .some((role) => normalizeRoleCode(role?.code || role?.name) === expectedRole);

const isManagerUser = (user) => hasRole(user, "MANAGER");

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
  assignedVendorIds: getArrayValue(project?.assignedVendorIds)
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
  projectManagerIds: [],
  spocIds: []
};

const EMPTY_ASSIGN_FORM = {
  assignedToIds: [],
  assignedVendorIds: [],
  reportingHeadId: ""
};

function formatUserName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.fullName || user?.vendor_name || user?.name || user?.email || user?.vendor_email || "-";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().split("T")[0];
}

const MultiUserSelect = ({ users, selectedIds, onChange, placeholder, tone = "blue", variant = "default" }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const getOptionId = (option) => Number(option?.id ?? option?.vendorId);
  const isProjectEdit = variant === "project-edit";

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [open]);

  const selectedUsers = users.filter((u) => selectedIds.includes(getOptionId(u)));

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
    <div ref={containerRef} className="relative">
      <div
        className={`min-h-10.5 w-full cursor-pointer rounded-lg border px-3 py-2 ${
          isProjectEdit ? "border-gray-200 bg-[#fbfbfc]" : "border-gray-300 bg-white"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selectedUsers.length > 0 ? (
            selectedUsers.map((u) => (
              <span
                key={getOptionId(u)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                  tone === "blue"
                    ? isProjectEdit ? "bg-[#f0f2f7] text-[#666d7c]" : "bg-blue-100 text-blue-700"
                    : isProjectEdit ? "bg-emerald-100 text-emerald-700" : "bg-green-100 text-green-700"
                }`}
              >
                {formatUserName(u)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(getOptionId(u));
                  }}
                  aria-label={`Remove ${formatUserName(u)}`}
                >
                  {isProjectEdit ? <X size={12} /> : "x"}
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
          <span className="ml-auto text-gray-400">{isProjectEdit ? <ChevronDown size={16} /> : "▼"}</span>
        </div>
      </div>

      {open && (
        <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {users.map((u) => {
            const optionId = getOptionId(u);
            const checked = selectedIds.includes(optionId);
            return (
              <label
                key={optionId}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50 ${checked ? "bg-blue-50" : ""}`}
                onClick={() => toggleUser(optionId)}
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
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [deletingId, setDeletingId] = useState(null);
  const canDelete = canDeleteRecords('project_details');
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assignmentType, setAssignmentType] = useState("employee");
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
      const [projectRes, userRes, employeeRes, categoryRes, vendorRes] = await Promise.allSettled([
        projectOnboardService.list(),
        userManagementService.getDirectory(),
        employeeService.list(),
        leadService.getCategoriesWithServices(),
        vendorService.getAll()
      ]);

      if (projectRes.status === "fulfilled") {
        setProjects(getArrayValue(projectRes.value?.data).map(normalizeProject));
      } else {
        setProjects([]);
        toast.error(projectRes.reason?.message || "Failed to load projects.");
      }

      if (userRes.status === "fulfilled") {
        // /users/directory already returns active users only.
        setUsers(userRes.value?.data || []);
      } else {
        setUsers([]);
      }

      if (employeeRes.status === "fulfilled") {
        setEmployees(filterEmployeeOptions(getEmployeeList(employeeRes.value).map(normalizeEmployee).filter((employee) => employee.id)));
      } else {
        setEmployees([]);
        toast.error(employeeRes.reason?.message || "Failed to load employees.");
      }

      if (categoryRes.status === "fulfilled") {
        setCategories(categoryRes.value?.data || []);
      } else {
        setCategories([]);
      }

      if (vendorRes.status === "fulfilled") {
        const vendorRecords = getArrayValue(vendorRes.value?.data || vendorRes.value)
          .filter((vendor) => String(vendor.status || "active").toLowerCase() === "active")
          .map((vendor) => ({
            ...vendor,
            id: vendor.id ?? vendor.vendorId,
            fullName: vendor.fullName || vendor.vendor_name || vendor.name,
            email: vendor.email || vendor.vendor_email
          }))
          .filter((vendor) => vendor.id !== undefined && vendor.id !== null);
        setVendors(vendorRecords);
      } else {
        setVendors([]);
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
    getArrayValue(ids)
      .map((id) => typeof id === "object" ? id : userMap.get(Number(id)) || employeeMap.get(Number(id)) || id)
      .filter(Boolean)
      .map((user) => typeof user === "object" ? formatUserName(user) : String(user));

  const managerUsers = useMemo(() => users.filter(isManagerUser), [users]);
  const spocUsers = useMemo(() => users.filter((user) => !isManagerUser(user)), [users]);
  const assignableOptions = assignmentType === "vendor" ? vendors : users;

  const getEmployeeNames = (ids = []) =>
    getArrayValue(ids)
      .map((id) => userMap.get(Number(id)) || employeeMap.get(Number(id)))
      .filter(Boolean)
      .map((person) => formatUserName(person));

  const getServiceNames = (ids = []) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => {
        if (id && typeof id === "object") return id.name || id.serviceName;
        return serviceMap.get(Number(id))?.name || serviceMap.get(String(id))?.name || id;
      })
      .filter(Boolean);

  const sortedProjects = sortRows(projects, sortConfig.key, sortConfig.direction, (project) => {
    if (sortConfig.key === "project") return project.projectName;
    if (sortConfig.key === "company") return project.companyName;
    if (sortConfig.key === "reportingHead") return getUserNames(project.projectManagerIds).join(" ");
    if (sortConfig.key === "assignedTo") return getEmployeeNames(project.assignedToIds).join(" ");
    if (sortConfig.key === "services") return getServiceNames(project.serviceIds).join(" ");
    if (sortConfig.key === "spoc") return getUserNames(project.spocIds).join(" ");
    if (sortConfig.key === "created") return project.createdAt;
    return "";
  });
  const toggleSort = (key) => setSortConfig((current) => ({
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  }));

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
      projectManagerIds: Array.isArray(project.projectManagerIds) ? project.projectManagerIds.map(Number) : [],
      spocIds: Array.isArray(project.spocIds) ? project.spocIds.map(Number) : []
    });
    setShowEditModal(true);
    hydrateSelectedProject(project);
  };

  const openAssignModal = (project) => {
    const fallbackReportingHeadId = Array.isArray(project.projectManagerIds) && project.projectManagerIds.length
      ? Number(project.projectManagerIds[0])
      : "";

    setSelectedProject(project);
    setAssignForm({
      assignedToIds: getArrayValue(project.assignedToIds).map(Number),
      assignedVendorIds: getArrayValue(project.assignedVendorIds).map(Number),
      reportingHeadId: project.reportingHeadId ? Number(project.reportingHeadId) : fallbackReportingHeadId
    });
    setShowAssignModal(true);
    setAssignmentType("employee");
    hydrateSelectedProject(project);
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedProject(null);
    setEditForm(EMPTY_EDIT_FORM);
    setAssignForm(EMPTY_ASSIGN_FORM);
    setAssignmentType("employee");
  };

  const saveProjectUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (!editForm.projectManagerIds.length) return toast.error("Select at least one Reporting Head.");
    if (!editForm.spocIds.length) return toast.error("Select at least one SPOC.");

    try {
      setSaving(true);
      await projectOnboardService.update(selectedProject.id, {
        projectName: selectedProject.projectName,
        companyName: selectedProject.companyName,
        projectManagerIds: editForm.projectManagerIds,
        spocIds: editForm.spocIds,
        serviceIds: Array.isArray(selectedProject.serviceIds) ? selectedProject.serviceIds : [],
        serviceDetails: selectedProject.serviceDetails || {}
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

    const validAssignedToIds = (assignForm.assignedToIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && userMap.has(id));
    const validAssignedVendorIds = (assignForm.assignedVendorIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && vendors.some((vendor) => Number(vendor.vendorId ?? vendor.id) === id));

    if (!validAssignedToIds.length && !validAssignedVendorIds.length) return toast.error("Select at least one valid employee or vendor.");

    try {
      setSaving(true);
      await projectOnboardService.assign(selectedProject.id, {
        assignedToIds: validAssignedToIds,
        assignedVendorIds: validAssignedVendorIds,
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
          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
            No projects found
          </td>
        </tr>
      );
    }

    return list.map((project) => {
      const managerNames = [...new Set([
        ...getUserNames(project.projectManagerIds),
        ...(project.reportingHeadUser ? [formatUserName(project.reportingHeadUser)] : [])
      ].filter(Boolean))];
      const visibleManagerNames = managerNames.slice(0, 2);
      const hiddenManagerNames = managerNames.slice(2);
      const assignedNames = project.assignedUsers?.length
        ? project.assignedUsers.map(formatUserName).filter(Boolean)
        : getEmployeeNames(project.assignedToIds);
      const assignedVendorNames = (project.assignedVendorUsers || [])
        .map((vendor) => vendor.vendor_name || vendor.name || vendor.vendor_email)
        .filter(Boolean);
      const allAssignedNames = [...new Set([...assignedNames, ...assignedVendorNames])];
      const serviceNames = getServiceNames(project.serviceIds);
      const spocNames = project.spocUsers?.length
        ? project.spocUsers.map(formatUserName).filter(Boolean)
        : getUserNames(project.spocIds);

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
                <>
                  {visibleManagerNames.map((name) => (
                    <span key={`${project.id}-${name}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {name}
                    </span>
                  ))}
                  {hiddenManagerNames.length > 0 && (
                    <span
                      title={hiddenManagerNames.join(", ")}
                      className="cursor-default rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
                    >
                      +{hiddenManagerNames.length}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {allAssignedNames.length ? (
                allAssignedNames.map((name) => (
                  <span key={`${project.id}-assigned-${name}`} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">Not assigned</span>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="View project"
                title="View"
                onClick={() => openViewModal(project)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-700 transition-colors hover:bg-green-200"
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                aria-label="Edit project"
                title="Edit"
                onClick={() => openEditModal(project)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-200 text-orange-700 transition-colors hover:bg-orange-300"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                aria-label="Assign project"
                title="Assign"
                onClick={() => openAssignModal(project)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-violet-200 text-violet-700 transition-colors hover:bg-violet-300"
              >
                <UserPlus size={16} />
              </button>
              {canDelete && (
                <button
                  type="button"
                  aria-label="Delete project"
                  title="Delete"
                  onClick={() => handleDeleteProject(project)}
                  disabled={deletingId === project.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9] px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-list-table min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="Project" sortKey="project" sortConfig={sortConfig} onSort={toggleSort} /></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="Company" sortKey="company" sortConfig={sortConfig} onSort={toggleSort} /></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="Reporting Head" sortKey="reportingHead" sortConfig={sortConfig} onSort={toggleSort} /></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="Assigned To" sortKey="assignedTo" sortConfig={sortConfig} onSort={toggleSort} /></th>
               
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="Required Services" sortKey="services" sortConfig={sortConfig} onSort={toggleSort} /></th>
                 <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="SPOC" sortKey="spoc" sortConfig={sortConfig} onSort={toggleSort} /></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><SortableHeader label="Created" sortKey="created" sortConfig={sortConfig} onSort={toggleSort} /></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading projects...
                  </td>
                </tr>
              ) : (
                renderProjectRows(sortedProjects)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
          <div className="fixed inset-0 bg-black/30" onClick={closeAllModals} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-details-title"
            className="relative flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-[#f4f5f8] px-5 py-3.5 sm:px-7">
              <h2 id="project-details-title" className="text-base font-semibold text-gray-900">Project Details</h2>
              <button
                type="button"
                aria-label="Close project details"
                onClick={closeAllModals}
                className="rounded-md p-1 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
              >
                <X size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <div className="mb-7 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">Project Name</p>
                  <p className="text-xs text-gray-500">{selectedProject.projectName || "-"}</p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">Company Name</p>
                  <p className="text-xs text-gray-500">{selectedProject.companyName || "-"}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">Reporting Head</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getUserNames(selectedProject.projectManagerIds).map((name) => (
                      <span key={name} className="rounded-full bg-[#f0f2f7] px-2.5 py-1 text-[11px] font-medium text-[#68748b]">{name}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">SPOC</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getUserNames(selectedProject.spocIds).map((name) => (
                      <span key={name} className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{name}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">Assigned to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getEmployeeNames(selectedProject.assignedToIds).length ? (
                      getEmployeeNames(selectedProject.assignedToIds).map((name) => (
                        <span key={name} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#687fa6]">{name}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Not assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                      <span key={serviceName} className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">{serviceName}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-gray-800">Created</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedProject.createdAt)}</p>
                </div>
              </div>

              <h3 className="mb-3 text-sm font-semibold text-gray-800">Service Details</h3>
              <div className="space-y-3">
                {getProjectServiceIds(selectedProject, getService).map((serviceId) => {
                  const service = getService(serviceId);
                  const details = getServiceDetails(selectedProject.serviceDetails, serviceId, service);
                  const entries = Object.entries(details || {}).filter(([, value]) => {
                    if (Array.isArray(value)) return value.length > 0;
                    return value !== null && value !== undefined && String(value).trim() !== "";
                  });

                  return (
                    <section key={`detail-${serviceId}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-[#fbfbfc]">
                      <h4 className="bg-[#10070a] px-5 py-3 text-xs font-semibold text-white">
                        {service?.name || `Service ${serviceId}`}
                      </h4>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                        {entries.length ? entries.map(([key, value]) => {
                          const parsedValue = parseStoredValue(value, value);
                          const values = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
                          return (
                            <div key={key} className="min-w-0">
                              <p className="mb-1.5 text-xs font-semibold text-gray-700">{DETAIL_LABELS[key] || key}</p>
                              <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
                                {values.map((item, index) => {
                                  const displayValue = resolveDetailValue(parseStoredValue(item, item));
                                  return Array.isArray(parsedValue) ? (
                                    <span key={`${key}-${index}`} className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-500">
                                      {displayValue}
                                    </span>
                                  ) : (
                                    <span key={`${key}-${index}`} className="text-xs text-gray-700">{displayValue}</span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }) : (
                          <p className="text-xs text-gray-500">No details added.</p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
          <div className="fixed inset-0 bg-black/30" onClick={closeAllModals} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-project-title"
            className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-[#f4f5f8] px-5 py-3.5 sm:px-7">
              <h2 id="edit-project-title" className="text-base font-semibold text-gray-900">Edit Project</h2>
              <button
                type="button"
                aria-label="Close edit project"
                onClick={closeAllModals}
                className="rounded-md p-1 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={saveProjectUpdate} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:space-y-5 sm:px-7">
                <p className="rounded-xl border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-xs leading-5 text-blue-700">
                  Project name, company, and services are locked after onboarding. Reporting Head and SPOC can be changed here.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Project Name</label>
                    <div className="flex min-h-10 items-center rounded-xl border border-gray-100 bg-[#fbfbfc] px-3.5 text-xs text-gray-700">
                      {selectedProject.projectName || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Company Name</label>
                    <div className="flex min-h-10 items-center rounded-xl border border-gray-100 bg-[#fbfbfc] px-3.5 text-xs text-gray-700">
                      {selectedProject.companyName || "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Reporting Head</label>
                  <MultiUserSelect
                    users={managerUsers}
                    selectedIds={editForm.projectManagerIds}
                    onChange={(ids) => setEditForm((prev) => ({ ...prev, projectManagerIds: ids }))}
                    placeholder="Select Reporting Head"
                    variant="project-edit"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">SPOC</label>
                  <MultiUserSelect
                    users={spocUsers}
                    selectedIds={editForm.spocIds}
                    onChange={(ids) => setEditForm((prev) => ({ ...prev, spocIds: ids }))}
                    placeholder="Select SPOC"
                    tone="green"
                    variant="project-edit"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Services</label>
                  <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-[#fbfbfc] px-3.5 py-2">
                    {getServiceNames(selectedProject.serviceIds).length ? (
                      getServiceNames(selectedProject.serviceIds).map((serviceName) => (
                        <span key={`edit-svc-${serviceName}`} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          {serviceName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No services</span>
                    )}
                  </div>
                </div>

                {getProjectServiceIds(selectedProject, getService).length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-gray-800">Service Details</h3>
                    <div className="space-y-3">
                      {getProjectServiceIds(selectedProject, getService).map((serviceId) => {
                        const service = getService(serviceId);
                        const details = getServiceDetails(selectedProject.serviceDetails, serviceId, service);
                        const entries = Object.entries(details || {}).filter(([, value]) => {
                          if (Array.isArray(value)) return value.length > 0;
                          return value !== null && value !== undefined && String(value).trim() !== "";
                        });

                        return (
                          <section key={`edit-${serviceId}`} className="overflow-hidden rounded-xl border border-gray-100 bg-[#fbfbfc]">
                            <h4 className="bg-[#10070a] px-5 py-3 text-xs font-semibold text-white">
                              {service?.name || `Service ${serviceId}`}
                            </h4>
                            <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                              {entries.length ? entries.map(([key, value]) => {
                                const parsedValue = parseStoredValue(value, value);
                                const values = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
                                return (
                                  <div key={key} className="min-w-0">
                                    <p className="mb-1.5 text-xs font-semibold text-gray-700">{DETAIL_LABELS[key] || key}</p>
                                    <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
                                      {values.map((item, index) => {
                                        const displayValue = resolveDetailValue(parseStoredValue(item, item));
                                        return Array.isArray(parsedValue) ? (
                                          <span key={`${key}-${index}`} className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
                                            {displayValue}
                                          </span>
                                        ) : (
                                          <span key={`${key}-${index}`} className="text-xs text-gray-700">{displayValue}</span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }) : (
                                <p className="text-xs text-gray-500">No details added.</p>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 flex-wrap gap-2.5 border-t border-gray-200 bg-[#f4f5f8] px-5 py-3 sm:px-7">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#a50912] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#88070e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Update Project"}
                </button>
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="rounded-lg border border-gray-200 bg-[#eceef3] px-5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
              </footer>
            </form>
          </section>
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
                      <label className="mb-1 block text-sm font-medium text-gray-700">Assigned To</label>
                      <div className="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                        {[{ value: "employee", label: "Employee" }, { value: "vendor", label: "Vendor" }].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setAssignmentType(option.value);
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${assignmentType === option.value ? "bg-violet-600 text-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <MultiUserSelect
                        users={assignableOptions}
                        selectedIds={assignmentType === "vendor" ? assignForm.assignedVendorIds : assignForm.assignedToIds}
                        onChange={(ids) => setAssignForm((prev) => assignmentType === "vendor"
                          ? { ...prev, assignedVendorIds: ids }
                          : { ...prev, assignedToIds: ids })}
                        placeholder={assignmentType === "vendor" ? "Select Vendors" : "Select Employees"}
                        tone="green"
                      />
                      {!assignableOptions.length && <p className="mt-1 text-xs text-gray-500">No {assignmentType === "vendor" ? "vendors" : "employees"} available.</p>}
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
