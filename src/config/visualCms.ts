import type { CSSProperties } from "react";

export const visualCmsEditorEnabled = process.env.NEXT_PUBLIC_VISUAL_CMS_EDITOR_ENABLED === "true";

export const supportedVisualSectionTypes = ["hero", "featured-products", "content", "cta"] as const;

export type VisualSectionType = (typeof supportedVisualSectionTypes)[number];

export const visualCmsStyleKeys = [
  "backgroundColor",
  "headingColor",
  "textColor",
  "buttonBackgroundColor",
  "buttonTextColor",
  "borderColor",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "borderWidth",
  "borderRadius",
  "shadow",
] as const;

export const visualCmsLayoutKeys = ["container", "alignment", "spacingY", "contentWidth", "gap", "minHeight"] as const;

export type VisualCmsSectionStyles = Partial<Record<(typeof visualCmsStyleKeys)[number], string>>;

export type VisualCmsSectionLayout = Partial<Record<(typeof visualCmsLayoutKeys)[number], string>>;

export type VisualCmsStylesBySection = Record<string, VisualCmsSectionStyles>;

export type VisualCmsLayoutBySection = Record<string, VisualCmsSectionLayout>;

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

export function visualCmsFieldAttrs(enabled: boolean, fieldKey: string, role: "heading" | "text" | "button" = "text") {
  return enabled
    ? {
        "data-visual-cms-field-key": fieldKey,
        "data-visual-cms-field-role": role,
      }
    : {};
}

const fontSizeMap: Record<string, string> = {
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
};

const fontWeightMap: Record<string, CSSProperties["fontWeight"]> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const lineHeightMap: Record<string, CSSProperties["lineHeight"]> = {
  tight: 1.15,
  normal: 1.45,
  relaxed: 1.75,
};

const borderWidthMap: Record<string, string> = {
  none: "0",
  thin: "1px",
  medium: "2px",
};

const radiusMap: Record<string, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
};

const shadowMap: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgb(15 23 42 / 0.08)",
  md: "0 8px 18px rgb(15 23 42 / 0.10)",
  lg: "0 18px 35px rgb(15 23 42 / 0.14)",
};

const spacingMap: Record<string, string> = {
  compact: "1.5rem",
  normal: "3rem",
  spacious: "5rem",
};

const minHeightMap: Record<string, string> = {
  none: "auto",
  sm: "280px",
  md: "420px",
  lg: "560px",
};

function safeColor(value?: string) {
  return value && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value) ? value : undefined;
}

export function visualCmsSectionStyle(styles: VisualCmsSectionStyles = {}, layout: VisualCmsSectionLayout = {}): CSSProperties {
  return {
    backgroundColor: safeColor(styles.backgroundColor),
    borderColor: safeColor(styles.borderColor),
    borderStyle: styles.borderWidth && styles.borderWidth !== "none" ? "solid" : undefined,
    borderWidth: styles.borderWidth ? borderWidthMap[styles.borderWidth] : undefined,
    borderRadius: styles.borderRadius ? radiusMap[styles.borderRadius] : undefined,
    boxShadow: styles.shadow ? shadowMap[styles.shadow] : undefined,
    minHeight: layout.minHeight ? minHeightMap[layout.minHeight] : undefined,
    paddingTop: layout.spacingY ? spacingMap[layout.spacingY] : undefined,
    paddingBottom: layout.spacingY ? spacingMap[layout.spacingY] : undefined,
    textAlign: layout.alignment as CSSProperties["textAlign"],
  };
}

export function visualCmsFieldStyle(styles: VisualCmsSectionStyles = {}, role: "heading" | "text" | "button" = "text"): CSSProperties {
  const isButton = role === "button";
  return {
    color: safeColor(isButton ? styles.buttonTextColor : role === "heading" ? styles.headingColor : styles.textColor),
    backgroundColor: isButton ? safeColor(styles.buttonBackgroundColor) : undefined,
    fontSize: styles.fontSize ? fontSizeMap[styles.fontSize] : undefined,
    fontWeight: styles.fontWeight ? fontWeightMap[styles.fontWeight] : undefined,
    lineHeight: styles.lineHeight ? lineHeightMap[styles.lineHeight] : undefined,
    letterSpacing: styles.letterSpacing === "wide" ? "0.04em" : undefined,
  };
}

export function mergeVisualStyle(base: CSSProperties | undefined, next: CSSProperties) {
  return { ...(base || {}), ...Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined)) };
}

export type VisualCmsPreviewEventName = "PREVIEW_READY" | "SECTION_SELECTED" | "SECTION_HOVERED" | "SECTION_CONTENT_UPDATED" | "SECTION_STYLE_UPDATED" | "SECTION_STRUCTURE_UPDATED" | "SCROLL_TO_SECTION";

export type VisualCmsPreviewMessage = {
  event: VisualCmsPreviewEventName;
  pageKey?: string;
  sectionId?: string;
  content?: Record<string, string>;
  styles?: VisualCmsStylesBySection;
  layout?: VisualCmsLayoutBySection;
  sections?: Array<{ id: string; sourceId: string; isActive: boolean; sortOrder: number }>;
};
