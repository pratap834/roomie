import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  /** Relative widths (in tailwind width classes) for each column's skeleton bar. */
  columnWidths?: string[];
  rows?: number;
  hasSelection?: boolean;
  hasActions?: boolean;
}

const DEFAULT_WIDTHS = ["w-32", "w-24", "w-20", "w-16"];

export function TableSkeleton({
  columnWidths = DEFAULT_WIDTHS,
  rows = 6,
  hasSelection = false,
  hasActions = true,
}: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {hasSelection && <TableHead className="w-8" />}
          {columnWidths.map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-3 w-14" />
            </TableHead>
          ))}
          {hasActions && <TableHead className="w-9" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {hasSelection && (
              <TableCell>
                <Skeleton className="h-3.5 w-3.5" />
              </TableCell>
            )}
            {columnWidths.map((width, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className={`h-3.5 ${width}`} />
              </TableCell>
            ))}
            {hasActions && (
              <TableCell>
                <Skeleton className="h-6 w-6 rounded-md" />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
