"use client";

import { getCart, getCartItemPrice, getCartItemStock, getVariantLabel, saveCart } from "@/utils/guestStore";
import { getProductImageUrl, resolveImageUrl, shouldBypassImageOptimizer } from "@/utils/imageUrl";
import { formatMoney } from "@/utils/money";
import { getPublicStoreSettings } from "@/services/apiClient";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GuestCartItem } from "@/utils/guestStore";

export function CartClient() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [currency, setCurrency] = useState("BDT");

  useEffect(() => {
    queueMicrotask(() => setItems(getCart()));
    getPublicStoreSettings().then((settings) => setCurrency(settings?.currency || "BDT")).catch(() => setCurrency("BDT"));
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0), [items]);

  function updateQuantity(cartLineId: string, quantity: number) {
    const next = items.map((item) => (item.cartLineId === cartLineId ? { ...item, quantity: Math.max(1, Math.min(quantity, getCartItemStock(item))) } : item));
    setItems(next);
    saveCart(next);
  }

  function removeItem(cartLineId: string) {
    const next = items.filter((item) => item.cartLineId !== cartLineId);
    setItems(next);
    saveCart(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        {items.length ? (
          items.map((item) => {
            const image = item.selectedVariant?.image ? resolveImageUrl(item.selectedVariant.image) : getProductImageUrl(item);
            const price = getCartItemPrice(item);
            const variantLabel = getVariantLabel(item.selectedVariant);
            return (
            <article key={item.cartLineId} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                  <Image src={image} alt={item.name} fill sizes="80px" unoptimized={shouldBypassImageOptimizer(image)} className="object-cover" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-950">{item.name}</h2>
                  {variantLabel ? <p className="mt-1 text-sm font-semibold text-teal-700">{variantLabel}</p> : null}
                  <p className="mt-1 text-sm font-semibold text-slate-950">{formatMoney(price, currency)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.cartLineId, item.quantity - 1)} className="grid size-9 place-items-center rounded-md border border-slate-200" aria-label="Decrease quantity">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.cartLineId, item.quantity + 1)} className="grid size-9 place-items-center rounded-md border border-slate-200" aria-label="Increase quantity">
                  <Plus size={16} />
                </button>
                <button onClick={() => removeItem(item.cartLineId)} className="grid size-9 place-items-center rounded-md border border-slate-200 text-rose-600" aria-label="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
            );
          })
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
            <dd className="font-semibold text-slate-950">{formatMoney(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Delivery</dt>
            <dd className="font-semibold text-slate-950">{formatMoney(0, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
            <dt className="font-semibold text-slate-950">Total</dt>
            <dd className="font-semibold text-slate-950">{formatMoney(subtotal, currency)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`mt-5 flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white ${items.length ? "bg-teal-600" : "pointer-events-none bg-slate-400"}`}>
          Checkout
        </Link>
      </aside>
    </div>
  );
}
