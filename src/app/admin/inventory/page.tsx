import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryManagerClient } from "@/components/admin/InventoryManagerClient";

export const metadata = {
  title: "Inventory | EasyEcommerce Admin",
};

export default function InventoryAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Stock control</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Inventory</h1>
      </div>
      <InventoryManagerClient />
    </AdminShell>
  );
}
