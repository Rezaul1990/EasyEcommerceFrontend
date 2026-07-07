import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";

export const metadata = {
  title: "Checkout | EasyEcommerce",
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Place order</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Checkout</h1>
        </div>
        <CheckoutClient />
      </main>
    </>
  );
}
