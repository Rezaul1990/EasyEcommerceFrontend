"use client";

import { editablePageDefinitions, pageDefinitionFor, type ContentField } from "@/config/contentFields";
import { getAdminPageContent, updateAdminPageContent } from "@/services/apiClient";
import { Eye, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function fieldValue(content: Record<string, string>, field: ContentField) {
  return content[field.key] || field.fallback;
}

export function ContentEditorClient() {
  const [pageKey, setPageKey] = useState(editablePageDefinitions[0].pageKey);
  const [content, setContent] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState(editablePageDefinitions[0].fields[0].key);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const page = useMemo(() => pageDefinitionFor(pageKey), [pageKey]);
  const selectedField = page.fields.find((field) => field.key === selectedKey) || page.fields[0];

  useEffect(() => {
    let ignore = false;
    getAdminPageContent(pageKey)
      .then((data) => {
        if (ignore) return;
        setContent(data.content || {});
        setSelectedKey(pageDefinitionFor(pageKey).fields[0].key);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Page content could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [pageKey]);

  function handlePageChange(nextPageKey: string) {
    setPageKey(nextPageKey);
    setLoading(true);
    setError("");
    setSuccess("");
  }

  function updateField(key: string, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
    setSuccess("");
  }

  async function saveContent() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await updateAdminPageContent(pageKey, { content, status: "published" });
      setContent(data.content || {});
      setSuccess("Content saved and published");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Content could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[280px_1fr_auto] md:items-end">
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Page</span>
            <select value={pageKey} onChange={(event) => handlePageChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3">
              {editablePageDefinitions.map((item) => (
                <option key={item.pageKey} value={item.pageKey}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Preview path: <span className="font-semibold text-slate-900">{page.path}</span>
          </div>
          <button onClick={saveContent} disabled={saving || loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white disabled:bg-slate-400">
            <Save size={16} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Eye size={18} />
              Client page preview
            </h2>
            <span className="text-xs font-medium text-slate-500">Click text to edit</span>
          </div>
          <div className="bg-slate-100 p-4">
            <div className="min-h-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                {page.fields.map((field) => {
                  const active = selectedKey === field.key;
                  const className = `w-full rounded-md border px-3 py-2 text-left transition ${active ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100" : "border-transparent hover:border-teal-200 hover:bg-teal-50/50"}`;
                  if (field.key === "title") {
                    return (
                      <button key={field.key} type="button" onClick={() => setSelectedKey(field.key)} className={`${className} mt-1 text-3xl font-semibold text-slate-950`}>
                        {fieldValue(content, field)}
                      </button>
                    );
                  }
                  if (field.key === "subtitle") {
                    return (
                      <button key={field.key} type="button" onClick={() => setSelectedKey(field.key)} className={`${className} mt-2 max-w-2xl text-slate-600`}>
                        {fieldValue(content, field)}
                      </button>
                    );
                  }
                  return (
                    <button key={field.key} type="button" onClick={() => setSelectedKey(field.key)} className={`${className} text-sm font-semibold uppercase tracking-wide text-teal-700`}>
                      {fieldValue(content, field)}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-44 rounded-md border border-slate-200 bg-slate-50" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">Edit selected content</h2>
          <p className="mt-1 text-sm text-slate-500">{selectedField.label}</p>
          <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
            <span>Text content</span>
            {selectedField.multiline ? (
              <textarea value={fieldValue(content, selectedField)} onChange={(event) => updateField(selectedField.key, event.target.value)} rows={6} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            ) : (
              <input value={fieldValue(content, selectedField)} onChange={(event) => updateField(selectedField.key, event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3" />
            )}
          </label>
          <button onClick={() => updateField(selectedField.key, selectedField.fallback)} className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            Reset this text
          </button>
        </aside>
      </div>
    </div>
  );
}
