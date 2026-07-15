import { AdminShell } from "@/components/admin/AdminShell";
import { visualCmsEditorEnabled } from "@/config/visualCms";
import { Eye, FilePenLine, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
          A protected foundation for editing the real client page in later phases. Existing content editing remains available while the visual editor is behind a feature flag.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        {visualCmsEditorEnabled ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="inline-flex size-11 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                <Eye size={22} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">Visual editor foundation is enabled</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Phase 1 only creates the safe entry point, feature flag, and shared section contracts. Live client-page preview, content editing, styling, section management, and publishing are intentionally reserved for later phases.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Rollback path</p>
              <p className="mt-2 text-sm text-slate-600">The current Content Editor remains available until the new Visual Editor is fully verified.</p>
              <Link href="/admin/content" className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                <FilePenLine size={16} />
                Open Content Editor
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="inline-flex size-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <ShieldCheck size={22} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Visual editor is disabled</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Set <span className="font-mono text-xs font-semibold">NEXT_PUBLIC_VISUAL_CMS_EDITOR_ENABLED=true</span> to expose this development-only editor entry point. Current admin content editing is unchanged.
            </p>
            <Link href="/admin/content" className="mt-5 inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
              <FilePenLine size={16} />
              Use existing editor
            </Link>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
