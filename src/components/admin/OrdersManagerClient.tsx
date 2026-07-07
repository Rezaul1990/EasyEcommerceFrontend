"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { Drawer } from "@/components/admin/ui/Drawer";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { createAdminCourier, getAdminCouriers, getAdminOrders, updateAdminOrderCourier, updateAdminOrderPayment, updateAdminOrderStatus } from "@/services/apiClient";
import type { CourierCompany, Order } from "@/types/ecommerce";
import { Plus, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function OrdersManagerClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<CourierCompany[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminOrders(), getAdminCouriers()])
      .then(([orderData, courierData]) => {
        if (ignore) return;
        setOrders(orderData);
        setCouriers(courierData);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Orders could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const value = search.toLowerCase();
    return orders.filter((order) => order.orderNumber.toLowerCase().includes(value) || order.customer.phone.includes(value) || order.customer.name.toLowerCase().includes(value));
  }, [orders, search]);

  function replaceOrder(order: Order) {
    setOrders((current) => current.map((item) => (item._id === order._id ? order : item)));
    setSelected(order);
  }

  async function handleStatus(order: Order, status: string) {
    replaceOrder(await updateAdminOrderStatus(order._id, status));
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    replaceOrder(await updateAdminOrderPayment(selected._id, {
      paymentStatus: String(form.get("paymentStatus") || "unpaid"),
      paidAmount: Number(form.get("paidAmount") || 0),
      dueAmount: Number(form.get("dueAmount") || 0),
      refundAmount: Number(form.get("refundAmount") || 0),
      note: String(form.get("note") || ""),
    }));
  }

  async function handleCourier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    replaceOrder(await updateAdminOrderCourier(selected._id, {
      courier: String(form.get("courier") || ""),
      courierCharge: Number(form.get("courierCharge") || 0),
      trackingNumber: String(form.get("trackingNumber") || ""),
    }));
  }

  async function handleCourierCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const courier = await createAdminCourier({
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      contactPerson: String(form.get("contactPerson") || ""),
      defaultCharge: Number(form.get("defaultCharge") || 0),
      status: "active",
    });
    setCouriers((current) => [...current, courier].sort((a, b) => a.name.localeCompare(b.name)));
    event.currentTarget.reset();
  }

  if (loading) return <LoadingState label="Loading orders..." />;

  return (
    <div className="space-y-5">
      {error ? <ErrorState message={error} /> : null}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="relative border-b border-slate-200 p-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full max-w-sm rounded-md border border-slate-300 pl-9 pr-3 text-sm" placeholder="Search order, phone, customer" />
        </div>
        <DataTable
          rows={filteredOrders}
          getRowKey={(row) => row._id}
          emptyText="No orders yet"
          columns={[
            { key: "order", header: "Order", render: (row) => <button onClick={() => setSelected(row)} className="font-semibold text-teal-700">{row.orderNumber}</button> },
            { key: "customer", header: "Customer", render: (row) => <span>{row.customer.name}<br /><span className="text-xs text-slate-500">{row.customer.phone}</span></span> },
            { key: "total", header: "Total", render: (row) => <span>{moneyFormatter.format(row.grandTotal)}</span> },
            { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status}</span> },
            { key: "payment", header: "Payment", render: (row) => <span>{row.paymentStatus}</span> },
          ]}
        />
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Plus size={18} />Add courier</h2>
        <form onSubmit={handleCourierCreate} className="mt-4 grid gap-3 md:grid-cols-4">
          <input name="name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Courier name" required />
          <input name="phone" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Phone" />
          <input name="contactPerson" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Contact person" />
          <input name="defaultCharge" type="number" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Default charge" />
          <button className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white md:col-span-4">Create courier</button>
        </form>
      </section>
      <Drawer open={Boolean(selected)} title={selected?.orderNumber || "Order"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5">
            <section className="rounded-md border border-slate-200 p-4">
              <p className="font-semibold text-slate-950">{selected.customer.name}</p>
              <p className="mt-1 text-sm text-slate-600">{selected.customer.phone}</p>
              <p className="mt-1 text-sm text-slate-600">{selected.customer.address}</p>
            </section>
            <section className="space-y-2">
              {selected.items.map((item) => <div key={item.sku} className="flex justify-between text-sm"><span>{item.name} x {item.quantity}</span><span>{moneyFormatter.format(item.subtotal)}</span></div>)}
            </section>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select value={selected.status} onChange={(event) => handleStatus(selected, event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3">
                {["pending", "confirmed", "packed", "courier_assigned", "shipped", "delivered", "cancelled", "returned", "refunded"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <form onSubmit={handlePayment} className="grid gap-3 rounded-md border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Payment</h3>
              <select name="paymentStatus" defaultValue={selected.paymentStatus} className="h-10 rounded-md border border-slate-300 px-3">{["unpaid", "paid", "partial_paid", "due", "refunded", "cancelled_payment"].map((status) => <option key={status}>{status}</option>)}</select>
              <div className="grid grid-cols-3 gap-2"><input name="paidAmount" type="number" defaultValue={selected.paidAmount || 0} className="h-10 rounded-md border border-slate-300 px-3" /><input name="dueAmount" type="number" defaultValue={selected.dueAmount || 0} className="h-10 rounded-md border border-slate-300 px-3" /><input name="refundAmount" type="number" defaultValue={selected.refundAmount || 0} className="h-10 rounded-md border border-slate-300 px-3" /></div>
              <button className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Save payment</button>
            </form>
            <form onSubmit={handleCourier} className="grid gap-3 rounded-md border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Courier</h3>
              <select name="courier" defaultValue={selected.courier?._id || ""} className="h-10 rounded-md border border-slate-300 px-3"><option value="">No courier</option>{couriers.map((courier) => <option key={courier._id} value={courier._id}>{courier.name}</option>)}</select>
              <input name="courierCharge" type="number" defaultValue={selected.courierCharge || 0} className="h-10 rounded-md border border-slate-300 px-3" placeholder="Courier charge" />
              <input name="trackingNumber" defaultValue={selected.trackingNumber || ""} className="h-10 rounded-md border border-slate-300 px-3" placeholder="Tracking number" />
              <button className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Save courier</button>
            </form>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
