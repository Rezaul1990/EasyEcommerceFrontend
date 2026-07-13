"use client";

import type { Product } from "@/types/ecommerce";
import { getProductImageUrl, resolveImageUrl, shouldBypassImageOptimizer } from "@/utils/imageUrl";
import { addToCart, toggleWishlist } from "@/utils/guestStore";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function ProductDetailClient({ product }: { product: Product }) {
  const activeVariants = product.productType === "variant" ? product.variants?.filter((variant) => variant.status === "active") || [] : [];
  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?._id || activeVariants[0]?.sku || "");
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = activeVariants.find((variant) => (variant._id || variant.sku) === selectedVariantId);
  const image = selectedVariant?.image ? resolveImageUrl(selectedVariant.image) : getProductImageUrl(product);
  const price = selectedVariant?.finalPrice || selectedVariant?.price || product.finalPrice || product.price;
  const availableStock = selectedVariant ? Math.max((selectedVariant.stock || 0) - (selectedVariant.reservedStock || 0), 0) : product.stockQuantity ?? product.stock ?? 0;
  const sku = selectedVariant?.sku || product.sku;

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
        <Image src={image} alt={product.name} fill unoptimized={shouldBypassImageOptimizer(image)} className="object-cover" />
      </div>
      <section className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{product.categoryId?.name || "Catalog"}</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{product.name}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{product.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">SKU: {sku}</span>
          <span className={`rounded-md px-2 py-1 font-semibold ${availableStock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {availableStock > 0 ? `${availableStock} in stock` : "Out of stock"}
          </span>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <span className="text-3xl font-semibold text-slate-950">${price.toFixed(2)}</span>
          {product.compareAtPrice ? <span className="text-lg text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</span> : null}
        </div>
        {activeVariants.length ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-950">Choose option</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeVariants.map((variant) => {
                const key = variant._id || variant.sku;
                return (
                  <button key={key} onClick={() => { setSelectedVariantId(key); setQuantity(1); }} className={`rounded-md border px-3 py-2 text-sm font-semibold ${selectedVariantId === key ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-700"}`}>
                    {variant.variantName}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex items-center gap-2">
          <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid size-10 place-items-center rounded-md border border-slate-200">-</button>
          <span className="w-10 text-center font-semibold">{quantity}</span>
          <button onClick={() => setQuantity((value) => Math.min(availableStock || 999, value + 1))} className="grid size-10 place-items-center rounded-md border border-slate-200">+</button>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button disabled={!availableStock} onClick={() => addToCart(product, quantity)} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400">
            <ShoppingCart size={18} />
            Add to cart
          </button>
          <button onClick={() => toggleWishlist(product)} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
            <Heart size={18} />
            Wishlist
          </button>
        </div>
      </section>
    </main>
  );
}
