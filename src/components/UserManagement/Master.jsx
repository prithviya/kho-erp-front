import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import leadService from "../../services/lead.service";
import { getSession } from "../../utils/session";

const initialCategoryForm = {
  name: "",
  code: "",
  color: "#2563EB",
  displayOrder: 1,
  isActive: true,
};

const initialServiceForm = {
  serviceCategoryId: "",
  name: "",
  code: "",
  displayOrder: 1,
  isActive: true,
};

const initialLeadStatusForm = {
  name: "",
  code: "",
  color: "#2563EB",
  description: "",
  displayOrder: 1,
  isDefault: false,
  isClosed: false,
  isActive: true,
};

const initialLeadSourceForm = {
  name: "",
  code: "",
  description: "",
  displayOrder: 1,
  isActive: true,
};

function normalizeRole(value = "") {
  return String(value).toLowerCase().replace(/[\s_]+/g, "");
}

function getListFromResponse(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.rows)) return value.data.rows;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.result)) return value.result;
  return [];
}

const modalTheme = {
  category: {
    title: "Service Category",
    addText: "Add Category",
    updateText: "Update Category",
    buttonClass: "bg-blue-600 hover:bg-blue-700",
  },
  service: {
    title: "Sub Service",
    addText: "Add Service",
    updateText: "Update Service",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  status: {
    title: "Lead Status",
    addText: "Add Status",
    updateText: "Update Status",
    buttonClass: "bg-amber-500 hover:bg-amber-600",
  },
  source: {
    title: "Lead Source",
    addText: "Add Source",
    updateText: "Update Source",
    buttonClass: "bg-violet-600 hover:bg-violet-700",
  },
};

function TableSection({ title, subtitle, count, countClass, onAdd, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${countClass}`}>{count}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            onClick={onAdd}
          >
            Add
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Master() {
  const session = getSession();
  const isSuperAdmin = useMemo(() => {
    const roles = session?.user?.roles || [];
    return roles.some((role) => {
      const code = normalizeRole(role?.code);
      const name = normalizeRole(role?.name);
      return code === "superadmin" || name === "superadmin";
    });
  }, [session]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [fetchIssues, setFetchIssues] = useState({ categories: "", statuses: "", sources: "" });

  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [leadStatusForm, setLeadStatusForm] = useState(initialLeadStatusForm);
  const [leadSourceForm, setLeadSourceForm] = useState(initialLeadSourceForm);

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingLeadStatusId, setEditingLeadStatusId] = useState(null);
  const [editingLeadSourceId, setEditingLeadSourceId] = useState(null);

  const [savingCategory, setSavingCategory] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [savingLeadStatus, setSavingLeadStatus] = useState(false);
  const [savingLeadSource, setSavingLeadSource] = useState(false);

  const [modalType, setModalType] = useState(null);
  const [servicePage, setServicePage] = useState(1);
  const servicesPerPage = 5;

  const allServices = useMemo(
    () =>
      categories.flatMap((category) =>
        (category.services || []).map((service) => ({
          ...service,
          categoryId: category.id,
          categoryName: category.name,
        }))
      ),
    [categories]
  );

  const totalServicePages = Math.max(1, Math.ceil(allServices.length / servicesPerPage));
  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * servicesPerPage;
    return allServices.slice(start, start + servicesPerPage);
  }, [allServices, servicePage]);

  useEffect(() => {
    if (servicePage > totalServicePages) {
      setServicePage(totalServicePages);
    }
  }, [servicePage, totalServicePages]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoriesResult, leadStatusesResult, leadSourcesResult] = await Promise.allSettled([
        leadService.getCategoriesWithServices(),
        leadService.getLeadStatuses(),
        leadService.getLeadSources(),
      ]);

      setFetchIssues({
        categories: categoriesResult.status === "rejected" ? (categoriesResult.reason?.message || "Unable to load service categories.") : "",
        statuses: leadStatusesResult.status === "rejected" ? (leadStatusesResult.reason?.message || "Unable to load lead statuses.") : "",
        sources: leadSourcesResult.status === "rejected" ? (leadSourcesResult.reason?.message || "Unable to load lead sources.") : "",
      });

      const categoriesData =
        categoriesResult.status === "fulfilled"
          ? getListFromResponse(categoriesResult.value)
          : [];

      const leadStatusData =
        leadStatusesResult.status === "fulfilled"
          ? getListFromResponse(leadStatusesResult.value)
          : [];

      const leadSourceData =
        leadSourcesResult.status === "fulfilled"
          ? getListFromResponse(leadSourcesResult.value)
          : [];

      setCategories(categoriesData);
      setLeadStatuses(leadStatusData);
      setLeadSources(leadSourceData);

      if (categoriesData.length && !serviceForm.serviceCategoryId) {
        setServiceForm((prev) => ({ ...prev, serviceCategoryId: String(categoriesData[0].id) }));
      }
    } catch (err) {
      setError(err.message || "Unable to load master data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const onFormChange = (setter) => (event) => {
    const { name, value, type, checked } = event.target;
    setter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const closeModal = () => setModalType(null);

  const openCreateModal = (type) => {
    if (type === "category") {
      setEditingCategoryId(null);
      setCategoryForm(initialCategoryForm);
    }
    if (type === "service") {
      setEditingServiceId(null);
      setServiceForm((prev) => ({
        ...initialServiceForm,
        serviceCategoryId: prev.serviceCategoryId || (categories[0]?.id ? String(categories[0].id) : ""),
      }));
    }
    if (type === "status") {
      setEditingLeadStatusId(null);
      setLeadStatusForm(initialLeadStatusForm);
    }
    if (type === "source") {
      setEditingLeadSourceId(null);
      setLeadSourceForm(initialLeadSourceForm);
    }
    setModalType(type);
  };

  const openEditModal = (type, record) => {
    if (type === "category") {
      setEditingCategoryId(record.id);
      setCategoryForm({
        name: record.name || "",
        code: record.code || "",
        color: record.color || "#2563EB",
        displayOrder: Number(record.displayOrder || 1),
        isActive: Boolean(record.isActive),
      });
    }
    if (type === "service") {
      setEditingServiceId(record.id);
      setServiceForm({
        serviceCategoryId: String(record.categoryId),
        name: record.name || "",
        code: record.code || "",
        displayOrder: Number(record.displayOrder || 1),
        isActive: Boolean(record.isActive),
      });
    }
    if (type === "status") {
      setEditingLeadStatusId(record.id);
      setLeadStatusForm({
        name: record.name || "",
        code: record.code || "",
        color: record.color || "#2563EB",
        description: record.description || "",
        displayOrder: Number(record.displayOrder || 1),
        isDefault: Boolean(record.isDefault),
        isClosed: Boolean(record.isClosed),
        isActive: Boolean(record.isActive),
      });
    }
    if (type === "source") {
      setEditingLeadSourceId(record.id);
      setLeadSourceForm({
        name: record.name || "",
        code: record.code || "",
        description: record.description || "",
        displayOrder: Number(record.displayOrder || 1),
        isActive: Boolean(record.isActive),
      });
    }
    setModalType(type);
  };

  const handleDelete = async (label, runDelete) => {
    if (!window.confirm(`Delete this ${label}?`)) return;
    try {
      setError("");
      await runDelete();
      await loadMasterData();
      toast.success(`${label} deleted.`);
    } catch (err) {
      setError(err.message || `Unable to delete ${label}.`);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingCategory(true);
      setError("");
      if (editingCategoryId) {
        await leadService.updateServiceCategory(editingCategoryId, categoryForm);
      } else {
        await leadService.createServiceCategory(categoryForm);
      }
      await loadMasterData();
      toast.success(editingCategoryId ? "Category updated." : "Category added.");
      closeModal();
    } catch (err) {
      setError(err.message || "Unable to save service category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleServiceSubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingService(true);
      setError("");
      const payload = { ...serviceForm, serviceCategoryId: Number(serviceForm.serviceCategoryId) };
      if (editingServiceId) {
        await leadService.updateService(editingServiceId, payload);
      } else {
        await leadService.createService(payload);
      }
      await loadMasterData();
      toast.success(editingServiceId ? "Service updated." : "Service added.");
      closeModal();
    } catch (err) {
      setError(err.message || "Unable to save service.");
    } finally {
      setSavingService(false);
    }
  };

  const handleLeadStatusSubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingLeadStatus(true);
      setError("");
      if (editingLeadStatusId) {
        await leadService.updateLeadStatus(editingLeadStatusId, leadStatusForm);
      } else {
        await leadService.createLeadStatus(leadStatusForm);
      }
      await loadMasterData();
      toast.success(editingLeadStatusId ? "Lead status updated." : "Lead status added.");
      closeModal();
    } catch (err) {
      setError(err.message || "Unable to save lead status.");
    } finally {
      setSavingLeadStatus(false);
    }
  };

  const handleLeadSourceSubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingLeadSource(true);
      setError("");
      if (editingLeadSourceId) {
        await leadService.updateLeadSource(editingLeadSourceId, leadSourceForm);
      } else {
        await leadService.createLeadSource(leadSourceForm);
      }
      await loadMasterData();
      toast.success(editingLeadSourceId ? "Lead source updated." : "Lead source added.");
      closeModal();
    } catch (err) {
      setError(err.message || "Unable to save lead source.");
    } finally {
      setSavingLeadSource(false);
    }
  };

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentTheme = modalType ? modalTheme[modalType] : null;

  return (
    <div className="max-h-[calc(100vh-110px)] overflow-y-auto space-y-5 p-4 sm:p-5">
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="space-y-5">
        <TableSection
          title="Service Category"
          subtitle="Manage service categories"
          count={categories.length}
          countClass="bg-blue-50 text-blue-700"
          onAdd={() => openCreateModal("category")}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length ? categories.map((category) => (
                <tr key={category.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color || "#2563EB" }} />
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{category.code}</td>
                  <td className="px-4 py-3 text-slate-600">{category.displayOrder || 1}</td>
                  <td className="px-4 py-3 text-slate-600">{category.services?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditModal("category", category)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                      <button type="button" onClick={() => handleDelete("category", () => leadService.deleteServiceCategory(category.id))} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-4 text-slate-500">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </TableSection>

        <TableSection
          title="Sub Service"
          subtitle="Manage all sub services"
          count={allServices.length}
          countClass="bg-emerald-50 text-emerald-700"
          onAdd={() => openCreateModal("service")}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.length ? paginatedServices.map((service) => (
                <tr key={service.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">{service.name}</td>
                  <td className="px-4 py-3 text-slate-600">{service.code}</td>
                  <td className="px-4 py-3 text-slate-600">{service.categoryName}</td>
                  <td className="px-4 py-3 text-slate-600">{service.displayOrder || 1}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${service.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {service.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditModal("service", service)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                      <button type="button" onClick={() => handleDelete("service", () => leadService.deleteService(service.id))} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-4 text-slate-500">No services found.</td></tr>
              )}
            </tbody>
          </table>
          {allServices.length ? (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <div>
                Showing {(servicePage - 1) * servicesPerPage + 1} to {Math.min(servicePage * servicesPerPage, allServices.length)} of {allServices.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={servicePage === 1}
                  onClick={() => setServicePage((prev) => Math.max(1, prev - 1))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="font-medium text-slate-700">Page {servicePage} / {totalServicePages}</span>
                <button
                  type="button"
                  disabled={servicePage === totalServicePages}
                  onClick={() => setServicePage((prev) => Math.min(totalServicePages, prev + 1))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </TableSection>

        <TableSection
          title="Lead Status"
          subtitle="Manage status pipeline"
          count={leadStatuses.length}
          countClass="bg-amber-50 text-amber-700"
          onAdd={() => openCreateModal("status")}
        >
          {fetchIssues.statuses ? <div className="mx-4 mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">{fetchIssues.statuses}</div> : null}
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {leadStatuses.length ? leadStatuses.map((status) => (
                <tr key={status.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color || "#2563EB" }} />
                    {status.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{status.code}</td>
                  <td className="px-4 py-3 text-slate-600">{status.displayOrder || 1}</td>
                  <td className="px-4 py-3 text-slate-600">{status.isDefault ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-slate-600">{status.isClosed ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {status.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditModal("status", status)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                      <button type="button" onClick={() => handleDelete("status", () => leadService.deleteLeadStatus(status.id))} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-4 text-slate-500">No statuses found.</td></tr>
              )}
            </tbody>
          </table>
        </TableSection>

        <TableSection
          title="Lead Source"
          subtitle="Manage lead source lookup"
          count={leadSources.length}
          countClass="bg-violet-50 text-violet-700"
          onAdd={() => openCreateModal("source")}
        >
          {fetchIssues.sources ? <div className="mx-4 mt-3 rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-700">{fetchIssues.sources}</div> : null}
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {leadSources.length ? leadSources.map((source) => (
                <tr key={source.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">{source.name}</td>
                  <td className="px-4 py-3 text-slate-600">{source.code}</td>
                  <td className="px-4 py-3 text-slate-600">{source.description || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{source.displayOrder || 1}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${source.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {source.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditModal("source", source)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                      <button type="button" onClick={() => handleDelete("lead source", () => leadService.deleteLeadSource(source.id))} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-4 text-slate-500">No lead sources found.</td></tr>
              )}
            </tbody>
          </table>
        </TableSection>
      </div>

      {loading ? <div className="text-sm text-slate-500">Loading master data...</div> : null}

      {modalType && currentTheme ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-800">{currentTheme.title}</h4>
              <button type="button" className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50" onClick={closeModal}>Close</button>
            </div>

            {modalType === "category" ? (
              <form onSubmit={handleCategorySubmit} className="grid gap-3 md:grid-cols-2">
                <input type="text" name="name" value={categoryForm.name} onChange={onFormChange(setCategoryForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Name" required />
                <input type="text" name="code" value={categoryForm.code} onChange={onFormChange(setCategoryForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Code" required />
                <input type="color" name="color" value={categoryForm.color} onChange={onFormChange(setCategoryForm)} className="h-10 rounded-lg border border-slate-300 px-1" />
                <input type="number" min="1" name="displayOrder" value={categoryForm.displayOrder} onChange={onFormChange(setCategoryForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Display Order" required />
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 md:col-span-2">
                  <input type="checkbox" name="isActive" checked={categoryForm.isActive} onChange={onFormChange(setCategoryForm)} /> Active
                </label>
                <button type="submit" disabled={savingCategory} className={`md:col-span-2 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${currentTheme.buttonClass}`}>
                  {savingCategory ? "Saving..." : editingCategoryId ? currentTheme.updateText : currentTheme.addText}
                </button>
              </form>
            ) : null}

            {modalType === "service" ? (
              <form onSubmit={handleServiceSubmit} className="grid gap-3 md:grid-cols-2">
                <select name="serviceCategoryId" value={serviceForm.serviceCategoryId} onChange={onFormChange(setServiceForm)} className="rounded-lg border border-slate-300 px-3 py-2" required>
                  <option value="">Select Category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <input type="text" name="name" value={serviceForm.name} onChange={onFormChange(setServiceForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Service Name" required />
                <input type="text" name="code" value={serviceForm.code} onChange={onFormChange(setServiceForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Service Code" required />
                <input type="number" min="1" name="displayOrder" value={serviceForm.displayOrder} onChange={onFormChange(setServiceForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Display Order" required />
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 md:col-span-2">
                  <input type="checkbox" name="isActive" checked={serviceForm.isActive} onChange={onFormChange(setServiceForm)} /> Active
                </label>
                <button type="submit" disabled={savingService || !serviceForm.serviceCategoryId} className={`md:col-span-2 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${currentTheme.buttonClass}`}>
                  {savingService ? "Saving..." : editingServiceId ? currentTheme.updateText : currentTheme.addText}
                </button>
              </form>
            ) : null}

            {modalType === "status" ? (
              <form onSubmit={handleLeadStatusSubmit} className="grid gap-3 md:grid-cols-2">
                <input type="text" name="name" value={leadStatusForm.name} onChange={onFormChange(setLeadStatusForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Status Name" required />
                <input type="text" name="code" value={leadStatusForm.code} onChange={onFormChange(setLeadStatusForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Status Code" required />
                <input type="color" name="color" value={leadStatusForm.color} onChange={onFormChange(setLeadStatusForm)} className="h-10 rounded-lg border border-slate-300 px-1" />
                <input type="number" min="1" name="displayOrder" value={leadStatusForm.displayOrder} onChange={onFormChange(setLeadStatusForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Display Order" required />
                <input type="text" name="description" value={leadStatusForm.description} onChange={onFormChange(setLeadStatusForm)} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Description" />
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" name="isDefault" checked={leadStatusForm.isDefault} onChange={onFormChange(setLeadStatusForm)} /> Default
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" name="isClosed" checked={leadStatusForm.isClosed} onChange={onFormChange(setLeadStatusForm)} /> Closed
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 md:col-span-2">
                  <input type="checkbox" name="isActive" checked={leadStatusForm.isActive} onChange={onFormChange(setLeadStatusForm)} /> Active
                </label>
                <button type="submit" disabled={savingLeadStatus} className={`md:col-span-2 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${currentTheme.buttonClass}`}>
                  {savingLeadStatus ? "Saving..." : editingLeadStatusId ? currentTheme.updateText : currentTheme.addText}
                </button>
              </form>
            ) : null}

            {modalType === "source" ? (
              <form onSubmit={handleLeadSourceSubmit} className="grid gap-3 md:grid-cols-2">
                <input type="text" name="name" value={leadSourceForm.name} onChange={onFormChange(setLeadSourceForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Name" required />
                <input type="text" name="code" value={leadSourceForm.code} onChange={onFormChange(setLeadSourceForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Code" required />
                <input type="text" name="description" value={leadSourceForm.description} onChange={onFormChange(setLeadSourceForm)} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Description" />
                <input type="number" min="1" name="displayOrder" value={leadSourceForm.displayOrder} onChange={onFormChange(setLeadSourceForm)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Display Order" required />
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" name="isActive" checked={leadSourceForm.isActive} onChange={onFormChange(setLeadSourceForm)} /> Active
                </label>
                <button type="submit" disabled={savingLeadSource} className={`md:col-span-2 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${currentTheme.buttonClass}`}>
                  {savingLeadSource ? "Saving..." : editingLeadSourceId ? currentTheme.updateText : currentTheme.addText}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Master;
