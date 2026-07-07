export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">{label}</div>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{message}</div>;
}
