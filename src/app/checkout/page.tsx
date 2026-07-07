import { SiteHeader } from "@/components/layout/SiteHeader";

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
        <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
          {["Full name", "Email", "Phone", "City"].map((label) => (
            <label key={label} className="space-y-2 text-sm font-medium text-slate-700">
              <span>{label}</span>
              <input className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" placeholder={label} />
            </label>
          ))}
          <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <span>Delivery address</span>
            <textarea className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" placeholder="Street, building, apartment" />
          </label>
          <button className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white sm:col-span-2">Place order</button>
        </form>
      </main>
    </>
  );
}
