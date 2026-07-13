import { contentValue } from "@/config/contentFields";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CouponShowcase } from "@/components/storefront/CouponShowcase";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { getActiveCoupons, getCategories, getProducts, getPublicPageContent, getPublicStoreSettings } from "@/services/apiClient";

export const metadata = {
  title: "Products | EasyEcommerce",
};

export default async function ProductsPage() {
  const [products, categories, coupons, pageContent, storeSettings] = await Promise.all([getProducts(), getCategories(), getActiveCoupons(), getPublicPageContent("products"), getPublicStoreSettings()]);
  const content = pageContent.content;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{contentValue(content, "eyebrow", "Shop")}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{contentValue(content, "title", "Products")}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">{contentValue(content, "subtitle", "Browse the active catalog and use eligible coupons for instant checkout savings.")}</p>
          </div>
        </div>
        <CouponShowcase coupons={coupons} />
        <ProductGrid products={products} categories={categories} currency={storeSettings?.currency || "BDT"} />
      </main>
    </>
  );
}
