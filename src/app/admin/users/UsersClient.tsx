"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  User,
  X,
  Loader2,
  CheckCircle,
  History,
} from "lucide-react";

interface SerializedUser {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  role: string;
  phoneNumber: string;
  nationality: string;
  centerId: string;
  competitionCenterId: string;
  centerName: string;
  competitionCenterName: string;
  createdAt: string;
}

interface Center {
  id: string;
  name: string;
  city: string;
}

interface Log {
  id: string;
  userNickname: string;
  fromCenterName: string;
  toCenterName: string;
  changedBy: string;
  createdAt: string;
}

interface Props {
  currentUserRole: string;
  currentUserId: string;
  initialUsers: SerializedUser[];
  centers: Center[];
  logs: Log[];
  serverQuery: string;
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors";

export default function UsersClient({
  currentUserRole,
  currentUserId,
  initialUsers,
  centers,
  logs,
  serverQuery,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"players" | "managers" | "logs">("players");
  const [search, setSearch] = useState(serverQuery);

  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const [addManagerOpen, setAddManagerOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);

  const [newManager, setNewManager] = useState({
    email: "",
    fullName: "",
    nickname: "",
    phoneNumber: "",
    password: "",
    centerId: "",
  });

  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    nickname: "",
    phoneNumber: "",
    centerId: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredUsers = initialUsers.filter((user) => {
    const isPlayerRole = user.role === "USER";
    const tabMatch = activeTab === "players" ? isPlayerRole : !isPlayerRole;

    if (!tabMatch) return false;

    const term = search.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(term) ||
      user.nickname.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.centerName.toLowerCase().includes(term) ||
      user.competitionCenterName.toLowerCase().includes(term)
    );
  });

  async function handleAddManager(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newManager),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create manager account.");
      }

      setSuccess("Manager account created successfully.");
      setAddManagerOpen(false);
      setNewManager({ email: "", fullName: "", nickname: "", phoneNumber: "", password: "", centerId: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedUser.role === "USER") {
        if (editForm.centerId !== selectedUser.competitionCenterId) {
          const centerRes = await fetch(`/api/admin/users/${selectedUser.id}/center`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ centerId: editForm.centerId }),
          });
          const centerData = await centerRes.json();
          if (!centerRes.ok) throw new Error(centerData.error ?? "Failed to update competition center.");
        }
      } else {
        const patchRes = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: editForm.fullName,
            nickname: editForm.nickname,
            phoneNumber: editForm.phoneNumber,
            centerId: editForm.centerId,
          }),
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) throw new Error(patchData.error ?? "Failed to update manager.");

        if (editForm.role !== selectedUser.role) {
          const roleRes = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: editForm.role }),
          });
          const roleData = await roleRes.json();
          if (!roleRes.ok) throw new Error(roleData.error ?? "Failed to update role.");
        }
      }

      setSuccess("Account updated successfully.");
      setEditUserOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    if (!confirm(`Delete ${selectedUser.fullName}? This cannot be undone.`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user.");

      setSuccess("Account deleted.");
      setEditUserOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(user: SerializedUser) {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      nickname: user.nickname,
      phoneNumber: user.phoneNumber,
      centerId: user.role === "USER" ? user.competitionCenterId : user.centerId,
      role: user.role,
    });
    setError(null);
    setSuccess(null);
    setEditUserOpen(true);
  }

  const roleBadge = (role: string) => {
    if (role === "SUPER_ADMIN" || role === "ADMIN")
      return "bg-purple-50 text-purple-700 border border-purple-200";
    if (role === "CENTER_ADMIN") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-gray-100 text-gray-600 border border-gray-200";
  };

  const roleLabel = (role: string) => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return "Owner";
    if (role === "CENTER_ADMIN") return "Manager";
    return "Player";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Managers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOwner
              ? "Manage manager accounts, audit center changes, and view player directory."
              : "View players registered under your center."}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => { setError(null); setSuccess(null); setAddManagerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Manager
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-px">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("players")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "players"
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Players ({initialUsers.filter((u) => u.role === "USER").length})
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab("managers")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "managers"
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Managers ({initialUsers.filter((u) => u.role !== "USER").length})
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "logs"
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Audit Log ({logs.length})
              </button>
            </>
          )}
        </div>

        {activeTab !== "logs" && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search… (Enter to search all)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = search.trim();
                  router.push(q ? `?q=${encodeURIComponent(q)}` : "?");
                }
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 text-green-700 text-sm rounded-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "logs" ? (
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Center Change Audit Log</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">No center change logs recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Player</th>
                    <th className="px-6 py-3">Change</th>
                    <th className="px-6 py-3">Authorized by</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{log.userNickname}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span>{log.fromCenterName.replace("GARRINCHA ", "")}</span>
                        <span className="mx-2 text-green-600">→</span>
                        <span>{log.toCenterName.replace("GARRINCHA ", "")}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-mono">{log.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No matching accounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Center</th>
                    <th className="px-6 py-3">Competition Center</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3 text-center">Role</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          @{user.nickname} · {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.centerName.replace("GARRINCHA ", "")}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === "USER" ? (
                          <span className="text-green-700 font-semibold text-sm">
                            {user.competitionCenterName.replace("GARRINCHA ", "")}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        <div>{user.phoneNumber || "—"}</div>
                        <div className="text-gray-400 mt-0.5 uppercase">{user.nationality || "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-sm ${roleBadge(user.role)}`}>
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(isOwner || (currentUserRole === "CENTER_ADMIN" && user.role === "USER")) && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Manager modal */}
      {addManagerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
          <div className="bg-white border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAddManagerOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Create Manager Account</h2>
            </div>

            <form onSubmit={handleAddManager} className="space-y-4">
              {[
                { label: "Full name", key: "fullName", type: "text", placeholder: "e.g. John Doe" },
                { label: "Nickname", key: "nickname", type: "text", placeholder: "e.g. jdoe" },
                { label: "Email", key: "email", type: "email", placeholder: "jdoe@garrincha.be" },
                { label: "Phone number", key: "phoneNumber", type: "text", placeholder: "+32…" },
                { label: "Temporary password", key: "password", type: "password", placeholder: "Min. 8 characters" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    required
                    placeholder={placeholder}
                    value={newManager[key as keyof typeof newManager]}
                    onChange={(e) => setNewManager({ ...newManager, [key]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned center</label>
                <select
                  required
                  value={newManager.centerId}
                  onChange={(e) => setNewManager({ ...newManager, centerId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Choose a center…</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User modal */}
      {editUserOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
          <div className="bg-white border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditUserOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Edit — {selectedUser.fullName}</h2>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              {selectedUser.role === "USER" ? (
                <>
                  <div className="p-4 border border-gray-100 bg-gray-50 text-sm text-gray-600 space-y-1">
                    <p>Player: <strong className="text-gray-900">{selectedUser.fullName}</strong></p>
                    <p>Nickname: <strong className="text-gray-900">@{selectedUser.nickname}</strong></p>
                    <p>Registered center: {selectedUser.centerName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Competition center
                    </label>
                    {isOwner ? (
                      <select
                        required
                        value={editForm.centerId}
                        onChange={(e) => setEditForm({ ...editForm, centerId: e.target.value })}
                        className={inputCls}
                      >
                        {centers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={selectedUser.competitionCenterName}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 text-sm"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1.5">
                      Center changes are logged in the audit table.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {[
                    { label: "Full name", key: "fullName" },
                    { label: "Nickname", key: "nickname" },
                    { label: "Phone number", key: "phoneNumber" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                      <input
                        type="text"
                        required
                        value={editForm[key as keyof typeof editForm]}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned center</label>
                    <select
                      required
                      value={editForm.centerId}
                      onChange={(e) => setEditForm({ ...editForm, centerId: e.target.value })}
                      className={inputCls}
                    >
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select
                      required
                      value={editForm.role}
                      disabled={selectedUser.id === currentUserId}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                      <option value="USER">Player</option>
                      <option value="CENTER_ADMIN">Manager</option>
                      <option value="ADMIN">Owner</option>
                    </select>
                    {selectedUser.id === currentUserId && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        You cannot change your own role.
                      </p>
                    )}
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                {isOwner && selectedUser.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
