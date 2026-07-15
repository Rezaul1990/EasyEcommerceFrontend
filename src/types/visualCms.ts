import type { VisualCmsSectionLayout, VisualCmsSectionStyles, VisualSectionType } from "@/config/visualCms";

export type VisualCmsContentValue = string | number | boolean | null;

export type VisualCmsSectionContent = Record<string, VisualCmsContentValue>;

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
