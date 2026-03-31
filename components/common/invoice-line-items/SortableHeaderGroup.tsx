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

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `empty-drop-${group.header.headerKey}`,
    disabled: isVirtualStandaloneHeader || group.items.length > 0,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <tbody ref={setNodeRef} style={style}>
      {!isVirtualStandaloneHeader && (
        <tr>
          <td colSpan={7} className="border border-gray-300 bg-slate-100 p-3">
            <div
              className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-white shadow-sm transition ${
                isDragging
                  ? "bg-slate-500 ring-2 ring-slate-300"
                  : "bg-gradient-to-r from-slate-700 to-slate-600"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing opacity-80 hover:opacity-100 transition"
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                  <Input
                    value={group.header.headerName || ""}
                    onChange={(e) =>
                      onUpdateRow(group.header.id, "headerName", e.target.value)
                    }
                    className="h-8 max-w-[220px] rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-white shadow-none transition-all placeholder:text-white/60 hover:bg-white/5 focus-visible:border-white/30 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20"
                    placeholder="Section name"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onAddLineItemUnderHeader(group.header.headerKey as string)
                  }
                  className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs transition"
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
                  className="flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs transition"
                >
                  <Plus className="h-3 w-3" />
                  Add Custom
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveRow(group.header.id)}
                  className="flex items-center gap-1 rounded-md bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-xs text-red-200 transition"
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
        />
      ))}
    </tbody>
  );
};

export default SortableHeaderGroup;
