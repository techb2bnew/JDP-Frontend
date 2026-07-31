export const DEFAULT_EMPTY_LINE_ITEM_COUNT = 5;

/** Round currency to 2 decimal places for API payloads. */
export const roundMoney = (value: number | string | null | undefined): number =>
  Number((Number(value) || 0).toFixed(2));

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

/**
 * Catalog product id for API payloads (createEstimate / sendInvoice).
 * UI row `id` is a random client key — never send that as the product id.
 */
export function resolveLineItemProductPayloadId(item: any): string | number | null {
  const isCustom =
    item?.isCustomProduct === true || item?.is_custom === true;
  const productId =
    item?.productId ?? item?.product_id ?? item?.estimate_product_id ?? null;
  if (
    !isCustom &&
    productId != null &&
    productId !== "" &&
    Number(productId) !== 0
  ) {
    return productId;
  }
  return null;
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

// ---------------------------------------------------------------------------
// Import from Bluesheets / Estimates (NewInvoiceDialog "Import" popup).
// These are additive helpers — they build brand-new rows to append onto an
// existing lineItems array, they never mutate/replace the rows already there.
// ---------------------------------------------------------------------------

/** Normalized product shape the import popup selects, regardless of source. */
export type ImportableProduct = {
  key: string;
  productId?: string | number | null;
  name: string;
  description?: string;
  rate: number;
  qty: number;
  total: number;
  supplierId?: number | null;
  isCustom?: boolean;
  /** Room/section this product was already grouped under on its source (e.g. "Kitchen"), if any. */
  headerName?: string | null;
};

/** Normalized labor entry shape the import popup selects. */
export type ImportableLabor = {
  key: string;
  name: string;
  hours: number;
  hourlyRate: number;
  total: number;
};

/**
 * Bluesheet `material_entries[i]` -> normalized product (see CustomInvoiceDialog's
 * mapping). Bluesheet materials are a raw "used on site" list — they don't carry
 * a room/section assignment, so `headerName` is left null (caller falls back to
 * grouping these by their source Bluesheet).
 */
export function bluesheetMaterialToImportable(
  entry: any,
  index: number,
): ImportableProduct {
  const rate = Number(entry?.jdp_price || entry?.unit_cost || 0);
  const qty = Number(entry?.material_used) || Number(entry?.total_ordered) || 1;
  return {
    key: `bm_${entry?.id ?? index}`,
    productId: entry?.product_id ?? entry?.product?.product_id ?? null,
    name: entry?.material_name || entry?.product?.product_name || "Material",
    description: entry?.product?.description || entry?.material_name || "",
    rate,
    qty,
    total: Number(entry?.total_cost) || Number((qty * rate).toFixed(2)),
    supplierId:
      entry?.product?.supplier_id ?? entry?.product?.suppliers?.id ?? null,
    isCustom: entry?.product_id == null,
    headerName: entry?.parent_header_name || null,
  };
}

/**
 * Estimate `products[i]` -> normalized product (see JobDetailsPage.buildLineItemsFromProducts).
 * Estimate products already carry the room/section they were entered under
 * (`parent_header_name`, e.g. "Kitchen") — preserved here so the import popup
 * can keep grouping by room instead of flattening everything under the source.
 */
export function estimateProductToImportable(
  product: any,
  index: number,
): ImportableProduct {
  const rate = Number(product?.jdp_price || product?.unit_cost || 0);
  const qty =
    Number(product?.material_used) || Number(product?.stock_quantity) || 1;
  return {
    key: `ep_${product?.id ?? product?.product_id ?? index}`,
    productId: product?.product_id ?? product?.id ?? null,
    name: product?.product_name || "Product",
    description: product?.description || "",
    rate,
    qty,
    total: Number(product?.total_cost) || Number((qty * rate).toFixed(2)),
    supplierId: product?.supplier_id ?? null,
    isCustom: !!product?.is_custom,
    headerName: product?.parent_header_name || null,
  };
}

/**
 * Bluesheet `total_hours` comes back as a duration string like "2h30m", not
 * a plain number (see BlueSheetApprovalDialog's formatLaborWorkedHours).
 * Converts it to decimal hours; falls back to a plain numeric value as-is.
 */
function parseLaborHoursToDecimal(rawHours: unknown): number {
  if (rawHours == null || rawHours === "") return 0;
  const match = String(rawHours).match(/^(\d+)h(\d+)m$/);
  if (match) {
    return Number(match[1]) + Number(match[2]) / 60;
  }
  const numeric = Number(rawHours);
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Bluesheet `labor_entries[i]` -> normalized labor row (see BlueSheetApprovalDialog's field usage). */
export function bluesheetLaborToImportable(
  entry: any,
  index: number,
): ImportableLabor {
  const hours = Number(
    parseLaborHoursToDecimal(entry?.total_hours ?? entry?.hours).toFixed(2),
  );
  const hourlyRate = Number(entry?.hourly_rate || 0);
  const name = String(entry?.employee_name || entry?.role || "Labor");
  return {
    key: `lb_${entry?.id ?? index}`,
    name,
    hours,
    hourlyRate,
    total: Number(entry?.total_cost) || Number((hours * hourlyRate).toFixed(2)),
  };
}

/**
 * Build header+item lineItem rows for a batch of imported products/labor,
 * grouped by room/section (`headerName`) — so "Kitchen" products picked from
 * two different Bluesheets/Estimates land under one "Kitchen" header,
 * matching the existing room-based use of custom headers (see
 * JobDetailsPage.buildLineItemsFromProducts). Products/labor with no room of
 * their own (`headerName` null/empty — e.g. plain Bluesheet materials or
 * labor, which never carry a room) are added as plain standalone rows with
 * no header at all, rather than inventing one named after their source
 * (Bluesheet/Estimate names are an internal reference, not a room, and
 * shouldn't leak onto the invoice as a header).
 *
 * Selected products become "item" rows shaped like a catalog product;
 * selected labor entries become "item" rows too (qty=hours, rate=hourly
 * rate) — the line-items table only has "header"/"item" row types, so labor
 * rides the same row shape and is fully editable like any other line item,
 * matching the existing "Labor total cost" product-row pattern already used
 * when sending bluesheets to estimates.
 */
export function buildLineItemRowsFromImportSelections({
  products = [],
  laborEntries = [],
  selectedSupplierId = 1,
}: {
  products?: { product: ImportableProduct; headerName: string | null }[];
  laborEntries?: { labor: ImportableLabor; headerName: string | null }[];
  selectedSupplierId?: number;
}): any[] {
  if (products.length === 0 && laborEntries.length === 0) return [];

  const buildProductRow = (
    product: ImportableProduct,
    parentHeaderKey: string | null,
    parentHeaderName: string | null,
  ) => ({
    ...createItemRow({
      selectedSupplierId: product.supplierId || selectedSupplierId,
      parentHeaderKey,
      parentHeaderName,
      isCustomProduct: !!product.isCustom,
    }),
    productId: product.productId ?? null,
    item: product.name,
    description: product.description || "",
    rate: product.rate,
    estimatedPrice: product.rate,
    qty: product.qty,
    total: product.total,
  });

  const buildLaborRow = (
    labor: ImportableLabor,
    parentHeaderKey: string | null,
    parentHeaderName: string | null,
  ) => ({
    ...createItemRow({
      selectedSupplierId,
      parentHeaderKey,
      parentHeaderName,
      isCustomProduct: true,
    }),
    item: labor.name,
    description: "Labor cost",
    rate: labor.hourlyRate,
    estimatedPrice: labor.hourlyRate,
    qty: labor.hours,
    total: labor.total,
  });

  const standaloneProducts = products.filter(
    (entry) => !entry.headerName?.trim(),
  );
  const standaloneLabor = laborEntries.filter(
    (entry) => !entry.headerName?.trim(),
  );

  const groupOrder: string[] = [];
  const groups = new Map<
    string,
    { products: ImportableProduct[]; laborEntries: ImportableLabor[] }
  >();

  const getGroup = (headerName: string) => {
    if (!groups.has(headerName)) {
      groups.set(headerName, { products: [], laborEntries: [] });
      groupOrder.push(headerName);
    }
    return groups.get(headerName)!;
  };

  products.forEach(({ product, headerName }) => {
    if (headerName?.trim()) getGroup(headerName.trim()).products.push(product);
  });
  laborEntries.forEach(({ labor, headerName }) => {
    if (headerName?.trim()) getGroup(headerName.trim()).laborEntries.push(labor);
  });

  const rows: any[] = [];

  // Standalone (no-room) rows first, kept in one contiguous block so the
  // line-items table's grouping treats them as a single virtual "Items"
  // section rather than several fragments.
  standaloneProducts.forEach(({ product }) =>
    rows.push(buildProductRow(product, null, null)),
  );
  standaloneLabor.forEach(({ labor }) =>
    rows.push(buildLaborRow(labor, null, null)),
  );

  groupOrder.forEach((headerName) => {
    const group = groups.get(headerName)!;
    const headerKey = createHeaderKey();

    rows.push({
      ...createHeaderRow(selectedSupplierId, headerName),
      headerKey,
    });

    group.products.forEach((product) =>
      rows.push(buildProductRow(product, headerKey, headerName)),
    );
    group.laborEntries.forEach((labor) =>
      rows.push(buildLaborRow(labor, headerKey, headerName)),
    );
  });

  return rows;
}

/**
 * Same product picked from more than one source in a single import batch
 * (e.g. the same catalog product selected from two different Estimates)
 * collapses into one entry with quantities/totals summed, instead of
 * producing duplicate rows. Matched by catalog product id, or by name for
 * custom/no-id products. Keeps the first occurrence's room/header.
 */
export function mergeDuplicateProductSelections(
  entries: { product: ImportableProduct; headerName: string | null }[],
): { product: ImportableProduct; headerName: string | null; mergedCount: number }[] {
  const dedupeKeyFor = (product: ImportableProduct) =>
    product.productId != null && String(product.productId).trim() !== ""
      ? `id:${product.productId}`
      : `name:${String(product.name || "").trim().toLowerCase()}`;

  const order: string[] = [];
  const merged = new Map<
    string,
    { product: ImportableProduct; headerName: string | null; mergedCount: number }
  >();

  entries.forEach((entry) => {
    const key = dedupeKeyFor(entry.product);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        product: entry.product,
        headerName: entry.headerName,
        mergedCount: 1,
      });
      order.push(key);
      return;
    }

    existing.product = {
      ...existing.product,
      qty: existing.product.qty + entry.product.qty,
      total: roundMoney(existing.product.total + entry.product.total),
    };
    existing.headerName = existing.headerName || entry.headerName;
    existing.mergedCount += 1;
  });

  return order.map((key) => merged.get(key)!);
}

/**
 * Skip products already present in `existingLineItems` (matched by catalog
 * product id, or by name when custom/no id) so re-importing the same source
 * doesn't duplicate rows. Labor entries are never treated as duplicates of
 * products.
 */
export function partitionImportedProductsByDuplicate(
  products: ImportableProduct[],
  existingLineItems: any[] = [],
): { toImport: ImportableProduct[]; duplicates: ImportableProduct[] } {
  const existingProductIds = new Set(
    existingLineItems
      .filter((row) => row?.type === "item")
      .map((row) => row.productId ?? row.estimate_product_id)
      .filter((id) => id != null && id !== "")
      .map((id) => String(id)),
  );
  const existingNames = new Set(
    existingLineItems
      .filter((row) => row?.type === "item")
      .map((row) => String(row.item || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const toImport: ImportableProduct[] = [];
  const duplicates: ImportableProduct[] = [];

  products.forEach((product) => {
    const idMatch =
      product.productId != null &&
      existingProductIds.has(String(product.productId));
    const nameMatch = existingNames.has(
      String(product.name || "").trim().toLowerCase(),
    );

    if (idMatch || nameMatch) {
      duplicates.push(product);
    } else {
      toImport.push(product);
    }
  });

  return { toImport, duplicates };
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