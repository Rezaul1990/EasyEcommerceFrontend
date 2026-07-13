import { contentValue } from "@/config/contentFields";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WishlistClient } from "@/components/storefront/WishlistClient";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Wishlist | EasyEcommerce",
};

export default async function WishlistPage() {
  const pageContent = await getPublicPageContent("wishlist");
  const content = pageContent.content;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{contentValue(content, "eyebrow", "Saved products")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{contentValue(content, "title", "Wishlist")}</h1>
        </div>
        <WishlistClient />
      </main>
    </>
  );
}
