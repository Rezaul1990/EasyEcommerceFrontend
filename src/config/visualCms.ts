export const visualCmsEditorEnabled = process.env.NEXT_PUBLIC_VISUAL_CMS_EDITOR_ENABLED === "true";

export const supportedVisualSectionTypes = ["hero", "featured-products", "content", "cta"] as const;

export type VisualSectionType = (typeof supportedVisualSectionTypes)[number];

export const visualCmsStyleKeys = ["backgroundColor", "headingColor", "textColor", "buttonBackgroundColor", "buttonTextColor"] as const;

export const visualCmsLayoutKeys = ["container", "alignment", "spacingY"] as const;

export const visualCmsPreviewParam = "visualEditor";

export type VisualCmsPreviewSearchParams = Record<string, string | string[] | undefined> | undefined;

export function isVisualCmsPreviewMode(searchParams: VisualCmsPreviewSearchParams) {
  const value = searchParams?.[visualCmsPreviewParam];
  return Array.isArray(value) ? value.includes("1") || value.includes("true") : value === "1" || value === "true";
}

export function visualCmsSectionAttrs(enabled: boolean, pageKey: string, sectionId: string) {
  return enabled
    ? {
        "data-visual-cms-section-id": sectionId,
        "data-visual-cms-page-key": pageKey,
      }
    : {};
}

export function visualCmsFieldAttrs(enabled: boolean, fieldKey: string) {
  return enabled
    ? {
        "data-visual-cms-field-key": fieldKey,
      }
    : {};
}

export type VisualCmsPreviewEventName = "PREVIEW_READY" | "SECTION_SELECTED" | "SECTION_HOVERED" | "SECTION_CONTENT_UPDATED" | "SCROLL_TO_SECTION";

export type VisualCmsPreviewMessage = {
  event: VisualCmsPreviewEventName;
  pageKey?: string;
  sectionId?: string;
  content?: Record<string, string>;
};
