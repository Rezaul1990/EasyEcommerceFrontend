import { AdminShell } from "@/components/admin/AdminShell";
import { VisualEditorClient } from "@/components/admin/VisualEditorClient";
import { visualCmsEditorEnabled } from "@/config/visualCms";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Visual Editor | EasyEcommerce Admin",
};

export default function VisualEditorPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Storefront</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Visual Editor</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Edit the real client-facing page with instant preview, controlled design settings, section management, and save-and-publish updates.
        </p>
      </div>

      {visualCmsEditorEnabled ? (
        <VisualEditorClient />
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="max-w-2xl">
            <div className="inline-flex size-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <ShieldCheck size={22} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Visual editor is disabled</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Set <span className="font-mono text-xs font-semibold">NEXT_PUBLIC_VISUAL_CMS_EDITOR_ENABLED=true</span> or remove the override to enable the production Visual Editor.</p>
          </div>
        </section>
      )}
    </AdminShell>
  );
}
