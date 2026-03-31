export const createRowId = () =>
  Math.random().toString(36).substring(2, 9);

export const createHeaderKey = () =>
  `header_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const createHeaderRow = (selectedSupplierId: number, headerName = "Custom Header") => ({
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
  parentHeaderKey,
  parentHeaderName,
  isCustomProduct = false,
}: {
  selectedSupplierId: number;
  parentHeaderKey: string;
  parentHeaderName: string;
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