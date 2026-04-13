import React, { useEffect, useMemo, useRef } from "react";
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
  supplierId?: number | string;
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
  isJobDetail?:boolean;
  duplicateRowRef?: React.MutableRefObject<HTMLElement | null>;
  dropdownPortalRef?: React.MutableRefObject<HTMLElement | null>;
  isDuplicateItem?: boolean;
  isInvalidItem?: boolean;
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
  isJobDetail=false,
  duplicateRowRef,
  dropdownPortalRef,
  isDuplicateItem=false,
  isInvalidItem
  
  
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

  const containerRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!lineItem.showSearchResults) return;
      if (!containerRef.current) return;

      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        onUpdateRow(lineItem.id, "showSearchResults", false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [lineItem.id, lineItem.showSearchResults, onUpdateRow]);

 const rowHighlightClass = isInvalidItem
  ? "bg-red-50/80 ring-2 ring-red-400 scale-[1.003] will-change-transform"
  : isDuplicateItem
    ? "bg-sky-50/80 ring-2 ring-sky-400 scale-[1.003] will-change-transform"
    : "hover:bg-gray-50";

const rowBoxShadow = isInvalidItem
  ? "0px 5px 15px rgba(220,38,38,0.35)"
  : isDuplicateItem
    ? "#3b82f680 0px 5px 15px"
    : "";

const cellClass = isInvalidItem
  ? "border-red-300 bg-red-50/60"
  : isDuplicateItem
    ? "border-sky-300 bg-sky-50/60"
    : "border-gray-300";

    const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    position: "relative",
    zIndex: isDragging ? 50 : isDuplicateItem ? 10 : 0.5,
    opacity: isDragging ? 0.12 : 1,
    // boxShadow: isDuplicateItem ? "#3b82f680 0px 5px 15px" : "",
     boxShadow: rowBoxShadow,
  };
  // };
  console.log(isInvalidItem,"isInvalidItem");
  

  const filteredProducts = useMemo(
    () => getFilteredProducts(lineItem.searchQuery || ""),
    [getFilteredProducts, lineItem.searchQuery],
  );
  const duplicateCellClass = isDuplicateItem
  ? "border-sky-300 bg-sky-50/60"
  : "border-gray-300";

  return (
    // <tr
    //   style={style}
    //   ref={(node) => {
    //     setNodeRef(node);
    //     if (isDuplicateItem && duplicateRowRef) {
    //       duplicateRowRef.current = node;
    //     }
    //   }}
    //   className={`relative overflow-visible transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
    //     isDragging
    //       ? "bg-white opacity-95"
    //       : isDuplicateItem
    //         ? "bg-sky-50/80 ring-2 ring-sky-400 scale-[1.003] will-change-transform"
    //         : "hover:bg-gray-50"
    //   }`}
    // >
    <tr
      style={style}
      ref={setNodeRef}
      className={`relative overflow-visible transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isDragging ? "bg-white opacity-95" : rowHighlightClass
      }`}
    >
      <td
        className={`border border-gray-300 px-2 py-2 align-top h-[92px] max-h-[92] ${cellClass}`}
      >
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

      <td
        ref={containerRef}
        // className={`w-[400px] border border-gray-300 p-1 relative h-[92px] overflow-visible max-h-[92] ${
        //   lineItem.showSearchResults ? "z-[9999]" : "z-[1]"
        // } ${duplicateCellClass}`}
        className={`${
          isJobDetail ? "w-[520px]" : "w-[400px]"
        } border border-gray-300 px-2 py-2 relative h-[92px] overflow-visible max-h-[92] ${
          lineItem.showSearchResults ? "z-[9999]" : "z-[1]"
        } ${cellClass}`}
      >
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
                onUpdateRow(lineItem.id, "showSearchResults", true);
                if (lineItem.item) {
                  onSearchFocus?.(lineItem.id, lineItem.item);
                }
              }}
              className="border-0 p-2 pr-10 h-11 text-[14px]"
              placeholder="Search by name, SKU, description, supplier..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {!lineItem.isCustomProduct &&
          lineItem.showSearchResults &&
          lineItem.searchQuery && (
            <div
              ref={(node) => {
                if (lineItem.showSearchResults && dropdownPortalRef) {
                  dropdownPortalRef.current = node;
                }
              }}
              //   className={`
              //   absolute left-0 top-full mt-2
              //   z-[999999]
              //   ${isJobDetail ? "w-[320px]" : ""}
              //   rounded-xl border border-slate-200 bg-white
              //   shadow-2xl max-h-[320px] overflow-y-auto p-2
              // `}
              className={`
                absolute left-0 top-full mt-2
                z-[999999]
                w-full min-w-full max-w-full
                rounded-xl border border-slate-200 bg-white
                shadow-2xl max-h-[320px] overflow-y-auto p-2
              `}
              style={{
                opacity: 1,
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            >
              {filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectProduct(lineItem.id, product);
                      }}
                      className="rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-[14px] text-slate-900 mb-1">
                            {product.name}
                          </div>

                          {product.description && (
                            <div className="text-[12px] text-slate-500 leading-5 line-clamp-2">
                              {product.description}
                            </div>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                            {product.jdpSKU && (
                              <span className="text-slate-600">
                                <span className="font-medium text-slate-700">
                                  SKU:
                                </span>{" "}
                                {product.jdpSKU}
                              </span>
                            )}

                            <span className="text-slate-600">
                              <span className="font-medium text-slate-700">
                                Rate:
                              </span>{" "}
                              $
                              {(product.jdpPrice || product.rate || 0).toFixed(
                                2,
                              )}
                            </span>

                            {!!product.estimatedPrice &&
                              product.estimatedPrice > 0 && (
                                <span className="text-slate-600">
                                  <span className="font-medium text-slate-700">
                                    Est:
                                  </span>{" "}
                                  ${product.estimatedPrice.toFixed(2)}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3">
                  <div className="text-sm text-muted-foreground mb-3">
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
                    className="w-full h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{lineItem.searchQuery}"
                  </Button>
                </div>
              )}
            </div>
          )}
      </td>

      <td
        className={`border border-gray-300 px-2 py-2 max-h-[92] ${cellClass}`}
      >
        <Textarea
          value={lineItem.description}
          onChange={(e) =>
            onUpdateRow(lineItem.id, "description", e.target.value)
          }
          className="border-0 p-2 min-h-[80px] h-[80px] max-h-[80px] resize-none"
          placeholder="Enter product description"
        />
      </td>

      <td
        className={`border border-gray-300 px-2 py-2 h-[92px] max-h-[92] ${cellClass}`}
      >
        <Input
          type="number"
          value={lineItem.rate}
          onChange={(e) =>
            onUpdateRow(lineItem.id, "rate", parseFloat(e.target.value) || 0)
          }
          className="text-right border-0 p-2 max-h-[92]"
          min="0"
        />
      </td>

      <td
        className={`border border-gray-300 px-2 py-2 max-h-[92] ${cellClass}`}
      >
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

      <td
        className={`border border-gray-300 px-3 py-2 text-right font-medium ${cellClass}`}
      >
        ${(lineItem.total || 0).toFixed(2)}
      </td>

      <td
        className={`border border-gray-300 px-3 py-2 text-center h-[92px] ${cellClass}`}
      >
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