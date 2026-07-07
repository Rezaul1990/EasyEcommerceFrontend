import { AdminShell } from "@/components/admin/AdminShell";
import { AccessControlClient } from "@/components/admin/AccessControlClient";
import { UserPlus } from "lucide-react";

export const metadata = {
  title: "Access Control | EasyEcommerce Admin",
};

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
      <AccessControlClient />
    </AdminShell>
  );
}
