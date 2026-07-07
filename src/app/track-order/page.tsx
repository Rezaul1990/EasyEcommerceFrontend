import { SiteHeader } from "@/components/layout/SiteHeader";
import { TrackOrderClient } from "@/components/storefront/TrackOrderClient";

export const metadata = {
  title: "Track Order | EasyEcommerce",
};

export default function TrackOrderPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Order status</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Track order</h1>
        </div>
        <TrackOrderClient />
      </main>
    </>
  );
}
