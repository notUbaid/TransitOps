import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 bg-surface-container-high/40">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  "whitespace-nowrap px-4 py-3 font-label-sm text-label-sm font-medium uppercase tracking-wider text-on-surface-variant",
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "transition-colors hover:bg-primary/5",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((col, i) => (
                <td key={i} className={cn("px-4 py-3 align-middle text-body-md text-on-surface", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
