"use client";

import { addToCart, getWishlist, toggleWishlist } from "@/utils/guestStore";
import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types/ecommerce";

export function WishlistClient() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    queueMicrotask(() => setItems(getWishlist()));
  }, []);

  function remove(product: Product) {
    toggleWishlist(product);
    setItems(getWishlist());
  }

  return (
    <section className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <article key={item._id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-950">{item.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.sku}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => addToCart(item)} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white"><ShoppingCart size={16} />Cart</button>
              <button onClick={() => remove(item)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600"><Trash2 size={16} />Remove</button>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-950">No wishlist items yet</p>
          <Link href="/products" className="mt-4 inline-flex rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Browse products</Link>
        </div>
      )}
    </section>
  );
}
