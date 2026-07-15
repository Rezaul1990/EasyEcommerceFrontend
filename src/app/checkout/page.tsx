import { contentValue } from "@/config/contentFields";
import { isVisualCmsPreviewMode, visualCmsFieldAttrs, visualCmsSectionAttrs, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="checkout" /> : null}
        <div className="mb-6" {...visualCmsSectionAttrs(visualPreview, "checkout", "page-header")}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" {...visualCmsFieldAttrs(visualPreview, "eyebrow")}>{contentValue(content, "eyebrow", "Place order")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950" {...visualCmsFieldAttrs(visualPreview, "title")}>{contentValue(content, "title", "Checkout")}</h1>
        </div>
        <CheckoutClient />
      </main>
    </>
  );
}
