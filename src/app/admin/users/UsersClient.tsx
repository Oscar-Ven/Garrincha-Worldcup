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
}

export default function UsersClient({
  currentUserRole,
  currentUserId,
  initialUsers,
  centers,
  logs,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"players" | "managers" | "logs">("players");
  const [search, setSearch] = useState("");

  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  // Modal visibility state
  const [addManagerOpen, setAddManagerOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);

  // Form states
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

  // Filters
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

  // Handle Add Manager Submit
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
      // Reset form
      setNewManager({
        email: "",
        fullName: "",
        nickname: "",
        phoneNumber: "",
        password: "",
        centerId: "",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Edit User Submit
  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Correct Player Competition center if player Center modified (Owner only)
      if (selectedUser.role === "USER") {
        if (editForm.centerId !== selectedUser.competitionCenterId) {
          const centerRes = await fetch(`/api/admin/users/${selectedUser.id}/center`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ centerId: editForm.centerId }),
          });
          const centerData = await centerRes.json();
          if (!centerRes.ok) {
            throw new Error(centerData.error ?? "Failed to update competition center.");
          }
        }
      } else {
        // 2. Edit Manager Details
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
        if (!patchRes.ok) {
          throw new Error(patchData.error ?? "Failed to update manager metadata.");
        }

        // 3. Edit Manager Role if altered
        if (editForm.role !== selectedUser.role) {
          const roleRes = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: editForm.role }),
          });
          const roleData = await roleRes.json();
          if (!roleRes.ok) {
            throw new Error(roleData.error ?? "Failed to update user role.");
          }
        }
      }

      setSuccess("Account information updated successfully.");
      setEditUserOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Delete User Account
  async function handleDeleteUser() {
    if (!selectedUser) return;
    if (!confirm(`Are you absolutely sure you want to delete ${selectedUser.fullName}? This cannot be undone.`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete user.");
      }

      setSuccess("Account deleted successfully.");
      setEditUserOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Trigger Edit Form
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Users & Managers Directory
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isOwner
              ? "Promote manager nodes, audit location changes, and manage standard lists."
              : "Verify local player accounts registered under your assigned center."}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              setError(null);
              setSuccess(null);
              setAddManagerOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black uppercase tracking-wider text-xs transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manager Account</span>
          </button>
        )}
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("players")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "players"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Players ({initialUsers.filter((u) => u.role === "USER").length})
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab("managers")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === "managers"
                    ? "border-lime-400 text-lime-400"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Managers & Admins ({initialUsers.filter((u) => u.role !== "USER").length})
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === "logs"
                    ? "border-lime-400 text-lime-400"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Corrections Audit Log ({logs.length})
              </button>
            </>
          )}
        </div>

        {activeTab !== "logs" && (
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Success Banner */}
      {success && (
        <div className="flex items-center gap-3 p-4 border border-lime-400/30 bg-lime-400/10 text-lime-400 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Tabs Content ── */}
      {activeTab === "logs" ? (
        /* AUDIT LOG TABLE */
        <div className="border border-zinc-800 bg-zinc-900/10">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-400">
            <History className="w-4 h-4 text-lime-400" />
            <span>Audit History Log</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-xs">No logged center change corrections.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/25">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Player Account</th>
                    <th className="px-6 py-3">Transition</th>
                    <th className="px-6 py-3">Operational Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 font-mono text-[10px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-white uppercase">{log.userNickname}</td>
                      <td className="px-6 py-4 text-zinc-400">
                        <span>{log.fromCenterName.replace("GARRINCHA ", "")}</span>
                        <span className="mx-2 text-lime-400">→</span>
                        <span>{log.toCenterName.replace("GARRINCHA ", "")}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400 text-[11px]">{log.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* USERS LIST TABLE */
        <div className="border border-zinc-800 bg-zinc-900/10">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <User className="w-10 h-10 mx-auto mb-3 opacity-30 text-lime-400" />
              <p className="text-xs uppercase font-bold">No matching directory accounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/20">
                    <th className="px-6 py-3">Identity details</th>
                    <th className="px-6 py-3">Direct Center</th>
                    <th className="px-6 py-3">Competition Center</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3 text-center">Security Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30 transition-colors">
                      {/* Identity detail */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white uppercase text-sm leading-tight">{user.fullName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-1.5 select-all">
                          <span>{user.nickname}</span>
                          <span className="text-zinc-700 font-sans">|</span>
                          <span className="text-zinc-400">{user.email}</span>
                        </div>
                      </td>

                      {/* Activation site */}
                      <td className="px-6 py-4 text-zinc-400 uppercase font-medium">
                        {user.centerName.replace("GARRINCHA ", "")}
                      </td>

                      {/* Competition site */}
                      <td className="px-6 py-4">
                        {user.role === "USER" ? (
                          <span className="text-lime-400 uppercase font-black">
                            {user.competitionCenterName.replace("GARRINCHA ", "")}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* PhoneNumber / Nationality */}
                      <td className="px-6 py-4 text-zinc-400 leading-tight">
                        <div className="text-[11px]">{user.phoneNumber || "No Phone"}</div>
                        <div className="text-[9px] text-zinc-500 uppercase font-extrabold mt-1">{user.nationality || "—"}</div>
                      </td>

                      {/* Security details */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] ${
                            user.role === "SUPER_ADMIN" || user.role === "ADMIN"
                              ? "bg-red-400/10 border border-red-400/20 text-red-400"
                              : user.role === "CENTER_ADMIN"
                                ? "bg-blue-400/10 border border-blue-400/20 text-blue-400"
                                : "bg-zinc-400/10 border border-zinc-500 text-zinc-400"
                          }`}
                        >
                          {user.role === "SUPER_ADMIN" || user.role === "ADMIN"
                            ? "OWNER"
                            : user.role === "CENTER_ADMIN"
                              ? "MANAGER"
                              : "PLAYER"}
                        </span>
                      </td>

                      {/* User manual correction trigger */}
                      <td className="px-6 py-4 text-right">
                        {(isOwner || (currentUserRole === "CENTER_ADMIN" && user.role === "USER")) && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 px-2.5 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Correct</span>
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

      {/* ── ADD MANAGER MODAL DIALOG ── */}
      {addManagerOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in select-none">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAddManagerOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-sm border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-lime-400" />
              Create Manager Node
            </h2>

            <form onSubmit={handleAddManager} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newManager.fullName}
                  onChange={(e) => setNewManager({ ...newManager, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Unique Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jdoe"
                  value={newManager.nickname}
                  onChange={(e) => setNewManager({ ...newManager, nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Email URL
                </label>
                <input
                  type="email"
                  required
                  placeholder="jdoe@garrincha.be"
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="+32..."
                  value={newManager.phoneNumber}
                  onChange={(e) => setNewManager({ ...newManager, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={newManager.password}
                  onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Assigned location
                </label>
                <select
                  required
                  value={newManager.centerId}
                  onChange={(e) => setNewManager({ ...newManager, centerId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                >
                  <option value="">Choose a sports center...</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="p-2 border border-red-900/50 bg-red-900/10 text-red-400 text-[11px] leading-relaxed">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black uppercase tracking-wider text-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Commit Creations</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL DIALOG ── */}
      {editUserOpen && selectedUser && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in select-none">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditUserOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-sm border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-lime-400" />
              Correct Directory Entry // {selectedUser.fullName}
            </h2>

            <form onSubmit={handleEditUser} className="space-y-4">
              {selectedUser.role === "USER" ? (
                /* Edit Player (Owner Only correction of competition center) */
                <>
                  <div className="p-4 border border-zinc-800 bg-zinc-950/30 text-xs text-zinc-400 space-y-1">
                    <p>
                      Player Name: <strong className="text-white">{selectedUser.fullName}</strong>
                    </p>
                    <p>
                      Nick: <strong className="text-white">@{selectedUser.nickname}</strong>
                    </p>
                    <p>
                      Primary: <span className="uppercase text-zinc-400">{selectedUser.centerName}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">
                      Correct Competition Sports Center
                    </label>
                    {isOwner ? (
                      <select
                        required
                        value={editForm.centerId}
                        onChange={(e) => setEditForm({ ...editForm, centerId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                      >
                        {centers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={selectedUser.competitionCenterName}
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs uppercase"
                      />
                    )}
                    <span className="text-[10px] text-zinc-500 leading-snug mt-1.5 block">
                      Admin center corrections are safely indexed in the internal Change Logs database table.
                    </span>
                  </div>
                </>
              ) : (
                /* Edit Manager (Owner only) */
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                      Full Client Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                      Nickname (Uniqueness strictly required)
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                      Assigned Location Base
                    </label>
                    <select
                      required
                      value={editForm.centerId}
                      onChange={(e) => setEditForm({ ...editForm, centerId: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors"
                    >
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                      Technical Security Role (Internal Mapping)
                    </label>
                    <select
                      required
                      value={editForm.role}
                      disabled={selectedUser.id === currentUserId}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors disabled:opacity-50"
                    >
                      <option value="USER">PLAYER</option>
                      <option value="CENTER_ADMIN">MANAGER</option>
                      <option value="ADMIN">OWNER</option>
                    </select>
                    {selectedUser.id === currentUserId && (
                      <em className="text-[10px] text-zinc-500 mt-1 block">
                        Server-side safety blocks downgrading/editing of your own logged role account.
                      </em>
                    )}
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="p-2 border border-red-900/50 bg-red-900/10 text-red-400 text-[11px] leading-relaxed">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                {isOwner && selectedUser.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-950 text-red-400 hover:text-red-300 border border-red-900/40 uppercase text-[10px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Node</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black uppercase tracking-wider text-[10px]"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Commit Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
