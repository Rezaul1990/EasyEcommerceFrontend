import { contentValue } from "@/config/contentFields";
import { isVisualCmsPreviewMode, visualCmsFieldAttrs, visualCmsSectionAttrs, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartClient } from "@/components/storefront/CartClient";
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {visualPreview ? <VisualCmsPreviewBridge pageKey="cart" /> : null}
        <div className="mb-6" {...visualCmsSectionAttrs(visualPreview, "cart", "page-header")}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" {...visualCmsFieldAttrs(visualPreview, "eyebrow")}>{contentValue(content, "eyebrow", "Review")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950" {...visualCmsFieldAttrs(visualPreview, "title")}>{contentValue(content, "title", "Cart")}</h1>
        </div>
        <CartClient />
      </main>
    </>
  );
}
