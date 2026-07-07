import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard | EasyEcommerce",
};

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Dashboard</h1>
        </div>
      </div>
      <AdminDashboardClient />
    </AdminShell>
  );
}
