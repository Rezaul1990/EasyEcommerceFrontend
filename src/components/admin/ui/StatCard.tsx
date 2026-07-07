import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "teal" | "slate" | "amber" | "rose" | "emerald";
};

const tones = {
  teal: "bg-teal-50 text-teal-700",
  slate: "bg-slate-100 text-slate-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

export function StatCard({ label, value, icon: Icon, tone = "teal" }: StatCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`grid size-9 place-items-center rounded-md ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </section>
  );
}
