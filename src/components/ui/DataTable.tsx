import { useState, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";

export interface Column<T> {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => any;
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
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
  pageSize,
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (sortCol === null) return rows;
    const col = columns[sortCol];
    if (!col?.sortValue) return rows;

    return [...rows].sort((a, b) => {
      const valA = col.sortValue!(a);
      const valB = col.sortValue!(b);
      if (valA === valB) return 0;
      const diff = valA < valB ? -1 : 1;
      return sortDesc ? -diff : diff;
    });
  }, [rows, columns, sortCol, sortDesc]);

  const pagedRows = useMemo(() => {
    if (!pageSize) return sortedRows;
    return sortedRows.slice(0, page * pageSize);
  }, [sortedRows, pageSize, page]);

  const handleSort = (index: number) => {
    if (!columns[index].sortValue) return;
    if (sortCol === index) {
      if (sortDesc) {
        setSortCol(null);
        setSortDesc(false);
      } else {
        setSortDesc(true);
      }
    } else {
      setSortCol(index);
      setSortDesc(false);
    }
  };

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
                onClick={() => handleSort(i)}
                className={cn(
                  "whitespace-nowrap px-4 py-3 font-label-sm text-label-sm font-medium uppercase tracking-wider text-on-surface-variant",
                  col.sortValue && "cursor-pointer select-none hover:text-on-surface",
                  col.headerClassName,
                )}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortValue && (
                    <span className="flex h-4 w-4 items-center justify-center text-on-surface-variant/50">
                      {sortCol === i ? (
                        <Icon name={sortDesc ? "arrow_downward" : "arrow_upward"} size={14} className="text-primary" />
                      ) : (
                        <Icon name="unfold_more" size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {pagedRows.map((row) => (
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
      {pageSize && sortedRows.length > page * pageSize && (
        <div className="flex justify-center border-t border-white/10 p-4">
          <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
            Show More
          </Button>
        </div>
      )}
    </div>
  );
}
