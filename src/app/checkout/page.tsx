import { contentValue } from "@/config/contentFields";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Checkout | EasyEcommerce",
};

export default async function CheckoutPage() {
  const pageContent = await getPublicPageContent("checkout");
  const content = pageContent.content;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{contentValue(content, "eyebrow", "Place order")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{contentValue(content, "title", "Checkout")}</h1>
        </div>
        <CheckoutClient />
      </main>
    </>
  );
}
