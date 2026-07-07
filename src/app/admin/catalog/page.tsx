import { AdminShell } from "@/components/admin/AdminShell";
import { CatalogManagerClient } from "@/components/admin/CatalogManagerClient";

export const metadata = {
  title: "Catalog | EasyEcommerce Admin",
};

export default function CatalogAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Products and categories</h1>
        </div>
      </div>
      <CatalogManagerClient />
    </AdminShell>
  );
}
