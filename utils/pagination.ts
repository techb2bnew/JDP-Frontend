export type PaginationItem = number | "ellipsis";

/**
 * Page numbers for compact controls: first/last always, a window around the
 * current page, with ellipses for skipped ranges (avoids rendering 50+ buttons).
 */
export function getCompactPaginationItems(
  currentPage: number,
  totalPages: number,
  delta = 2,
): PaginationItem[] {
  if (totalPages < 1) return [];
  const current = Math.min(Math.max(1, currentPage), totalPages);
  const last = totalPages;
  const left = current - delta;
  const right = current + delta + 1;
  const range: number[] = [];

  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= left && i < right)) {
      range.push(i);
    }
  }

  const result: PaginationItem[] = [];
  let prev: number | undefined;

  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) {
        result.push(prev + 1);
      } else if (i - prev !== 1) {
        result.push("ellipsis");
      }
    }
    result.push(i);
    prev = i;
  }

  return result;
}
