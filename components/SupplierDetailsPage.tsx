import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";
import { Eye, Trash2, Tag, Building } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

type SupplierDocument = {
  label: string;
  fileName: string;
  url?: string;
};

type SupplierOrder = {
  orderNumber: string;
  product: string;
  jdpPrice: number;
  quantity: number;
  totalPrice: number;
  orderDate: string;
  deliveryDate: string;
  delivery_address?: string;
  status: string;
  totalAmount: number;
  job?: {
    job_title?: string;
  };
};

type SupplierContact = {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  gender?: string;
};

interface SupplierDetailsPageProps {
  supplierId: string;
  onBack: () => void;
  supplierData?: any;
  onEdit?: () => void;
}
export function SupplierDetailsPage({
  supplierId,
  onBack,
  supplierData,
  onEdit,
}: SupplierDetailsPageProps) {
  const data = supplierData || {};
  const userData = data.users || {};
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Pagination state for orders
  const [orderRows, setOrderRows] = useState<SupplierOrder[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [sortBy, setSortBy] = useState<"name">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsTotalPages, setProductsTotalPages] = useState(1);

  const itemsPerPage = 10;

  const normalizedProducts = products.map((product: any) => ({
    id: product.id,
    name: product.product_name || "N/A",
    sku: product.supplier_sku || "N/A",
    jdpSku: product.jdp_sku || "N/A",
    unit_cost: product.unit_cost ?? 0,
    markup_percentage: product.markup_percentage ?? 0,
    jdp_price: product.jdp_price ?? 0,
    estimated_price: product.estimated_price ?? 0,
    stock: product.stock_quantity ?? 0,
    status: product.status || "inactive",
  }));

  const fetchProductsBySupplier = useCallback(
    async (page: number = 1) => {
      if (!apiBaseUrl || !supplierId) return;

      setIsLoadingProducts(true);

      try {
        const token =
          typeof window !== "undefined" && localStorage.getItem("jdp_auth")
            ? JSON.parse(localStorage.getItem("jdp_auth")!).token
            : null;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${apiBaseUrl}/products/getProductsBySupplier/${supplierId}?page=${page}&limit=${itemsPerPage}`,
          {
            method: "GET",
            headers,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const result = await response.json();
        console.log("Supplier products response:", result);
        console.log(result,"result");
        

        const records = Array.isArray(result?.data?.data) ? result?.data?.data : [];
        const pagination = result?.data.pagination || {};

        setProducts(records);
        setProductsTotal(pagination.totalItems ?? records.length);
        setProductsTotalPages(pagination.totalPages ?? 1);
        setCurrentPage(pagination.currentPage ?? page);
      } catch (error) {
        console.error("Error loading supplier products:", error);
        toast.error("Failed to load products");
        setProducts([]);
        setProductsTotal(0);
        setProductsTotalPages(1);
        setCurrentPage(1);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [apiBaseUrl, supplierId, itemsPerPage],
  );

  useEffect(() => {
    fetchProductsBySupplier(1);
  }, [fetchProductsBySupplier]);
  const handleProductsPageChange = useCallback(
    (direction: "prev" | "next") => {
      const nextPage = direction === "prev" ? currentPage - 1 : currentPage + 1;

      if (nextPage < 1 || nextPage > productsTotalPages) return;

      fetchProductsBySupplier(nextPage);
    },
    [currentPage, productsTotalPages, fetchProductsBySupplier],
  );

  const sortedProducts = [...normalizedProducts].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }
    return 0;
  });

  const paginatedProducts = sortedProducts;
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-50 text-green-600 border-green-200";
      case "inactive":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    return null;
  };

  const hasPermission = () => true;

  const handleAction = (action: string, product: any) => {
    console.log(action, product);
  };

  const rawDocuments = Array.isArray(data.documents)
    ? data.documents
    : Array.isArray(data.documents_and_certifications)
      ? data.documents_and_certifications
      : [];

  const documents: SupplierDocument[] = rawDocuments.map((doc: any) => ({
    label: doc.label || doc.type || doc.category || "Document",
    fileName: doc.file_name || doc.name || doc.title || "Download",
    url: doc.url || doc.file_url || doc.link,
  }));

  // Transform API order to SupplierOrder
  const transformOrder = (order: any): SupplierOrder => {
    // Extract product and quantity from order_items array
    let product = "N/A";
    let quantity = 0;
    let totalPrice = 0;
    let jdpPrice = 0;

    if (Array.isArray(order.order_items) && order.order_items.length > 0) {
      // Get first product name or SKU
      const firstItem = order.order_items[0];
      product =
        firstItem.product?.name || firstItem.product?.product_name || "N/A";
      jdpPrice = firstItem.product?.jdp_price ?? 0;

      // Sum all quantities from order items
      quantity = order.order_items.reduce(
        (sum: number, item: any) => sum + (item.quantity ?? 0),
        0,
      );

      // Sum all total_price from order items
      totalPrice = order.order_items.reduce(
        (sum: number, item: any) => sum + (item.total_price ?? 0),
        0,
      );
    } else {
      // Fallback to direct order properties if order_items is not available
      product =
        order.product_name || order.product?.name || order.product || "N/A";
      jdpPrice = order.product?.jdp_price ?? 0;
      quantity = order.quantity ?? order.qty ?? 0;
      totalPrice = order.total_price ?? 0;
    }

    return {
      orderNumber:
        order.order_number || order.po_number || `ORD-${order.id ?? ""}`,
      product,
      jdpPrice,
      quantity,
      totalPrice,
      orderDate: order.order_date || order.created_at || "",
      deliveryDate:
        order.delivery_date || order.expected_delivery || order.due_date || "",
      delivery_address:
        order.delivery_address ||
        order.shipping_address ||
        order.address ||
        "N/A",
      status: order.status || "N/A",
      totalAmount: order.total_amount ?? order.amount ?? order.total ?? 0,
      job: order.job
        ? {
            job_title: order.job.job_title || order.job.title || "N/A",
          }
        : undefined,
    };
  };

  // Extract initial orders from API response
  useEffect(() => {
    const ordersRaw = data.orders;
    if (ordersRaw && Array.isArray(ordersRaw.records)) {
      const transformedOrders = ordersRaw.records.map((order: any) =>
        transformOrder(order),
      );
      setOrderRows(transformedOrders);
      setOrderPage(ordersRaw.page ?? 1);
      setOrderLimit(ordersRaw.limit ?? 10);
      setOrderTotal(ordersRaw.total ?? transformedOrders.length);
      setOrderTotalPages(ordersRaw.totalPages ?? 1);
    } else if (Array.isArray(data.orders)) {
      // Fallback for legacy format
      const transformedOrders = data.orders.map((order: any) =>
        transformOrder(order),
      );
      setOrderRows(transformedOrders);
      setOrderTotal(transformedOrders.length);
      setOrderTotalPages(1);
    }
  }, [data.orders]);

  const contactPerson: SupplierContact | null = data.contact_person
    ? {
        name:
          data.contact_person?.full_name ||
          data.contact_person?.name ||
          data.contact_person ||
          "N/A",
        role: data.contact_person?.role || data.contact_role || "Supplier",
        email:
          data.contact_person?.email || userData.email || data.email || "N/A",
        phone:
          data.contact_person?.phone || userData.phone || data.phone || "N/A",
        gender: data.contact_person?.gender || data.contact_gender || "",
      }
    : userData.full_name
      ? {
          name: userData.full_name,
          role: userData.role || "Supplier",
          email: userData.email,
          phone: userData.phone,
          gender: data.contact_gender || "",
        }
      : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const renderStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const normalized = status.toLowerCase();
    const classes =
      normalized === "active"
        ? "bg-green-50 text-green-600 border-green-200"
        : normalized === "inactive"
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-blue-50 text-blue-600 border-blue-200";
    return <Badge className={classes}>{status}</Badge>;
  };

  const renderOrderStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase();
    let classes = "bg-green-50 text-green-600 border-green-200";
    if (normalized.includes("deliver")) {
      classes = "bg-green-50 text-green-600 border-green-200";
    } else if (
      normalized.includes("transit") ||
      normalized.includes("shipping")
    ) {
      classes = "bg-blue-50 text-blue-600 border-blue-200";
    } else if (normalized.includes("pending")) {
      classes = "bg-yellow-50 text-yellow-600 border-yellow-200";
    } else if (normalized.includes("cancel")) {
      classes = "bg-red-50 text-red-600 border-red-200";
    }
    return <Badge className={classes}>{status || "N/A"}</Badge>;
  };

  const fetchOrdersPage = useCallback(
    async (page: number) => {
      if (!apiBaseUrl || !supplierId) return;
      setIsOrderLoading(true);
      try {
        const token =
          typeof window !== "undefined" && localStorage.getItem("jdp_auth")
            ? JSON.parse(localStorage.getItem("jdp_auth")!).token
            : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${apiBaseUrl}/suppliers/getSupplierById/${supplierId}?page=${page}&limit=${orderLimit}`,
          {
            method: "GET",
            headers,
          },
        );

        if (!response.ok) {
          toast.error("Failed to load orders");
          return;
        }

        const result = await response.json();
        if (result.success && result.data?.orders) {
          const payload = result.data.orders;
          const newOrders = Array.isArray(payload.records)
            ? payload.records.map((order: any) => transformOrder(order))
            : [];
          setOrderRows(newOrders);
          setOrderPage(payload.page ?? page);
          setOrderLimit(payload.limit ?? orderLimit);
          setOrderTotal(payload.total ?? newOrders.length);
          setOrderTotalPages(payload.totalPages ?? 1);
        } else {
          toast.error("Failed to load orders");
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setIsOrderLoading(false);
      }
    },
    [apiBaseUrl, supplierId, orderLimit],
  );

  const handleOrderPageChange = useCallback(
    (direction: "prev" | "next") => {
      const nextPage = direction === "prev" ? orderPage - 1 : orderPage + 1;
      if (nextPage < 1 || nextPage > orderTotalPages) return;
      fetchOrdersPage(nextPage);
    },
    [fetchOrdersPage, orderPage, orderTotalPages],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-[#2b2b2b]">
              Supplier Details
            </h1>
            <p className="text-sm text-gray-500">
              View and manage business profile and order history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={onEdit}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-md border-0">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#00A1FF] rounded-full flex items-center justify-center shadow-inner">
              <span className="text-white font-medium text-xl">
                {data.company_name
                  ? data.company_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                  : "SP"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#2b2b2b]">
                {data.company_name || userData.full_name || "Supplier"}
              </h2>
              <p className="text-sm text-gray-600">
                {data.business_type || data.supplier_category || "Supplier"}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#00A1FF]">
                {data.website && (
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-4 w-4" />
                    {data.website}
                  </a>
                )}
                {data.gst_number && (
                  <span className="text-xs text-gray-500">
                    GST: {data.gst_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {data.supplier_code || `SUP-${data.id || supplierId}`}
            </span>
            {renderStatusBadge(userData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactPerson && (
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center gap-4 md:col-span-2">
                <div className="w-12 h-12 rounded-full bg-[#00A1FF] flex items-center justify-center text-white font-semibold">
                  {contactPerson.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Primary Contact Person
                  </p>
                  <p className="text-sm font-medium text-[#2b2b2b]">
                    {contactPerson.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {contactPerson.role}
                    {contactPerson.gender ? ` • ${contactPerson.gender}` : ""}
                  </p>
                  {(contactPerson.email || contactPerson.phone) && (
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                      {contactPerson.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contactPerson.email}
                        </span>
                      )}
                      {contactPerson.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contactPerson.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail className="h-4 w-4 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="text-sm font-medium text-[#2b2b2b]">
                  {userData.email || data.email || "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone className="h-4 w-4 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Primary Phone</p>
                <p className="text-sm font-medium text-[#2b2b2b]">
                  {userData.phone || data.primary_phone || "Not provided"}
                </p>
              </div>
            </div>
            {/* <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone className="h-4 w-4 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Business Contact</p>
                <p className="text-sm font-medium text-[#2b2b2b]">{data.business_phone || data.contact_phone || 'Not provided'}</p>
              </div>
            </div> */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <MapPin className="h-4 w-4 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Business Address</p>
                <p className="text-sm font-medium text-[#2b2b2b]">
                  {data.address || data.business_address || "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Calendar className="h-4 w-4 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Contract Start Date</p>
                <p className="text-sm font-medium text-[#2b2b2b]">
                  {data.contract_start
                    ? formatDate(data.contract_start)
                    : "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Calendar className="h-4 w-4 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Contract End Date</p>
                <p className="text-sm font-medium text-[#2b2b2b]">
                  {data.contract_end
                    ? formatDate(data.contract_end)
                    : "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {data.notes || data.notes ? (
            <div className=" p-4 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-xs text-gray-500 mb-2">Notes</p>
              <p className="text-sm text-[#2b2b2b] leading-relaxed">
                {data.notes || data.description}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-[#00A1FF]" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOrderLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-6 text-sm text-gray-500"
                    >
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : orderRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-6 text-sm text-gray-500"
                    >
                      No order history available.
                    </TableCell>
                  </TableRow>
                ) : (
                  orderRows.map((order, index) => (
                    <TableRow key={`${order.orderNumber}-${index}`}>
                      <TableCell className="font-medium text-[#2b2b2b]">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-[#2b2b2b]">
                        {order.job?.job_title || "N/A"}
                      </TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.jdpPrice)}
                      </TableCell>
                      <TableCell>
                        {order.orderDate ? formatDate(order.orderDate) : "—"}
                      </TableCell>
                      <TableCell>{order.delivery_address || "N/A"}</TableCell>
                      <TableCell>
                        {renderOrderStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {orderTotalPages > 1 && orderRows.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing page {orderPage} of {orderTotalPages} (Total orders:{" "}
                {orderTotal})
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOrderPageChange("prev")}
                  disabled={isOrderLoading || orderPage <= 1}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOrderPageChange("next")}
                  disabled={isOrderLoading || orderPage >= orderTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-[#00A1FF]" />
            Products
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead className="w-12"> */}
                  {/* <Checkbox
                      checked={
                        paginatedProducts.length > 0 &&
                        paginatedProducts.every((p) =>
                          selectedProducts.includes(p.id),
                        )
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts((prev) => {
                            const merged = new Set([
                              ...prev,
                              ...paginatedProducts.map((p) => p.id),
                            ]);
                            return Array.from(merged);
                          });
                        } else {
                          setSelectedProducts((prev) =>
                            prev.filter(
                              (id) =>
                                !paginatedProducts.some((p) => p.id === id),
                            ),
                          );
                        }
                      }}
                    /> */}
                  {/* </TableHead> */}
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier SKU</TableHead>
                  <TableHead>JDP SKU</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>JDP Price</TableHead>
                  <TableHead>Estimated Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead>Actions</TableHead> */}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading products...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      {/* <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts((prev) => [
                                ...prev,
                                product.id,
                              ]);
                            } else {
                              setSelectedProducts((prev) =>
                                prev.filter((id) => id !== product.id),
                              );
                            }
                          }}
                        />
                      </TableCell> */}

                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-3 items-center">
                          <Building className="w-4 h-4 text-blue-500" />
                          <div className="bg-[#75a7eb17] text-blue-500 p-[5px] rounded w-auto">
                            {product.sku}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-3 items-center">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <div className="bg-gray-100 text-black p-[5px] rounded w-auto">
                            {product.jdpSku}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        {formatCurrency(product.unit_cost)}
                      </TableCell>

                      <TableCell>{product.markup_percentage}%</TableCell>

                      <TableCell className="font-medium">
                        {formatCurrency(product.jdp_price)}
                      </TableCell>

                      <TableCell className="font-medium">
                        {formatCurrency(product.estimated_price)}
                      </TableCell>

                      <TableCell>{product.stock}</TableCell>

                      <TableCell>
                        <Badge
                          className={`${getStatusColor(product.status)} flex items-center gap-1 w-fit`}
                        >
                          {product.status.charAt(0).toUpperCase() +
                            product.status.slice(1)}
                        </Badge>
                      </TableCell>

                      {/* <TableCell>
                        <div className="flex gap-1">
                          {hasPermission() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("view", product)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}

                          {hasPermission() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("edit", product)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}

                          {hasPermission() && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleAction("delete", product)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {productsTotalPages > 1 && normalizedProducts.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + normalizedProducts.length,
                  productsTotal,
                )}{" "}
                of {productsTotal} products
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductsPageChange("prev")}
                  disabled={currentPage === 1 || isLoadingProducts}
                >
                  Previous
                </Button>

                <span className="text-sm">
                  Page {currentPage} of {productsTotalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductsPageChange("next")}
                  disabled={
                    currentPage >= productsTotalPages || isLoadingProducts
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
