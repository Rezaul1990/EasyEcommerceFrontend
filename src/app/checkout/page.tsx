import { contentValue } from "@/config/contentFields";
import { isVisualCmsPreviewMode, visualCmsFieldAttrs, visualCmsFieldStyle, visualCmsSectionAttrs, visualCmsSectionStyle, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";
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
  const headerStyles = pageContent.styles?.["page-header"];
  const headerLayout = pageContent.layout?.["page-header"];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="checkout" /> : null}
        <div className="mb-6" style={visualCmsSectionStyle(headerStyles, headerLayout)} {...visualCmsSectionAttrs(visualPreview, "checkout", "page-header")}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" style={visualCmsFieldStyle(headerStyles, "text")} {...visualCmsFieldAttrs(visualPreview, "eyebrow", "text")}>{contentValue(content, "eyebrow", "Place order")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950" style={visualCmsFieldStyle(headerStyles, "heading")} {...visualCmsFieldAttrs(visualPreview, "title", "heading")}>{contentValue(content, "title", "Checkout")}</h1>
        </div>
        <CheckoutClient />
      </main>
    </>
  );
}
