"use client";

import type { Coupon } from "@/types/ecommerce";
import { BadgePercent, Check, Copy, Crown, Sparkles, Timer } from "lucide-react";
import { useState } from "react";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function discountLabel(coupon: Coupon) {
  if (coupon.discountType === "percentage") return `${coupon.discountValue}% off`;
  return `${moneyFormatter.format(coupon.discountValue)} off`;
}

function productScope(coupon: Coupon) {
  if (!coupon.products?.length) return "Storewide";
  if (coupon.products.length === 1) return "Selected product";
  return `${coupon.products.length} selected products`;
}

export function CouponShowcase({ coupons }: { coupons: Coupon[] }) {
  const [copiedCode, setCopiedCode] = useState("");
  const activeCoupons = coupons.slice(0, 3);

  if (!activeCoupons.length) return null;

  async function copyCode(code: string) {
    await navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(""), 1600);
  }

  return (
    <section className="mb-7 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
            <Crown size={16} />
            Active offers
          </div>
          <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight text-white">Premium savings are live today</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
            Use an active coupon at checkout and unlock instant savings on eligible products.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white">
            <Sparkles size={16} className="text-teal-300" />
            {activeCoupons.length} coupon{activeCoupons.length === 1 ? "" : "s"} available
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-3">
          {activeCoupons.map((coupon) => (
            <article key={coupon._id} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">{productScope(coupon)}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{discountLabel(coupon)}</h3>
                </div>
                <BadgePercent size={22} className="shrink-0 text-amber-300" />
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-300">{coupon.title}</p>
              <div className="mt-4 rounded-md border border-dashed border-white/20 bg-slate-950/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="truncate text-sm font-semibold tracking-wide text-white">{coupon.code}</code>
                  <button type="button" onClick={() => copyCode(coupon.code)} className="inline-flex h-8 items-center gap-1 rounded-md bg-teal-500 px-2.5 text-xs font-semibold text-slate-950 hover:bg-teal-300">
                    {copiedCode === coupon.code ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode === coupon.code ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Timer size={14} />
                  Ends {dateFormatter.format(new Date(coupon.expiryDate))}
                </span>
                {coupon.minimumOrderAmount ? <span>Min {moneyFormatter.format(coupon.minimumOrderAmount)}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
