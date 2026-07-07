"use client";

import { getCart, getWishlist } from "@/utils/guestStore";
import { Heart, LayoutDashboard, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    function syncCounts() {
      setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
      setWishlistCount(getWishlist().length);
    }
    syncCounts();
    window.addEventListener("easy-ecommerce-store-change", syncCounts);
    return () => window.removeEventListener("easy-ecommerce-store-change", syncCounts);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-slate-950">
          EasyEcommerce
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/products" className="hover:text-slate-950">
            Products
          </Link>
          <Link href="/checkout" className="hover:text-slate-950">
            Checkout
          </Link>
          <Link href="/admin" className="hover:text-slate-950">
            Admin
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <button className="grid size-10 place-items-center rounded-md border border-slate-200 text-slate-600" aria-label="Search">
            <Search size={18} />
          </button>
          <Link href="/wishlist" className="relative grid size-10 place-items-center rounded-md border border-slate-200 text-slate-600" aria-label="Wishlist">
            <Heart size={18} />
            {wishlistCount ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-[11px] font-semibold text-white">{wishlistCount}</span> : null}
          </Link>
          <Link href="/cart" className="relative grid size-10 place-items-center rounded-md border border-slate-200 text-slate-600" aria-label="Cart">
            <ShoppingBag size={18} />
            {cartCount ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-teal-600 text-[11px] font-semibold text-white">{cartCount}</span> : null}
          </Link>
          <Link href="/admin" className="grid size-10 place-items-center rounded-md bg-slate-950 text-white" aria-label="Admin dashboard">
            <LayoutDashboard size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
