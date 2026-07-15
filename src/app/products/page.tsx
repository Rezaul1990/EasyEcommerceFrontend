import { contentValue } from "@/config/contentFields";
import { isVisualCmsPreviewMode, visualCmsFieldAttrs, visualCmsSectionAttrs, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CouponShowcase } from "@/components/storefront/CouponShowcase";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { VisualCmsPreviewBridge } from "@/components/storefront/VisualCmsPreviewBridge";
import { getActiveCoupons, getCategories, getProducts, getPublicPageContent, getPublicStoreSettings } from "@/services/apiClient";

export const metadata = {
  title: "Products | EasyEcommerce",
};

type ProductsPageProps = {
  searchParams?: Promise<VisualCmsPreviewSearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const visualPreview = isVisualCmsPreviewMode(params);
  const [products, categories, coupons, pageContent, storeSettings] = await Promise.all([getProducts(), getCategories(), getActiveCoupons(), getPublicPageContent("products"), getPublicStoreSettings()]);
  const content = pageContent.content;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="products" /> : null}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end" {...visualCmsSectionAttrs(visualPreview, "products", "page-header")}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" {...visualCmsFieldAttrs(visualPreview, "eyebrow")}>{contentValue(content, "eyebrow", "Shop")}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950" {...visualCmsFieldAttrs(visualPreview, "title")}>{contentValue(content, "title", "Products")}</h1>
            <p className="mt-2 max-w-2xl text-slate-600" {...visualCmsFieldAttrs(visualPreview, "subtitle")}>{contentValue(content, "subtitle", "Browse the active catalog and use eligible coupons for instant checkout savings.")}</p>
          </div>
        </div>
        <CouponShowcase coupons={coupons} />
        <ProductGrid products={products} categories={categories} currency={storeSettings?.currency || "BDT"} />
      </main>
    </>
  );
}
