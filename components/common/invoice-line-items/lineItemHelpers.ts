export const DEFAULT_EMPTY_LINE_ITEM_COUNT = 5;

const STANDALONE_GROUP_KEY_PREFIX = "standalone_";

/** Virtual UI-only groups for items without a custom header. */
export const isStandaloneGroupKey = (key?: string | null): boolean =>
  !!key &&
  (key === "standalone_header_key" || key.startsWith(STANDALONE_GROUP_KEY_PREFIX));

export const createRowId = () =>
  Math.random().toString(36).substring(2, 9);

export const createHeaderKey = () =>
  `header_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const createHeaderRow = (selectedSupplierId: number, headerName = "") => ({
  id: createRowId(),
  type: "header",
  headerName,
  headerKey: createHeaderKey(),
  parentHeaderKey: null,
  parentHeaderName: null,
  isEditingHeader: false,
  productId: null,
  qty: 0,
  item: "",
  description: "",
  rate: 0,
  estimatedPrice: 0,
  total: 0,
  searchQuery: "",
  showSearchResults: false,
  supplierId: selectedSupplierId || 1,
  isCustomProduct: true,
  estimate_product_id: null,
});

export const createItemRow = ({
  selectedSupplierId,
  parentHeaderKey = null,
  parentHeaderName = null,
  isCustomProduct = false,
}: {
  selectedSupplierId: number;
  parentHeaderKey?: string | null;
  parentHeaderName?: string | null;
  isCustomProduct?: boolean;
}) => ({
  id: createRowId(),
  type: "item",
  headerKey: null,
  headerName: "",
  parentHeaderKey,
  parentHeaderName,
  isEditingHeader: false,
  productId: null,
  qty: 1,
  item: "",
  description: "",
  rate: 0,
  estimatedPrice: 0,
  total: 0,
  searchQuery: "",
  showSearchResults: false,
  supplierId: selectedSupplierId || 1,
  isCustomProduct,
  estimate_product_id: null,
});

export const createDefaultEmptyLineItems = (
  count = DEFAULT_EMPTY_LINE_ITEM_COUNT,
  selectedSupplierId = 1,
) =>
  Array.from({ length: count }, () =>
    createItemRow({
      selectedSupplierId,
      parentHeaderKey: null,
      parentHeaderName: null,
      isCustomProduct: false,
    }),
  );

/** Product/item name on a line row (supports API-shaped rows). */
export function getLineItemProductName(row: any): string {
  return String(row?.item ?? row?.product_name ?? "").trim();
}

/** Row has a product selected or item name entered (counts toward "at least one"). */
export function isFilledLineItemRow(row: any): boolean {
  if (!row || row.type === "header") return false;
  if (getLineItemProductName(row)) return true;
  const productId = row.productId ?? row.product_id;
  return productId != null && productId !== "";
}

/** Row has partial data but no item name (should show field error). */
export function isStartedLineItemRow(row: any): boolean {
  if (!row || row.type === "header") return false;
  if (isFilledLineItemRow(row)) return false;
  const desc = String(row.description ?? "").trim();
  const rate = Number(row.rate ?? row.unit_cost) || 0;
  const estimated =
    Number(row.estimatedPrice ?? row.estimated_price) || 0;
  const total = Number(row.total ?? row.total_cost) || 0;
  const qty = Number(row.qty ?? row.stock_quantity);
  return !!(
    desc ||
    rate > 0 ||
    estimated > 0 ||
    total > 0 ||
    (Number.isFinite(qty) && qty > 1)
  );
}

export function getFilledLineItemRows(lineItems: any[] = []): any[] {
  return lineItems.filter(isFilledLineItemRow);
}

export function hasAtLeastOneFilledLineItem(lineItems: any[] = []): boolean {
  return getFilledLineItemRows(lineItems).length > 0;
}

/** API expects integer stock_quantity (not float/string). */
export function toPayloadStockQuantity(qty: unknown): number {
  const n = Number(qty);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.trunc(n);
}

/** First product line row (for single-row validation highlight). */
export function getFirstItemLineRow(lineItems: any[] = []): any | null {
  return lineItems.find((row) => row?.type === "item") ?? null;
}

/** Keep parentHeaderKey/Name in sync with flat row order (after header drag). */
export function syncParentHeadersFromFlatOrder<T extends {
  type?: string;
  headerKey?: string | null;
  headerName?: string | null;
  parentHeaderKey?: string | null;
  parentHeaderName?: string | null;
}>(rows: T[]): T[] {
  let currentHeader: { key: string; name: string } | null = null;

  return rows.map((row) => {
    if (
      row.type === "header" &&
      row.headerKey &&
      !isStandaloneGroupKey(row.headerKey)
    ) {
      currentHeader = {
        key: row.headerKey,
        name: String(row.headerName || "").trim(),
      };
      return row;
    }

    if (row.type !== "item") return row;

    if (currentHeader) {
      return {
        ...row,
        parentHeaderKey: currentHeader.key,
        parentHeaderName: currentHeader.name || null,
      };
    }

    return {
      ...row,
      parentHeaderKey: null,
      parentHeaderName: null,
    };
  });
}

function normalizePreviewLineItem(item: any) {
  return {
    ...item,
    qty: item.qty ?? item.stock_quantity ?? 0,
    item: item.item ?? item.product_name ?? "-",
    description: item.description ?? "",
    rate: item.rate ?? item.unit_cost ?? 0,
    estimatedPrice: item.estimatedPrice ?? item.estimated_price ?? 0,
    total: item.total ?? item.total_cost ?? 0,
  };
}

/** Preview rows in the same order as the line-item editor (headers + items). */
export function buildInvoicePreviewRows(lineItems: any[] = []): any[] {
  const rows: any[] = [];

  for (const row of lineItems) {
    if (row.type === "header" && !isStandaloneGroupKey(row.headerKey)) {
      const headerName = String(row.headerName || "").trim();
      if (headerName) {
        rows.push({
          id: `header-${row.headerKey}`,
          type: "synthetic-header",
          headerName,
        });
      }
      continue;
    }

    if (row.type !== "item" || !isFilledLineItemRow(row)) continue;
    rows.push(normalizePreviewLineItem(row));
  }

  return rows;
}

export function validateInvoiceLineItemsForSubmit(lineItems: any[] = []): {
  valid: boolean;
  message?: string;
  invalidIds: string[];
} {
  if (!hasAtLeastOneFilledLineItem(lineItems)) {
    const firstRow = getFirstItemLineRow(lineItems);
    return {
      valid: false,
      message: "Please fill at least one line item",
      invalidIds: firstRow?.id ? [firstRow.id] : [],
    };
  }

  const startedIncomplete = lineItems.filter(
    (row) =>
      row.type === "item" &&
      isStartedLineItemRow(row) &&
      !isFilledLineItemRow(row),
  );

  if (startedIncomplete.length > 0) {
    return {
      valid: false,
      message: "Each started line item must have an item name",
      invalidIds: startedIncomplete.map((row) => row.id),
    };
  }

  return { valid: true, invalidIds: [] };
}