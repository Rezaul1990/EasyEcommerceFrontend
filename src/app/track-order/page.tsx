import { contentValue } from "@/config/contentFields";
import { isVisualCmsPreviewMode, visualCmsFieldAttrs, visualCmsFieldStyle, visualCmsSectionAttrs, visualCmsSectionStyle, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
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
  const headerStyles = pageContent.styles?.["page-header"];
  const headerLayout = pageContent.layout?.["page-header"];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="track-order" /> : null}
        <div className="mb-6" style={visualCmsSectionStyle(headerStyles, headerLayout)} {...visualCmsSectionAttrs(visualPreview, "track-order", "page-header")}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" style={visualCmsFieldStyle(headerStyles, "text")} {...visualCmsFieldAttrs(visualPreview, "eyebrow", "text")}>{contentValue(content, "eyebrow", "Order status")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950" style={visualCmsFieldStyle(headerStyles, "heading")} {...visualCmsFieldAttrs(visualPreview, "title", "heading")}>{contentValue(content, "title", "Track order")}</h1>
        </div>
        <TrackOrderClient initialOrderNumber={params?.order || ""} initialPhone={params?.phone || ""} />
      </main>
    </>
  );
}
