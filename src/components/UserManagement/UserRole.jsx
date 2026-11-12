import React, { useEffect, useMemo, useState } from "react";
import AddRole from "./AddRole";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import userManagementService from "../../services/userManagement.service";
import employeeService from "../../services/employee.service";
import { toast } from "react-toastify";
import { getCurrentUser, isSuperAdmin, canDeleteRecords } from "../../utils/auth";
import { getSession, setSession } from "../../utils/session";
import SortableHeader from "../common/SortableHeader";
import { sortRows } from "../../utils/tableSorting";

function usernameFromEmail(email = "") {
    const local = String(email).split("@")[0] || "user";
    return `@${local}`;
}

function normalizeEmployeeCode(value) {
    return String(value || "").trim().replace(/-/g, "").toLowerCase();
}

function UserRole() {
    const [openModal, setOpenModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [userAccountsAvailable, setUserAccountsAvailable] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [tableError, setTableError] = useState("");
    const [employeeError, setEmployeeError] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const [canDelete, setCanDelete] = useState(() => canDeleteRecords());
    const isAdmin = isSuperAdmin();
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    const loadData = async () => {
        setLoading(true);
        setTableError("");
        setEmployeeError("");
        const [usersResult, rolesResult, employeesResult] = await Promise.allSettled([
            userManagementService.getUsers(),
            userManagementService.getRoles(),
            employeeService.list()
        ]);

        if (usersResult.status === "fulfilled") {
            setUserAccountsAvailable(true);
            setUsers(Array.isArray(usersResult.value?.data) ? usersResult.value.data : []);
        } else {
            setUserAccountsAvailable(false);
            setUsers([]);
            setTableError(usersResult.reason?.message || "Failed to load user accounts.");
        }

        if (rolesResult.status === "fulfilled") {
            setRoles(Array.isArray(rolesResult.value?.data) ? rolesResult.value.data : []);
        } else {
            setRoles([]);
            setTableError((current) => [
                current,
                rolesResult.reason?.message || "Failed to load roles."
            ].filter(Boolean).join(" "));
        }

        if (employeesResult.status === "fulfilled") {
            setEmployees(Array.isArray(employeesResult.value?.data) ? employeesResult.value.data : []);
        } else {
            setEmployees([]);
            setEmployeeError(employeesResult.reason?.message || "Failed to load employee records.");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const employeeOptions = useMemo(() => {
        return employees
            .filter((employee) => employee.employeeCode)
            .map((employee) => ({
                value: employee.employeeCode,
                label: `${employee.fullName || "Employee"} (${employee.email || employee.employeeCode})`
            }));
    }, [employees]);

    const handleOpenCreate = () => {
        if (!isAdmin) return;
        setFormError("");
        setEditingUser(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (user) => {
        if (!isAdmin) return;
        setFormError("");
        setEditingUser(user);
        setOpenModal(true);
    };

    const handleSubmitUser = async (form, userToEdit = null) => {
        if (!isAdmin) return;
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
                canDelete: form.canDelete !== false,
                ...(form.password?.trim() ? { password: form.password.trim() } : {})
            };

            const targetId = userToEdit?.id || userToEdit?._id;

            if (targetId) {
                const updated = await userManagementService.updateUser(targetId, payload);
                if (targetId === currentUserId) {
                    const session = getSession();
                    if (session?.user) {
                        setSession({ ...session, user: { ...session.user, ...(updated?.data || {}), canDelete: payload.canDelete } });
                        setCanDelete(canDeleteRecords());
                    }
                }
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
            await loadData();
        } catch (err) {
            setFormError(err.message || "Failed to save user.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!isAdmin) return;
        const targetId = String(user?.id || user?._id || "");
    if (!canDelete || deletingId || !targetId) return;

    try {
        setDeletingId(targetId);
        await userManagementService.deleteUser(targetId);

        toast.dismiss();
        toast.success("User deleted successfully!");
        setUserToDelete(null);
        setUsers((prevUsers) =>
            prevUsers.filter((u) => String(u.id || u._id) !== targetId)
        );
    } catch (err) {
        console.error("Delete Error:", err);
        toast.error(err.message || "Failed to delete user.");
    } finally {
        setDeletingId(null);
    }
    };

    const searchTerm = search.trim().toLowerCase();
    const rows = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter((user) => [
            user.firstName,
            user.lastName,
            user.email,
            user.username,
            user.employeeRecord
        ].some((value) => String(value || "").toLowerCase().includes(searchTerm)));
    }, [searchTerm, users]);
    const employeeRows = useMemo(() => employees
        .filter((employee) => {
            if (!searchTerm) return true;
            return [
                employee.fullName,
                employee.employeeCode,
                employee.email,
                employee.phone,
                employee.jobPosition,
                employee.status
            ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
        })
        .map((employee) => {
            const employeeCode = normalizeEmployeeCode(employee.employeeCode);
            const email = String(employee.email || "").trim().toLowerCase();
            const linkedUser = users.find((user) => (
                (employeeCode && normalizeEmployeeCode(user.employeeRecord) === employeeCode)
                || (email && String(user.email || "").trim().toLowerCase() === email)
            ));

            return { employee, linkedUser };
        }), [employees, searchTerm, users]);
    const sortedEmployeeRows = useMemo(() => sortRows(
        employeeRows,
        sortConfig.key,
        sortConfig.direction,
        ({ employee, linkedUser }) => {
            if (sortConfig.key === "employee") return employee.fullName;
            if (sortConfig.key === "employeeCode") return employee.employeeCode;
            if (sortConfig.key === "email") return employee.email;
            if (sortConfig.key === "position") return employee.jobPosition;
            if (sortConfig.key === "status") return employee.status;
            if (sortConfig.key === "userAccount") return linkedUser ? "Account created" : "No account";
            return "";
        }
    ), [employeeRows, sortConfig]);
    const toggleSort = (key) => setSortConfig((current) => ({
        key,
        direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));

    return (
        <div className="p-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Directory</h1>
                        <p className="text-xs text-gray-500">Manage user accounts and view all employees</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search employees and users..."
                            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                        {isAdmin && (
                            <button
                                onClick={handleOpenCreate}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <UserPlus size={16} />
                                Add New User
                            </button>
                        )}
                    </div>
                </div>

                <section className="mb-6 overflow-hidden rounded-2xl border border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-5 py-3">
                        <h2 className="text-sm font-semibold text-gray-700">Employee Directory</h2>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Total Employees: {employeeError ? "Unavailable" : loading ? "Loading..." : employees.length}
                        </span>
                    </div>
                    {employeeError ? (
                        <div className="px-5 py-6 text-sm text-red-600">
                            Unable to load employees: {employeeError}
                        </div>
                    ) : loading ? (
                        <div className="px-5 py-6 text-sm text-gray-500">Loading employees...</div>
                    ) : employeeRows.length === 0 ? (
                        <div className="px-5 py-6 text-sm text-gray-500">No employees found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="erp-list-table min-w-full text-left text-sm">
                                <thead className="text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold"><SortableHeader label="Employee" sortKey="employee" sortConfig={sortConfig} onSort={toggleSort} /></th>
                                        <th className="px-5 py-3 font-semibold"><SortableHeader label="Employee Code" sortKey="employeeCode" sortConfig={sortConfig} onSort={toggleSort} /></th>
                                        <th className="px-5 py-3 font-semibold"><SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={toggleSort} /></th>
                                        <th className="px-5 py-3 font-semibold"><SortableHeader label="Position" sortKey="position" sortConfig={sortConfig} onSort={toggleSort} /></th>
                                        <th className="px-5 py-3 font-semibold"><SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={toggleSort} /></th>
                                        <th className="px-5 py-3 font-semibold"><SortableHeader label="User Account" sortKey="userAccount" sortConfig={sortConfig} onSort={toggleSort} /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedEmployeeRows.map(({ employee, linkedUser }) => (
                                        <tr key={employee.id || employee.employeeCode} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 font-medium text-gray-800">{employee.fullName || "—"}</td>
                                            <td className="px-5 py-3 text-gray-600">{employee.employeeCode || "—"}</td>
                                            <td className="px-5 py-3 text-gray-600">{employee.email || "—"}</td>
                                            <td className="px-5 py-3 text-gray-600">{employee.jobPosition || "—"}</td>
                                            <td className="px-5 py-3 text-gray-600">{employee.status || "—"}</td>
                                            <td className="px-5 py-3">
                                                <span className={!userAccountsAvailable
                                                    ? "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                                                    : linkedUser
                                                        ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                        : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                                }>
                                                    {!userAccountsAvailable ? "Unavailable" : linkedUser ? "Account created" : "No account"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <h2 className="mb-3 text-sm font-semibold text-gray-700">User Accounts</h2>
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
                                const userId = user.id || user._id;
                                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";

                                return (
                                    <div key={userId} className="grid grid-cols-[2fr_3fr_1.2fr_2fr_0.8fr] items-center px-5 py-3 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <p className="truncate text-lg font-semibold text-gray-800">{fullName}</p>
                                            <p className="text-xs text-gray-500">ID: #{userId}</p>
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
                                                <span key={`${userId}-${role.id || role._id}`} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                    {role.name}
                                                </span>
                                            ))}
                                            {(user.roles || []).length === 0 && (
                                                <span className="text-xs text-gray-400">No roles</span>
                                            )}
                                        </div>

                                        <div className="relative text-right">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                {isAdmin && (
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
                                                )}
                                                {isAdmin && canDelete && userId !== currentUserId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setUserToDelete(user)}
                                                        disabled={deletingId === userId}
                                                        className="group relative rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                        <span className="pointer-events-none absolute -top-7 right-0 rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                            Delete
                                                        </span>
                                                    </button>
                                                )}
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

            {userToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">Delete user?</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-gray-900">
                                {`${userToDelete.firstName || ""} ${userToDelete.lastName || ""}`.trim() || userToDelete.email}
                            </span>
                            ?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                disabled={Boolean(deletingId)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteUser(userToDelete)}
                                disabled={Boolean(deletingId)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deletingId ? "Deleting..." : "OK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserRole;