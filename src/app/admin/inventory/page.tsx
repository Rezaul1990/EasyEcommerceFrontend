import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryManagerClient } from "@/components/admin/InventoryManagerClient";

export const metadata = {
  title: "Inventory | EasyEcommerce Admin",
};

export default function InventoryAdminPage() {
  return (
    <AdminShell>
      <InventoryManagerClient />
    </AdminShell>
  );
}
