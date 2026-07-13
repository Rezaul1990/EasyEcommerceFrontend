"use client";

import { trackPublicOrder } from "@/services/apiClient";
import type { Order } from "@/types/ecommerce";
import { FormEvent, useState } from "react";

type TrackOrderClientProps = {
  initialOrderNumber?: string;
  initialPhone?: string;
};

export function TrackOrderClient({ initialOrderNumber = "", initialPhone = "" }: TrackOrderClientProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanOrderNumber = orderNumber.trim();
    const cleanPhone = phone.trim();

    if (!cleanOrderNumber && !cleanPhone) {
      setOrders([]);
      setError("Enter an order ID or phone number.");
      return;
    }

    setIsLoading(true);
    try {
      setOrders(await trackPublicOrder({ orderNumber: cleanOrderNumber, phone: cleanPhone }));
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Tracking failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
        {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Order ID</span>
          <input name="orderNumber" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="EE-..." />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Phone</span>
          <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="Phone number" />
        </label>
        <button disabled={isLoading} className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:col-span-2">
          {isLoading ? "Checking..." : "Track order"}
        </button>
      </form>
      {orders.length ? (
        <section className="space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">{order.orderNumber}</h2>
                  <p className="mt-1 text-sm text-slate-600">{order.customer.name} | {order.customer.phone}</p>
                </div>
                <p className="text-sm font-semibold text-slate-950">BDT {order.grandTotal}</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <p>Status: {order.status}</p>
                <p>Payment: {order.paymentStatus}</p>
                <p>Tracking: {order.trackingNumber || "Not assigned yet"}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
