import { defaultManagedSections } from "@/config/contentFields";
import { isVisualCmsPreviewMode, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { activeSections, PageHeaderManagedSection } from "@/components/storefront/ManagedSectionRenderers";
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
  const sections = activeSections("products", pageContent.sections, defaultManagedSections("products"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="products" /> : null}
        {sections.map((section) => <PageHeaderManagedSection key={section.id} pageKey="products" section={section} maps={{ content, styles: pageContent.styles, layout: pageContent.layout }} visualPreview={visualPreview} fallbackEyebrow="Shop" fallbackTitle="Products" fallbackSubtitle="Browse the active catalog and use eligible coupons for instant checkout savings." />)}
        <CouponShowcase coupons={coupons} />
        <ProductGrid products={products} categories={categories} currency={storeSettings?.currency || "BDT"} />
      </main>
    </>
  );
}
