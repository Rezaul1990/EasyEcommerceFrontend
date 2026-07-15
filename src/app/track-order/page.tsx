import { defaultManagedSections } from "@/config/contentFields";
import { isVisualCmsPreviewMode, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { activeSections, PageHeaderManagedSection } from "@/components/storefront/ManagedSectionRenderers";
import { TrackOrderClient } from "@/components/storefront/TrackOrderClient";
import { VisualCmsPreviewBridge } from "@/components/storefront/VisualCmsPreviewBridge";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Track Order | EasyEcommerce",
};

type TrackOrderPageProps = {
  searchParams?: Promise<{
    order?: string;
    phone?: string;
  } & VisualCmsPreviewSearchParams>;
};

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const [params, pageContent] = await Promise.all([searchParams, getPublicPageContent("track-order")]);
  const visualPreview = isVisualCmsPreviewMode(params);
  const content = pageContent.content;
  const sections = activeSections("track-order", pageContent.sections, defaultManagedSections("track-order"));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="track-order" /> : null}
        {sections.map((section) => <PageHeaderManagedSection key={section.id} pageKey="track-order" section={section} maps={{ content, styles: pageContent.styles, layout: pageContent.layout }} visualPreview={visualPreview} fallbackEyebrow="Order status" fallbackTitle="Track order" />)}
        <TrackOrderClient initialOrderNumber={params?.order || ""} initialPhone={params?.phone || ""} />
      </main>
    </>
  );
}
