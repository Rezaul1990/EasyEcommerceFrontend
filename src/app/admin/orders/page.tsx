import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersManagerClient } from "@/components/admin/OrdersManagerClient";

export const metadata = {
  title: "Orders | EasyEcommerce Admin",
};

export default function OrdersAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Orders</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Order queue</h1>
        </div>
      </div>
      <OrdersManagerClient />
    </AdminShell>
  );
}
