import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";
import { getProductBySlug } from "@/services/apiClient";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <ProductDetailClient product={product} />
    </>
  );
}
