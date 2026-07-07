"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type DrawerProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Drawer({ open, title, children, onClose }: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-slate-950/30" aria-label="Close drawer" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
