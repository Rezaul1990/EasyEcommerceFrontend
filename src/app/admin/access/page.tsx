import { AdminShell } from "@/components/admin/AdminShell";
import { ShieldCheck, UserPlus } from "lucide-react";

export const metadata = {
  title: "Access Control | EasyEcommerce Admin",
};

const permissionGroups = [
  { group: "Catalog", permissions: ["products.view", "products.create", "products.update", "categories.manage"] },
  { group: "Orders", permissions: ["orders.view", "orders.update", "orders.export"] },
  { group: "Access Control", permissions: ["staff.manage", "roles.manage"] },
  { group: "Settings", permissions: ["settings.view", "settings.update", "auditLogs.view"] },
];

export default function AccessAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Security</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Users, roles, and permissions</h1>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
          <UserPlus size={17} />
          Invite staff
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <ShieldCheck size={19} />
            System roles
          </h2>
          <div className="mt-4 space-y-3">
            {["Owner", "Admin", "Staff"].map((role) => (
              <div key={role} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold text-slate-950">{role}</p>
                <p className="mt-1 text-sm text-slate-600">{role === "Owner" ? "Always receives all permissions." : "Configurable module access."}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Permission selector</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {permissionGroups.map((group) => (
              <div key={group.group} className="rounded-md border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-950">{group.group}</h3>
                <div className="mt-3 space-y-2">
                  {group.permissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" defaultChecked={permission.endsWith(".view")} className="size-4 rounded border-slate-300 text-teal-600" />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
