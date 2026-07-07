import type { ReactNode } from "react";

type DataTableProps<T> = {
  columns: Array<{ key: string; header: string; align?: "left" | "right"; render: (row: T) => ReactNode }>;
  rows: T[];
  getRowKey: (row: T) => string;
  emptyText?: string;
};

export function DataTable<T>({ columns, rows, getRowKey, emptyText = "No records found" }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : "text-left"}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.length ? (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : "text-left"}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
