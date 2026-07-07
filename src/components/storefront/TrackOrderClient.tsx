"use client";

import { trackPublicOrder } from "@/services/apiClient";
import type { Order } from "@/types/ecommerce";
import { FormEvent, useState } from "react";

export function TrackOrderClient() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      setOrder(await trackPublicOrder({ orderNumber: String(form.get("orderNumber") || ""), phone: String(form.get("phone") || "") }));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Tracking failed");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
        {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Order ID</span><input name="orderNumber" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="EE-..." required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Phone</span><input name="phone" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="Phone number" required /></label>
        <button className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white sm:col-span-2">Track order</button>
      </form>
      {order ? <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">{order.orderNumber}</h2><p className="mt-2 text-sm text-slate-600">Status: {order.status}</p><p className="mt-1 text-sm text-slate-600">Payment: {order.paymentStatus}</p><p className="mt-1 text-sm text-slate-600">Tracking: {order.trackingNumber || "Not assigned yet"}</p></section> : null}
    </div>
  );
}
