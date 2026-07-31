import React, { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
    fullName: "",
    email: "",
    username: "",
    password: "",
    roleIds: [],
    privileges: ["view", "create", "edit"],
    employeeRecord: "",
    isActive: true
};

function AddRole({
    openModal,
    setOpenModal,
    roles = [],
    employeeOptions = [],
    editingUser = null,
    onSubmit,
    saving = false,
    error = ""
}) {
    const [form, setForm] = useState(EMPTY_FORM);

    const isEditMode = Boolean(editingUser?.id);
    const title = isEditMode ? "Edit User Profile" : "Add New User";

    const roleOptions = useMemo(() => {
        return (roles || []).map((role) => ({
            id: role.id,
            name: role.name,
            code: role.code
        }));
    }, [roles]);

    useEffect(() => {
        if (!openModal) return;
        if (editingUser) {
            const fullName = `${editingUser.firstName || ""} ${editingUser.lastName || ""}`.trim();
            setForm({
                fullName,
                email: editingUser.email || "",
                username: editingUser.username || (editingUser.email ? editingUser.email.split("@")[0] : ""),
                password: "",
                roleIds: Array.isArray(editingUser.roles) ? editingUser.roles.map((role) => role.id) : [],
                privileges: ["view", "create", "edit"],
                employeeRecord: editingUser.employeeRecord || fullName,
                isActive: Boolean(editingUser.isActive)
            });
            return;
        }
        setForm(EMPTY_FORM);
    }, [openModal, editingUser]);

    if (!openModal) return null;

    const toggleRole = (roleId) => {
        setForm((prev) => {
            const selected = prev.roleIds.includes(roleId);
            return {
                ...prev,
                roleIds: selected ? prev.roleIds.filter((id) => id !== roleId) : [...prev.roleIds, roleId]
            };
        });
    };

    const closeModal = () => {
        if (saving) return;
        setOpenModal(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.(form, isEditMode ? editingUser : null);
    };

    const togglePrivilege = (key) => {
        setForm((prev) => {
            const selected = prev.privileges.includes(key);
            return {
                ...prev,
                privileges: selected ? prev.privileges.filter((item) => item !== key) : [...prev.privileges, key]
            };
        });
    };

    const employeeListId = "employee-record-options";

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-4xl rounded-[28px] border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
                    <h2 className="text-4xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={closeModal}
                        className="rounded-md p-1 text-5xl leading-none text-gray-500 hover:bg-gray-100 hover:text-red-500"
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-8 py-7">
                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Full Name</span>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Geetha"
                                className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-lg outline-none focus:border-blue-500"
                                required
                            />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Email Address</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="geetha.khosocial@gmail.com"
                                className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-lg outline-none focus:border-blue-500"
                                required
                            />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Username</span>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                                placeholder="Geetha"
                                className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-lg outline-none focus:border-blue-500"
                                required
                            />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">New Password (Leave Blank To Keep)</span>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="••••••••"
                                className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-lg outline-none focus:border-blue-500"
                                required={!isEditMode}
                                minLength={6}
                            />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">System Role Access</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            {roleOptions.length === 0 ? (
                                <p className="text-sm text-gray-500">No roles available.</p>
                            ) : (
                                roleOptions.map((role) => {
                                    const selected = form.roleIds.includes(role.id);
                                    return (
                                        <label
                                            key={role.id}
                                            className="inline-flex cursor-pointer items-center gap-2 text-base text-gray-700"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => toggleRole(role.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            {role.name}
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Privileges (Permissions)</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            {[
                                { key: "view", label: "View" },
                                { key: "create", label: "Create" },
                                { key: "edit", label: "Edit" },
                                { key: "delete", label: "Delete" }
                            ].map((item) => (
                                <label key={item.key} className="inline-flex items-center gap-2 text-base text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.privileges.includes(item.key)}
                                        onChange={() => togglePrivilege(item.key)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {item.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <label className="block space-y-2 text-sm">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Link To Employee Record</span>
                        <input
                            list={employeeListId}
                            value={form.employeeRecord}
                            onChange={(e) => setForm((prev) => ({ ...prev, employeeRecord: e.target.value }))}
                            placeholder="Select employee"
                            className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-lg outline-none focus:border-blue-500"
                        />
                        <datalist id={employeeListId}>
                            {employeeOptions.map((employee) => (
                                <option key={employee} value={employee} />
                            ))}
                        </datalist>
                    </label>

                    <label className="block max-w-md space-y-2 text-sm">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Status</span>
                        <select
                            value={form.isActive ? "active" : "inactive"}
                            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === "active" }))}
                            className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-lg outline-none focus:border-blue-500"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </label>

                    <div className="flex gap-4 border-t border-gray-100 pt-5">
                        <button
                            type="submit"
                            disabled={saving || form.roleIds.length === 0}
                            className="h-14 flex-1 rounded-full bg-blue-600 px-5 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create User"}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={saving}
                            className="h-14 min-w-37.5 rounded-full bg-gray-100 px-6 text-lg font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddRole;
