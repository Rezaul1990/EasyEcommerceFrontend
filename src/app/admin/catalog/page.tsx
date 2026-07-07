import { AdminShell } from "@/components/admin/AdminShell";
import { getCategories, getProducts } from "@/services/apiClient";
import { Edit, Plus, Search, Trash2 } from "lucide-react";

export const metadata = {
  title: "Catalog | EasyEcommerce Admin",
};

export default async function CatalogAdminPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Products and categories</h1>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={17} />
          Add product
        </button>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" placeholder="Search products" />
          </div>
          <select className="h-10 rounded-md border border-slate-300 px-3 text-sm">
            <option>All categories</option>
            {categories.map((category) => (
              <option key={category._id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                  <td className="px-4 py-3 text-slate-600">{product.stockQuantity}</td>
                  <td className="px-4 py-3 text-slate-600">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{product.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="grid size-8 place-items-center rounded-md border border-slate-200" aria-label="Edit product">
                        <Edit size={15} />
                      </button>
                      <button className="grid size-8 place-items-center rounded-md border border-slate-200 text-rose-600" aria-label="Archive product">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
