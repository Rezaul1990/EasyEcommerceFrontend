"use client";

import type { Product } from "@/types/ecommerce";
import { getProductImageUrl, shouldBypassImageOptimizer } from "@/utils/imageUrl";
import { addToCart, toggleWishlist } from "@/utils/guestStore";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({ product }: { product: Product }) {
  const image = getProductImageUrl(product);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <Link href={`/products/${product.slug}`} className="block aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={product.name}
          width={900}
          height={675}
          unoptimized={shouldBypassImageOptimizer(image)}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">{product.categoryId?.name || "Catalog"}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{product.shortDescription || product.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-950">${product.price.toFixed(2)}</p>
            {product.compareAtPrice ? <p className="text-xs text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</p> : null}
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleWishlist(product)} className="grid size-10 place-items-center rounded-md border border-slate-200 text-slate-600" aria-label={`Add ${product.name} to wishlist`}>
              <Heart size={18} />
            </button>
            <button onClick={() => addToCart(product)} className="grid size-10 place-items-center rounded-md bg-teal-600 text-white" aria-label={`Add ${product.name} to cart`}>
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
