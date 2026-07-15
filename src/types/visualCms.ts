import type { VisualSectionType } from "@/config/visualCms";

export type VisualCmsContentValue = string | number | boolean | null;

export type VisualCmsSectionContent = Record<string, VisualCmsContentValue>;

export type VisualCmsSectionStyles = Partial<Record<"backgroundColor" | "headingColor" | "textColor" | "buttonBackgroundColor" | "buttonTextColor", string>>;

export type VisualCmsSectionLayout = Partial<{
  container: "contained" | "full";
  alignment: "left" | "center" | "right";
  spacingY: "compact" | "normal" | "spacious";
}>;

export type PageSection = {
  id: string;
  pageId: string;
  type: VisualSectionType;
  internalName: string;
  sortOrder: number;
  isActive: boolean;
  content: VisualCmsSectionContent;
  styles: VisualCmsSectionStyles;
  layout: VisualCmsSectionLayout;
};
