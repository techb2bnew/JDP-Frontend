import React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import SortableHeaderGroup from "./SortableHeaderGroup";

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
  supplierId?: number;
  isCustomProduct?: boolean;
  productId?: string | number | null;
  estimate_product_id?: string | number | null;
  
};

type HeaderGroupType = {
  header: LineItemType;
  items: LineItemType[];
};

interface GroupedLineItemsTableProps {
  onDragStart: (event: DragStartEvent) => void;
  activeDraggedItem?: any;
  groupedItems: HeaderGroupType[];
  sortableIds: string[];
  onDragEnd: (event: DragEndEvent) => void;

  onAddHeaderWithFirstItem: () => void;
  onAddLineItemUnderHeader: (headerKey: string) => void;
  onAddCustomProductUnderHeader: (headerKey: string) => void;

  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: string, value: any) => void;

  onSearchChange: (rowId: string, value: string) => void;
  onSearchFocus?: (rowId: string, value: string) => void;
  onSelectProduct: (rowId: string, product: ProductType) => void;
  onAddCustomFromSearch?: (rowId: string, value: string) => void;

  getFilteredProducts: (query: string) => ProductType[];
  subtotal: number;
  handleAddStandaloneLineItem: () => void;
  handleAddStandaloneCustomItem: () => void;
  handleAddHeaderWithFirstItem: () => void;
  duplicateItemRowId?: string | null;
  duplicateRowRef?: React.MutableRefObject<HTMLElement | null>;
  dropdownPortalRef?: React.MutableRefObject<HTMLElement | null>;
  isJobDetail?:boolean;
  invalidHeaderKeys?: string[];
}

const GroupedLineItemsTable = ({
  groupedItems,
  sortableIds,
  onDragEnd,
  onAddLineItemUnderHeader,
  onAddCustomProductUnderHeader,

  handleAddStandaloneLineItem,
  handleAddStandaloneCustomItem,
  onAddHeaderWithFirstItem,

  onRemoveRow,
  onUpdateRow,

  onSearchChange,
  onSearchFocus,
  onSelectProduct,
  onAddCustomFromSearch,
  onDragStart,
  activeDraggedItem,
  getFilteredProducts,
  subtotal,
  duplicateItemRowId,
  duplicateRowRef,
  dropdownPortalRef,
  invalidHeaderKeys=[],
  isJobDetail=false
}: GroupedLineItemsTableProps) => {
  return (
    <div className="space-y-4">
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={[
            ...sortableIds,
            ...groupedItems.flatMap((group) =>
              group.items.map((item) => item.id),
            ),
          ]}
          strategy={verticalListSortingStrategy}
        >
          <DragOverlay>
            {activeDraggedItem ? (
              <div className="pointer-events-none w-[1060px] rounded-md border border-slate-200 bg-white shadow-2xl">
                <div className="grid grid-cols-[90px_220px_320px_120px_160px_140px_90px] items-stretch">
                  <div className="border-r border-slate-200 px-3 py-4 text-sm">
                    {activeDraggedItem.qty}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-4 text-sm">
                    {activeDraggedItem.item}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-4 text-sm line-clamp-3">
                    {activeDraggedItem.description}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-4 text-sm text-right">
                    {activeDraggedItem.rate}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-4 text-sm text-right">
                    {activeDraggedItem.estimatedPrice}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-4 text-sm text-right font-medium">
                    ${Number(activeDraggedItem.total || 0).toFixed(2)}
                  </div>
                  <div className="px-3 py-4" />
                </div>
              </div>
            ) : null}
          </DragOverlay>

          <div className="overflow-y-visible">
            <table className="table-fixed w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left w-[90px]">
                    Qty
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left min-w-[220px]">
                    Item
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left min-w-[320px]">
                    Description
                  </th>
                  <th
                    className={`border border-gray-300 px-3 py-2 text-left ${
                      isJobDetail ? "w-[85px]" : "w-[120px]"
                    }`}
                  >
                    Rate
                  </th>
                  <th
                    className={`border border-gray-300 px-3 py-2 text-left ${
                      isJobDetail ? "w-[125px]" : "w-[160px]"
                    }`}
                  >
                    Estimated Price
                  </th>
                  <th
                    className={`border border-gray-300 px-3 py-2 text-left ${
                      isJobDetail ? "w-[85px]" : "w-[140px]"
                    }`}
                  >
                    Total
                  </th>
                  <th className={`border border-gray-300 px-3 py-2 text-left ${
                      isJobDetail ? "w-[85px]" : "w-[90px]"
                    }`}>
                    Action
                  </th>
                </tr>
              </thead>

              {groupedItems.map((group) => (
                <SortableHeaderGroup
                  key={group.header.headerKey}
                  group={group}
                  onAddLineItemUnderHeader={onAddLineItemUnderHeader}
                  onAddCustomProductUnderHeader={onAddCustomProductUnderHeader}
                  onRemoveRow={onRemoveRow}
                  onUpdateRow={onUpdateRow}
                  onSearchChange={onSearchChange}
                  onSearchFocus={onSearchFocus}
                  onSelectProduct={onSelectProduct}
                  onAddCustomFromSearch={onAddCustomFromSearch}
                  getFilteredProducts={getFilteredProducts}
                  duplicateItemRowId={duplicateItemRowId}
                  duplicateRowRef={duplicateRowRef}
                  dropdownPortalRef={dropdownPortalRef}
                  isJobDetail={isJobDetail}
                  isInvalidHeader={invalidHeaderKeys.includes(
                    group.header.headerKey || "",
                  )}
                />
              ))}

              <tfoot>
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-300 px-3 py-2"
                  />
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                    ${subtotal.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2 pt-3 pb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStandaloneLineItem}
          className="border-dashed border-2 border-primary text-primary hover:bg-primary/5"
        >
          Add Line Item
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed border-2 border-green-500 text-green-600 hover:bg-green-50"
          onClick={handleAddStandaloneCustomItem}
        >
          Add Custom
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onAddHeaderWithFirstItem}
          className="text-white"
        >
          Add Custom Header
        </Button>
      </div>
    </div>
  );
};

export default GroupedLineItemsTable;