export const visualCmsEditorEnabled = process.env.NEXT_PUBLIC_VISUAL_CMS_EDITOR_ENABLED === "true";

export const supportedVisualSectionTypes = ["hero", "featured-products", "content", "cta"] as const;

export type VisualSectionType = (typeof supportedVisualSectionTypes)[number];

export const visualCmsStyleKeys = ["backgroundColor", "headingColor", "textColor", "buttonBackgroundColor", "buttonTextColor"] as const;

export const visualCmsLayoutKeys = ["container", "alignment", "spacingY"] as const;
