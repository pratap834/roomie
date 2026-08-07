import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "@/types";

interface PaginationBarProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ meta, onPageChange }: PaginationBarProps) {
  if (meta.pageCount <= 1) return null;

  const pages = Array.from({ length: meta.pageCount }, (_, i) => i + 1).filter(
    (page) => page === 1 || page === meta.pageCount || Math.abs(page - meta.page) <= 1,
  );

  return (
    <Pagination>
      <p className="text-xs text-muted-foreground">
        {meta.total} room{meta.total === 1 ? "" : "s"} · page {meta.page} of {meta.pageCount}
      </p>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          />
        </PaginationItem>
        {pages.map((page, index) => {
          const prevPage = pages[index - 1];
          const showEllipsis = prevPage !== undefined && page - prevPage > 1;
          return (
            <PaginationItem key={page} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-xs text-muted-foreground">…</span>}
              <PaginationLink isActive={page === meta.page} onClick={() => onPageChange(page)}>
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            disabled={meta.page >= meta.pageCount}
            onClick={() => onPageChange(meta.page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
