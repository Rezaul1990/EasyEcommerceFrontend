import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { getCategories, getProducts } from "@/services/apiClient";
import { ArrowRight, BadgeCheck, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const featuredProducts = products.filter((product) => product.isFeatured).slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Modern ecommerce operations</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                EasyEcommerce
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                A complete storefront and admin foundation for selling products, managing catalog data, processing orders, and controlling staff access.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white">
                  Browse products
                  <ArrowRight size={17} />
                </Link>
                <Link href="/admin" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">
                  Open admin
                </Link>
              </div>
            </div>
            <div className="relative min-h-[360px] overflow-hidden rounded-lg bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
                alt="Packed ecommerce orders on a fulfillment table"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </section>

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

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Featured catalog</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Products ready to sell</h2>
            </div>
            <Link href="/products" className="hidden text-sm font-semibold text-teal-700 sm:inline">
              View all
            </Link>
          </div>
          <ProductGrid products={featuredProducts.length ? featuredProducts : products.slice(0, 3)} />
        </section>
      </main>
    </>
  );
}
