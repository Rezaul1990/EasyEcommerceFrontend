import { defaultManagedSections } from "@/config/contentFields";
import { isVisualCmsPreviewMode, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { activeSections, PageHeaderManagedSection } from "@/components/storefront/ManagedSectionRenderers";
import { VisualCmsPreviewBridge } from "@/components/storefront/VisualCmsPreviewBridge";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Checkout | EasyEcommerce",
};

type CheckoutPageProps = {
  searchParams?: Promise<VisualCmsPreviewSearchParams>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const visualPreview = isVisualCmsPreviewMode(params);
  const pageContent = await getPublicPageContent("checkout");
  const content = pageContent.content;
  const sections = activeSections("checkout", pageContent.sections, defaultManagedSections("checkout"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="checkout" /> : null}
        {sections.map((section) => <PageHeaderManagedSection key={section.id} pageKey="checkout" section={section} maps={{ content, styles: pageContent.styles, layout: pageContent.layout }} visualPreview={visualPreview} fallbackEyebrow="Place order" fallbackTitle="Checkout" />)}
        <CheckoutClient />
      </main>
    </>
  );
}
