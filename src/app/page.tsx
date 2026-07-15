import { defaultManagedSections } from "@/config/contentFields";
import { isVisualCmsPreviewMode, type VisualCmsPreviewSearchParams } from "@/config/visualCms";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { activeSections, HomeManagedSection } from "@/components/storefront/ManagedSectionRenderers";
import { VisualCmsPreviewBridge } from "@/components/storefront/VisualCmsPreviewBridge";
import { getCategories, getProducts, getPublicPageContent } from "@/services/apiClient";
import { BadgeCheck, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { Fragment } from "react";

type HomePageProps = {
  searchParams?: Promise<VisualCmsPreviewSearchParams>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const visualPreview = isVisualCmsPreviewMode(params);
  const [products, categories, pageContent] = await Promise.all([getProducts(), getCategories(), getPublicPageContent("home")]);
  const content = pageContent.content;
  const sections = activeSections("home", pageContent.sections, defaultManagedSections("home"));

  return (
    <>
      <SiteHeader />
      <main>
        {visualPreview ? <VisualCmsPreviewBridge pageKey="home" /> : null}
        {sections.map((section, index) => (
          <Fragment key={section.id}>
            <HomeManagedSection section={section} maps={{ content, styles: pageContent.styles, layout: pageContent.layout }} visualPreview={visualPreview} products={products} categories={categories} />
            {index === 0 ? (
              <section className="border-y border-slate-200 bg-slate-50">
                <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                  {[
                    { icon: PackageSearch, label: "Catalog-ready", value: `${products.length} products loaded` },
                    { icon: BadgeCheck, label: "Curated categories", value: `${categories.length} active groups` },
                    { icon: Truck, label: "Checkout flow", value: "COD and manual payment-ready" },
                    { icon: ShieldCheck, label: "Admin security", value: "Owner, roles, permissions" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                        <Icon className="mt-0.5 text-teal-700" size={20} />
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </Fragment>
        ))}
      </main>
    </>
  );
}
