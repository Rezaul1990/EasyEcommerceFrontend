import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: "Settings | EasyEcommerce Admin",
};

export default function SettingsAdminPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Store setup</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Settings</h1>
      </div>
      <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        {[
          "Business name",
          "Contact email",
          "Contact phone",
          "Currency",
          "Timezone",
          "Shipping fee",
        ].map((label) => (
          <label key={label} className="space-y-2 text-sm font-medium text-slate-700">
            <span>{label}</span>
            <input className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" placeholder={label} />
          </label>
        ))}
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Business address</span>
          <textarea className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" placeholder="Address" />
        </label>
        <button className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white md:col-span-2">Save settings</button>
      </form>
    </AdminShell>
  );
}
