'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
  Button,
  Badge,
  Input,
  Select,
  EmptyState,
  ConfirmDialog,
  Drawer,
  PageHeader,
  Tabs,
} from "../../components/ui";
import {
  Search,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Store,
  Trash2,
  Edit2,
  Mail,
  Phone,
  User,
  RefreshCw,
} from "lucide-react";

export default function UsersManagement() {
  const { token, backendUrl, adminUser } = useAdminAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create User Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newStoreName, setNewStoreName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit User Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("user");
  const [editName, setEditName] = useState("");
  const [editStoreName, setEditStoreName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Users from Backend
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const res = await axios.get(`${backendUrl}/api/v1/user/all?${params.toString()}`, {
        headers: { token }
      });

      if (res.data?.success) {
        setUsers(res.data.data?.users || []);
      } else {
        toast.error(res.data?.message || "Failed to fetch users");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token, roleFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Edit Drawer
  const openEditDrawer = (user) => {
    setEditingUser(user);
    setEditRole(user.role || "user");
    setEditName(user.name || "");
    setEditStoreName(user.storeName || "");
    setEditPhone(user.phone || "");
    setEditDrawerOpen(true);
  };

  // Submit User Role Elevation / Profile Modification
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdating(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/update-user`,
        {
          userId: editingUser._id,
          role: editRole,
          name: editName,
          storeName: editStoreName,
          phone: editPhone
        },
        { headers: { token } }
      );

      if (res.data?.success) {
        toast.success(`User updated. Role set to '${editRole}' successfully.`);
        setEditDrawerOpen(false);
        setEditingUser(null);
        await fetchUsers();
      } else {
        toast.error(res.data?.message || "Update failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to update user"
      );
    } finally {
      setUpdating(false);
    }
  };

  // Submit User Creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/create`,
        {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          storeName: newStoreName,
          phone: newPhone
        },
        { headers: { token } }
      );

      if (res.data?.success) {
        toast.success(`User ${newName} created successfully as ${newRole}.`);
        setCreateModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("user");
        setNewStoreName("");
        setNewPhone("");
        await fetchUsers();
      } else {
        toast.error(res.data?.message || "Creation failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to create account"
      );
    } finally {
      setCreating(false);
    }
  };

  // Delete User Confirmation
  const requestDeleteUser = (user) => {
    if (user.role === "admin" && adminUser?.id === user._id) {
      toast.warning("You cannot delete your own active administrator account.");
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/delete`,
        { userId: userToDelete._id },
        { headers: { token } }
      );

      if (res.data?.success) {
        toast.success(`User '${userToDelete.name}' removed from platform.`);
        setUserToDelete(null);
        await fetchUsers();
      } else {
        toast.error(res.data?.message || "Deletion failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to delete user"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge variant="accent">Administrator</Badge>;
      case "seller":
        return <Badge variant="info">Merchant Seller</Badge>;
      case "user":
      default:
        return <Badge variant="neutral">Client Buyer</Badge>;
    }
  };

  const roleCounts = useMemo(() => {
    const counts = { all: users.length, user: 0, seller: 0, admin: 0 };
    users.forEach((u) => {
      const r = u.role || 'user';
      if (counts[r] !== undefined) counts[r]++;
    });
    return counts;
  }, [users]);

  const tabs = [
    { id: "all", label: "All accounts", count: roleCounts.all },
    { id: "user", label: "Buyers", count: roleCounts.user },
    { id: "seller", label: "Merchants", count: roleCounts.seller },
    { id: "admin", label: "Admins", count: roleCounts.admin },
  ];

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Client &amp; Merchant Access"
        subtitle="Centralized directory of client patrons, boutique merchant partners, and executive administrators."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users & Roles" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              icon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Provision Account
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar with Tabs */}
      <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Role Filter Tabs */}
          <Tabs
            tabs={tabs}
            activeTab={roleFilter}
            onChange={(tabId) => setRoleFilter(tabId)}
            variant="pill"
          />

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#1C1917] dark:text-[#FAF8F5] placeholder-[#A8A29E] focus:outline-none focus:border-[#B08D57]"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="w-full bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF8F5] dark:bg-[#161413] text-[#78716C] dark:text-[#A8A29E] font-medium border-b border-[#E7E3D9] dark:border-[#292524] text-xs">
              <tr>
                <th className="py-3 px-4">Name &amp; account ID</th>
                <th className="py-3 px-4">Email &amp; contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">2FA security</th>
                <th className="py-3 px-4">Store / affiliation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3D9]/60 dark:divide-[#292524]/60 bg-white dark:bg-[#1C1917] text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#78716C] dark:text-[#A8A29E]">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#B08D57] border-t-transparent rounded-full mb-2" />
                    <p>Loading accounts directory...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="No accounts found"
                      description="No user profiles match the selected role filter or search criteria."
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#252220] transition-colors"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-[#1C1917] dark:text-[#FAF8F5] text-xs sm:text-sm">
                          {user.name}
                        </p>
                        <p className="text-[11px] font-mono text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                          ID: #{user._id?.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-mono text-xs text-[#1C1917] dark:text-[#FAF8F5]">
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* 2FA Status */}
                    <td className="py-3.5 px-4">
                      {user.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF3EC] dark:bg-[#14532D] text-[#2E5A36] dark:text-[#4ADE80]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F5] dark:bg-[#252220] text-[#78716C] dark:text-[#A8A29E] border border-[#E7E3D9] dark:border-[#292524]">
                          <ShieldAlert className="w-3.5 h-3.5 text-[#A8A29E]" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>

                    {/* Store / Merchant */}
                    <td className="py-3.5 px-4">
                      {user.role === "seller" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#F7F3EB] dark:bg-[#2C2318] text-[#B08D57] border border-[#B08D57]/30">
                          <Store className="w-3 h-3" />
                          <span>{user.storeName || `${user.name}'s Boutique`}</span>
                        </span>
                      ) : user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] dark:bg-[#252220] text-[#1C1917] dark:text-[#FAF8F5] border border-[#E7E3D9] dark:border-[#292524]">
                          Vellora Head Office
                        </span>
                      ) : (
                        <span className="text-xs text-[#78716C] dark:text-[#A8A29E] italic">
                          Client Patron
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(user)}
                          className="p-1.5 rounded-md text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#FAF8F5] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] transition-colors cursor-pointer"
                          title="Edit role & permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => requestDeleteUser(user)}
                          className="p-1.5 rounded-md text-[#78716C] hover:text-[#8E2824] dark:text-[#A8A29E] dark:hover:text-[#FAECEB] hover:bg-[#FAECEB] dark:hover:bg-[#3D1A18] transition-colors cursor-pointer"
                          title="Delete account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT ROLE SLIDE-OUT DRAWER */}
      <Drawer
        isOpen={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingUser(null);
        }}
        title="Modify Account Role"
        subtitle={editingUser?.email || "Configure privileges"}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              variant="primary"
              size="sm"
              disabled={updating}
              loading={updating}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] space-y-2">
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5]">
              Assigned Authority Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-white dark:bg-[#1C1917] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none font-medium cursor-pointer"
            >
              <option value="user">Buyer (Client Patron)</option>
              <option value="seller">Seller (Merchant Vendor)</option>
              <option value="admin">Administrator (Superuser Access)</option>
            </select>
            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
              Granting &lsquo;admin&rsquo; gives platform-wide control over catalog, transactions, and store operations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-white dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+1 555-0199"
              className="w-full px-3.5 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-white dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
            />
          </div>

          {editRole === "seller" && (
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
                Storefront / Merchant Name
              </label>
              <input
                type="text"
                value={editStoreName}
                onChange={(e) => setEditStoreName(e.target.value)}
                placeholder="e.g. Atelier Milan Fine Goods"
                className="w-full px-3.5 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-white dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                required
              />
            </div>
          )}
        </form>
      </Drawer>

      {/* PROVISION USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1917] rounded-xl shadow-2xl max-w-md w-full p-6 border border-[#E7E3D9] dark:border-[#292524] space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-[#E7E3D9] dark:border-[#292524]">
              <div>
                <h3 className="text-base font-semibold text-[#1C1917] dark:text-[#FAF8F5] font-serif">
                  Provision Platform Account
                </h3>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                  Create credentialed user with defined role
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="eleanor@atelier.com"
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none cursor-pointer"
                >
                  <option value="user">Buyer (Client Customer)</option>
                  <option value="seller">Seller (Merchant Vendor)</option>
                  <option value="admin">Administrator (Superuser)</option>
                </select>
              </div>

              {newRole === "seller" && (
                <div>
                  <label className="block font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1">
                    Store / Boutique Name
                  </label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g. Vance Maison"
                    className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                    required
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#E7E3D9] dark:border-[#292524] flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={creating}
                  loading={creating}
                >
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        description={`Are you sure you want to permanently delete user '${userToDelete?.name}' (${userToDelete?.email})? All platform access and authentication sessions will be immediately revoked.`}
        confirmLabel="Delete Account"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
