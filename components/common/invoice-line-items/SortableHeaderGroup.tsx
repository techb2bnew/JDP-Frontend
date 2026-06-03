import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import SortableLineItemRow from "./SortableLineItemRow";
import { isStandaloneGroupKey } from "./lineItemHelpers";

type ProductType = {
  id: string | number;
  name: string;
  description?: string;
  jdpSKU?: string;
  supplierSKU?: string;
  jdpPrice?: number;
  estimatedPrice?: number;
  rate?: number;
};

type LineItemType = {
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
  isCustomProduct?: boolean;
};

type GroupType = {
  header: LineItemType;
  items: LineItemType[];
};

interface SortableHeaderGroupProps {
  group: GroupType;
  onAddLineItemUnderHeader: (headerKey: string) => void;
  onAddCustomProductUnderHeader: (headerKey: string) => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: string, value: any) => void;
  onSearchChange: (rowId: string, value: string) => void;
  onSearchFocus?: (rowId: string, value: string) => void;
  onSelectProduct: (rowId: string, product: ProductType) => void;
  onAddCustomFromSearch?: (rowId: string, value: string) => void;
  getFilteredProducts: (query: string) => ProductType[];
  duplicateItemRowId?: string | null;
  duplicateRowRef?: React.MutableRefObject<HTMLElement | null>;
  dropdownPortalRef?: React.MutableRefObject<HTMLElement | null>;
  isJobDetail?: boolean;
  isInvalidHeader?: boolean;
  invalidLineItemIds:string[]
}

const SortableHeaderGroup = ({
  group,
  onAddLineItemUnderHeader,
  onAddCustomProductUnderHeader,
  onRemoveRow,
  onUpdateRow,
  onSearchChange,
  onSearchFocus,
  onSelectProduct,
  onAddCustomFromSearch,
  getFilteredProducts,
  isJobDetail = false,
  duplicateRowRef,
  dropdownPortalRef,
  duplicateItemRowId,
  isInvalidHeader,
  invalidLineItemIds=[]
  
}: SortableHeaderGroupProps) => {
  const isVirtualStandaloneHeader = isStandaloneGroupKey(
    group.header.headerKey,
  );

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group.header.headerKey as string,
    disabled: isVirtualStandaloneHeader,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `empty-drop-${group.header.headerKey}`,
    disabled: isVirtualStandaloneHeader || group.items.length > 0,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <tbody
      ref={setNodeRef}
      style={style}
      className="overflow-visible"
      // className={isDuplicateSection ? "animate-pulse" : ""}
    >
      {!isVirtualStandaloneHeader && (
        <tr>
          <td
            colSpan={7}
            // className={`border-x border-b p-0 transition-all duration-300 ${
            //   isInvalidHeader
            //     ? "border-red-300 bg-red-50/40 "
            //     : "border-slate-300"
            // }`}
            className="p-0 border-0 bg-transparent overflow-visible"
          >
            <div
              className={`relative z-10 flex items-center justify-between gap-3 px-3 py-2 text-white transform-gpu overflow-visible rounded-[2px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isInvalidHeader
                  ? "bg-[#334155] scale-[1.003] shadow-[0px_5px_15px_rgb(210_0_0_/_35%)] border border-[#ff000066]"
                  : isDragging
                    ? "bg-[#334155] scale-[1.002] shadow-[0_6px_18px_rgba(15,23,42,0.18)]"
                    : "bg-gray-600 hover:shadow-[0_4px_14px_rgba(15,23,42,0.10)]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing opacity-80 hover:opacity-100 transition shrink-0"
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <Input
                  value={group.header.headerName || ""}
                  onChange={(e) =>
                    onUpdateRow(group.header.id, "headerName", e.target.value)
                  }
                  className={`
                      h-8 w-[240px]
                      bg-transparent px-2
                      text-[18px] font-medium text-white
                      border rounded-md
                      shadow-none outline-none
                      transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                      placeholder:text-white/45
                      focus-visible:bg-white/5
                      focus-visible:ring-0
                      focus-visible:ring-offset-0
                      focus:outline-none
                      !ring-0 !ring-offset-0
                      ${
                        isInvalidHeader
                          ? "border-red-300/90 bg-red-50/20 focus:border-red-300"
                          : "border-transparent focus-visible:border-white/15"
                      }
                    `}
                  placeholder="Type your header name"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onAddLineItemUnderHeader(group.header.headerKey as string)
                  }
                  className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-[11px] transition"
                >
                  <Plus className="h-3 w-3" />
                  Add Line Item
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddCustomProductUnderHeader(
                      group.header.headerKey as string,
                    )
                  }
                  className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-[11px] transition"
                >
                  <Plus className="h-3 w-3" />
                  Add Custom
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveRow(group.header.id)}
                  className="flex items-center gap-1 rounded-md bg-red-500/20 hover:bg-red-500/30 px-2.5 py-1.5 text-[11px] text-red-200 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {group.items.length === 0 && !isVirtualStandaloneHeader && (
        <tr>
          <td
            ref={setDropRef}
            colSpan={7}
            className="border border-dashed border-slate-300 bg-slate-50 h-[84px] min-h-[84px] px-4 text-center text-sm text-slate-500"
          >
            Drag line item here
          </td>
        </tr>
      )}

      {group.items.map((lineItem) => (
        <SortableLineItemRow
          key={lineItem.id}
          lineItem={lineItem}
          onRemoveRow={onRemoveRow}
          onUpdateRow={onUpdateRow}
          onSearchChange={onSearchChange}
          onSearchFocus={onSearchFocus}
          onSelectProduct={onSelectProduct}
          onAddCustomFromSearch={onAddCustomFromSearch}
          getFilteredProducts={getFilteredProducts}
          isJobDetail={isJobDetail}
          isDuplicateItem={duplicateItemRowId === lineItem.id}
          duplicateRowRef={duplicateRowRef}
          dropdownPortalRef={dropdownPortalRef}
          isInvalidItem={invalidLineItemIds?.includes(lineItem.id)}
        />
      ))}
    </tbody>
  );
};

export default SortableHeaderGroup;