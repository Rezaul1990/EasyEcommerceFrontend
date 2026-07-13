"use client";

import type { Product } from "@/types/ecommerce";
import { getProductImageUrl, resolveImageUrl, shouldBypassImageOptimizer } from "@/utils/imageUrl";
import { addToCart, getVariantLabel, toggleWishlist } from "@/utils/guestStore";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

export function ProductDetailClient({ product }: { product: Product }) {
  const activeVariants = useMemo(() => (product.productType === "variant" ? product.variants?.filter((variant) => variant.status === "active") || [] : []), [product.productType, product.variants]);
  const optionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    activeVariants.forEach((variant) => {
      Object.entries(variant.options || {}).forEach(([name, value]) => {
        if (!value) return;
        const values = groups.get(name) || [];
        if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value);
        groups.set(name, values);
      });
    });
    return Array.from(groups.entries()).map(([name, values]) => ({ name, values }));
  }, [activeVariants]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(activeVariants[0]?.options || {});
  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?._id || activeVariants[0]?.sku || "");
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = activeVariants.find((variant) => {
    if (optionGroups.length) return optionGroups.every((group) => variant.options?.[group.name] === selectedOptions[group.name]);
    return (variant._id || variant.sku) === selectedVariantId;
  }) || activeVariants.find((variant) => (variant._id || variant.sku) === selectedVariantId);
  const image = selectedVariant?.image ? resolveImageUrl(selectedVariant.image) : getProductImageUrl(product);
  const price = selectedVariant?.finalPrice || selectedVariant?.price || product.finalPrice || product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice || product.compareAtPrice;
  const availableStock = selectedVariant ? Math.max((selectedVariant.stock || 0) - (selectedVariant.reservedStock || 0), 0) : product.stockQuantity ?? product.stock ?? 0;
  const sku = selectedVariant?.sku || product.sku;
  const selectedLabel = getVariantLabel(selectedVariant);

  function chooseOption(name: string, value: string) {
    const nextOptions = { ...selectedOptions, [name]: value };
    setSelectedOptions(nextOptions);
    const nextVariant = activeVariants.find((variant) => optionGroups.every((group) => variant.options?.[group.name] === nextOptions[group.name]));
    if (nextVariant) setSelectedVariantId(nextVariant._id || nextVariant.sku);
    setQuantity(1);
  }

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
          {compareAtPrice ? <span className="text-lg text-slate-400 line-through">${compareAtPrice.toFixed(2)}</span> : null}
        </div>
        {optionGroups.length ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <div className="space-y-4">
              {optionGroups.map((group) => (
                <div key={group.name}>
                  <p className="text-sm font-semibold capitalize text-slate-950">{group.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.values.map((value) => (
                      <button key={`${group.name}-${value}`} type="button" onClick={() => chooseOption(group.name, value)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${selectedOptions[group.name] === value ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-700"}`}>
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                <span className="font-semibold text-slate-950">Selected: {selectedLabel}</span>
                <span className="text-slate-500">{availableStock} available</span>
              </div>
            </div>
          </div>
        ) : activeVariants.length ? (
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
          <button disabled={!availableStock || (activeVariants.length > 0 && !selectedVariant)} onClick={() => addToCart(product, quantity, selectedVariant)} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400">
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
