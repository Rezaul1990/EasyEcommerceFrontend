import { contentValue } from "@/config/contentFields";
import { isVisualCmsPreviewMode, visualCmsFieldAttrs, visualCmsSectionAttrs, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="track-order" /> : null}
        <div className="mb-6" {...visualCmsSectionAttrs(visualPreview, "track-order", "page-header")}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" {...visualCmsFieldAttrs(visualPreview, "eyebrow")}>{contentValue(content, "eyebrow", "Order status")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950" {...visualCmsFieldAttrs(visualPreview, "title")}>{contentValue(content, "title", "Track order")}</h1>
        </div>
        <TrackOrderClient initialOrderNumber={params?.order || ""} initialPhone={params?.phone || ""} />
      </main>
    </>
  );
}
