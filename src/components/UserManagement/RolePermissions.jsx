import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";
import userManagementService from "../../services/userManagement.service";

const EMPTY_ROLE = { name: "", description: "", isActive: true };

function getList(response) {
    if (Array.isArray(response?.data)) return response.data;
    return Array.isArray(response) ? response : [];
}

function normalizeCode(value) {
    return String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function isSystemRole(role) {
    return String(role?.code || "").replace(/[\s_-]+/g, "").toLowerCase() === "superadmin";
}

function PermissionGroup({ module, selectedIds, onTogglePermission, onToggleModule }) {
    const permissions = module.permissions || module.Permissions || [];
    const permissionIds = permissions.map((permission) => permission.id);
    const allSelected = permissionIds.length > 0
        && permissionIds.every((id) => selectedIds.includes(id));

    return (
        <section className="border-b border-slate-200 last:border-b-0">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                        <KeyRound size={15} />
                    </span>
                    <span>{module.name}</span>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    Select all
                    <input
                        type="checkbox"
                        checked={allSelected}
                        disabled={!permissionIds.length}
                        onChange={() => onToggleModule(permissionIds, allSelected)}
                        title={`Select or clear every action for ${module.name}`}
                        aria-label={`Select all permissions for ${module.name}`}
                    />
                </label>
            </div>
            {permissions.length ? (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {permissions.map((permission) => (
                        <label
                            key={permission.id}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-blue-50"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(permission.id)}
                                onChange={() => onTogglePermission(permission.id)}
                            />
                            {permission.action} {module.name}
                        </label>
                    ))}
                </div>
            ) : (
                <p className="px-4 pb-3 text-sm text-slate-400">
                    {module.superAdminOnly ? "Super Admin only — cannot be granted to other roles." : "No permissions are configured for this menu."}
                </p>
            )}
        </section>
    );
}

export default function RolePermissions() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [permissionConfigurationEnabled, setPermissionConfigurationEnabled] = useState(false);
    const [form, setForm] = useState(EMPTY_ROLE);
    const [editingRole, setEditingRole] = useState(null);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [error, setError] = useState("");

    const [sections, setSections] = useState([]);
    const [prefilled, setPrefilled] = useState(false);
    const [matrixLoading, setMatrixLoading] = useState(false);

    const allMenus = useMemo(() => sections.flatMap((section) => section.menus), [sections]);
    const allPermissionIds = useMemo(
        () => allMenus.flatMap((menu) => menu.permissions.map((permission) => permission.id)),
        [allMenus]
    );

    const loadMatrix = async (roleId) => {
        setMatrixLoading(true);
        try {
            const response = await userManagementService.getRolePermissionMatrix(roleId);
            const matrix = response?.data || {};
            setSections(matrix.sections || []);
            setSelectedIds(matrix.grantedPermissionIds || []);
            setPrefilled(Boolean(matrix.prefilled));
            return true;
        } catch (matrixError) {
            setError(matrixError.message || "Unable to load role permissions.");
            return false;
        } finally {
            setMatrixLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [rolesResponse, catalogResponse] = await Promise.all([
                userManagementService.getManageRoles(),
                userManagementService.getPermissionCatalog(),
            ]);
            setRoles(getList(rolesResponse));
            setModules(getList(catalogResponse));
        } catch (loadError) {
            setError(loadError.message || "Unable to load roles and permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const startCreate = async () => {
        setEditingRole(null);
        setCreating(true);
        setForm(EMPTY_ROLE);
        setSelectedIds([]);
        setPermissionConfigurationEnabled(true);
        setError("");
        await loadMatrix("new");
    };

    const startEdit = async (role) => {
        if (isSystemRole(role)) {
            toast.info("Super Admin always has full access and cannot be changed here.");
            return;
        }
        setEditingRole(role);
        setCreating(false);
        setForm({
            name: role.name || "",
            description: role.description || "",
            isActive: role.isActive !== false,
        });
        setSelectedIds([]);
        setPermissionConfigurationEnabled(true);
        setError("");
        await loadMatrix(role.id);
    };

    const closeEditor = () => {
        setEditingRole(null);
        setCreating(false);
        setSelectedIds([]);
        setSections([]);
        setPrefilled(false);
        setPermissionConfigurationEnabled(false);
        setForm(EMPTY_ROLE);
        setError("");
    };

    const togglePermission = (permissionId) => {
        setSelectedIds((current) => current.includes(permissionId)
            ? current.filter((id) => id !== permissionId)
            : [...current, permissionId]);
    };

    const toggleModulePermissions = (permissionIds, allSelected) => {
        setSelectedIds((current) => {
            if (allSelected) {
                const removing = new Set(permissionIds);
                return current.filter((id) => !removing.has(id));
            }
            return [...new Set([...current, ...permissionIds])];
        });
    };

    const saveRole = async (event) => {
        event.preventDefault();
        const name = form.name.trim();
        const code = editingRole?.code || normalizeCode(name);
        if (!name || !code) {
            setError("Enter a role name using letters or numbers.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const payload = {
                name,
                code,
                description: form.description.trim(),
                isActive: form.isActive,
                ...(permissionConfigurationEnabled ? { permissionIds: selectedIds } : {}),
            };
            if (editingRole) {
                await userManagementService.updateRole(editingRole.id, payload);
                toast.success(permissionConfigurationEnabled
                    ? "Role permissions updated. Members see changes after signing in again."
                    : "Role updated. This role still has no access to protected modules.");
            } else {
                await userManagementService.createRole(payload);
                toast.success("Role created successfully.");
            }
            closeEditor();
            await loadData();
        } catch (saveError) {
            setError(saveError.message || "Unable to save this role.");
        } finally {
            setSaving(false);
        }
    };

    const deleteRole = async (role) => {
        if (isSystemRole(role) || role.users?.length) return;
        if (!window.confirm(`Delete the "${role.name}" role? This role has no assigned staff.`)) return;
        try {
            await userManagementService.deleteRole(role.id);
            toast.success("Role deleted.");
            await loadData();
        } catch (deleteError) {
            toast.error(deleteError.message || "Unable to delete this role.");
        }
    };

    const initializeCatalog = async () => {
        if (!window.confirm("Add any missing standard menu and permission records? Existing modules, permissions, and role assignments will not be overwritten.")) return;
        setInitializing(true);
        try {
            const response = await userManagementService.initializePermissionCatalog();
            const result = response?.data || {};
            toast.success(`Added ${result.createdModules || 0} menus and ${result.createdPermissions || 0} permissions.`);
            await loadData();
        } catch (initError) {
            toast.error(initError.message || "Unable to initialize the permission catalog.");
        } finally {
            setInitializing(false);
        }
    };

    const setQuickSelection = (mode) => {
        if (mode === "all") {
            setSelectedIds(allPermissionIds);
            return;
        }
        if (mode === "none") {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(allMenus.flatMap((menu) => (
            menu.permissions
                .filter((permission) => String(permission.action).toLowerCase() === "view")
                .map((permission) => permission.id)
        )));
    };

    const renderModule = (menu) => (
        <div key={menu.id}>
            <PermissionGroup
                module={menu}
                selectedIds={selectedIds}
                onTogglePermission={togglePermission}
                onToggleModule={toggleModulePermissions}
            />
        </div>
    );

    return (
        <div className="space-y-5 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Roles &amp; Permissions</h1>
                    <p className="mt-1 text-sm text-slate-500">Configure role access to application menus and pages.</p>
                </div>
                {!editingRole && !creating && (
                    <button
                        type="button"
                        onClick={startCreate}
                        disabled={!modules.length}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus size={16} /> Create Role
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => navigate("/user-management")}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-white"
                >
                    <ArrowLeft size={15} /> Back to Staff
                </button>
                {!modules.length && !loading && (
                    <button
                        type="button"
                        onClick={initializeCatalog}
                        disabled={initializing}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                        {initializing ? <Loader2 className="animate-spin" size={15} /> : <KeyRound size={15} />}
                        Initialize standard menu permissions
                    </button>
                )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                These permissions control menu visibility, page navigation, and backend actions. Only Super Admin can manage roles or assign permissions; unassigned permissions are denied.
            </div>

            {error && !editingRole && !creating && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading roles…</div>
            ) : editingRole || creating ? (
                <form onSubmit={saveRole} className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.8fr)]">
                    <div className="space-y-4">
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="flex items-center gap-2 border-b border-orange-200 bg-orange-400 px-4 py-3 font-semibold text-white">
                                <ShieldCheck size={18} /> {creating ? "Create Role" : `Edit Role — ${editingRole.name}`}
                            </div>
                            <div className="space-y-4 p-4">
                                {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                                <label className="block text-sm font-medium text-slate-700">
                                    Role Name <span className="text-red-500">*</span>
                                    <input
                                        required
                                        maxLength={100}
                                        value={form.name}
                                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </label>
                                {creating && (
                                    <p className="text-xs text-slate-500">Role code: <strong>{normalizeCode(form.name) || "GENERATED_FROM_NAME"}</strong></p>
                                )}
                                <label className="block text-sm font-medium text-slate-700">
                                    Description
                                    <textarea
                                        rows={3}
                                        maxLength={255}
                                        value={form.description}
                                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                                    />
                                    Role is active
                                </label>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-semibold text-slate-700">Quick Select</h3>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setQuickSelection("all")} className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700">All Permissions</button>
                                <button type="button" onClick={() => setQuickSelection("none")} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600">None</button>
                                <button type="button" onClick={() => setQuickSelection("view")} className="rounded-full border border-cyan-300 px-3 py-1 text-xs font-medium text-cyan-700">View Only</button>
                            </div>
                        </section>

                        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="animate-spin" size={17} />}
                                {creating ? "Create Role" : "Update Role"}
                            </button>
                            <button type="button" disabled={saving} onClick={closeEditor} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                        </section>
                    </div>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">
                            <KeyRound size={18} className="text-amber-500" /> Permissions
                            {permissionConfigurationEnabled && (
                                <span className="ml-auto text-xs font-normal text-slate-500">{selectedIds.length} selected</span>
                            )}
                        </div>
                        {prefilled && editingRole && (
                            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                                This role has not been configured yet. The boxes below are pre-ticked from its current page access. Review them and click Update Role to save them to the database.
                            </div>
                        )}
                        {matrixLoading ? (
                            <p className="p-5 text-sm text-slate-500">Loading permissions…</p>
                        ) : sections.length ? (
                            <div className="max-h-[75vh] overflow-y-auto">
                                {sections.map((section) => (
                                    <div key={section.id}>
                                        <h3 className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{section.name}</h3>
                                        {section.menus.map(renderModule)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="p-5 text-sm text-slate-600">
                                No menus found. Use "Initialize standard menu permissions" first.
                            </p>
                        )}
                    </section>
                </form>
            ) : (
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 font-semibold text-slate-800">
                        <ShieldCheck size={19} className="text-blue-700" /> Roles &amp; Permissions
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Role</th>
                                    <th className="px-5 py-3 text-left">Description</th>
                                    <th className="px-5 py-3 text-center">Active Staff</th>
                                    <th className="px-5 py-3 text-center">Permissions</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-semibold text-slate-800">
                                            {role.name}
                                            {isSystemRole(role) && <span className="ml-2 rounded-full bg-slate-700 px-2 py-1 text-[10px] text-white">System</span>}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{role.description || "—"}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold text-white"><Users size={12} /> {role.users?.filter((user) => user.isActive).length || 0} staff</span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="rounded-full bg-slate-500 px-3 py-1 text-xs font-semibold text-white">
                                                {isSystemRole(role)
                                                    ? "Full access"
                                                    : role.permissionsConfigured === true || role.permissions?.length
                                                        ? `${role.permissions?.length || 0} permissions`
                                                        : "No permissions"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${role.isActive === false ? "bg-slate-400" : "bg-green-600"}`}>
                                                {role.isActive === false ? "Inactive" : "Active"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => startEdit(role)} title={isSystemRole(role) ? "Super Admin always has full access" : `Edit permissions for ${role.name}`} className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                                                    <Pencil size={13} /> {isSystemRole(role) ? "System Role" : "Edit Permissions"}
                                                </button>
                                                {!isSystemRole(role) && !role.users?.length && (
                                                    <button type="button" onClick={() => deleteRole(role)} title={`Delete ${role.name}`} aria-label={`Delete ${role.name}`} className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!roles.length && !error && (
                                    <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No roles were found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
