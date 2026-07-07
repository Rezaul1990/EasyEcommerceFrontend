"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { StatCard } from "@/components/admin/ui/StatCard";
import { getAdminSummary } from "@/services/apiClient";
import type { DashboardSummary } from "@/types/ecommerce";
import { AlertTriangle, Banknote, Boxes, CheckCircle2, Clock, CreditCard, Package, RotateCcw, ShoppingCart, Truck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function AdminDashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getAdminSummary()
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Dashboard could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;
  if (!summary) return <ErrorState message="Dashboard summary is unavailable" />;

  const cards = [
    { label: "Total orders", value: summary.cards.totalOrders, icon: ShoppingCart, tone: "teal" as const },
    { label: "Total sales", value: moneyFormatter.format(summary.cards.totalSales), icon: Banknote, tone: "emerald" as const },
    { label: "Total products", value: summary.cards.totalProducts, icon: Package, tone: "slate" as const },
    { label: "Low stock", value: summary.cards.lowStockCount, icon: AlertTriangle, tone: "amber" as const },
    { label: "Today orders", value: summary.cards.todayOrders, icon: Clock, tone: "teal" as const },
    { label: "Pending orders", value: summary.cards.pendingOrders, icon: Truck, tone: "amber" as const },
    { label: "Delivered", value: summary.cards.deliveredOrders, icon: CheckCircle2, tone: "emerald" as const },
    { label: "Cancelled", value: summary.cards.cancelledOrders, icon: XCircle, tone: "rose" as const },
    { label: "Due amount", value: moneyFormatter.format(summary.cards.dueAmount), icon: CreditCard, tone: "amber" as const },
    { label: "Refund amount", value: moneyFormatter.format(summary.cards.refundAmount), icon: RotateCcw, tone: "rose" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent orders</h2>
          </div>
          <DataTable
            rows={summary.recentOrders}
            getRowKey={(row) => row._id}
            emptyText="No recent orders yet"
            columns={[
              { key: "order", header: "Order", render: (row) => <span className="font-medium text-slate-950">{row.orderNumber || row.orderCode || row._id.slice(-6)}</span> },
              { key: "customer", header: "Customer", render: (row) => <span className="text-slate-600">{row.customer?.name || row.customer?.phone || row.customer?.email || "Guest"}</span> },
              { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status}</span> },
              { key: "total", header: "Total", align: "right", render: (row) => <span className="font-medium text-slate-950">{moneyFormatter.format(row.grandTotal || 0)}</span> },
            ]}
          />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Payment summary</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {summary.paymentSummary.length ? (
              summary.paymentSummary.map((item) => (
                <div key={item.status} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium capitalize text-slate-950">{item.status}</p>
                    <p className="text-slate-500">{item.count} orders</p>
                  </div>
                  <p className="font-semibold text-slate-950">{moneyFormatter.format(item.amount || 0)}</p>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-slate-500">No payment data yet</p>
            )}
          </div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 p-4">
            <AlertTriangle size={18} className="text-amber-700" />
            <h2 className="text-lg font-semibold text-slate-950">Low stock alerts</h2>
          </div>
          <DataTable
            rows={summary.lowStockList}
            getRowKey={(row) => row._id}
            emptyText="No low stock products"
            columns={[
              { key: "product", header: "Product", render: (row) => <span className="font-medium text-slate-950">{row.name}</span> },
              { key: "sku", header: "SKU", render: (row) => <span className="text-slate-600">{row.sku || row.baseSku || "N/A"}</span> },
              { key: "stock", header: "Stock", align: "right", render: (row) => <span className="font-medium text-slate-950">{row.stockQuantity ?? row.stock ?? 0}</span> },
            ]}
          />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 p-4">
            <Boxes size={18} className="text-teal-700" />
            <h2 className="text-lg font-semibold text-slate-950">Top selling products</h2>
          </div>
          <DataTable
            rows={summary.topSellingProducts}
            getRowKey={(row) => row._id}
            emptyText="No product performance yet"
            columns={[
              { key: "product", header: "Product", render: (row) => <span className="font-medium text-slate-950">{row.name}</span> },
              { key: "score", header: "Score", align: "right", render: (row) => <span className="text-slate-600">{row.bestSellingScore || 0}</span> },
              { key: "price", header: "Price", align: "right", render: (row) => <span className="font-medium text-slate-950">{moneyFormatter.format(row.finalPrice || row.price || 0)}</span> },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
