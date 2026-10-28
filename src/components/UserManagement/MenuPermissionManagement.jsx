import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowDown, ArrowUp, GripVertical, KeyRound, ListTree, Loader2, Pencil, Plus,
    Power, Search, ShieldCheck, Table2, Trash2, X
} from "lucide-react";
import { toast } from "react-toastify";
import userManagementService from "../../services/userManagement.service";
import { MENU_ICONS, getMenuIcon } from "../sidebar/menuIcons";

const STANDARD_ACTIONS = ["view", "create", "edit", "delete"];
const EMPTY_MENU = { name: "", parentId: "", route: "", icon: "", displayOrder: "", isActive: true, extraActions: "" };

const list = (response) => (Array.isArray(response?.data) ? response.data : []);
const permissionsOf = (module) => module.Permissions || module.permissions || [];
const actionKey = (permission) => String(permission.permissionKey || "").split(".").pop();
const isSystemRole = (role) => String(role?.code || "").replace(/[\s_-]+/g, "").toLowerCase() === "superadmin";
const notifyMenusChanged = () => window.dispatchEvent(new Event("menus-updated"));

function StatusBadge({ active }) {
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function MenuForm({ menu, sections, onClose, onSaved }) {
    const editing = Boolean(menu?.id);
    const [form, setForm] = useState(() => editing
        ? {
            name: menu.name || "",
            parentId: menu.parentId || "",
            route: menu.route || "",
            icon: menu.icon || "",
            displayOrder: menu.displayOrder ?? "",
            isActive: menu.isActive !== false,
            extraActions: "",
        }
        : { ...EMPTY_MENU, ...menu });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const hasChildren = editing && (menu.children || []).length > 0;
    const extraPermissions = editing ? permissionsOf(menu).filter((permission) => !STANDARD_ACTIONS.includes(actionKey(permission))) : [];
    const [newAction, setNewAction] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        const payload = {
            name: form.name.trim(),
            parentId: form.parentId ? Number(form.parentId) : null,
            route: form.route.trim() || null,
            icon: form.icon || null,
            isActive: form.isActive,
            ...(form.displayOrder !== "" ? { displayOrder: Number(form.displayOrder) } : {}),
        };
        try {
            if (editing) {
                await userManagementService.updateMenu(menu.id, payload);
            } else {
                await userManagementService.createMenu({
                    ...payload,
                    extraActions: form.extraActions.split(",").map((action) => action.trim()).filter(Boolean),
                });
            }
            toast.success(editing ? "Menu updated." : "Menu created.");
            notifyMenusChanged();
            onSaved();
        } catch (saveError) {
            setError(saveError.message || "Unable to save this menu.");
        } finally {
            setSaving(false);
        }
    };

    const addAction = async () => {
        if (!newAction.trim()) return;
        try {
            await userManagementService.addMenuAction(menu.id, newAction.trim());
            toast.success("Action added. Assign it to roles in the Permission Matrix.");
            setNewAction("");
            onSaved(true);
        } catch (actionError) {
            setError(actionError.message || "Unable to add this action.");
        }
    };

    const removeAction = async (permission) => {
        try {
            await userManagementService.removeMenuAction(menu.id, permission.id);
            toast.success("Action removed.");
            onSaved(true);
        } catch (actionError) {
            setError(actionError.message || "Unable to remove this action.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={submit} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{editing ? `Edit ${menu.name}` : "Add menu"}</h2>
                    <button type="button" onClick={onClose} title="Close" aria-label="Close" className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
                </div>
                {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Name *
                        <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">Parent menu
                        <select disabled={hasChildren} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                            <option value="">None (top-level menu)</option>
                            {sections.filter((section) => section.id !== menu?.id).map((section) => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">Route / URL
                        <input value={form.route} placeholder="/employee or https://example.com" onChange={(e) => setForm({ ...form, route: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                        <span className="text-xs font-normal text-slate-500">Use an existing application route or an external link. Leave empty for a section heading.</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-slate-700">Icon
                            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                                <option value="">Default</option>
                                {Object.keys(MENU_ICONS).map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-700">Display order
                            <input type="number" min={0} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                        </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                        Active (inactive menus are hidden and their permissions are denied)
                    </label>
                    {!editing && (
                        <label className="block text-sm font-medium text-slate-700">Additional actions
                            <input value={form.extraActions} placeholder="Export, Approve, Print" onChange={(e) => setForm({ ...form, extraActions: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                            <span className="text-xs font-normal text-slate-500">View, Create, Edit and Delete are added automatically for routed menus and submenus.</span>
                        </label>
                    )}
                    {editing && !hasChildren && (
                        <div className="rounded-lg border border-slate-200 p-3">
                            <p className="text-sm font-medium text-slate-700">Additional actions</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {extraPermissions.map((permission) => (
                                    <span key={permission.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                                        {permission.action}
                                        <button type="button" title={`Remove ${permission.action}`} aria-label={`Remove ${permission.action}`} onClick={() => removeAction(permission)}><X size={12} /></button>
                                    </span>
                                ))}
                                {!extraPermissions.length && <span className="text-xs text-slate-500">None</span>}
                            </div>
                            <div className="mt-2 flex gap-2">
                                <input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="e.g. Approve" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                                <button type="button" onClick={addAction} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white">Add</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                    <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {saving && <Loader2 className="animate-spin" size={15} />} Save
                    </button>
                </div>
            </form>
        </div>
    );
}

function MenusTab({ tree, loading, reload }) {
    const [search, setSearch] = useState("");
    const [editor, setEditor] = useState(null);
    const [dragId, setDragId] = useState(null);

    const sections = useMemo(() => tree.filter((item) => !item.parentId), [tree]);
    const term = search.trim().toLowerCase();
    const matches = (item) => !term || [item.name, item.route, item.code].some((value) => String(value || "").toLowerCase().includes(term));
    const rows = tree.flatMap((section) => {
        const children = (section.children || []).filter(matches);
        return matches(section) || children.length ? [section, ...(matches(section) ? section.children : children)] : [];
    });

    const saveOrder = async (items) => {
        try {
            await userManagementService.reorderMenus(items);
            notifyMenusChanged();
            await reload();
        } catch (error) {
            toast.error(error.message || "Unable to save the menu order.");
        }
    };

    const siblingsOf = (parentId) => (parentId
        ? tree.find((section) => section.id === parentId)?.children || []
        : tree);

    const move = (item, direction) => {
        const group = [...siblingsOf(item.parentId)];
        const index = group.findIndex((entry) => entry.id === item.id);
        const target = index + direction;
        if (target < 0 || target >= group.length) return;
        [group[index], group[target]] = [group[target], group[index]];
        saveOrder(group.map((entry, order) => ({ id: entry.id, parentId: entry.parentId || null, displayOrder: order + 1 })));
    };

    const drop = (target) => {
        const dragged = rows.find((item) => item.id === dragId);
        setDragId(null);
        if (!dragged || dragged.id === target.id) return;
        if ((dragged.parentId || null) === (target.parentId || null)) {
            const group = siblingsOf(dragged.parentId).filter((entry) => entry.id !== dragged.id);
            group.splice(group.findIndex((entry) => entry.id === target.id), 0, dragged);
            saveOrder(group.map((entry, order) => ({ id: entry.id, parentId: entry.parentId || null, displayOrder: order + 1 })));
        } else if (dragged.parentId && !target.parentId) {
            const group = [...(target.children || []), dragged];
            saveOrder(group.map((entry, order) => ({ id: entry.id, parentId: target.id, displayOrder: order + 1 })));
        } else {
            toast.info("Drop a submenu onto a sibling or onto a parent menu to move it.");
        }
    };

    const toggle = async (item) => {
        try {
            await userManagementService.updateMenu(item.id, { isActive: item.isActive === false });
            toast.success(item.isActive === false ? "Menu enabled." : "Menu disabled.");
            notifyMenusChanged();
            await reload();
        } catch (error) {
            toast.error(error.message || "Unable to change the menu status.");
        }
    };

    const remove = async (item) => {
        if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        try {
            await userManagementService.deleteMenu(item.id);
            toast.success("Menu deleted.");
            notifyMenusChanged();
            await reload();
        } catch (error) {
            toast.error(error.message || "Unable to delete this menu.");
        }
    };

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="relative block w-full sm:w-72">
                    <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menus..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" />
                </label>
                <button type="button" onClick={() => setEditor({})} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <Plus size={16} /> Add menu
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-[760px] w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Menu</th>
                            <th className="px-4 py-3 text-left">Route / URL</th>
                            <th className="px-4 py-3 text-center">Icon</th>
                            <th className="px-4 py-3 text-center">Order</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading menus…</td></tr>}
                        {!loading && !rows.length && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                No menus found.{" "}
                                <button
                                    type="button"
                                    className="font-medium text-blue-700 underline"
                                    onClick={async () => {
                                        try {
                                            await userManagementService.initializePermissionCatalog();
                                            toast.success("Standard menus created.");
                                            await reload();
                                        } catch (initError) {
                                            toast.error(initError.message || "Unable to initialize the standard menus.");
                                        }
                                    }}
                                >
                                    Create the standard menus
                                </button>
                            </td></tr>
                        )}
                        {rows.map((item) => {
                            const Icon = getMenuIcon(item.icon);
                            return (
                                <tr
                                    key={item.id}
                                    draggable
                                    onDragStart={() => setDragId(item.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => drop(item)}
                                    className={`hover:bg-slate-50 ${dragId === item.id ? "opacity-50" : ""} ${item.isActive === false ? "text-slate-400" : ""}`}
                                >
                                    <td className={`px-4 py-2.5 ${item.parentId ? "pl-10" : "font-semibold"}`}>
                                        <span className="inline-flex items-center gap-2">
                                            <GripVertical size={14} className="cursor-grab text-slate-400" title="Drag to reorder" />
                                            {item.name}
                                            {item.builtIn && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">Built-in</span>}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600">{item.route || "—"}</td>
                                    <td className="px-4 py-2.5 text-center" title={item.icon ? `Icon: ${item.icon}` : "Default link icon"}><Icon size={16} className="mx-auto" /></td>
                                    <td className="px-4 py-2.5 text-center">{item.displayOrder}</td>
                                    <td className="px-4 py-2.5 text-center"><StatusBadge active={item.isActive !== false} /></td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex justify-end gap-1">
                                            <button type="button" title="Move up" aria-label="Move up" onClick={() => move(item, -1)} className="rounded p-1.5 hover:bg-slate-100"><ArrowUp size={14} /></button>
                                            <button type="button" title="Move down" aria-label="Move down" onClick={() => move(item, 1)} className="rounded p-1.5 hover:bg-slate-100"><ArrowDown size={14} /></button>
                                            <button type="button" title={item.isActive === false ? "Enable menu" : "Disable menu"} aria-label="Enable or disable" onClick={() => toggle(item)} className="rounded p-1.5 hover:bg-slate-100"><Power size={14} /></button>
                                            <button type="button" title="Edit menu" aria-label="Edit" onClick={() => setEditor(item)} className="rounded p-1.5 hover:bg-slate-100"><Pencil size={14} /></button>
                                            {!item.builtIn && (
                                                <button type="button" title="Delete menu" aria-label="Delete" onClick={() => remove(item)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {editor && (
                <MenuForm
                    key={editor.id || "new"}
                    menu={editor}
                    sections={sections}
                    onClose={() => setEditor(null)}
                    onSaved={(keepOpen) => { if (!keepOpen) setEditor(null); reload(); }}
                />
            )}
        </section>
    );
}

function MatrixTab({ tree, roles, loading, reload }) {
    const [roleId, setRoleId] = useState("");
    const [selected, setSelected] = useState(new Set());
    const [original, setOriginal] = useState(new Set());
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [message, setMessage] = useState(null);

    const editableRoles = useMemo(() => roles.filter((role) => !isSystemRole(role)), [roles]);
    const role = roles.find((item) => String(item.id) === String(roleId));

    const columns = useMemo(() => {
        const keys = new Set(STANDARD_ACTIONS);
        const labels = new Map(STANDARD_ACTIONS.map((key) => [key, key[0].toUpperCase() + key.slice(1)]));
        tree.flatMap((section) => [section, ...(section.children || [])]).forEach((menu) => {
            permissionsOf(menu).forEach((permission) => {
                const key = actionKey(permission);
                keys.add(key);
                if (!labels.has(key)) labels.set(key, permission.action);
            });
        });
        const extras = [...keys].filter((key) => !STANDARD_ACTIONS.includes(key)).sort();
        return [...STANDARD_ACTIONS, ...extras].map((key) => ({ key, label: labels.get(key) }));
    }, [tree]);

    const selectRole = (id) => {
        setRoleId(id);
        setMessage(null);
        const target = roles.find((item) => String(item.id) === String(id));
        const ids = new Set((target?.permissions || []).map((permission) => permission.id));
        setSelected(ids);
        setOriginal(new Set(ids));
    };

    const pageMenus = useMemo(
        () => tree.flatMap((section) => (section.children?.length ? section.children : [])
            .concat(!section.children?.length && permissionsOf(section).length ? [section] : [])),
        [tree]
    );
    const allPermissionIds = useMemo(() => pageMenus.flatMap((menu) => permissionsOf(menu).map((permission) => permission.id)), [pageMenus]);
    const permissionFor = (menu, key) => permissionsOf(menu).find((permission) => actionKey(permission) === key);

    // Granting any action also grants View, and removing View removes the other actions.
    const setPermission = (menu, key, checked, base) => {
        const next = base || new Set(selected);
        const target = permissionFor(menu, key);
        const view = permissionFor(menu, "view");
        if (!target) return next;
        if (checked) {
            next.add(target.id);
            if (view) next.add(view.id);
        } else if (key === "view") {
            permissionsOf(menu).forEach((permission) => next.delete(permission.id));
        } else {
            next.delete(target.id);
        }
        return next;
    };

    const toggleCell = (menu, key) => {
        const target = permissionFor(menu, key);
        setSelected(setPermission(menu, key, !selected.has(target.id)));
    };

    const toggleRow = (menu) => {
        const ids = permissionsOf(menu).map((permission) => permission.id);
        const all = ids.length > 0 && ids.every((id) => selected.has(id));
        const next = new Set(selected);
        ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
        setSelected(next);
    };

    const toggleColumn = (key, menus) => {
        const targets = menus.map((menu) => [menu, permissionFor(menu, key)]).filter(([, permission]) => permission);
        const all = targets.length > 0 && targets.every(([, permission]) => selected.has(permission.id));
        let next = new Set(selected);
        targets.forEach(([menu]) => { next = setPermission(menu, key, !all, next); });
        setSelected(next);
    };

    const dirty = selected.size !== original.size || [...selected].some((id) => !original.has(id));

    const save = async () => {
        if (!role) return;
        setSaving(true);
        setMessage(null);
        try {
            await userManagementService.updateRole(role.id, { permissionIds: [...selected] });
            setMessage({ type: "success", text: `Permissions saved for ${role.name}.` });
            toast.success(`Permissions saved for ${role.name}.`);
            notifyMenusChanged();
            setOriginal(new Set(selected));
            await reload();
        } catch (error) {
            setMessage({ type: "error", text: error.message || "Unable to save permissions." });
        } finally {
            setSaving(false);
        }
    };

    const initialize = async () => {
        if (!window.confirm("Add any missing standard menus and permissions? Existing records and role assignments are not changed.")) return;
        setInitializing(true);
        try {
            const response = await userManagementService.initializePermissionCatalog();
            toast.success(`Added ${response?.data?.createdModules || 0} menus and ${response?.data?.createdPermissions || 0} permissions.`);
            await reload();
        } catch (error) {
            toast.error(error.message || "Unable to initialize the permission catalog.");
        } finally {
            setInitializing(false);
        }
    };

    const term = search.trim().toLowerCase();
    const visibleTree = tree
        .map((section) => ({
            ...section,
            children: (section.children || []).filter((child) => !term || child.name.toLowerCase().includes(term) || section.name.toLowerCase().includes(term)),
        }))
        .filter((section) => section.children.length || (!section.children.length && permissionsOf(section).length && (!term || section.name.toLowerCase().includes(term))));

    const cell = (menu, column) => {
        const permission = permissionFor(menu, column.key);
        if (!permission) return <span className="text-slate-300">—</span>;
        return (
            <input
                type="checkbox"
                aria-label={`${column.label} ${menu.name}`}
                checked={selected.has(permission.id)}
                disabled={!role}
                onChange={() => toggleCell(menu, column.key)}
            />
        );
    };

    const renderMenuRow = (menu, indent) => (
        <tr key={menu.id} className="hover:bg-slate-50">
            <td className={`px-4 py-2 ${indent ? "pl-10" : "font-medium"}`}>
                {menu.name}
                {menu.isActive === false && <span className="ml-2 text-xs text-slate-400">(inactive)</span>}
            </td>
            {columns.map((column) => <td key={column.key} className="px-3 py-2 text-center">{cell(menu, column)}</td>)}
            <td className="px-3 py-2 text-center">
                <button type="button" disabled={!role} onClick={() => toggleRow(menu)} className="text-xs text-blue-600 disabled:text-slate-300">Row</button>
            </td>
        </tr>
    );

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
                <label className="block text-sm font-medium text-slate-700">Role
                    <select value={roleId} onChange={(e) => selectRole(e.target.value)} className="mt-1 block w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                        <option value="">Select a role…</option>
                        {editableRoles.map((item) => <option key={item.id} value={item.id}>{item.name}{item.isActive === false ? " (inactive)" : ""}</option>)}
                    </select>
                </label>
                <label className="relative block w-full sm:w-64">
                    <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menus..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" />
                </label>
                {!tree.length && !loading && (
                    <button type="button" onClick={initialize} disabled={initializing} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                        {initializing ? <Loader2 className="animate-spin" size={15} /> : <KeyRound size={15} />} Initialize standard menus
                    </button>
                )}
            </div>

            <p className="text-sm text-slate-600">
                {role
                    ? <>Editing <strong>{role.name}</strong>: {selected.size} of {allPermissionIds.length} permissions assigned. Anything not ticked is denied.</>
                    : "Super Admin always has full access and is not editable. Select a role to configure its menus and actions."}
            </p>

            {message && (
                <div className={`rounded-lg px-4 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>
            )}

            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!role} onClick={() => setSelected(new Set(allPermissionIds))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">Select All</button>
                <button type="button" disabled={!role} onClick={() => setSelected(new Set())} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">Clear All</button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-[640px] w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Menu / Module</th>
                            {columns.map((column) => (
                                <th key={column.key} className="px-3 py-3 text-center">
                                    <button type="button" disabled={!role} onClick={() => toggleColumn(column.key, pageMenus)} className="uppercase disabled:cursor-not-allowed" title={`Toggle ${column.label} for every menu`}>{column.label}</button>
                                </th>
                            ))}
                            <th className="px-3 py-3 text-center">All</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>}
                        {visibleTree.map((section) => (
                            section.children.length ? [
                                <tr key={`s-${section.id}`} className="bg-slate-100">
                                    <td className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">{section.name}</td>
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-3 py-2 text-center">
                                            <button type="button" disabled={!role} onClick={() => toggleColumn(column.key, section.children)} className="text-[11px] text-blue-600 disabled:text-slate-300">all</button>
                                        </td>
                                    ))}
                                    <td />
                                </tr>,
                                ...section.children.map((child) => renderMenuRow(child, true)),
                            ] : renderMenuRow(section, false)
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} disabled={!role || !dirty || saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                    {saving && <Loader2 className="animate-spin" size={15} />} Save Permissions
                </button>
                <button type="button" onClick={() => { setSelected(new Set(original)); setMessage(null); }} disabled={!dirty || saving} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm disabled:opacity-40">Cancel</button>
            </div>
        </section>
    );
}

export default function MenuPermissionManagement() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("menus");
    const [tree, setTree] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        try {
            const [menusResponse, rolesResponse] = await Promise.all([
                userManagementService.getMenus(),
                userManagementService.getManageRoles(),
            ]);
            setTree(list(menusResponse));
            setRoles(list(rolesResponse));
            setError("");
        } catch (loadError) {
            setError(loadError.message || "Unable to load menus and permissions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { reload(); }, [reload]);

    const matrixTree = useMemo(() => tree
        .filter((section) => section.isActive !== false)
        .map((section) => ({ ...section, children: (section.children || []).filter((child) => child.isActive !== false) })), [tree]);

    return (
        <div className="space-y-5 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Menu &amp; Permission Management</h1>
                    <p className="mt-1 text-sm text-slate-500">Create menus, reorder them and decide which role may view, create, edit, delete or use extra actions. Only Super Admin can change these settings.</p>
                </div>
                <button type="button" onClick={() => navigate("/role-permissions")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-white">
                    <ShieldCheck size={16} /> Manage roles
                </button>
            </div>

            <div className="flex gap-2 border-b border-slate-200">
                {[["menus", "Menus", ListTree], ["matrix", "Permission Matrix", Table2]].map(([key, label, Icon]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            {tab === "menus"
                ? <MenusTab tree={tree} loading={loading} reload={reload} />
                : <MatrixTab tree={matrixTree} roles={roles} loading={loading} reload={reload} />}
        </div>
    );
}
