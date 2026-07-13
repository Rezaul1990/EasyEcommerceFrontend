import { contentValue } from "@/config/contentFields";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TrackOrderClient } from "@/components/storefront/TrackOrderClient";
import { getPublicPageContent } from "@/services/apiClient";

export const metadata = {
  title: "Track Order | EasyEcommerce",
};

type TrackOrderPageProps = {
  searchParams?: Promise<{
    order?: string;
    phone?: string;
  }>;
};

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const [params, pageContent] = await Promise.all([searchParams, getPublicPageContent("track-order")]);
  const content = pageContent.content;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{contentValue(content, "eyebrow", "Order status")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{contentValue(content, "title", "Track order")}</h1>
        </div>
        <TrackOrderClient initialOrderNumber={params?.order || ""} initialPhone={params?.phone || ""} />
      </main>
    </>
  );
}
