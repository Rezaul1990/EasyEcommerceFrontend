import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartClient } from "@/components/storefront/CartClient";

export const metadata = {
  title: "Cart | EasyEcommerce",
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Review</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Cart</h1>
        </div>
        <CartClient />
      </main>
    </>
  );
}
