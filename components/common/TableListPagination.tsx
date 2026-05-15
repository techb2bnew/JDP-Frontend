import { Button } from "@/components/ui/button";

type TableListPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
  compact?: boolean;
};

export function TableListPagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "items",
  className = "",
  compact = false,
}: TableListPaginationProps) {
  if (totalPages <= 1 || totalItems === 0) return null;

  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 ${
        compact
          ? "mt-3 px-3 pt-4 pb-3"
          : "mt-4 px-1 pt-5 pb-2"
      } ${className}`}
    >
      <p className={compact ? "text-xs text-gray-500" : "text-sm text-gray-500"}>
        Showing {start} to {end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className={compact ? "text-xs text-gray-600" : "text-sm text-gray-600"}>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
