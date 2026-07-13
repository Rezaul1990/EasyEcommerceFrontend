"use client";

import { editablePageDefinitions, pageDefinitionFor, type ContentField } from "@/config/contentFields";
import { getAdminPageContent, updateAdminPageContent } from "@/services/apiClient";
import { Check, ChevronDown, Copy, ExternalLink, FileText, Home, Languages, Layers, Monitor, Plus, Redo2, Save, Settings2, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function fieldValue(content: Record<string, string>, field: ContentField) {
  return content[field.key] || field.fallback;
}

function fieldTone(field: ContentField) {
  if (field.key.toLowerCase().includes("title")) return "text-4xl font-semibold leading-tight text-slate-950";
  if (field.key.toLowerCase().includes("button") || field.key.toLowerCase().includes("link")) return "inline-flex w-auto rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white";
  if (field.multiline || field.key.toLowerCase().includes("subtitle")) return "text-lg leading-8 text-slate-600";
  return "text-sm font-semibold uppercase tracking-wide text-teal-700";
}

export function ContentEditorClient() {
  const [pageKey, setPageKey] = useState(editablePageDefinitions[0].pageKey);
  const [content, setContent] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState(editablePageDefinitions[0].fields[0].key);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const page = useMemo(() => pageDefinitionFor(pageKey), [pageKey]);
  const selectedField = page.fields.find((field) => field.key === selectedKey) || page.fields[0];
  const canvasWidth = viewport === "desktop" ? "max-w-6xl" : viewport === "tablet" ? "max-w-3xl" : "max-w-sm";

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
      setSuccess("Published changes saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Content could not be saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="-mx-4 -mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white sm:-mx-6 lg:-mx-8">
      <div className="flex min-h-[calc(100vh-170px)] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-500">
              Site
              <div className="text-sm text-slate-950">{page.label}</div>
            </div>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
              <Languages size={15} />
              English
              <ChevronDown size={14} />
            </button>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
              <button className="grid size-8 place-items-center rounded text-slate-400" aria-label="Undo">
                <Undo2 size={15} />
              </button>
              <button className="grid size-8 place-items-center rounded text-slate-400" aria-label="Redo">
                <Redo2 size={15} />
              </button>
            </div>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {[
                { value: "desktop", icon: Monitor, label: "Desktop" },
                { value: "tablet", icon: Tablet, label: "Tablet" },
                { value: "mobile", icon: Smartphone, label: "Mobile" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.value} onClick={() => setViewport(item.value as "desktop" | "tablet" | "mobile")} className={`grid size-8 place-items-center rounded ${viewport === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} aria-label={item.label}>
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={page.path} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
              <ExternalLink size={15} />
              Live
            </a>
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">
              <Check size={15} />
              Published
            </span>
            <button onClick={saveContent} disabled={saving || loading} className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white disabled:bg-slate-400">
              <Save size={15} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_360px]">
          <aside className="border-r border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">Pages</h2>
              <button className="text-slate-400" aria-label="Page settings">
                <Settings2 size={16} />
              </button>
            </div>
            <div className="p-4">
              <button className="mb-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-700">
                <Plus size={16} />
                Add page
              </button>
              <div className="space-y-1">
                {editablePageDefinitions.map((item) => {
                  const active = item.pageKey === pageKey;
                  return (
                    <button key={item.pageKey} onClick={() => handlePageChange(item.pageKey)} className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left ${active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-white"}`}>
                      <span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {item.pageKey === "home" ? <Home size={15} /> : <FileText size={15} />}
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">{item.path}</span>
                      </span>
                      <span className="size-2 rounded-full bg-teal-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-w-0 overflow-auto bg-slate-100 p-4">
            {error ? <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
            <div className={`relative mx-auto min-h-[680px] ${canvasWidth} border border-slate-200 bg-white shadow-sm transition-all`}>
              <div className="flex h-16 items-center justify-center gap-8 border-b border-slate-100 text-sm font-semibold text-slate-800">
                <span>Home</span>
                <span>Products</span>
                <span>Checkout</span>
                <span>Track Order</span>
                <span>Cart</span>
              </div>
              <section className="relative border-2 border-violet-500 px-8 py-10">
                <div className="absolute -top-7 left-3 rounded-t-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                  1. {page.label} / Editable content
                </div>
                <div className="absolute right-3 top-2 flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg">
                  {selectedField.label}
                  <Copy size={13} />
                  <Trash2 size={13} />
                  <Settings2 size={13} />
                </div>
                <div className="mx-auto max-w-3xl text-center">
                  {page.fields.map((field) => {
                    const active = selectedKey === field.key;
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => setSelectedKey(field.key)}
                        className={`my-2 block w-full rounded-md border px-3 py-2 text-center transition ${fieldTone(field)} ${active ? "border-violet-600 bg-violet-50 ring-2 ring-violet-100" : "border-transparent hover:border-violet-300 hover:bg-violet-50/40"}`}
                      >
                        {fieldValue(content, field)}
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="px-8 py-12">
                <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-40 rounded-md border border-slate-200 bg-slate-50" />
                  ))}
                </div>
              </section>
            </div>
          </main>

          <aside className="border-l border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Layers size={16} />
                Edit selected content
              </h2>
              <p className="mt-1 text-xs text-slate-500">{page.label} / {selectedField.label}</p>
            </div>
            <div className="space-y-4 p-4">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Text</span>
                {selectedField.multiline ? (
                  <textarea value={fieldValue(content, selectedField)} onChange={(event) => updateField(selectedField.key, event.target.value)} rows={7} className="w-full rounded-md border border-slate-300 px-3 py-2" />
                ) : (
                  <input value={fieldValue(content, selectedField)} onChange={(event) => updateField(selectedField.key, event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3" />
                )}
              </label>
              <button onClick={() => updateField(selectedField.key, selectedField.fallback)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                Reset selected text
              </button>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                Public page updates after save. Unsaved edits stay in this preview only.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
