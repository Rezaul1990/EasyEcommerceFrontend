import { AdminShell } from "@/components/admin/AdminShell";
import { AccessControlClient } from "@/components/admin/AccessControlClient";

export const metadata = {
  title: "Team & Permissions | EasyEcommerce Admin",
};

export default function AccessAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Team & Permissions</h1>
        </div>
      </div>
      <AccessControlClient />
    </AdminShell>
  );
}
