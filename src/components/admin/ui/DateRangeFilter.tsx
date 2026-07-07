"use client";

type DateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      <input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
    </div>
  );
}
