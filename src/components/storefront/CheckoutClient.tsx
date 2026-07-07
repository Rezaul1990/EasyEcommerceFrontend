"use client";

import { createPublicOrder } from "@/services/apiClient";
import { clearCart, getCart } from "@/utils/guestStore";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { GuestCartItem } from "@/utils/guestStore";

export function CheckoutClient() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.finalPrice || item.price) * item.quantity, 0), [items]);

  useEffect(() => {
    queueMicrotask(() => setItems(getCart()));
  }, []);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const order = await createPublicOrder({
        customer: {
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          address: String(form.get("address") || ""),
          city: String(form.get("city") || ""),
          postalCode: String(form.get("postalCode") || ""),
        },
        items: items.map((item) => ({ productId: item._id, quantity: item.quantity })),
        paymentMethod: String(form.get("paymentMethod") || "cod") as "cod" | "manual",
        notes: String(form.get("notes") || ""),
      });
      setOrderNumber(order.orderNumber);
      clearCart();
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be placed");
    } finally {
      setLoading(false);
    }
  }

  if (orderNumber) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-semibold text-emerald-950">Order placed</h2>
        <p className="mt-2 text-sm text-emerald-800">Order ID: {orderNumber}</p>
        <Link href={`/track-order?order=${orderNumber}`} className="mt-5 inline-flex rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Track order</Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submitOrder} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
        {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Full name</span><input name="name" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Email</span><input name="email" type="email" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Phone</span><input name="phone" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>City</span><input name="city" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Postal code</span><input name="postalCode" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Payment</span><select name="paymentMethod" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950"><option value="cod">Cash on delivery</option><option value="manual">Manual payment</option></select></label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><span>Delivery address</span><textarea name="address" className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><span>Note</span><textarea name="notes" className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
        <button disabled={loading || !items.length} className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400 sm:col-span-2">{loading ? "Placing order..." : "Place order"}</button>
      </form>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Order summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          {items.map((item) => <div key={item._id} className="flex justify-between gap-3"><span className="text-slate-600">{item.name} x {item.quantity}</span><span className="font-semibold">${((item.finalPrice || item.price) * item.quantity).toFixed(2)}</span></div>)}
        </div>
        <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 font-semibold"><span>Total</span><span>${subtotal.toFixed(2)}</span></div>
      </aside>
    </div>
  );
}
