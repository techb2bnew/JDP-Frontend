import React, { useEffect, useMemo, useRef, useState } from "react";
import GroupedLineItemsTable from "./GroupedLineItemsTable";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import {
  createDefaultEmptyLineItems,
  isStandaloneGroupKey,
  syncParentHeadersFromFlatOrder,
} from "./lineItemHelpers";

export type ProductType = {
  id: string | number;
  name: string;
  description?: string;
  jdpSKU?: string;
  /** Supplier / manufacturer SKU (may come from API as supplier_sku) */
  supplierSKU?: string;
  jdpPrice?: number;
  estimatedPrice?: number;
  rate?: number;
};

export type LineItemType = {
  id: string;
  type: "header" | "item";
  headerKey?: string | null;
  headerName?: string;
  parentHeaderKey?: string | null;
  parentHeaderName?: string | null;

  qty: number;
  item: string;
  description: string;
  rate: number;
  estimatedPrice: number;
  total: number;

  searchQuery?: string;
  showSearchResults?: boolean;
  supplierId?: number;
  isCustomProduct?: boolean;
  productId?: string | number | null;
  estimate_product_id?: string | number | null;
   jdpSKU?: string | null;
};

export type HeaderGroupType = {
  header: LineItemType;
  items: LineItemType[];
};

interface InvoiceLineItemsManagerProps {
  lineItems: LineItemType[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItemType[]>>;
  selectedSupplierId: number;
  fetchProducts: (query: string) => void;
  getFilteredProducts: (query: string) => ProductType[];
  onSelectProductData?: (rowId: string, product: ProductType) => void;
  /** When true, row/footer totals use qty × rate (jdp_price), not estimated price. */
  useRateForLineTotal?: boolean;
  isJobDetail?:boolean
  invalidHeaderKeys?:string[]
  setInvalidHeaderKeys?: () => void;
  invalidLineItemIds?: string[];
  setInvalidLineItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
  /** Passed through to GroupedLineItemsTable; omit everywhere except CustomInvoiceDialog. */
  summaryLaborTotal?: number;
}

const createRowId = () =>
  `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const createHeaderKey = () =>
  `header_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createHeaderRow = (
  selectedSupplierId: number,
  headerName = "",
): LineItemType => ({
  id: createRowId(),
  type: "header",
  headerName,
  headerKey: createHeaderKey(),
  parentHeaderKey: null,
  parentHeaderName: null,
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
  productId: null,
  estimate_product_id: null,
});

const createItemRow = ({
  selectedSupplierId,
  parentHeaderKey = null,
  parentHeaderName = null,
  isCustomProduct = false,
}: {
  selectedSupplierId: number;
  parentHeaderKey?: string | null;
  parentHeaderName?: string | null;
  isCustomProduct?: boolean;
}): LineItemType => ({
  id: createRowId(),
  type: "item",
  headerKey: null,
  headerName: "",
  parentHeaderKey,
  parentHeaderName,
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
  productId: null,
  estimate_product_id: null,
  jdpSKU: null,
});

const STANDALONE_GROUP_KEY_PREFIX = "standalone_";

const createStandaloneVirtualHeader = (segmentKey: string): LineItemType => ({
  id: `standalone_header_${segmentKey}`,
  type: "header",
  headerKey: segmentKey,
  headerName: "Items",
  parentHeaderKey: null,
  parentHeaderName: null,
  qty: 0,
  item: "",
  description: "",
  rate: 0,
  estimatedPrice: 0,
  total: 0,
  searchQuery: "",
  showSearchResults: false,
  supplierId: 1,
  isCustomProduct: true,
  productId: null,
  estimate_product_id: null,
});

/** Build groups in flat `lineItems` order (standalone segments stay where they appear). */
const getHeaderGroups = (lineItems: LineItemType[] = []): HeaderGroupType[] => {
  const groups: HeaderGroupType[] = [];
  let currentHeaderGroup: HeaderGroupType | null = null;
  let currentStandaloneGroup: HeaderGroupType | null = null;

  const flushStandalone = () => {
    if (currentStandaloneGroup && currentStandaloneGroup.items.length > 0) {
      groups.push(currentStandaloneGroup);
    }
    currentStandaloneGroup = null;
  };

  const flushHeader = () => {
    if (currentHeaderGroup) {
      groups.push(currentHeaderGroup);
      currentHeaderGroup = null;
    }
  };

  for (const row of lineItems) {
    if (row.type === "item" && !row.parentHeaderKey) {
      flushHeader();
      if (!currentStandaloneGroup) {
        currentStandaloneGroup = {
          header: createStandaloneVirtualHeader(
            `${STANDALONE_GROUP_KEY_PREFIX}${row.id}`,
          ),
          items: [],
        };
      }
      currentStandaloneGroup.items.push(row);
      continue;
    }

    if (row.type === "header") {
      flushStandalone();
      flushHeader();
      currentHeaderGroup = { header: row, items: [] };
      continue;
    }

    if (
      row.type === "item" &&
      currentHeaderGroup &&
      row.parentHeaderKey === currentHeaderGroup.header.headerKey
    ) {
      currentHeaderGroup.items.push(row);
    }
  }

  flushStandalone();
  flushHeader();

  return groups;
};

const flattenGroupsToLineItems = (groups: HeaderGroupType[]): LineItemType[] =>
  groups.flatMap((group) =>
    isStandaloneGroupKey(group.header.headerKey)
      ? group.items
      : [group.header, ...group.items],
  );

const getGroupStartIndexInFlatList = (
  groups: HeaderGroupType[],
  targetHeaderKey: string,
): number => {
  let index = 0;
  for (const group of groups) {
    if (group.header.headerKey === targetHeaderKey) return index;
    if (isStandaloneGroupKey(group.header.headerKey)) {
      index += group.items.length;
    } else {
      index += 1 + group.items.length;
    }
  }
  return index;
};

const reorderHeaderGroups = ({
  lineItems,
  activeHeaderKey,
  overHeaderKey,
}: {
  lineItems: LineItemType[];
  activeHeaderKey: string;
  overHeaderKey: string;
}) => {
  if (!activeHeaderKey || !overHeaderKey || activeHeaderKey === overHeaderKey) {
    return lineItems;
  }

  if (isStandaloneGroupKey(activeHeaderKey)) {
    return lineItems;
  }

  const groups = getHeaderGroups(lineItems);

  const activeIndex = groups.findIndex(
    (group) => group.header.headerKey === activeHeaderKey,
  );
  const overIndex = groups.findIndex(
    (group) => group.header.headerKey === overHeaderKey,
  );

  if (activeIndex === -1 || overIndex === -1) return lineItems;

  const updatedGroups = [...groups];
  const [movedGroup] = updatedGroups.splice(activeIndex, 1);
  updatedGroups.splice(overIndex, 0, movedGroup);

  return syncParentHeadersFromFlatOrder(
    flattenGroupsToLineItems(updatedGroups),
  );
};

const resolveParentAfterDrop = (rows: LineItemType[], targetIndex: number) => {
  for (let i = targetIndex - 1; i >= 0; i--) {
    const row = rows[i];

    if (row.type === "header" && !isStandaloneGroupKey(row.headerKey)) {
      return {
        parentHeaderKey: row.headerKey || null,
        parentHeaderName: row.headerName || null,
      };
    }

    if (row.type === "item" && row.parentHeaderKey == null) {
      return {
        parentHeaderKey: null,
        parentHeaderName: null,
      };
    }
  }

  return {
    parentHeaderKey: null,
    parentHeaderName: null,
  };
};

const handleItemDropReparent = (
  rows: LineItemType[],
  movedItemId: string,
  newIndex: number,
) => {
  const updatedRows = [...rows];
  const movedIndex = updatedRows.findIndex((r) => r.id === movedItemId);
  if (movedIndex === -1) return rows;

  const [movedItem] = updatedRows.splice(movedIndex, 1);
  updatedRows.splice(newIndex, 0, movedItem);

  const parentMeta = resolveParentAfterDrop(updatedRows, newIndex);

  updatedRows[newIndex] = {
    ...updatedRows[newIndex],
    parentHeaderKey: parentMeta.parentHeaderKey,
    parentHeaderName: parentMeta.parentHeaderName,
  };

  return updatedRows;
};

const InvoiceLineItemsManager = ({
  lineItems,
  setLineItems,
  selectedSupplierId,
  fetchProducts,
  getFilteredProducts,
  onSelectProductData,
  isJobDetail=false,
  useRateForLineTotal = false,
  invalidHeaderKeys,
  setInvalidHeaderKeys,
  invalidLineItemIds,
  setInvalidLineItemIds,
  summaryLaborTotal,
}: InvoiceLineItemsManagerProps) => {
  const [activeDraggedItem, setActiveDraggedItem] =
    useState<LineItemType | null>(null);
const [duplicateItemRowId, setDuplicateItemRowId] = useState<string | null>(null);


const highlightDuplicateItem = (rowId: string | null) => {
  if (!rowId) return;
  setDuplicateItemRowId(rowId);
};

const duplicateRowRef = useRef<HTMLElement | null>(null);
const dropdownPortalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (lineItems.length > 0) return;
    setLineItems(createDefaultEmptyLineItems(5, selectedSupplierId) as LineItemType[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once when parent starts with no rows
  }, []);

  useEffect(() => {
    if (!duplicateItemRowId) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInsideHighlightedRow =
        duplicateRowRef.current?.contains(target) ?? false;

      const clickedInsideDropdown =
        dropdownPortalRef.current?.contains(target) ?? false;

      if (clickedInsideHighlightedRow || clickedInsideDropdown) {
        return;
      }

      setDuplicateItemRowId(null);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [duplicateItemRowId]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);

    const draggedRow = lineItems.find((row) => row.id === activeId);
    if (draggedRow?.type === "item") {
      setActiveDraggedItem(draggedRow);
      return;
    }

    setActiveDraggedItem(null);
  };

  const groupedItems = useMemo(
    () => getHeaderGroups(lineItems || []),
    [lineItems],
  );

  const sortableIds = useMemo(
    () =>
      groupedItems
        .map((group) => group.header.headerKey as string)
        .filter((id) => !isStandaloneGroupKey(id)),
    [groupedItems],
  );

  const allGroupHeaderKeys = useMemo(
    () =>
      groupedItems
        .map((group) => group.header.headerKey as string)
        .filter(Boolean),
    [groupedItems],
  );

  const handleAddLineItemUnderHeader = (headerKey: string) => {
    setLineItems((prev) => {
      const rows = [...prev];
      const headerIndex = rows.findIndex(
        (row) => row.type === "header" && row.headerKey === headerKey,
      );

      if (headerIndex === -1) return prev;

      const headerRow = rows[headerIndex];

      const newItem = createItemRow({
        selectedSupplierId,
        parentHeaderKey: headerRow.headerKey as string,
        parentHeaderName: headerRow.headerName || "",
        isCustomProduct: false,
      });

      let insertAt = headerIndex + 1;

      while (
        insertAt < rows.length &&
        rows[insertAt].type === "item" &&
        rows[insertAt].parentHeaderKey === headerKey
      ) {
        insertAt++;
      }

      rows.splice(insertAt, 0, newItem);
      return rows;
    });
  };

  const handleAddCustomProductUnderHeader = (headerKey: string) => {
    setLineItems((prev) => {
      const rows = [...prev];
      const headerIndex = rows.findIndex(
        (row) => row.type === "header" && row.headerKey === headerKey,
      );

      if (headerIndex === -1) return prev;

      const headerRow = rows[headerIndex];

      const newItem = createItemRow({
        selectedSupplierId,
        parentHeaderKey: headerRow.headerKey as string,
        parentHeaderName: headerRow.headerName || "",
        isCustomProduct: true,
      });

      let insertAt = headerIndex + 1;

      while (
        insertAt < rows.length &&
        rows[insertAt].type === "item" &&
        rows[insertAt].parentHeaderKey === headerKey
      ) {
        insertAt++;
      }

      rows.splice(insertAt, 0, newItem);
      return rows;
    });
  };


//   const handleUpdateLineItem = (rowId: string, field: string, value: any) => {
//   setLineItems((prev) => {
//     const updatedRows = prev.map((row) => {
//       if (row.id !== rowId) return row;

//       const updated = { ...row, [field]: value };

//       if (
//         updated.type === "item" &&
//         ["qty", "rate", "estimatedPrice"].includes(field)
//       ) {
//         const qty = Number(updated.qty) || 0;
//         const priceToUse =
//           Number(updated.estimatedPrice) > 0
//             ? Number(updated.estimatedPrice)
//             : Number(updated.rate) || 0;

//         updated.total = qty * priceToUse;
//       }

//       return updated;
//     });

//     const changedHeader = updatedRows.find(
//       (row) => row.id === rowId && row.type === "header",
//     );

//     if (changedHeader && field === "headerName") {
//       updatedRows.forEach((row) => {
//         if (
//           row.type === "item" &&
//           row.parentHeaderKey === changedHeader.headerKey
//         ) {
//           row.parentHeaderName = value || null;
//         }
//       });

//       const trimmedValue = String(value || "").trim();

//       setInvalidHeaderKeys((prev) => {
//         const withoutCurrent = prev.filter(
//           (key) => key !== changedHeader.headerKey,
//         );

//         if (!trimmedValue && changedHeader.headerKey) {
//           return [...withoutCurrent, changedHeader.headerKey];
//         }

//         return withoutCurrent;
//       });
//     }

//     return updatedRows;
//   });
// };
 

const handleUpdateLineItem = (rowId: string, field: string, value: any) => {
  setLineItems((prev) => {
    const updatedRows = prev.map((row) => {
      if (row.id !== rowId) return row;

      const updated = { ...row, [field]: value };

      if (
        updated.type === "item" &&
        ["qty", "rate", "estimatedPrice"].includes(field)
      ) {
        const qty = Number(updated.qty) || 0;
        const rate = Number(updated.rate) || 0;
        if (isJobDetail || useRateForLineTotal) {
          // qty × rate (jdp_price) — match backend / Job Details invoice
          updated.total = Number((qty * rate).toFixed(2));
        } else {
          const priceToUse =
            Number(updated.estimatedPrice) > 0
              ? Number(updated.estimatedPrice)
              : rate;
          updated.total = qty * priceToUse;
        }
      }

      return updated;
    });

    const changedHeader = updatedRows.find(
      (row) => row.id === rowId && row.type === "header",
    );

    if (changedHeader && field === "headerName") {
      const headerName = String(value || "").trim();

      const propagatedRows = updatedRows.map((row) => {
        if (
          row.type === "item" &&
          row.parentHeaderKey === changedHeader.headerKey
        ) {
          return {
            ...row,
            parentHeaderName: headerName || null,
          };
        }
        return row;
      });

      if (typeof setInvalidHeaderKeys === "function") {
        (setInvalidHeaderKeys as any)((prev: string[] = []) => {
          const withoutCurrent = prev.filter(
            (key) => key !== changedHeader.headerKey,
          );

          if (!headerName && changedHeader.headerKey) {
            return [...withoutCurrent, changedHeader.headerKey];
          }

          return withoutCurrent;
        });
      }

      return propagatedRows;
    }

    return updatedRows;
  });

  if (field === "item" || field === "product_name") {
    const nextValue = String(value || "").trim();
    if (nextValue && typeof setInvalidLineItemIds === "function") {
      setInvalidLineItemIds((prev) => prev.filter((id) => id !== rowId));
    }
  }
};
const handleRemoveLineItem = (rowId: string) => {
    setLineItems((prev) => {
      const target = prev.find((row) => row.id === rowId);
      if (!target) return prev;

      if (target.type === "header") {
        if (isStandaloneGroupKey(target.headerKey)) return prev;

        return prev.filter(
          (row) =>
            row.id !== rowId &&
            !(row.type === "item" && row.parentHeaderKey === target.headerKey),
        );
      }

      return prev.filter((row) => row.id !== rowId);
    });
  };

  const handleSearchChange = (rowId: string, value: string) => {
    setLineItems((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              item: value,
              searchQuery: value,
              showSearchResults: true,
            }
          : row,
      ),
    );

    if (value?.trim()) {
      fetchProducts(value);
    }
  };

  const handleSearchFocus = (rowId: string, value: string) => {
    setLineItems((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              searchQuery: value,
              showSearchResults: true,
            }
          : row,
      ),
    );
  };

  const handleAddCustomFromSearch = (rowId: string, value: string) => {
    setLineItems((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              item: value,
              isCustomProduct: true,
              showSearchResults: false,
            }
          : row,
      ),
    );
  };

  // const handleSelectProduct = (rowId: string, product: ProductType) => {
  //   const targetRow = lineItems.find((row) => row.id === rowId);
  //   console.log(lineItems,"lineItemslineItems");
    

  //   if (!targetRow) return;

  //   const targetHeaderKey = targetRow.parentHeaderKey || null;

  //   const duplicateItemInSameSection = lineItems.find((row) => {
  //     if (row.id === rowId) return false;
  //     if (row.type !== "item") return false;
  //     if ((row.parentHeaderKey || null) !== targetHeaderKey) return false;

  //     const currentProductId = row.productId ?? row.estimate_product_id ?? null;
  //     const selectedProductId = product.id ?? null;

  //     if (
  //       currentProductId !== null &&
  //       selectedProductId !== null &&
  //       String(currentProductId) === String(selectedProductId)
  //     ) {
  //       return true;
  //     }

  //     return (
  //       String(row.item || "").trim().toLowerCase() ===
  //       String(product.name || "").trim().toLowerCase()
  //     );
  //   });

  //   if (duplicateItemInSameSection) {
  //     highlightDuplicateSection(targetHeaderKey);

  //     toast.error(
  //       "This product is already added in this section. You can increase its quantity instead.",
  //     );
  //     return;
  //   }
  //   console.log(product,"productproduct");

  //   if (onSelectProductData) {
  //     onSelectProductData(rowId, product);
  //     return;
  //   };

    

  //   setLineItems((prev) =>
  //     prev.map((row) => {
  //       if (row.id !== rowId) return row;

  //       const rate = Number(product.jdpPrice || product.rate || 0);
  //       const estimatedPrice = Number(product.estimatedPrice || 0);
  //       const qty = Number(row.qty || 0);
  //       const total = qty * (estimatedPrice > 0 ? estimatedPrice : rate);

  //       return {
  //         ...row,
  //         productId: product.id,
  //         estimate_product_id: product.id,
  //         item: product.name || "",
  //         description: product.description || "",
  //         rate,
  //         estimatedPrice,
  //         total,
  //         searchQuery: product.name || "",
  //         showSearchResults: false,
  //         isCustomProduct: false,
  //       };
  //     }),
  //   );
  // };


  const handleSelectProduct = (rowId: string, product: ProductType) => {
    const targetRow = lineItems.find((row) => row.id === rowId);

    if (!targetRow) return;

    const targetHeaderKey = targetRow.parentHeaderKey || null;

    const duplicateItemInSameSection = lineItems.find((row) => {
      if (row.id === rowId) return false;
      if (row.type !== "item") return false;
      if ((row.parentHeaderKey || null) !== targetHeaderKey) return false;

      const currentProductId = row.productId ?? row.estimate_product_id ?? null;
      const selectedProductId = product.id ?? null;

      if (
        currentProductId !== null &&
        selectedProductId !== null &&
        String(currentProductId) === String(selectedProductId)
      ) {
        return true;
      }

      return (
        String(row.item || "")
          .trim()
          .toLowerCase() ===
        String(product.name || "")
          .trim()
          .toLowerCase()
      );
    });

    if (duplicateItemInSameSection) {
      highlightDuplicateItem(duplicateItemInSameSection.id);

      toast(
        "This product is already added in this section. You can increase its quantity instead.",
        {
          duration: 3000,
        },
      );
      return;
    }

    if (onSelectProductData) {
      onSelectProductData(rowId, product);
      return;
    }

    setLineItems((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const rate = Number(product.jdpPrice || product.rate || 0);
        const estimatedPrice = Number(product.estimatedPrice || 0);
        const qty = Number(row.qty || 0);
        const total = qty * (estimatedPrice > 0 ? estimatedPrice : rate);

        return {
          ...row,
          productId: product.id,
          estimate_product_id: product.id,
          jdpSKU: product.jdpSKU || null,
          item: product.name || "",
          description: product.description || "",
          rate,
          estimatedPrice,
          total,
          searchQuery: product.name || "",
          showSearchResults: false,
          isCustomProduct: false,
        };
      }),
    );
  };
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDraggedItem(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeGroup = groupedItems.find(
      (group) => group.header.headerKey === activeId,
    );

    // HEADER GROUP DRAG (custom headers only; virtual standalone groups are drop targets)
    if (
      activeGroup?.header.type === "header" &&
      !isStandaloneGroupKey(activeId)
    ) {
      let normalizedOverHeaderKey = overId;

      if (overId.startsWith("empty-drop-")) {
        normalizedOverHeaderKey = overId.replace("empty-drop-", "");
      }

      const overRow = lineItems.find((row) => row.id === overId);
      if (overRow?.type === "item") {
        const itemGroup = groupedItems.find((group) =>
          group.items.some((item) => item.id === overId),
        );
        normalizedOverHeaderKey =
          itemGroup?.header.headerKey ||
          overRow.parentHeaderKey ||
          normalizedOverHeaderKey;
      }

      const overGroup = groupedItems.find(
        (group) => group.header.headerKey === normalizedOverHeaderKey,
      );

      if (!overGroup) return;

      setLineItems((prev) =>
        reorderHeaderGroups({
          lineItems: prev,
          activeHeaderKey: activeId,
          overHeaderKey: normalizedOverHeaderKey,
        }),
      );
      return;
    }

    // ITEM DRAG
    const activeRow = lineItems.find((row) => row.id === activeId);
    if (!activeRow || activeRow.type !== "item") return;

    let overRowIndex = lineItems.findIndex((row) => row.id === overId);

    if (overRowIndex === -1 && overId.startsWith("empty-drop-")) {
      const targetHeaderKey = overId.replace("empty-drop-", "");
      const targetGroup = groupedItems.find(
        (group) => group.header.headerKey === targetHeaderKey,
      );

      if (targetGroup) {
        if (isStandaloneGroupKey(targetHeaderKey)) {
          overRowIndex = getGroupStartIndexInFlatList(
            groupedItems,
            targetHeaderKey,
          );
        } else {
          const headerIndex = lineItems.findIndex(
            (row) => row.type === "header" && row.headerKey === targetHeaderKey,
          );
          if (headerIndex !== -1) {
            overRowIndex = headerIndex + 1;
          }
        }
      }
    }

    if (overRowIndex === -1) {
      const overGroup = groupedItems.find(
        (group) => group.header.headerKey === overId,
      );

      if (overGroup) {
        if (isStandaloneGroupKey(overGroup.header.headerKey)) {
          overRowIndex = getGroupStartIndexInFlatList(
            groupedItems,
            overGroup.header.headerKey as string,
          );
        } else {
          const headerIndex = lineItems.findIndex(
            (row) =>
              row.type === "header" &&
              row.headerKey === overGroup.header.headerKey,
          );

          if (headerIndex !== -1) {
            overRowIndex = headerIndex + 1;
          }
        }
      }
    }

    if (overRowIndex === -1) return;

    setLineItems((prev) =>
      handleItemDropReparent(prev, activeId, overRowIndex),
    );
  };
  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => {
      if (item.type === "header") return sum;
      if (useRateForLineTotal || isJobDetail) {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        return sum + Number((qty * rate).toFixed(2));
      }
      return sum + (Number(item.total) || 0);
    }, 0);
  };

  const prependStandaloneLineItem = (isCustomProduct: boolean) => {
    setLineItems((prev) => [
      createItemRow({
        selectedSupplierId,
        parentHeaderKey: null,
        parentHeaderName: null,
        isCustomProduct,
      }),
      ...prev,
    ]);
  };

  const handleAddStandaloneLineItem = () => {
    prependStandaloneLineItem(false);
  };

  const handleAddStandaloneCustomItem = () => {
    prependStandaloneLineItem(true);
  };

  const handleAddHeaderWithFirstItem = () => {
    setLineItems((prev) => {
      const headerRow = createHeaderRow(selectedSupplierId, "");

      const firstItem = createItemRow({
        selectedSupplierId,
        parentHeaderKey: headerRow.headerKey as string,
        parentHeaderName: headerRow.headerName || "",
        isCustomProduct: false,
      });

      return [...prev, headerRow, firstItem];
    });
  };

  return (
    <GroupedLineItemsTable
      groupedItems={groupedItems}
      sortableIds={sortableIds}
      allGroupHeaderKeys={allGroupHeaderKeys}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      activeDraggedItem={activeDraggedItem}
      onAddHeaderWithFirstItem={handleAddHeaderWithFirstItem}
      handleAddHeaderWithFirstItem={handleAddHeaderWithFirstItem}
      handleAddStandaloneLineItem={handleAddStandaloneLineItem}
      handleAddStandaloneCustomItem={handleAddStandaloneCustomItem}
      onAddLineItemUnderHeader={handleAddLineItemUnderHeader}
      onAddCustomProductUnderHeader={handleAddCustomProductUnderHeader}
      onRemoveRow={handleRemoveLineItem}
      onUpdateRow={handleUpdateLineItem}
      onSearchChange={handleSearchChange}
      onSearchFocus={handleSearchFocus}
      onSelectProduct={handleSelectProduct}
      onAddCustomFromSearch={handleAddCustomFromSearch}
      getFilteredProducts={getFilteredProducts}
      subtotal={calculateSubtotal()}
      duplicateItemRowId={duplicateItemRowId}
      isJobDetail={isJobDetail}
       duplicateRowRef={duplicateRowRef}
       dropdownPortalRef={dropdownPortalRef}
       invalidHeaderKeys={invalidHeaderKeys}
       invalidLineItemIds={invalidLineItemIds}
       summaryLaborTotal={summaryLaborTotal}
    />
  );
};

export default InvoiceLineItemsManager;