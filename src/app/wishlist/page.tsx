import { defaultManagedSections } from "@/config/contentFields";
import { isVisualCmsPreviewMode, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WishlistClient } from "@/components/storefront/WishlistClient";
import { activeSections, PageHeaderManagedSection } from "@/components/storefront/ManagedSectionRenderers";
import { VisualCmsPreviewBridge } from "@/components/storefront/VisualCmsPreviewBridge";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Wishlist | EasyEcommerce",
};

type WishlistPageProps = {
  searchParams?: Promise<VisualCmsPreviewSearchParams>;
};

export default async function WishlistPage({ searchParams }: WishlistPageProps) {
  const params = await searchParams;
  const visualPreview = isVisualCmsPreviewMode(params);
  const pageContent = await getPublicPageContent("wishlist");
  const content = pageContent.content;
  const sections = activeSections("wishlist", pageContent.sections, defaultManagedSections("wishlist"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="wishlist" /> : null}
        {sections.map((section) => <PageHeaderManagedSection key={section.id} pageKey="wishlist" section={section} maps={{ content, styles: pageContent.styles, layout: pageContent.layout }} visualPreview={visualPreview} fallbackEyebrow="Saved products" fallbackTitle="Wishlist" />)}
        <WishlistClient />
      </main>
    </>
  );
}
