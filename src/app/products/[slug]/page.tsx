import { SiteHeader } from "@/components/layout/SiteHeader";
import { sampleProducts } from "@/services/apiClient";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = sampleProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
          <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" />
        </div>
        <section className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{product.categoryId?.name}</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">{product.name}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{product.description}</p>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-3xl font-semibold text-slate-950">${product.price.toFixed(2)}</span>
            {product.compareAtPrice ? <span className="text-lg text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</span> : null}
          </div>
          <button className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white sm:w-auto">
            <ShoppingCart size={18} />
            Add to cart
          </button>
        </section>
      </main>
    </>
  );
}
