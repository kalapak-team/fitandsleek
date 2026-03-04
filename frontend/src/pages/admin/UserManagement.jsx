import React, { useState, useEffect } from "react";
import apiClient from "../../lib/api";
import { errorAlert, toastSuccess, warningConfirm } from "../../lib/swal";
import { AdminSectionLoader } from "@/components/admin/AdminLoading";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    role: "customer",
    status: "active",
  });
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSessions, setUserSessions] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await apiClient.get(
        `/admin/superadmin/users?${params.toString()}`
      );
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = async (userId) => {
    const userToEdit = users.find((u) => u.id === userId);
    setEditingUser(userToEdit);
    setFormData({
      role: userToEdit.role,
      status: userToEdit.status,
    });
    setShowModal(true);
  };

  const handleSaveRole = async () => {
    try {
      if (editingUser.role === "superadmin") {
        await errorAlert({
          khTitle: "មិនអនុញ្ញាត",
          enTitle: "Not allowed",
          khText: "មិនអាចកែតួនាទី Superadmin បានទេ",
          enText: "Cannot modify superadmin role",
        });
        return;
      }

      await apiClient.patch(`/admin/superadmin/users/${editingUser.id}/role`, {
        role: formData.role,
      });

      await toastSuccess({
        khText: "បានកែប្រែតួនាទីអ្នកប្រើប្រាស់ដោយជោគជ័យ",
        enText: "User role updated successfully",
      });
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      await errorAlert({
        khTitle: "កែតួនាទីបរាជ័យ",
        enTitle: "Role update failed",
        detail: "Failed to update user role: " + error.message,
      });
    }
  };

  const handleSaveStatus = async (userId) => {
    try {
      const userToUpdate = users.find((u) => u.id === userId);
      if (userToUpdate.role === "superadmin") {
        await errorAlert({
          khTitle: "មិនអនុញ្ញាត",
          enTitle: "Not allowed",
          khText: "មិនអាចកែស្ថានភាព Superadmin បានទេ",
          enText: "Cannot modify superadmin status",
        });
        return;
      }

      const confirmRes = await warningConfirm({
        khTitle: "បញ្ជាក់ការកែស្ថានភាព",
        enTitle: "Confirm status change",
        khText: "តើអ្នកចង់ប្ដូរស្ថានភាពអ្នកប្រើនេះមែនទេ?",
        enText: "Do you want to change this user's status?",
      });
      if (!confirmRes.isConfirmed) return;

      const newStatus =
        userToUpdate.status === "active" ? "inactive" : "active";
      await apiClient.patch(
        `/admin/superadmin/users/${userId}/status`,
        {
          status: newStatus,
        }
      );

      await toastSuccess({
        khText: "បានកែស្ថានភាពអ្នកប្រើប្រាស់ដោយជោគជ័យ",
        enText: "User status updated successfully",
      });
      fetchUsers();
    } catch (error) {
      await errorAlert({
        khTitle: "កែស្ថានភាពបរាជ័យ",
        enTitle: "Status update failed",
        detail: "Failed to update user status: " + error.message,
      });
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      driver: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      customer: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[role] || colors.customer;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      inactive:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      suspended:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status] || colors.active;
  };

  const openSessionsModal = async (user) => {
    setSelectedUser(user);
    setShowSessionsModal(true);
    setSessionsLoading(true);
    try {
      const { data } = await apiClient.get(`/admin/superadmin/users/${user.id}/sessions`);
      setUserSessions(data?.data || []);
    } catch (error) {
      await errorAlert({
        khTitle: "ផ្ទុកសម័យបរាជ័យ",
        enTitle: "Failed to load sessions",
        detail: error?.response?.data?.message || "Failed to load user sessions",
      });
      setUserSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const revokeUserSession = async (sessionId) => {
    if (!selectedUser) return;
    const confirmRes = await warningConfirm({
      khTitle: "បញ្ជាក់ចេញពីសម័យ",
      enTitle: "Confirm revoke session",
      khText: "តើអ្នកចង់បញ្ចប់សម័យនេះមែនទេ?",
      enText: "Are you sure you want to revoke this session?",
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await apiClient.delete(`/admin/superadmin/users/${selectedUser.id}/sessions/${sessionId}`);
      setUserSessions((prev) => prev.filter((s) => s.id !== sessionId));
      await toastSuccess({
        khText: "បានបញ្ចប់សម័យដោយជោគជ័យ",
        enText: "Session revoked successfully",
      });
    } catch (error) {
      await errorAlert({
        khTitle: "បញ្ចប់សម័យបរាជ័យ",
        enTitle: "Failed to revoke session",
        detail: error?.response?.data?.message || "Failed to revoke session",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4">
          User Management
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          View, manage, and update user roles and status.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <AdminSectionLoader rows={5} />
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 dark:text-white">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 dark:text-white">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "superadmin" ? (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Protected
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditRole(user.id)}
                            className="px-3 py-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleSaveStatus(user.id)}
                            className="px-3 py-1 text-sm bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg transition-colors"
                          >
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => openSessionsModal(user)}
                            className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                          >
                            Sessions
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Edit User Role
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              User: <strong>{editingUser.name}</strong>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="driver">Driver</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Sessions: {selectedUser.name}</h3>
              <button onClick={() => setShowSessionsModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>

            {sessionsLoading ? (
              <AdminSectionLoader rows={3} className="p-0" />
            ) : userSessions.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No sessions found.</p>
            ) : (
              <div className="space-y-3">
                {userSessions.map((session) => (
                  <div key={session.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{session.device_name || "Unknown device"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{session.browser || "Unknown browser"} • {session.os || "Unknown OS"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">IP: {session.ip_address || "-"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Last used: {session.last_used_at || "-"}</p>
                      </div>
                      <button
                        onClick={() => revokeUserSession(session.id)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
