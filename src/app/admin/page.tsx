import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSummary } from "@/services/apiClient";
import { AlertTriangle, DollarSign, Package, ShoppingCart } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard | EasyEcommerce",
};

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();
  const cards = [
    { label: "Active products", value: summary.activeProducts, icon: Package },
    { label: "Pending orders", value: summary.pendingOrders, icon: ShoppingCart },
    { label: "Low stock", value: summary.lowStockProducts, icon: AlertTriangle },
    { label: "Revenue", value: `$${summary.totalRevenue.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Dashboard</h1>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <section key={card.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{card.label}</p>
                <Icon className="text-teal-700" size={20} />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</p>
            </section>
          );
        })}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Admin workflow coverage</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          <p>Catalog: products, categories, SKU, stock, status, featured products.</p>
          <p>Orders: checkout, customer details, order status, payment status.</p>
          <p>Access: owner role, staff users, permission registry, audit logs.</p>
        </div>
      </section>
    </AdminShell>
  );
}
