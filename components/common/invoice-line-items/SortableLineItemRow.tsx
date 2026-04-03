import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Plus, Search, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

interface SortableLineItemRowProps {
  lineItem: LineItemType;
  onRemoveRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: string, value: any) => void;
  onSearchChange: (rowId: string, value: string) => void;
  onSearchFocus?: (rowId: string, value: string) => void;
  onSelectProduct: (rowId: string, product: ProductType) => void;
  onAddCustomFromSearch?: (rowId: string, value: string) => void;
  getFilteredProducts: (query: string) => ProductType[];
}

const SortableLineItemRow = ({
  lineItem,
  onRemoveRow,
  onUpdateRow,
  onSearchChange,
  onSearchFocus,
  onSelectProduct,
  onAddCustomFromSearch,
  getFilteredProducts,
}: SortableLineItemRowProps) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lineItem.id,
  });
  console.log(lineItem,"lineItem");
  

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    position: "relative",
    zIndex: isDragging ? 1 : "auto",
    opacity: isDragging ? 0.12 : 1,
  };

  const filteredProducts = getFilteredProducts(lineItem.searchQuery || "");
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`overflow-visible ${
        isDragging
          ? "bg-white shadow-lg opacity-95"
          : "hover:bg-gray-50 transition-colors"
      }`}
    >
    {/* <tr ref={setNodeRef} style={style} className="overflow-visible"> */}
      <td className="border border-gray-300 p-1 align-top h-[92px] max-h-[92]">
        <div className="flex items-center gap-2 h-[100%]">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>

          <Input
            type="number"
            value={lineItem.qty}
            onChange={(e) =>
              onUpdateRow(lineItem.id, "qty", parseFloat(e.target.value) || 0)
            }
            className="text-center border-0 p-2"
            min="0"
          />
        </div>
      </td>

      <td className="border border-gray-300 p-1 relative h-[92px] overflow-visible  max-h-[92]">
        {lineItem.isCustomProduct ? (
          <Input
            value={lineItem.item}
            onChange={(e) => onUpdateRow(lineItem.id, "item", e.target.value)}
            className="border-0 p-2"
            placeholder="Enter custom item name"
          />
        ) : (
          <div className="relative product-search-container">
            <Input
              value={lineItem.item}
              onChange={(e) => {
                const value = e.target.value;
                onUpdateRow(lineItem.id, "item", value);
                onSearchChange(lineItem.id, value);
              }}
              onFocus={() => {
                if (lineItem.item) {
                  onSearchFocus?.(lineItem.id, lineItem.item);
                }
              }}
              className="border-0 p-2 pr-8"
              placeholder="Search or enter product name"
            />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {!lineItem.isCustomProduct &&
          lineItem.showSearchResults &&
          lineItem.searchQuery && (
            <div className=" z-[999999] absolute left-0 top-full mt-1 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectProduct(lineItem.id, product);
                    }}
                    className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100 transition-colors"
                  >
                    <div className="font-medium text-sm mb-1">
                      {product.name}
                    </div>

                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {product.description}
                    </div>

                    <div className="text-xs text-primary mt-2">
                      {product.jdpSKU} • $
                      {(product.jdpPrice || product.rate || 0).toFixed(2)}
                      {!!product.estimatedPrice &&
                        product.estimatedPrice > 0 &&
                        ` • Est: $${product.estimatedPrice.toFixed(2)}`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3">
                  <div className="text-sm text-muted-foreground mb-2">
                    No products found
                  </div>

                  <Button
                    size="sm"
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onAddCustomFromSearch?.(
                        lineItem.id,
                        lineItem.searchQuery || "",
                      );
                    }}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add "{lineItem.searchQuery}"
                  </Button>
                </div>
              )}
            </div>
          )}
      </td>

      <td className="border border-gray-300 p-1  max-h-[92]">
        {/* <Textarea
          value={lineItem.description}
          onChange={(e) =>
            onUpdateRow(lineItem.id, "description", e.target.value)
          }
          className="border-0 p-2 min-h-[80px] h-[80px]  max-h-[80]"
          placeholder="Enter product description"
        /> */}
        <Textarea
          value={lineItem.description}
          onChange={(e) =>
            onUpdateRow(lineItem.id, "description", e.target.value)
          }
          className="border-0 p-2 min-h-[80px] h-[80px] max-h-[80px] resize-none"
          placeholder="Enter product description"
        />
      </td>

      <td className="border border-gray-300 p-1 h-[92px]  max-h-[92]">
        <Input
          type="number"
          value={lineItem.rate}
          onChange={(e) =>
            onUpdateRow(lineItem.id, "rate", parseFloat(e.target.value) || 0)
          }
          className="text-right border-0 p-2  max-h-[92]"
          min="0"
        />
      </td>

      <td className="border border-gray-300 p-1  max-h-[92]">
        <Input
          type="number"
          value={lineItem.estimatedPrice}
          onChange={(e) =>
            onUpdateRow(
              lineItem.id,
              "estimatedPrice",
              parseFloat(e.target.value) || 0,
            )
          }
          className="text-right border-0 p-2"
          min="0"
        />
      </td>

      <td className="border border-gray-300 px-3 py-2 text-right font-medium">
        ${(lineItem.total || 0).toFixed(2)}
      </td>

      <td className="border border-gray-300 px-3 py-2 text-center h-[92px]">
        <button
          type="button"
          onClick={() => onRemoveRow(lineItem.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mx-auto" />
        </button>
      </td>
    </tr>
  );
};

export default SortableLineItemRow;
