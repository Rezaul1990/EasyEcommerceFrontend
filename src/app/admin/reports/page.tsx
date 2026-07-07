import { AdminShell } from "@/components/admin/AdminShell";
import { ReportsClient } from "@/components/admin/ReportsClient";

export const metadata = {
  title: "Reports | EasyEcommerce Admin",
};

export default function ReportsAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Reports</h1>
      </div>
      <ReportsClient />
    </AdminShell>
  );
}
