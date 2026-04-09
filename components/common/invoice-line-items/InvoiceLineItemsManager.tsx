import React, { useEffect, useMemo, useRef, useState } from "react";
import GroupedLineItemsTable from "./GroupedLineItemsTable";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";

export type ProductType = {
  id: string | number;
  name: string;
  description?: string;
  jdpSKU?: string;
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
  isJobDetail?:boolean
  invalidHeaderKeys?:string[]
  setInvalidHeaderKeys?: () => void;
  invalidLineItemIds?: string[];
  setInvalidLineItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
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

const getHeaderGroups = (lineItems: LineItemType[] = []): HeaderGroupType[] => {
  const groups: HeaderGroupType[] = [];
  const standaloneItems: LineItemType[] = [];
  let currentGroup: HeaderGroupType | null = null;

  for (const row of lineItems) {
    if (row.type === "item" && !row.parentHeaderKey) {
      standaloneItems.push(row);
      continue;
    }

    if (row.type === "header") {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        header: row,
        items: [],
      };
      continue;
    }

    if (
      row.type === "item" &&
      currentGroup &&
      row.parentHeaderKey === currentGroup.header.headerKey
    ) {
      currentGroup.items.push(row);
    }
  }

  if (standaloneItems.length > 0) {
    groups.unshift({
      header: {
        id: "standalone_header",
        type: "header",
        headerKey: "standalone_header_key",
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
      },
      items: standaloneItems,
    });
  }

  if (currentGroup) groups.push(currentGroup);

  return groups;
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

  if (
    activeHeaderKey === "standalone_header_key" ||
    overHeaderKey === "standalone_header_key"
  ) {
    return lineItems;
  }

  const groups = getHeaderGroups(lineItems).filter(
    (group) => group.header.headerKey !== "standalone_header_key",
  );

  const standaloneRows = lineItems.filter(
    (row) => row.type === "item" && !row.parentHeaderKey,
  );

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

  return [
    ...standaloneRows,
    ...updatedGroups.flatMap((group) => [group.header, ...group.items]),
  ];
};

const resolveParentAfterDrop = (rows: LineItemType[], targetIndex: number) => {
  for (let i = targetIndex - 1; i >= 0; i--) {
    const row = rows[i];

    if (row.type === "header" && row.headerKey !== "standalone_header_key") {
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
  invalidHeaderKeys,
  setInvalidHeaderKeys,
  invalidLineItemIds,
  setInvalidLineItemIds

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
        .filter((id) => id !== "standalone_header_key"),
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
        const priceToUse =
          Number(updated.estimatedPrice) > 0
            ? Number(updated.estimatedPrice)
            : Number(updated.rate) || 0;

        updated.total = qty * priceToUse;
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
    if (nextValue) {
      setInvalidLineItemIds((prev) => prev.filter((id) => id !== rowId));
    }
  }
};
const handleRemoveLineItem = (rowId: string) => {
    setLineItems((prev) => {
      const target = prev.find((row) => row.id === rowId);
      if (!target) return prev;

      if (target.type === "header") {
        if (target.headerKey === "standalone_header_key") return prev;

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

    // HEADER GROUP DRAG
    if (activeGroup?.header.type === "header") {
      let normalizedOverHeaderKey = overId;

      // if dropped on empty drop zone
      if (overId.startsWith("empty-drop-")) {
        normalizedOverHeaderKey = overId.replace("empty-drop-", "");
      }

      // if dropped on an item row, resolve its parent header
      const overRow = lineItems.find((row) => row.id === overId);
      if (overRow?.type === "item") {
        normalizedOverHeaderKey =
          overRow.parentHeaderKey || "standalone_header_key";
      }

      // if dropped on header row id, keep as is
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
      const headerIndex = lineItems.findIndex(
        (row) => row.type === "header" && row.headerKey === targetHeaderKey,
      );
      if (headerIndex !== -1) {
        overRowIndex = headerIndex + 1;
      }
    }

    if (overRowIndex === -1) {
      const overGroup = groupedItems.find(
        (group) => group.header.headerKey === overId,
      );

      if (overGroup) {
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

    if (overRowIndex === -1) return;

    setLineItems((prev) =>
      handleItemDropReparent(prev, activeId, overRowIndex),
    );
  };
  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => {
      if (item.type === "header") return sum;
      return sum + (Number(item.total) || 0);
    }, 0);
  };

  const handleAddStandaloneLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      createItemRow({
        selectedSupplierId,
        parentHeaderKey: null,
        parentHeaderName: null,
        isCustomProduct: false,
      }),
    ]);
  };

  const handleAddStandaloneCustomItem = () => {
    setLineItems((prev) => [
      ...prev,
      createItemRow({
        selectedSupplierId,
        parentHeaderKey: null,
        parentHeaderName: null,
        isCustomProduct: true,
      }),
    ]);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      activeDraggedItem={activeDraggedItem}
      onAddHeaderWithFirstItem={handleAddHeaderWithFirstItem}
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
    />
  );
};

export default InvoiceLineItemsManager;