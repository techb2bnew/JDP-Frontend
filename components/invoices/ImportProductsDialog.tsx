import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Package, FileText } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/utils/api";
import { LoadingSpinner } from "../common/LoadingSpinner";
import {
  bluesheetLaborToImportable,
  bluesheetMaterialToImportable,
  buildLineItemRowsFromImportSelections,
  estimateProductToImportable,
  partitionImportedProductsByDuplicate,
  type ImportableLabor,
  type ImportableProduct,
} from "../common/invoice-line-items/lineItemHelpers";

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | number | null | undefined;
  selectedSupplierId: number;
  /** Current invoice draft rows — used only to skip already-added products. */
  existingLineItems: any[];
  /** Called with ready-to-append lineItem rows (header + item rows). */
  onImport: (rows: any[]) => void;
}

type SourceSelection = {
  products: Record<string, ImportableProduct>;
  labor: Record<string, ImportableLabor>;
};

const emptySelection = (): SourceSelection => ({ products: {}, labor: {} });

function formatMoney(value: number): string {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

/** Preview grouping: mirrors the room-based grouping products get on import. */
function groupProductsByRoom(
  products: ImportableProduct[],
): { roomName: string | null; products: ImportableProduct[] }[] {
  const order: (string | null)[] = [];
  const map = new Map<string | null, ImportableProduct[]>();

  products.forEach((product) => {
    const room = product.headerName?.trim() || null;
    if (!map.has(room)) {
      map.set(room, []);
      order.push(room);
    }
    map.get(room)!.push(product);
  });

  return order.map((roomName) => ({ roomName, products: map.get(roomName)! }));
}

/** Product checklist for one source, sub-grouped by room so the preview matches the import result. */
function ProductPickList({
  products,
  selectedKeys,
  onToggle,
}: {
  products: ImportableProduct[];
  selectedKeys: Record<string, ImportableProduct>;
  onToggle: (product: ImportableProduct) => void;
}) {
  const groups = groupProductsByRoom(products);

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div key={group.roomName ?? "__ungrouped__"}>
          {group.roomName && (
            <div className="bg-gray-100 rounded-md px-2.5 py-1.5 mb-1">
              <p className="text-sm font-semibold text-gray-700">{group.roomName}</p>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {group.products.map((product) => (
              <label
                key={product.key}
                className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox
                  checked={!!selectedKeys[product.key]}
                  onCheckedChange={() => onToggle(product)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">
                    Qty {product.qty} × {formatMoney(product.rate)}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0">{formatMoney(product.total)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ImportProductsDialog({
  open,
  onOpenChange,
  jobId,
  selectedSupplierId,
  existingLineItems,
  onImport,
}: ImportProductsDialogProps) {
  const [loadingSources, setLoadingSources] = useState(false);
  const [bluesheets, setBluesheets] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);

  const [estimateProductsById, setEstimateProductsById] = useState<
    Record<string, "loading" | "error" | any[]>
  >({});

  const [selections, setSelections] = useState<Record<string, SourceSelection>>({});

  useEffect(() => {
    if (!open || !jobId) return;

    let cancelled = false;
    setLoadingSources(true);
    setBluesheets([]);
    setEstimates([]);
    setEstimateProductsById({});
    setSelections({});

    (async () => {
      const [bluesheetsResult, estimatesResult] = await Promise.allSettled([
        apiClient.getJobBluesheets(Number(jobId)),
        apiClient.getEstimatesByJob(String(jobId), 1, 100),
      ]);

      if (cancelled) return;

      if (bluesheetsResult.status === "fulfilled") {
        const responseData = bluesheetsResult.value?.data ?? bluesheetsResult.value;
        const blues =
          responseData?.bluesheets ?? responseData?.data ?? responseData ?? [];
        setBluesheets(Array.isArray(blues) ? blues : []);
      } else {
        toast.error("Failed to load Bluesheets for this job");
      }

      if (estimatesResult.status === "fulfilled") {
        const responseData = estimatesResult.value?.data ?? estimatesResult.value;
        const nextEstimates = Array.isArray(responseData?.estimates)
          ? responseData.estimates
          : [];
        setEstimates(nextEstimates);
      } else {
        toast.error("Failed to load Estimates for this job");
      }

      setLoadingSources(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  const fetchEstimateProducts = async (estimateId: string | number) => {
    const key = String(estimateId);
    if (estimateProductsById[key]) return;

    setEstimateProductsById((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const response = await apiClient.getEstimateById(Number(estimateId));
      const estimateData = response?.data || response;
      const products = Array.isArray(estimateData?.products)
        ? estimateData.products
        : [];
      setEstimateProductsById((prev) => ({ ...prev, [key]: products }));
    } catch {
      setEstimateProductsById((prev) => ({ ...prev, [key]: "error" }));
      toast.error("Failed to load products for this estimate");
    }
  };

  const getSelection = (sourceKey: string): SourceSelection =>
    selections[sourceKey] || emptySelection();

  const toggleProduct = (sourceKey: string, product: ImportableProduct) => {
    setSelections((prev) => {
      const current = prev[sourceKey] || emptySelection();
      const nextProducts = { ...current.products };
      if (nextProducts[product.key]) {
        delete nextProducts[product.key];
      } else {
        nextProducts[product.key] = product;
      }
      return { ...prev, [sourceKey]: { ...current, products: nextProducts } };
    });
  };

  const toggleLabor = (sourceKey: string, labor: ImportableLabor) => {
    setSelections((prev) => {
      const current = prev[sourceKey] || emptySelection();
      const nextLabor = { ...current.labor };
      if (nextLabor[labor.key]) {
        delete nextLabor[labor.key];
      } else {
        nextLabor[labor.key] = labor;
      }
      return { ...prev, [sourceKey]: { ...current, labor: nextLabor } };
    });
  };

  const toggleSelectAllForSource = (
    sourceKey: string,
    products: ImportableProduct[],
    laborEntries: ImportableLabor[],
  ) => {
    setSelections((prev) => {
      const current = prev[sourceKey] || emptySelection();
      const allSelected =
        products.every((p) => current.products[p.key]) &&
        laborEntries.every((l) => current.labor[l.key]);

      if (allSelected) {
        return { ...prev, [sourceKey]: emptySelection() };
      }

      const nextProducts: Record<string, ImportableProduct> = {};
      products.forEach((p) => (nextProducts[p.key] = p));
      const nextLabor: Record<string, ImportableLabor> = {};
      laborEntries.forEach((l) => (nextLabor[l.key] = l));

      return { ...prev, [sourceKey]: { products: nextProducts, labor: nextLabor } };
    });
  };

  const totalSelectedCount = useMemo(() => {
    return Object.values(selections).reduce(
      (sum, sel) =>
        sum + Object.keys(sel.products).length + Object.keys(sel.labor).length,
      0,
    );
  }, [selections]);

  const handleImport = () => {
    // Group by each product's own room/section (e.g. "Kitchen") when it has
    // one, so the same room picked from two different sources merges under
    // one header. Products/labor with no room of their own (plain Bluesheet
    // materials, all labor) get no header at all — Bluesheet/Estimate names
    // are an internal reference, not a room, so they're never used as a
    // fallback header name.
    const productEntries: { product: ImportableProduct; headerName: string | null }[] = [];
    const laborItems: { labor: ImportableLabor; headerName: string | null }[] = [];

    bluesheets.forEach((sheet) => {
      const sourceKey = `bluesheet-${sheet.id}`;
      const selection = selections[sourceKey];
      if (!selection) return;

      Object.values(selection.products).forEach((product) => {
        productEntries.push({
          product,
          headerName: (product.headerName || "").trim() || null,
        });
      });

      Object.values(selection.labor).forEach((labor) => {
        laborItems.push({ labor, headerName: null });
      });
    });

    estimates.forEach((estimate) => {
      const sourceKey = `estimate-${estimate.id}`;
      const selection = selections[sourceKey];
      if (!selection) return;

      Object.values(selection.products).forEach((product) => {
        productEntries.push({
          product,
          headerName: (product.headerName || "").trim() || null,
        });
      });
    });

    if (productEntries.length === 0 && laborItems.length === 0) return;

    const { toImport, duplicates } = partitionImportedProductsByDuplicate(
      productEntries.map((entry) => entry.product),
      existingLineItems,
    );
    const toImportKeys = new Set(toImport.map((product) => product.key));
    const filteredProductEntries = productEntries.filter((entry) =>
      toImportKeys.has(entry.product.key),
    );

    if (filteredProductEntries.length === 0 && laborItems.length === 0) {
      if (duplicates.length > 0) {
        toast(
          `${duplicates.length} product(s) already in this invoice were skipped`,
        );
      }
      return;
    }

    const rows = buildLineItemRowsFromImportSelections({
      products: filteredProductEntries,
      laborEntries: laborItems,
      selectedSupplierId,
    });

    onImport(rows);

    const importedCount = filteredProductEntries.length + laborItems.length;
    if (duplicates.length > 0) {
      toast(
        `Imported ${importedCount} item(s). ${duplicates.length} duplicate product(s) were skipped.`,
      );
    } else {
      toast.success(`Imported ${importedCount} item(s).`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] grid grid-rows-[auto_1fr_auto] gap-4">
        <DialogHeader>
          <DialogTitle>Import from Bluesheets / Estimates</DialogTitle>
          <DialogDescription>
            Select products (and labor, where available) to add to this invoice.
          </DialogDescription>
        </DialogHeader>

        {loadingSources ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LoadingSpinner />
            <p className="mt-3 text-sm text-gray-500">Loading Bluesheets and Estimates...</p>
          </div>
        ) : (
          <div className="min-h-0 overflow-y-auto pr-3">
            <Accordion type="multiple" className="w-full space-y-2">
              {bluesheets.map((sheet) => {
                const sourceKey = `bluesheet-${sheet.id}`;
                const products: ImportableProduct[] = (
                  sheet.material_entries ?? []
                ).map((m: any, i: number) => bluesheetMaterialToImportable(m, i));
                const laborEntries: ImportableLabor[] = (
                  sheet.labor_entries ?? []
                ).map((l: any, i: number) => bluesheetLaborToImportable(l, i));
                const selection = getSelection(sourceKey);
                const selectedCount =
                  Object.keys(selection.products).length +
                  Object.keys(selection.labor).length;

                if (products.length === 0 && laborEntries.length === 0) return null;

                return (
                  <AccordionItem
                    key={sourceKey}
                    value={sourceKey}
                    className="border border-l-4 border-gray-200 border-l-blue-400 rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    <AccordionTrigger className="hover:no-underline hover:bg-slate-100 px-3 py-3 bg-slate-50">
                      <div className="flex items-center gap-2 flex-wrap text-left">
                        <Package className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="font-semibold text-sm text-gray-900">
                          Bluesheet #{sheet.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          {sheet.date || sheet.created_at || ""}
                        </span>
                        {sheet.materials_invoiced === true && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Already Invoiced
                          </Badge>
                        )}
                        {selectedCount > 0 && (
                          <Badge variant="secondary">{selectedCount} selected</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2">
                      <div className="flex justify-end mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleSelectAllForSource(sourceKey, products, laborEntries)
                          }
                        >
                          Select all
                        </Button>
                      </div>

                      <ProductPickList
                        products={products}
                        selectedKeys={selection.products}
                        onToggle={(product) => toggleProduct(sourceKey, product)}
                      />

                      {laborEntries.length > 0 && (
                        <div className="pt-2 mt-2 border-t">
                          <div className="bg-gray-100 rounded-md px-2.5 py-1.5 mb-1">
                            <p className="text-sm font-semibold text-gray-700">Labor</p>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {laborEntries.map((labor) => (
                              <label
                                key={labor.key}
                                className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <Checkbox
                                  checked={!!selection.labor[labor.key]}
                                  onCheckedChange={() => toggleLabor(sourceKey, labor)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-tight truncate">{labor.name}</p>
                                  <p className="text-xs text-gray-500 leading-tight">
                                    {labor.hours} hrs × {formatMoney(labor.hourlyRate)}
                                  </p>
                                </div>
                                <span className="text-sm font-medium shrink-0">
                                  {formatMoney(labor.total)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}

              {estimates.map((estimate) => {
                const sourceKey = `estimate-${estimate.id}`;
                const cachedProducts = estimateProductsById[String(estimate.id)];
                const products = Array.isArray(cachedProducts)
                  ? cachedProducts.map((p: any, i: number) =>
                      estimateProductToImportable(p, i),
                    )
                  : [];
                const selection = getSelection(sourceKey);
                const selectedCount = Object.keys(selection.products).length;

                return (
                  <AccordionItem
                    key={sourceKey}
                    value={sourceKey}
                    className="border border-l-4 border-gray-200 border-l-violet-400 rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    <AccordionTrigger
                      className="hover:no-underline hover:bg-slate-100 px-3 py-3 bg-slate-50"
                      onClick={() => fetchEstimateProducts(estimate.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap text-left">
                        <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="font-semibold text-sm text-gray-900">
                          Estimate {estimate.invoice_number || `#${estimate.id}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {estimate.estimate_date || estimate.created_at || ""}
                        </span>
                        {selectedCount > 0 && (
                          <Badge variant="secondary">{selectedCount} selected</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2">
                      {cachedProducts === "loading" ? (
                        <div className="flex items-center justify-center py-6">
                          <LoadingSpinner />
                        </div>
                      ) : cachedProducts === "error" ? (
                        <p className="text-sm text-red-600 py-2">
                          Failed to load products for this estimate.
                        </p>
                      ) : products.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">
                          No products found on this estimate.
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-end mb-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSelectAllForSource(sourceKey, products, [])}
                            >
                              Select all
                            </Button>
                          </div>
                          <ProductPickList
                            products={products}
                            selectedKeys={selection.products}
                            onToggle={(product) => toggleProduct(sourceKey, product)}
                          />
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {!loadingSources && bluesheets.length === 0 && estimates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-gray-500">
                  No Bluesheets or Estimates found for this job.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center sm:justify-between border-t pt-3">
          <p className="text-sm text-gray-600">
            {totalSelectedCount > 0
              ? `${totalSelectedCount} item(s) selected`
              : "No items selected"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={totalSelectedCount === 0}>
              Import Selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
