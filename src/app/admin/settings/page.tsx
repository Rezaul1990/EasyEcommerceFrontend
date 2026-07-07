import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsManagerClient } from "@/components/admin/SettingsManagerClient";

export const metadata = {
  title: "Settings | EasyEcommerce Admin",
};

export default function SettingsAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Store setup</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Settings</h1>
      </div>
      <SettingsManagerClient />
    </AdminShell>
  );
}
