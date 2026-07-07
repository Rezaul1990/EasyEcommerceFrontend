import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { getCategories, getProducts } from "@/services/apiClient";

export const metadata = {
  title: "Products | EasyEcommerce",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Shop</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Products</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Browse the active catalog. The API client falls back to sample data until MongoDB is configured.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category._id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                {category.name}
              </span>
            ))}
          </div>
        </div>
        <ProductGrid products={products} />
      </main>
    </>
  );
}
