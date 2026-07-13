"use client";

import type { Product } from "@/types/ecommerce";
import { getProductImageUrl, shouldBypassImageOptimizer } from "@/utils/imageUrl";
import { addToCart, toggleWishlist } from "@/utils/guestStore";
import { Eye, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function discountText(discountType?: Product["discountType"], discountValue = 0) {
  if (!discountValue || discountType === "none") return "";
  if (discountType === "percentage") return `${discountValue}% off`;
  if (discountType === "fixed") return `${money.format(discountValue)} off`;
  return "";
}

export function ProductCard({ product }: { product: Product }) {
  const image = getProductImageUrl(product);
  const activeVariants = product.productType === "variant" ? product.variants?.filter((variant) => variant.status === "active") || [] : [];
  const isVariantProduct = activeVariants.length > 0;
  const lowestVariant = isVariantProduct
    ? [...activeVariants].sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price))[0]
    : null;
  const displayPrice = lowestVariant ? lowestVariant.finalPrice || lowestVariant.price : product.finalPrice || product.price;
  const originalPrice = lowestVariant
    ? lowestVariant.compareAtPrice || (lowestVariant.price > displayPrice ? lowestVariant.price : null)
    : product.compareAtPrice || (product.price > displayPrice ? product.price : null);
  const priceDiscountText = lowestVariant ? discountText(lowestVariant.discountType, lowestVariant.discountValue) : discountText(product.discountType, product.discountValue);
  const availableStock = isVariantProduct
    ? activeVariants.reduce((total, variant) => total + Math.max((variant.stock || 0) - (variant.reservedStock || 0), 0), 0)
    : product.stockQuantity ?? product.stock ?? 0;

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={product.name}
          width={900}
          height={675}
          unoptimized={shouldBypassImageOptimizer(image)}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {isVariantProduct ? <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">Options available</span> : null}
          {priceDiscountText ? <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">{priceDiscountText}</span> : null}
          {availableStock <= 0 ? <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">Out of stock</span> : null}
        </div>
      </Link>
      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">{product.categoryId?.name || "Catalog"}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{product.shortDescription || product.description}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-lg font-semibold text-slate-950">{isVariantProduct ? "From " : ""}{money.format(displayPrice)}</p>
              {originalPrice && originalPrice > displayPrice ? <p className="text-sm text-slate-400 line-through">{money.format(originalPrice)}</p> : null}
            </div>
            {priceDiscountText ? <p className="mt-1 text-xs font-semibold text-rose-600">Save {priceDiscountText.replace(" off", "")}</p> : null}
            <p className={`mt-1 text-xs font-semibold ${availableStock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
              {availableStock > 0 ? `${availableStock} available` : "Currently unavailable"}
            </p>
          </div>
          <button onClick={() => toggleWishlist(product)} className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-rose-600" aria-label={`Add ${product.name} to wishlist`}>
            <Heart size={18} />
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href={`/products/${product.slug}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <Eye size={17} />
            View details
          </Link>
          {isVariantProduct ? (
            <Link href={`/products/${product.slug}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700">
              <ShoppingCart size={17} />
              Choose options
            </Link>
          ) : (
            <button onClick={() => addToCart(product)} disabled={availableStock <= 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:bg-slate-400">
              <ShoppingCart size={17} />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
