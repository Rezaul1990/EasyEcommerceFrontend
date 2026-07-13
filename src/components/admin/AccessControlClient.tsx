"use client";

import { createRole, createUserInvite, getCurrentAdmin, getPermissionRegistry, getRoles, getUsers, resendUserInvite } from "@/services/apiClient";
import type { AdminUser, InviteResponse, Permission, Role } from "@/types/ecommerce";
import { Copy, Plus, RefreshCcw, ShieldCheck, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

function slugFromName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AccessControlClient() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRoleId, setUserRoleId] = useState("");
  const [invite, setInvite] = useState<InviteResponse | { inviteLink: string; expiresInDays: number } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      groups[permission.group] = groups[permission.group] || [];
      groups[permission.group].push(permission);
      return groups;
    }, {});
  }, [permissions]);
  const hasPermission = (permission: string) => Boolean(currentUser?.role?.slug === "owner" || currentUser?.role?.permissions.includes(permission));
  const canViewStaff = hasPermission("staff.view");
  const canCreateStaff = hasPermission("staff.create");
  const canCreateRoles = hasPermission("roles.create");

  useEffect(() => {
    let ignore = false;
    getCurrentAdmin()
      .then(async (user) => {
        const can = (permission: string) => Boolean(user.role?.slug === "owner" || user.role?.permissions.includes(permission));
        const [permissionData, roleData, userData] = await Promise.all([
          can("roles.view") ? getPermissionRegistry() : Promise.resolve([]),
          can("roles.view") || can("staff.create") ? getRoles() : Promise.resolve([]),
          can("staff.view") ? getUsers() : Promise.resolve([]),
        ]);
        return { user, permissionData, roleData, userData };
      })
      .then(({ user, permissionData, roleData, userData }) => {
        if (ignore) return;
        setCurrentUser(user);
        setPermissions(permissionData);
        setRoles(roleData);
        setUsers(userData);
        setUserRoleId(roleData.find((role) => role.slug !== "owner")?._id || roleData[0]?._id || "");
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Team and permission data could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  function togglePermission(permission: string) {
    setSelectedPermissions((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));
  }

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRole(true);
    setError("");
    setSuccess("");
    try {
      const role = await createRole({
        name: roleName,
        slug: slugFromName(roleName),
        description: roleDescription,
        permissions: selectedPermissions,
      });
      setRoles((current) => [...current, role].sort((a, b) => a.name.localeCompare(b.name)));
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissions([]);
      setSuccess("Role created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role could not be created");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingUser(true);
    setError("");
    setSuccess("");
    setInvite(null);
    try {
      const data = await createUserInvite({ name: userName, email: userEmail, roleId: userRoleId });
      setInvite(data);
      setUsers((current) => [data.user, ...current]);
      setUserName("");
      setUserEmail("");
      setSuccess("Invite link created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite could not be created");
    } finally {
      setSavingUser(false);
    }
  }

  async function handleResendInvite(userId: string) {
    setError("");
    setSuccess("");
    setInvite(null);
    try {
      const data = await resendUserInvite(userId);
      setInvite(data);
      setSuccess("Invite link refreshed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite could not be refreshed");
    }
  }

  async function copyInviteLink() {
    if (!invite?.inviteLink) return;
    await navigator.clipboard.writeText(invite.inviteLink);
    setSuccess("Invite link copied");
  }

  if (loading) {
    return <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading team and permissions...</section>;
  }

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
      {invite ? (
        <section className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-900">Invite link</p>
              <p className="mt-1 break-all text-sm text-teal-800">{invite.inviteLink}</p>
            </div>
            <button onClick={copyInviteLink} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white">
              <Copy size={16} />
              Copy
            </button>
          </div>
        </section>
      ) : null}
      {canCreateStaff || canCreateRoles ? (
        <div className={`grid gap-5 ${canCreateStaff && canCreateRoles ? "xl:grid-cols-[380px_1fr]" : ""}`}>
          {canCreateStaff ? <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <UserPlus size={19} />
            Staff invitation
          </h2>
          <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              <span>Name</span>
              <input value={userName} onChange={(event) => setUserName(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3" required />
            </label>
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input value={userEmail} onChange={(event) => setUserEmail(event.target.value)} type="email" className="h-10 w-full rounded-md border border-slate-300 px-3" required />
            </label>
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              <span>Role</span>
              <select value={userRoleId} onChange={(event) => setUserRoleId(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3" required>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <button disabled={savingUser} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
              <Plus size={16} />
              {savingUser ? "Creating..." : "Create staff invite"}
            </button>
          </form>
        </section> : null}
          {canCreateRoles ? <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <ShieldCheck size={19} />
            Role builder
          </h2>
          <form onSubmit={handleCreateRole} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                <span>Role name</span>
                <input value={roleName} onChange={(event) => setRoleName(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3" required />
              </label>
              <label className="block space-y-1 text-sm font-medium text-slate-700">
                <span>Description</span>
                <input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3" />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(groupedPermissions).map(([group, items]) => (
                <div key={group} className="rounded-md border border-slate-200 p-3">
                  <h3 className="text-sm font-semibold text-slate-950">{group}</h3>
                  <div className="mt-3 grid gap-2">
                    {items.map((permission) => (
                      <label key={permission.key} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={selectedPermissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} className="size-4 rounded border-slate-300 text-teal-600" />
                        {permission.key}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button disabled={savingRole} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
              <Plus size={16} />
              {savingRole ? "Saving..." : "Create permission role"}
            </button>
          </form>
        </section> : null}
      </div>
      ) : null}
      {canViewStaff ? <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">Team members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.role?.name || "No role"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{user.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.status === "pending" ? (
                      <button onClick={() => handleResendInvite(user.id)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                        <RefreshCcw size={15} />
                        Resend
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section> : null}
    </div>
  );
}
