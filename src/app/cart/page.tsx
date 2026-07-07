import { SiteHeader } from "@/components/layout/SiteHeader";
import { sampleProducts } from "@/services/apiClient";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Cart | EasyEcommerce",
};

export default function CartPage() {
  const cartItems = sampleProducts.slice(0, 2).map((product, index) => ({ ...product, quantity: index + 1 }));
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Review</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Cart</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            {cartItems.map((item) => (
              <article key={item._id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <h2 className="font-semibold text-slate-950">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="grid size-9 place-items-center rounded-md border border-slate-200" aria-label="Decrease quantity">
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button className="grid size-9 place-items-center rounded-md border border-slate-200" aria-label="Increase quantity">
                    <Plus size={16} />
                  </button>
                  <button className="grid size-9 place-items-center rounded-md border border-slate-200 text-rose-600" aria-label="Remove item">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </section>
          <aside className="rounded-lg border border-slate-200 bg-white p-5">
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
                <dt className="text-slate-600">Shipping</dt>
                <dd className="font-semibold text-slate-950">$0.00</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-semibold text-slate-950">Total</dt>
                <dd className="font-semibold text-slate-950">${subtotal.toFixed(2)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="mt-5 flex w-full items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white">
              Checkout
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
