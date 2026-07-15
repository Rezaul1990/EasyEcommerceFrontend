import { defaultManagedSections } from "@/config/contentFields";
import { isVisualCmsPreviewMode, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartClient } from "@/components/storefront/CartClient";
import { activeSections, PageHeaderManagedSection } from "@/components/storefront/ManagedSectionRenderers";
import { VisualCmsPreviewBridge } from "@/components/storefront/VisualCmsPreviewBridge";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Cart | EasyEcommerce",
};

type CartPageProps = {
  searchParams?: Promise<VisualCmsPreviewSearchParams>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const params = await searchParams;
  const visualPreview = isVisualCmsPreviewMode(params);
  const pageContent = await getPublicPageContent("cart");
  const content = pageContent.content;
  const sections = activeSections("cart", pageContent.sections, defaultManagedSections("cart"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="cart" /> : null}
        {sections.map((section) => <PageHeaderManagedSection key={section.id} pageKey="cart" section={section} maps={{ content, styles: pageContent.styles, layout: pageContent.layout }} visualPreview={visualPreview} fallbackEyebrow="Review" fallbackTitle="Cart" />)}
        <CartClient />
      </main>
    </>
  );
}
