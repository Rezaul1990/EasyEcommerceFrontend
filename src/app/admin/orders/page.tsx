import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersManagerClient } from "@/components/admin/OrdersManagerClient";
import { Suspense } from "react";

export const metadata = {
  title: "Orders | EasyEcommerce Admin",
};

export default function OrdersAdminPage() {
  return (
    <AdminShell>
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading orders...</div>}>
        <OrdersManagerClient />
      </Suspense>
    </AdminShell>
  );
}
