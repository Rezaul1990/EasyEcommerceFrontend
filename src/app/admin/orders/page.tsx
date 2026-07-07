import { AdminShell } from "@/components/admin/AdminShell";
import { Download, Search } from "lucide-react";

export const metadata = {
  title: "Orders | EasyEcommerce Admin",
};

const orders = [
  { id: "EE-20260707-482193", customer: "Amina Rahman", total: 140, status: "pending", payment: "cod" },
  { id: "EE-20260707-318450", customer: "Daniel Smith", total: 59, status: "processing", payment: "manual" },
  { id: "EE-20260706-993120", customer: "Maya Chen", total: 92, status: "shipped", payment: "cod" },
];

export default function OrdersAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Orders</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Order queue</h1>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800">
          <Download size={17} />
          Export
        </button>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="relative border-b border-slate-200 p-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input className="h-10 w-full max-w-sm rounded-md border border-slate-300 pl-9 pr-3 text-sm" placeholder="Search orders" />
        </div>
        <div className="divide-y divide-slate-200">
          {orders.map((order) => (
            <article key={order.id} className="grid gap-3 p-4 sm:grid-cols-5 sm:items-center">
              <div className="sm:col-span-2">
                <h2 className="font-semibold text-slate-950">{order.id}</h2>
                <p className="mt-1 text-sm text-slate-600">{order.customer}</p>
              </div>
              <p className="font-semibold text-slate-950">${order.total.toFixed(2)}</p>
              <span className="w-fit rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{order.status}</span>
              <select className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option>{order.status}</option>
                <option>confirmed</option>
                <option>processing</option>
                <option>shipped</option>
                <option>delivered</option>
                <option>cancelled</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
