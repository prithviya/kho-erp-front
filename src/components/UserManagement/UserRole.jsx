import React, { useEffect, useMemo, useState } from "react";
import AddRole from "./AddRole";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import userManagementService from "../../services/userManagement.service";
import { toast } from "react-toastify";

function usernameFromEmail(email = "") {
    const local = String(email).split("@")[0] || "user";
    return `@${local}`;
}

function UserRole() {
    const [openModal, setOpenModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [tableError, setTableError] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const loadData = async (searchText = "") => {
        try {
            setLoading(true);
            setTableError("");
            const [usersRes, rolesRes] = await Promise.all([
                userManagementService.getUsers(searchText ? { search: searchText } : {}),
                userManagementService.getRoles()
            ]);
            setUsers(usersRes?.data || []);
            setRoles(rolesRes?.data || []);
        } catch (err) {
            setTableError(err.message || "Failed to load user data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(search.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const usersCount = users.length;
    const employeeOptions = useMemo(() => {
        const values = users.map((user) => {
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";
            return `${fullName} (${user.email})`;
        });
        return Array.from(new Set(values));
    }, [users]);

    const handleOpenCreate = () => {
        setFormError("");
        setEditingUser(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (user) => {
        setFormError("");
        setEditingUser(user);
        setOpenModal(true);
    };

    const handleSubmitUser = async (form, userToEdit = null) => {
        try {
            setSaving(true);
            setFormError("");

            const fullName = form.fullName.trim();
            const [firstNamePart, ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);
            if (!firstNamePart) {
                setFormError("Full name is required.");
                return;
            }

            const payload = {
                firstName: firstNamePart,
                lastName: lastNameParts.join(" "),
                email: form.email.trim(),
                username: form.username.trim(),
                employeeRecord: form.employeeRecord.trim(),
                isActive: form.isActive,
                phone: "",
                roleIds: form.roleIds,
                ...(form.password?.trim() ? { password: form.password.trim() } : {})
            };

            if (userToEdit?.id) {
                await userManagementService.updateUser(userToEdit.id, payload);
                toast.success("User updated successfully.");
            } else {
                if (!payload.password) {
                    setFormError("Password is required.");
                    return;
                }
                await userManagementService.createUser(payload);
                toast.success("User created successfully.");
            }

            setOpenModal(false);
            setEditingUser(null);
            await loadData(search.trim());
        } catch (err) {
            setFormError(err.message || "Failed to save user.");
        } finally {
            setSaving(false);
        }
    };

      const handleDeleteUser = async () => {
        if (!deleteTarget?.id) return;
        try {
            await userManagementService.deleteUser(deleteTarget.id);
            toast.success("User deleted successfully.");
            setDeleteTarget(null);
            await loadData(search.trim());
        } catch (err) {
            toast.error(err.message || "Failed to delete user.");
        }
    };

    const rows = useMemo(() => users || [], [users]);

    return (
        <div className="p-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Directory</h1>
                        <p className="text-xs text-gray-500">Manage and monitor all user accounts</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users..."
                            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleOpenCreate}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <UserPlus size={16} />
                            Add New User
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-gray-100">
                    <div className="grid grid-cols-[2fr_3fr_1.2fr_2fr_0.8fr] bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600">
                        <div>Full Name</div>
                        <div>Email / Username</div>
                        <div>Status</div>
                        <div>Role</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {loading ? (
                        <div className="px-5 py-10 text-sm text-gray-500">Loading users...</div>
                    ) : tableError ? (
                        <div className="px-5 py-10 text-sm text-red-600">{tableError}</div>
                    ) : rows.length === 0 ? (
                        <div className="px-5 py-10 text-sm text-gray-500">No users found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {rows.map((user) => {
                                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";

                                return (
                                    <div key={user.id} className="grid grid-cols-[2fr_3fr_1.2fr_2fr_0.8fr] items-center px-5 py-3 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <p className="truncate text-lg font-semibold text-gray-800">{fullName}</p>
                                            <p className="text-xs text-gray-500">ID: #{user.id}</p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-lg text-gray-800">{user.email}</p>
                                            <p className="text-xs text-gray-500">@{user.username || usernameFromEmail(user.email).replace("@", "")}</p>
                                            <p className="text-xs text-gray-500">Employee: {user.employeeRecord || fullName}</p>
                                        </div>

                                        <div>
                                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                <span className="text-base leading-none">•</span>
                                                {user.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {(user.roles || []).map((role) => (
                                                <span key={`${user.id}-${role.id}`} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                    {role.name}
                                                </span>
                                            ))}
                                            {(user.roles || []).length === 0 && (
                                                <span className="text-xs text-gray-400">No roles</span>
                                            )}
                                        </div>

                                        <div className="relative text-right">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="group relative rounded-md p-1.5 text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Pencil size={14} />
                                                    <span className="pointer-events-none absolute -top-7 right-0 rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        Edit
                                                    </span>
                                                </button>
                                               
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(user)}
                                                    className="group relative rounded-md p-1.5 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                    <span className="pointer-events-none absolute -top-7 right-0 rounded bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        Delete
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AddRole
                openModal={openModal}
                setOpenModal={setOpenModal}
                roles={roles}
                employeeOptions={employeeOptions}
                editingUser={editingUser}
                onSubmit={handleSubmitUser}
                saving={saving}
                error={formError}
            />

            {deleteTarget && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete this user account?
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserRole;
