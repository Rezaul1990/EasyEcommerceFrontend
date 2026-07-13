import { AdminShell } from "@/components/admin/AdminShell";
import { ContentEditorClient } from "@/components/admin/ContentEditorClient";

export const metadata = {
  title: "Content Editor | EasyEcommerce Admin",
};

export default function ContentEditorPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Storefront</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Content Editor</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Edit client-facing page text with a live preview. Public pages keep their default content until a saved value exists.</p>
      </div>
      <ContentEditorClient />
    </AdminShell>
  );
}
