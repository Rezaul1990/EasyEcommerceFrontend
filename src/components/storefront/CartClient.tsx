"use client";

import { getCart, saveCart } from "@/utils/guestStore";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GuestCartItem } from "@/utils/guestStore";

export function CartClient() {
  const [items, setItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    queueMicrotask(() => setItems(getCart()));
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.finalPrice || item.price) * item.quantity, 0), [items]);

  function updateQuantity(id: string, quantity: number) {
    const next = items.map((item) => (item._id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stockQuantity ?? item.stock ?? 999)) } : item));
    setItems(next);
    saveCart(next);
  }

  function removeItem(id: string) {
    const next = items.filter((item) => item._id !== id);
    setItems(next);
    saveCart(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item._id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-950">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.sku}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">${(item.finalPrice || item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="grid size-9 place-items-center rounded-md border border-slate-200" aria-label="Decrease quantity">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="grid size-9 place-items-center rounded-md border border-slate-200" aria-label="Increase quantity">
                  <Plus size={16} />
                </button>
                <button onClick={() => removeItem(item._id)} className="grid size-9 place-items-center rounded-md border border-slate-200 text-rose-600" aria-label="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-950">Your cart is empty</p>
            <Link href="/products" className="mt-4 inline-flex rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Shop products</Link>
          </div>
        )}
      </section>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-slate-950">
          <ShoppingBag size={18} />
          <h2 className="font-semibold">Order summary</h2>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="font-semibold text-slate-950">${subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Delivery</dt>
            <dd className="font-semibold text-slate-950">$0.00</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
            <dt className="font-semibold text-slate-950">Total</dt>
            <dd className="font-semibold text-slate-950">${subtotal.toFixed(2)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`mt-5 flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white ${items.length ? "bg-teal-600" : "pointer-events-none bg-slate-400"}`}>
          Checkout
        </Link>
      </aside>
    </div>
  );
}
