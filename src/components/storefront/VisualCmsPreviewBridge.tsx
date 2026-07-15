"use client";

import { visualCmsFieldStyle, visualCmsSectionStyle, type VisualCmsPreviewMessage } from "@/config/visualCms";
import { useEffect } from "react";

type VisualCmsPreviewBridgeProps = {
  pageKey: string;
};

function isPreviewMessage(value: unknown): value is VisualCmsPreviewMessage {
  if (!value || typeof value !== "object") return false;
  const event = (value as { event?: unknown }).event;
  return event === "SECTION_CONTENT_UPDATED" || event === "SECTION_STYLE_UPDATED" || event === "SCROLL_TO_SECTION";
}

function selectSection(sectionId: string) {
  document.querySelectorAll("[data-visual-cms-selected]").forEach((node) => node.removeAttribute("data-visual-cms-selected"));
  const section = document.querySelector<HTMLElement>(`[data-visual-cms-section-id="${sectionId}"]`);
  section?.setAttribute("data-visual-cms-selected", "true");
  return section;
}

function updatePreviewContent(content: Record<string, string>) {
  Object.entries(content).forEach(([key, value]) => {
    document.querySelectorAll<HTMLElement>(`[data-visual-cms-field-key="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  });
}

function updatePreviewStyles(message: VisualCmsPreviewMessage) {
  const styles = message.styles || {};
  const layout = message.layout || {};
  const sectionIds = new Set([...Object.keys(styles), ...Object.keys(layout)]);

  sectionIds.forEach((sectionId) => {
    const section = document.querySelector<HTMLElement>(`[data-visual-cms-section-id="${sectionId}"]`);
    if (!section) return;
    Object.assign(section.style, visualCmsSectionStyle(styles[sectionId], layout[sectionId]));
    section.querySelectorAll<HTMLElement>("[data-visual-cms-field-key]").forEach((node) => {
      const role = node.dataset.visualCmsFieldRole === "heading" || node.dataset.visualCmsFieldRole === "button" ? node.dataset.visualCmsFieldRole : "text";
      Object.assign(node.style, visualCmsFieldStyle(styles[sectionId], role));
      const button = node.closest<HTMLElement>("a,button");
      if (role === "button" && button) Object.assign(button.style, visualCmsFieldStyle(styles[sectionId], "button"));
    });
  });
}

export function VisualCmsPreviewBridge({ pageKey }: VisualCmsPreviewBridgeProps) {
  useEffect(() => {
    const parentWindow = window.parent;
    const origin = window.location.origin;

    function post(message: VisualCmsPreviewMessage) {
      parentWindow.postMessage({ pageKey, ...message }, origin);
    }

    function handleClick(event: MouseEvent) {
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-visual-cms-section-id]");
      if (!section) return;
      event.preventDefault();
      event.stopPropagation();
      const sectionId = section.dataset.visualCmsSectionId;
      if (!sectionId) return;
      selectSection(sectionId);
      post({ event: "SECTION_SELECTED", sectionId });
    }

    function handleMouseOver(event: MouseEvent) {
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-visual-cms-section-id]");
      const sectionId = section?.dataset.visualCmsSectionId;
      if (sectionId) post({ event: "SECTION_HOVERED", sectionId });
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== origin || !isPreviewMessage(event.data)) return;
      if (event.data.pageKey && event.data.pageKey !== pageKey) return;

      if (event.data.event === "SECTION_CONTENT_UPDATED" && event.data.content) {
        updatePreviewContent(event.data.content);
      }

      if (event.data.event === "SECTION_STYLE_UPDATED") {
        updatePreviewStyles(event.data);
      }

      if (event.data.event === "SCROLL_TO_SECTION" && event.data.sectionId) {
        selectSection(event.data.sectionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("mouseover", handleMouseOver, true);
    window.addEventListener("message", handleMessage);
    post({ event: "PREVIEW_READY" });

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("mouseover", handleMouseOver, true);
      window.removeEventListener("message", handleMessage);
    };
  }, [pageKey]);

  return (
    <style>
      {`
        [data-visual-cms-section-id] {
          cursor: pointer;
          outline: 2px solid transparent;
          outline-offset: -2px;
          transition: outline-color 160ms ease, box-shadow 160ms ease;
        }

        [data-visual-cms-section-id]:hover {
          outline-color: rgba(13, 148, 136, 0.65);
          box-shadow: inset 0 0 0 9999px rgba(240, 253, 250, 0.18);
        }

        [data-visual-cms-selected="true"] {
          outline-color: rgb(13, 148, 136);
          box-shadow: inset 0 0 0 9999px rgba(240, 253, 250, 0.28);
        }
      `}
    </style>
  );
}
