"use client";

import { editablePageDefinitions, pageDefinitionFor, sectionFields, type ContentField } from "@/config/contentFields";
import type { VisualCmsLayoutBySection, VisualCmsPreviewMessage, VisualCmsSectionLayout, VisualCmsSectionStyles, VisualCmsStylesBySection } from "@/config/visualCms";
import { getAdminPageContent, updateAdminPageContent } from "@/services/apiClient";
import { AlertTriangle, Check, ExternalLink, FileText, Home, Loader2, Monitor, Save, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Viewport = "desktop" | "tablet" | "mobile";

function fieldValue(content: Record<string, string>, field: ContentField) {
  return content[field.key] || field.fallback;
}

function previewWidth(viewport: Viewport) {
  if (viewport === "mobile") return "max-w-[390px]";
  if (viewport === "tablet") return "max-w-[820px]";
  return "max-w-full";
}

function contentSignature(content: Record<string, unknown>) {
  return JSON.stringify(Object.entries(content).sort(([a], [b]) => a.localeCompare(b)));
}

function settingsSignature(settings: Record<string, Record<string, string>>) {
  return JSON.stringify(
    Object.entries(settings)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sectionId, values]) => [sectionId, Object.entries(values).sort(([a], [b]) => a.localeCompare(b))]),
  );
}

function ColorControl({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value || "#ffffff"} onChange={(event) => onChange(event.target.value)} className="size-9 rounded border border-slate-300 bg-white p-1" />
        <button type="button" onClick={() => onChange("")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500">
          Clear
        </button>
      </span>
    </label>
  );
}

function SelectControl({ label, value, options, onChange }: { label: string; value?: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
        <option value="">Default</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function VisualEditorClient() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [pageKey, setPageKey] = useState(editablePageDefinitions[0].pageKey);
  const [content, setContent] = useState<Record<string, string>>({});
  const [savedContent, setSavedContent] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<VisualCmsStylesBySection>({});
  const [savedStyles, setSavedStyles] = useState<VisualCmsStylesBySection>({});
  const [layout, setLayout] = useState<VisualCmsLayoutBySection>({});
  const [savedLayout, setSavedLayout] = useState<VisualCmsLayoutBySection>({});
  const [selectedSectionId, setSelectedSectionId] = useState(editablePageDefinitions[0].sections[0].id);
  const [selectedFieldKey, setSelectedFieldKey] = useState(editablePageDefinitions[0].sections[0].fieldKeys[0]);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const page = useMemo(() => pageDefinitionFor(pageKey), [pageKey]);
  const selectedSection = page.sections.find((section) => section.id === selectedSectionId) || page.sections[0];
  const fields = sectionFields(page, selectedSection);
  const selectedField = fields.find((field) => field.key === selectedFieldKey) || fields[0] || page.fields[0];
  const selectedStyles = styles[selectedSectionId] || {};
  const selectedLayout = layout[selectedSectionId] || {};
  const dirty = contentSignature(content) !== contentSignature(savedContent) || settingsSignature(styles) !== settingsSignature(savedStyles) || settingsSignature(layout) !== settingsSignature(savedLayout);
  const previewUrl = `${page.path}${page.path.includes("?") ? "&" : "?"}visualEditor=1`;

  const postToPreview = useCallback((message: VisualCmsPreviewMessage) => {
    iframeRef.current?.contentWindow?.postMessage({ pageKey, ...message }, window.location.origin);
  }, [pageKey]);

  useEffect(() => {
    let ignore = false;

    async function loadPageContent() {
      setLoading(true);
      setError("");
      setSuccess("");
      setPreviewReady(false);

      try {
        const data = await getAdminPageContent(pageKey);
        if (ignore) return;
        const nextContent = data.content || {};
        const nextStyles = (data.styles || {}) as VisualCmsStylesBySection;
        const nextLayout = (data.layout || {}) as VisualCmsLayoutBySection;
        const nextPage = pageDefinitionFor(pageKey);
        const nextSection = nextPage.sections[0];
        setContent(nextContent);
        setSavedContent(nextContent);
        setStyles(nextStyles);
        setSavedStyles(nextStyles);
        setLayout(nextLayout);
        setSavedLayout(nextLayout);
        setSelectedSectionId(nextSection.id);
        setSelectedFieldKey(nextSection.fieldKeys[0]);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Page content could not load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPageContent();

    return () => {
      ignore = true;
    };
  }, [pageKey]);

  useEffect(() => {
    if (!previewReady) return;
    postToPreview({ event: "SECTION_CONTENT_UPDATED", content });
  }, [content, postToPreview, previewReady]);

  useEffect(() => {
    if (!previewReady) return;
    postToPreview({ event: "SECTION_STYLE_UPDATED", styles, layout });
  }, [layout, postToPreview, previewReady, styles]);

  useEffect(() => {
    if (!previewReady || !selectedSectionId) return;
    postToPreview({ event: "SCROLL_TO_SECTION", sectionId: selectedSectionId });
  }, [postToPreview, previewReady, selectedSectionId]);

  useEffect(() => {
    function handlePreviewMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as VisualCmsPreviewMessage;
      if (!data || data.pageKey !== pageKey) return;

      if (data.event === "PREVIEW_READY") {
        setPreviewReady(true);
        postToPreview({ event: "SECTION_CONTENT_UPDATED", content });
        postToPreview({ event: "SECTION_STYLE_UPDATED", styles, layout });
        postToPreview({ event: "SCROLL_TO_SECTION", sectionId: selectedSectionId });
      }

      if (data.event === "SECTION_SELECTED" && data.sectionId) {
        const nextSection = page.sections.find((section) => section.id === data.sectionId);
        if (nextSection) {
          setSelectedSectionId(nextSection.id);
          setSelectedFieldKey(nextSection.fieldKeys[0]);
        }
      }
    }

    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, [content, layout, page.sections, pageKey, postToPreview, selectedSectionId, styles]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function selectPage(nextPageKey: string) {
    if (nextPageKey === pageKey) return;
    if (dirty && !window.confirm("You have unsaved changes. Switch pages and discard local edits?")) return;
    setPageKey(nextPageKey);
  }

  function selectSection(sectionId: string) {
    const nextSection = page.sections.find((section) => section.id === sectionId);
    if (!nextSection) return;
    setSelectedSectionId(sectionId);
    setSelectedFieldKey(nextSection.fieldKeys[0]);
  }

  function updateField(key: string, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
    setSuccess("");
  }

  function updateStyle(key: keyof VisualCmsSectionStyles, value: string) {
    setStyles((current) => {
      const sectionStyles = { ...(current[selectedSectionId] || {}) };
      if (value) sectionStyles[key] = value;
      else delete sectionStyles[key];
      return { ...current, [selectedSectionId]: sectionStyles };
    });
    setSuccess("");
  }

  function updateLayout(key: keyof VisualCmsSectionLayout, value: string) {
    setLayout((current) => {
      const sectionLayout = { ...(current[selectedSectionId] || {}) };
      if (value) sectionLayout[key] = value;
      else delete sectionLayout[key];
      return { ...current, [selectedSectionId]: sectionLayout };
    });
    setSuccess("");
  }

  function resetSectionDesign() {
    setStyles((current) => ({ ...current, [selectedSectionId]: {} }));
    setLayout((current) => ({ ...current, [selectedSectionId]: {} }));
    setSuccess("");
  }

  async function saveChanges() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await updateAdminPageContent(pageKey, { content, styles, layout, status: "published" });
      const nextContent = data.content || {};
      const nextStyles = (data.styles || {}) as VisualCmsStylesBySection;
      const nextLayout = (data.layout || {}) as VisualCmsLayoutBySection;
      setContent(nextContent);
      setSavedContent(nextContent);
      setStyles(nextStyles);
      setSavedStyles(nextStyles);
      setLayout(nextLayout);
      setSavedLayout(nextLayout);
      setSuccess("Changes saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Changes could not be saved");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setContent(savedContent);
    setStyles(savedStyles);
    setLayout(savedLayout);
    setSuccess("Local changes discarded");
  }

  return (
    <div className="-mx-4 -mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white sm:-mx-6 lg:-mx-8">
      <div className="flex min-h-[calc(100vh-170px)] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{page.label}</p>
            <p className="text-xs text-slate-500">{dirty ? "Unsaved local edits" : "Preview matches saved content"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {[
                { value: "desktop", icon: Monitor, label: "Desktop" },
                { value: "tablet", icon: Tablet, label: "Tablet" },
                { value: "mobile", icon: Smartphone, label: "Mobile" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.value} type="button" onClick={() => setViewport(item.value as Viewport)} className={`grid size-8 place-items-center rounded ${viewport === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} aria-label={item.label}>
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>
            <a href={page.path} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
              <ExternalLink size={15} />
              Live
            </a>
            <button type="button" onClick={discardChanges} disabled={!dirty || saving} className="h-9 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400">
              Discard
            </button>
            <button type="button" onClick={saveChanges} disabled={!dirty || saving || loading} className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
              {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_1fr_340px]">
          <aside className="border-r border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">Pages</h2>
            </div>
            <div className="space-y-1 p-4">
              {editablePageDefinitions.map((item) => {
                const active = item.pageKey === pageKey;
                return (
                  <button key={item.pageKey} type="button" onClick={() => selectPage(item.pageKey)} className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left ${active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-white"}`}>
                    {item.pageKey === "home" ? <Home size={16} /> : <FileText size={16} />}
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block text-xs text-slate-500">{item.path}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-y border-slate-200 bg-white px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">Sections</h2>
            </div>
            <div className="space-y-2 p-4">
              {page.sections.map((section, index) => {
                const active = section.id === selectedSectionId;
                return (
                  <button key={section.id} type="button" onClick={() => selectSection(section.id)} className={`w-full rounded-md border px-3 py-3 text-left ${active ? "border-teal-300 bg-white text-teal-900 shadow-sm" : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white"}`}>
                    <span className="block text-sm font-semibold">{index + 1}. {section.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{section.description}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 overflow-auto bg-slate-100 p-4">
            {error ? <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
            {!previewReady ? (
              <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle size={15} />
                Loading live preview...
              </p>
            ) : null}
            <div className={`mx-auto h-[760px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-all ${previewWidth(viewport)}`}>
              <iframe
                ref={iframeRef}
                key={pageKey}
                title={`${page.label} live visual preview`}
                src={previewUrl}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="h-full w-full bg-white"
                onLoad={() => {
                  setPreviewReady(false);
                  postToPreview({ event: "SECTION_CONTENT_UPDATED", content });
                }}
              />
            </div>
          </main>

          <aside className="border-l border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">{selectedSection.label}</h2>
              <p className="mt-1 text-xs text-slate-500">{selectedSection.description}</p>
            </div>
            <div className="space-y-4 p-4">
              {loading ? <p className="text-sm text-slate-500">Loading fields...</p> : null}
              {fields.map((field) => (
                <label key={field.key} className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>{field.label}</span>
                  {field.multiline ? (
                    <textarea value={fieldValue(content, field)} onFocus={() => setSelectedFieldKey(field.key)} onChange={(event) => updateField(field.key, event.target.value)} rows={5} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  ) : (
                    <input value={fieldValue(content, field)} onFocus={() => setSelectedFieldKey(field.key)} onChange={(event) => updateField(field.key, event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  )}
                </label>
              ))}
              <button type="button" onClick={() => updateField(selectedField.key, selectedField.fallback)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                Reset selected field
              </button>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Colors</h3>
                <div className="mt-3 space-y-3">
                  <ColorControl label="Background" value={selectedStyles.backgroundColor} onChange={(value) => updateStyle("backgroundColor", value)} />
                  <ColorControl label="Heading" value={selectedStyles.headingColor} onChange={(value) => updateStyle("headingColor", value)} />
                  <ColorControl label="Text" value={selectedStyles.textColor} onChange={(value) => updateStyle("textColor", value)} />
                  <ColorControl label="Button background" value={selectedStyles.buttonBackgroundColor} onChange={(value) => updateStyle("buttonBackgroundColor", value)} />
                  <ColorControl label="Button text" value={selectedStyles.buttonTextColor} onChange={(value) => updateStyle("buttonTextColor", value)} />
                  <ColorControl label="Border" value={selectedStyles.borderColor} onChange={(value) => updateStyle("borderColor", value)} />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Typography</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <SelectControl label="Font size" value={selectedStyles.fontSize} onChange={(value) => updateStyle("fontSize", value)} options={[
                    { value: "sm", label: "Small" },
                    { value: "base", label: "Base" },
                    { value: "lg", label: "Large" },
                    { value: "xl", label: "XL" },
                    { value: "2xl", label: "2XL" },
                    { value: "3xl", label: "3XL" },
                    { value: "4xl", label: "4XL" },
                    { value: "5xl", label: "5XL" },
                  ]} />
                  <SelectControl label="Font weight" value={selectedStyles.fontWeight} onChange={(value) => updateStyle("fontWeight", value)} options={[
                    { value: "normal", label: "Normal" },
                    { value: "medium", label: "Medium" },
                    { value: "semibold", label: "Semibold" },
                    { value: "bold", label: "Bold" },
                  ]} />
                  <SelectControl label="Line height" value={selectedStyles.lineHeight} onChange={(value) => updateStyle("lineHeight", value)} options={[
                    { value: "tight", label: "Tight" },
                    { value: "normal", label: "Normal" },
                    { value: "relaxed", label: "Relaxed" },
                  ]} />
                  <SelectControl label="Letter spacing" value={selectedStyles.letterSpacing} onChange={(value) => updateStyle("letterSpacing", value)} options={[
                    { value: "normal", label: "Normal" },
                    { value: "wide", label: "Wide" },
                  ]} />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Layout</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <SelectControl label="Text alignment" value={selectedLayout.alignment} onChange={(value) => updateLayout("alignment", value)} options={[
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                  ]} />
                  <SelectControl label="Vertical spacing" value={selectedLayout.spacingY} onChange={(value) => updateLayout("spacingY", value)} options={[
                    { value: "compact", label: "Compact" },
                    { value: "normal", label: "Normal" },
                    { value: "spacious", label: "Spacious" },
                  ]} />
                  <SelectControl label="Minimum height" value={selectedLayout.minHeight} onChange={(value) => updateLayout("minHeight", value)} options={[
                    { value: "none", label: "None" },
                    { value: "sm", label: "Small" },
                    { value: "md", label: "Medium" },
                    { value: "lg", label: "Large" },
                  ]} />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Decoration</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <SelectControl label="Border width" value={selectedStyles.borderWidth} onChange={(value) => updateStyle("borderWidth", value)} options={[
                    { value: "none", label: "None" },
                    { value: "thin", label: "Thin" },
                    { value: "medium", label: "Medium" },
                  ]} />
                  <SelectControl label="Radius" value={selectedStyles.borderRadius} onChange={(value) => updateStyle("borderRadius", value)} options={[
                    { value: "none", label: "None" },
                    { value: "sm", label: "Small" },
                    { value: "md", label: "Medium" },
                    { value: "lg", label: "Large" },
                  ]} />
                  <SelectControl label="Shadow" value={selectedStyles.shadow} onChange={(value) => updateStyle("shadow", value)} options={[
                    { value: "none", label: "None" },
                    { value: "sm", label: "Small" },
                    { value: "md", label: "Medium" },
                    { value: "lg", label: "Large" },
                  ]} />
                </div>
              </div>
              <button type="button" onClick={resetSectionDesign} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                Reset section design
              </button>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                <p className="flex items-center gap-2 font-semibold text-slate-700">
                  <Check size={14} />
                  Live preview only
                </p>
                <p className="mt-1">Edits update the iframe immediately. MongoDB is updated only when you save.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
