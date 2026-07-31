import React, { useEffect, useMemo, useState } from "react";
import leadService from "../../services/lead.service";

const initialForm = {
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

const initialLeadSourceForm = {
  name: "",
  code: "",
  description: "",
  displayOrder: 1,
  isActive: true,
};

function Master() {
  const [categories, setCategories] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [categoryForm, setCategoryForm] = useState(initialForm);
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [leadSourceForm, setLeadSourceForm] = useState(initialLeadSourceForm);
  const [loading, setLoading] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [savingLeadSource, setSavingLeadSource] = useState(false);
  const [error, setError] = useState("");

  const totalServices = useMemo(
    () => categories.reduce((count, category) => count + (category.services?.length || 0), 0),
    [categories]
  );

  const loadMasterData = async () => {
    try {
      setLoading(true);
      setError("");
      const [categoriesResult, leadSourceResult] = await Promise.allSettled([
        leadService.getCategoriesWithServices(),
        leadService.getLeadSources(),
      ]);

      const categoriesData = categoriesResult.status === "fulfilled"
        ? (Array.isArray(categoriesResult.value?.data)
            ? categoriesResult.value.data
            : Array.isArray(categoriesResult.value)
              ? categoriesResult.value
              : [])
        : [];

      const leadSourceData = leadSourceResult.status === "fulfilled"
        ? (Array.isArray(leadSourceResult.value?.data)
            ? leadSourceResult.value.data
            : Array.isArray(leadSourceResult.value)
              ? leadSourceResult.value
              : [])
        : [];

      setCategories(categoriesData);
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

  const handleCategoryChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleServiceChange = (event) => {
    const { name, value, type, checked } = event.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleLeadSourceChange = (event) => {
    const { name, value, type, checked } = event.target;
    setLeadSourceForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingCategory(true);
      setError("");
      const response = await leadService.createServiceCategory(categoryForm);
      const createdCategory = response?.data || response;

      setCategories((prev) => [createdCategory, ...prev]);
      setCategoryForm(initialForm);
      setServiceForm((prev) => ({
        ...prev,
        serviceCategoryId: createdCategory.id ? String(createdCategory.id) : prev.serviceCategoryId,
      }));
    } catch (err) {
      setError(err.message || "Unable to add service category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleServiceSubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingService(true);
      setError("");
      await leadService.createService({
        ...serviceForm,
        serviceCategoryId: Number(serviceForm.serviceCategoryId),
      });
      await loadMasterData();
      setServiceForm((prev) => ({ ...initialServiceForm, serviceCategoryId: prev.serviceCategoryId }));
    } catch (err) {
      setError(err.message || "Unable to add service.");
    } finally {
      setSavingService(false);
    }
  };

  const handleLeadSourceSubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingLeadSource(true);
      setError("");
      await leadService.createLeadSource(leadSourceForm);
      await loadMasterData();
      setLeadSourceForm(initialLeadSourceForm);
    } catch (err) {
      setError(err.message || "Unable to add lead source.");
    } finally {
      setSavingLeadSource(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h5 className="text-lg font-semibold text-slate-800">Service Category</h5>
            <p className="text-sm text-slate-500">Manage service categories and show them in the master list.</p>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {categories.length} Categories
          </div>
        </div>

        <form onSubmit={handleCategorySubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Name</span>
            <input
              type="text"
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Media"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Code</span>
            <input
              type="text"
              name="code"
              value={categoryForm.code}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="MEDIA"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Color</span>
            <input
              type="color"
              name="color"
              value={categoryForm.color}
              onChange={handleCategoryChange}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-1 py-1"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Display Order</span>
            <input
              type="number"
              name="displayOrder"
              value={categoryForm.displayOrder}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              min="1"
              required
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              checked={categoryForm.isActive}
              onChange={handleCategoryChange}
            />
            Active
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={savingCategory}
            >
              {savingCategory ? "Saving..." : "Add Category"}
            </button>
          </div>
        </form>

        <div>
            <h5 className="text-lg font-semibold text-slate-800 mt-3">Sub Service</h5>
            <p className="text-sm text-slate-500">Manage sub service and show them in the master list.</p>
          </div>
        <form onSubmit={handleServiceSubmit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Service Category</span>
            <select
              name="serviceCategoryId"
              value={serviceForm.serviceCategoryId}
              onChange={handleServiceChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Service Name</span>
            <input
              type="text"
              name="name"
              value={serviceForm.name}
              onChange={handleServiceChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Videography"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Service Code</span>
            <input
              type="text"
              name="code"
              value={serviceForm.code}
              onChange={handleServiceChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Videography"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Display Order</span>
            <input
              type="number"
              name="displayOrder"
              value={serviceForm.displayOrder}
              onChange={handleServiceChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              min="1"
              required
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              checked={serviceForm.isActive}
              onChange={handleServiceChange}
            />
            Active
          </label>

          <div className="flex items-end md:col-span-2 xl:col-span-1">
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              disabled={savingService || !serviceForm.serviceCategoryId}
            >
              {savingService ? "Saving..." : "Add Service"}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h5 className="text-lg font-semibold text-slate-800">Lead Source</h5>
              <p className="text-sm text-slate-500">Manage lead source lookup values used in the lead form.</p>
            </div>
            <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              {leadSources.length} Sources
            </div>
          </div>

          <form onSubmit={handleLeadSourceSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-600">Name</span>
              <input
                type="text"
                name="name"
                value={leadSourceForm.name}
                onChange={handleLeadSourceChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Email Campaign"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-600">Code</span>
              <input
                type="text"
                name="code"
                value={leadSourceForm.code}
                onChange={handleLeadSourceChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="EMAIL_CAMPAIGN"
                required
              />
            </label>

            <label className="space-y-1 md:col-span-2 xl:col-span-2">
              <span className="text-sm font-medium text-slate-600">Description</span>
              <input
                type="text"
                name="description"
                value={leadSourceForm.description}
                onChange={handleLeadSourceChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Lead generated from Email Campaign."
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-600">Display Order</span>
              <input
                type="number"
                name="displayOrder"
                value={leadSourceForm.displayOrder}
                onChange={handleLeadSourceChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                min="1"
                required
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                checked={leadSourceForm.isActive}
                onChange={handleLeadSourceChange}
              />
              Active
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                disabled={savingLeadSource}
              >
                {savingLeadSource ? "Saving..." : "Add Lead Source"}
              </button>
            </div>
          </form>
        </div>

        {error ? <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h6 className="text-base font-semibold text-slate-800">Registered Categories</h6>
          <span className="text-xs text-slate-500">{totalServices} Services attached</span>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading service categories...</div>
        ) : categories.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No service categories found.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <div key={category.id || `${category.code}-${index}`} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: category.color || "#2563EB" }}
                    />
                    <span className="font-semibold text-slate-800">{category.name}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Code</span>
                    <span className="font-medium text-slate-800">{category.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Display Order</span>
                    <span className="font-medium text-slate-800">{category.displayOrder ?? index + 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Services</span>
                    <span className="font-medium text-slate-800">{category.services?.length || 0}</span>
                  </div>
                </div>

                {Array.isArray(category.services) && category.services.length > 0 ? (
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Services</p>
                    <div className="flex flex-wrap gap-2">
                      {category.services.map((service) => (
                        <span
                          key={service.id}
                          className="rounded-full border px-2 py-1 text-xs font-medium text-slate-700"
                          style={{ borderColor: category.color || "#2563EB" }}
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Master;