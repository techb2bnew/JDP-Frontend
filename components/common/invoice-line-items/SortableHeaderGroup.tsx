import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import SortableLineItemRow from "./SortableLineItemRow";

type ProductType = {
  id: string | number;
  name: string;
  description?: string;
  jdpSKU?: string;
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
  isDuplicateSection?: boolean;
  isJobDetail?: boolean;
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
  isDuplicateSection = false,
  isJobDetail = false,
}: SortableHeaderGroupProps) => {
  const isVirtualStandaloneHeader =
    group.header.headerKey === "standalone_header_key";

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
      // className={isDuplicateSection ? "animate-pulse" : ""}
    >
      {!isVirtualStandaloneHeader && (
        <tr>
          <td
            colSpan={7}
            className={`border-x border-b border-slate-300 p-0 transition-all duration-300 ${
              isDuplicateSection ? "bg-amber-50/30" : "bg-transparent"
            }`}
          >
            <div
              className={`relative flex items-center justify-between gap-3 px-4 py-3 text-white transition-all duration-300 ${
                isDuplicateSection
                  ? "bg-[#334155] ring-1 ring-amber-200/80"
                  : isDragging
                    ? "bg-[#334155]"
                    : "bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
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
                  className="
                  h-9 w-[240px]
                  bg-transparent px-2
                  text-[20px] font-medium text-white
                  border border-transparent rounded-md
                  shadow-none outline-none
                  transition-all duration-200
                  placeholder:text-white/50
                  focus-visible:border-white/15
                  focus-visible:bg-white/5
                  focus-visible:ring-0
                  focus-visible:ring-transparent
                  focus-visible:ring-offset-0
                  focus:outline-none
                  !ring-0 !ring-transparent !ring-offset-0
                "
                  placeholder="Type your header name"
                />
              </div>

              <div className="flex items-center gap-2">
                {isDuplicateSection && (
                  <span className="rounded-full border border-amber-200/30 bg-amber-100/10 px-3 py-1 text-[11px] font-medium text-amber-50">
                    Item already exists in this section
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    onAddLineItemUnderHeader(group.header.headerKey as string)
                  }
                  className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs transition"
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
                  className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs transition"
                >
                  <Plus className="h-3 w-3" />
                  Add Custom
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveRow(group.header.id)}
                  className="flex items-center gap-1 rounded-md bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-xs text-red-200 transition"
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
        />
      ))}
    </tbody>
  );
};

export default SortableHeaderGroup;