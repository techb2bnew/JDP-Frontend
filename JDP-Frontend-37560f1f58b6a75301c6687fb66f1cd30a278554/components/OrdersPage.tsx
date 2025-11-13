'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Separator } from './ui/separator'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { usePermissions } from '../contexts/PermissionContext'

import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar as CalendarIcon,
  FileDown,
  Receipt,
  Printer,
  Mail,
  Building,
  User,
  MapPin,
  Phone,
  PlusCircle,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { apiClient, globalApiCall } from '@/utils/api'
import { LoadingSpinner } from './common/LoadingSpinner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'



interface Order {
  id: string
  jobId: string
  orderNumber: string
  customerName: string
  contractorName?: string
  customerEmail: string
  customerPhone: string
  job_title?: string
  billingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    zipCode: string
    email: string
    phone: string
  }
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  orderDate: string
  items: OrderItem[]
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes?: string

}



interface OrderItem {
  id: string
  name?: string
  product_name: string
  sku: string
  quantity: number
  unitPrice: number
  jdp_price: number
  total: number
  //  billingAddress?: string;
  // billingCityZip?: string;
  // billingEmail?: string;
  // billingPhone?: string;
}
interface Job {
  id: number;
  job_title: string;
  job_type: 'service_based' | 'product_based' | string;
  status: 'active' | 'inactive' | string;

  bill_to_email?: string;
  bill_to_phone?: string;
  bill_to_address?: string;
  bill_to_city_zip?: string;
}




interface Customer {
  id: string
  email: string
  phone: string
  companyName: string
  customerName: string
}

interface OrderFormData {
  id: string
  jobId: string
  orderNumber: string
  createdAt: string
  billingAddress: string
  billingDate: string
  billingNotes: string
  billingPhone: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  subtotal: number
  total_amount: number
  tax_amount: number
  discount_amount: number
  customer: Customer
  orderItems: OrderItem[]
  job: Job
  notes: string

  // discount_amount:number
  // tax_amount:number
  // totalPayment:number


}
 

export function OrdersPage() {
  const { hasPermission } = usePermissions()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [sortBy, setSortBy] = useState('all')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderFormData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  // Validation errors state (kept for potential future use)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    fetchOrders(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchOrdersStats();
  }, []);


  // Debounce only filter/search changes; reset to page 1 and let the page effect fetch
  useEffect(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);



  const fetchOrders = async (page: number = 1, limit: number = 50) => {
    try {
      setIsLoadingOrders(true);

      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.order_date_from = dateFrom;
      if (dateTo) params.order_date_to = dateTo;

      const endpoint =
        Object.keys(params).some((key) => key !== 'page' && key !== 'limit')
          ? 'orders/searchOrders'
          : 'orders/getAllOrders';

      const queryString = new URLSearchParams(params).toString();
      const url = `${apiBaseUrl}/${endpoint}?${queryString}`;

      const response = await globalApiCall(url, { method: 'GET' });
      const responseData = await response.json();
      console.log('Orders API Response:', responseData);

      if (responseData.success && responseData.data?.orders) {
        const transformedOrders = responseData.data.orders.map((apiOrder: any) => ({
          id: apiOrder.id?.toString(),
          orderNumber: apiOrder.order_number,
          jobId: apiOrder.job_id?.toString() || 'N/A',
          job_title: apiOrder.job?.job_title || apiOrder.job_title || 'N/A',
          customerName: apiOrder.customer?.customer_name || '',
          contractorName: apiOrder.contractor?.contractor_name || apiOrder.contractor?.company_name || '',
          status: apiOrder.status,
          orderDate: apiOrder.order_date,
        }));

        setOrders(transformedOrders);
        setTotalOrders(responseData.data.total || transformedOrders.length);
      } else {
        console.error('Invalid response:', responseData);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setOrders([]);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  };


  const fetchOrdersStats = async () => {
    try {
      setIsLoadingStats(true);

      const response = await globalApiCall(`${apiBaseUrl}/orders/getOrderStats`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Order Stats API Response:', responseData);

      if (responseData.success && responseData.data) {
        setOrderStats(responseData.data);
      } else {
        console.error('Invalid order stats API response structure:', responseData);
        setOrderStats(null);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setOrderStats(null);
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchOrderById = async (orderId: string) => {
    try {
      setIsLoading(true);

      const response = await globalApiCall(`${apiBaseUrl}/orders/getOrderById/${orderId}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Order by ID API Response:', responseData);

      if (responseData.success && responseData.data) {
        const apiOrder = responseData.data;


        // Transform API response to match form data format
        const orderData: OrderFormData = {
          id: apiOrder.id.toString(),
          orderNumber: apiOrder.order_number || '',
          jobId: apiOrder.job_id?.toString() || 'N/A',
          status: apiOrder.status as 'pending' | 'processing' | 'completed' | 'cancelled' || 'pending',
          subtotal: apiOrder.subtotal?.toString() || '0',
          tax_amount: apiOrder.tax_amount?.toString() || '0',
          discount_amount: apiOrder.discount_amount?.toString() || '0',
          createdAt: apiOrder.created_at || '',
          total_amount: apiOrder.total_amount || 0,
          notes: apiOrder.notes,
          // Top-level customer fields

          billingAddress: apiOrder.delivery_address || '',
          billingDate: apiOrder.delivery_date || '',
          billingNotes: apiOrder.delivery_notes || '',
          billingPhone: apiOrder.delivery_phone || '',


          job: {
            id: apiOrder.job?.id?.toString() || '',
            job_title: apiOrder.job?.job_title || '',
            job_type: apiOrder.job?.job_type || '',
            status: apiOrder.job?.status || '',
            bill_to_email: apiOrder.job?.bill_to_email || '',
            bill_to_phone: apiOrder.job?.bill_to_phone || '',
            bill_to_address: apiOrder.job?.bill_to_address || '',
            bill_to_city_zip: apiOrder.job?.bill_to_city_zip || '',
          },


          // Nested customer object
          customer: {
            id: apiOrder.customer?.id?.toString() || '',
            email: apiOrder.customer?.email || '',
            phone: apiOrder.customer?.phone || '',
            companyName: apiOrder.company_name || '',
            customerName: apiOrder.customer_name || '',
          },

          // Order items
          orderItems: apiOrder.order_items?.map((item: any) => ({
            id: item.id.toString(),
            product_name: item.product.product_name || '',
            sku: item.product?.jdp_sku || '',
            quantity: item.quantity || 0,
            unitPrice: item.product?.unit_cost || 0,
            jdp_price: item.product?.jdp_price || 0,
            total: item.total_price || 0,

          })) || []
        };


        setSelectedOrder(orderData);
      } else {
        throw new Error(responseData.message || 'Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to fetch product details');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };




  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'processing': return <AlertCircle className="h-3 w-3" />
      case 'cancelled': return <XCircle className="h-3 w-3" />
      default: return null
    }
  }

  const handleViewInvoice = (order: Order) => {
    // setSelectedOrder(order)
    setShowInvoiceModal(true)
    fetchOrderById(order.id)
  }

  const handleEditOrder = (order: Order) => {
    router.push(`/orders/form?id=${order.id}`);
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteDialog(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await globalApiCall(`${apiBaseUrl}/orders/deleteOrder/${orderToDelete.id}`, {
        method: 'DELETE',
        body: JSON.stringify({})
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success('Order deleted successfully!');
        // Refresh orders list
        fetchOrders(currentPage, itemsPerPage);
      } else {
        toast.error(responseData.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setShowDeleteDialog(false);
      setOrderToDelete(null);
    }
  };


  const csvEscape = (val: any) => {
    const s = (val ?? "").toString();
    const hasSpecial = /[",\n]/.test(s);
    return hasSpecial ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const dateSlug = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  };


  const handleDownload = async () => {
    // Must have an open order + a ref pointing to the INVOICE container (not the list)
    if (!selectedOrder) {
      const { toast } = await import('sonner');
      toast.warning('Open an order to download its invoice.');
      return;
    }
    if (!printRef.current) return;

    setIsGeneratingPdf(true);

    // (A4 @ 72dpi in jsPDF units is 210x297 mm). We'll add small margins.
    const PAGE_W_MM = 210;
    const PAGE_H_MM = 297;
    const MARGIN_MM = 10;
    const CONTENT_W_MM = PAGE_W_MM - MARGIN_MM * 2;

    // Temporarily force a stable width so html2canvas renders predictably
    const el = printRef.current as HTMLElement;
    const prevStyle = el.getAttribute('style') || '';
    el.style.width = '794px';          // ~A4 width @ 96dpi; adjust as you like
    el.style.background = '#fff';
    el.classList.add('pdf-export');     // optional: for color-correct CSS

    try {
      // Ensure DOM is committed (modal content fully rendered)
      await new Promise(requestAnimationFrame);

      const canvas = await html2canvas(el, {
        scale: 2,                // crisp output
        backgroundColor: '#fff',
        useCORS: true,
        logging: false,
        ignoreElements: (node) =>
          (node as HTMLElement)?.classList?.contains?.('no-export'), // exclude UI-only bits
      });

      // Convert canvas -> multi-page PDF with margins
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Convert canvas px -> mm using the target content width
      const pxToMm = (px: number) => (px * CONTENT_W_MM) / canvas.width;
      const imgWmm = CONTENT_W_MM;
      const imgHmm = pxToMm(canvas.height);

      let remainingHmm = imgHmm;
      let y = MARGIN_MM;

      // First page
      pdf.addImage(imgData, 'PNG', MARGIN_MM, y, imgWmm, imgHmm);
      remainingHmm -= (PAGE_H_MM - MARGIN_MM * 2);

      // Extra pages
      while (remainingHmm > 0) {
        pdf.addPage();
        y = MARGIN_MM - (imgHmm - remainingHmm);
        pdf.addImage(imgData, 'PNG', MARGIN_MM, y, imgWmm, imgHmm);
        remainingHmm -= (PAGE_H_MM - MARGIN_MM * 2);
      }

      const fileName = `invoice_${selectedOrder.orderNumber || selectedOrder.id || dateSlug()}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error('Error generating PDF:', e);
      const { toast } = await import('sonner');
      toast.error('Failed to generate PDF.');
    } finally {
      // Restore styles no matter what
      el.setAttribute('style', prevStyle);
      el.classList.remove('pdf-export');
      setIsGeneratingPdf(false);
    }
  };


  const exportOrdersCSV = (orders: Order[]) => {
    // Define the columns you want in CSV
    const headers = [
      "Order ID",
      "Job ID",
      "Customer",
      "Contractor",
      "Status",
      "Order Date"
    ];
    const rows = orders.map(o => [
      o.orderNumber,
      o.jobId,
      o.customerName,
      o.contractorName ?? "",
      o.status,
      o.orderDate
    ]);

    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // \uFEFF = BOM for Excel
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_${dateSlug()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // LIST HANDLER (buttons in filters bar)
  const handleExportList = async (format: "csv" | "pdf") => {
    try {
      if (!orders || orders.length === 0) {
        const { toast } = await import("sonner");
        toast.warning("No orders to export.");
        return;
      }
      if (format === "csv") {
        // aapka existing CSV function call kar do (exportOrdersCSV)
        exportOrdersCSV(orders);
      } else {
        await exportOrdersPDF(orders);
      }
    } catch (e: any) {
      console.error("List export error:", e);
      const { toast } = await import("sonner");
      toast.error(e?.message || "Failed to export.");
    }
  };

  // LIST PDF (orders table)
  const exportOrdersPDF = async (orders: Order[]) => {
    try {
      const { default: jsPDFmod } = await import("jspdf");
      // @ts-ignore
      const { default: autoTable } = await import("jspdf-autotable");
      // @ts-ignore
      const doc = new jsPDFmod({ orientation: "landscape", unit: "pt", format: "a4" });

      doc.setFontSize(14);
      doc.text("Orders Export", 40, 30);

      const head = [["Order ID", "Job ID", "Customer", "Contractor", "Status", "Order Date"]];
      const body = orders.map(o => [
        o.orderNumber,
        o.jobId,
        o.customerName,
        o.contractorName ?? "",
        o.status?.charAt(0).toUpperCase() + o.status?.slice(1),
        new Date(o.orderDate).toLocaleDateString()
      ]);

      // @ts-ignore
      autoTable(doc, {
        head,
        body,
        startY: 50,
        styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
        headStyles: { fillColor: [0, 0, 0] },
        columnStyles: { 0: { cellWidth: 120 } }
      });

      doc.save(`orders_${dateSlug()}.pdf`);
    } catch (err) {
      console.error("List PDF export failed:", err);
      // Fallback: print current table
      const tableHtml = document.querySelector("table")?.outerHTML ?? "<p>No table found</p>";
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(`
        <html><head><title>Orders Export</title>
        <style>
          body{font-family:Arial,sans-serif;padding:16px}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #ddd;padding:8px;font-size:12px}
          th{background:#000;color:#fff}
        </style></head>
        <body><h2>Orders Export</h2>${tableHtml}
        <script>window.onload=()=>window.print()</script></body></html>
      `);
        w.document.close();
      }
    }
  };


  const handleExport = async (format: "csv" | "pdf") => {
    try {
      if (!orders || orders.length === 0) {
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.warning("No orders to export.");
        }
        return;
      }

      if (format === "csv") {
        exportOrdersCSV(orders);
      } else {
        await exportOrdersPDF(orders);
      }
    } catch (e: any) {
      console.error("Export error:", e);
      if (typeof window !== "undefined") {
        const { toast } = await import("sonner");
        toast.error(e?.message || "Failed to export.");
      }
    }
  };

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleEmailInvoice = () => {
    console.log('Sending invoice via email...')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Search handlers for Add Order Modal
  // Get system IP (kept for potential future use)
  const getSystemIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '1234567';
    } catch (error) {
      console.error('Error fetching IP:', error);
      return '1234567';
    }
  };

  // Navigate to form page
  const handleOpenAddOrderModal = () => {
    router.push('/orders/form');
  };

  const fetchBySearchOrders = async () => {
    if (!searchTerm.trim()) return;

    setIsLoadingOrders(true);

    try {
      const response = await apiClient.searchOrdersByQuery(searchTerm.trim(), currentPage, itemsPerPage);
      const orders = response.data?.orders || [];

      const transformedOrders = orders.map((apiOrder: any) => ({
        id: apiOrder.id?.toString(),
        orderNumber: apiOrder.order_number || 'N/A',
        jobId: apiOrder.job_id?.toString() || 'N/A',
        job_title: apiOrder.job?.job_title || apiOrder.job_title || 'N/A',
        customerName: apiOrder.customer?.customer_name || '',
        contractorName:
          apiOrder.contractor?.contractor_name ||
          apiOrder.contractor?.company_name ||
          '',
        status: apiOrder.status || 'Unknown',
        paymentStatus: apiOrder.payment_status || 'Unpaid',
        orderDate: apiOrder.order_date || 'N/A',
        deliveryDate: apiOrder.delivery_date || 'N/A',
        totalItems: apiOrder.total_items ?? 0,
        total_amount: apiOrder.total_amount ?? 0,
        deliveryAddress: apiOrder.delivery_address || 'N/A',
        leadLabor: {
          name: apiOrder.lead_labor?.users?.full_name || '',
          email: apiOrder.lead_labor?.users?.email || '',
          phone: apiOrder.lead_labor?.users?.phone || '',
          code: apiOrder.lead_labor?.labor_code || '',
          specialization: apiOrder.lead_labor?.specialization || '',
        },
        createdBy: {
          name: apiOrder.created_by_user?.full_name || '',
          email: apiOrder.created_by_user?.email || '',
        },
      }));


      setOrders(transformedOrders);
      setTotalOrders(transformedOrders.length);
    } catch (err) {
      console.error('Order search error:', err);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) return;

    const debounceTimeout = setTimeout(() => {
      fetchBySearchOrders();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, currentPage, itemsPerPage]);



  useEffect(() => {
    const fetchOrdersByFilters = async () => {
      if (searchTerm.trim()) return;

      setIsLoadingOrders(true);

      try {
        let orders: any[] = [];

        const hasStatus = statusFilter !== '';
        const hasDateRange = dateFrom && dateTo;

        if (hasStatus && hasDateRange) {
          const res = await apiClient.searchOrdersByDateRange(dateFrom, dateTo, currentPage, itemsPerPage);
          const apiOrders = res.data?.orders || [];

          // Transform API data same way as fetchOrders
          orders = apiOrders.map((apiOrder: any) => ({
            id: apiOrder.id?.toString(),
            orderNumber: apiOrder.order_number,
            jobId: apiOrder.job_id?.toString() || 'N/A',
            job_title: apiOrder.job?.job_title || apiOrder.job_title || 'N/A',
            customerName: apiOrder.customer?.customer_name || '',
            contractorName: apiOrder.contractor?.contractor_name || apiOrder.contractor?.company_name || '',
            status: apiOrder.status,
            orderDate: apiOrder.order_date,
          }));
        } else if (hasStatus) {
          const res = await apiClient.searchOrdersByStatus(statusFilter, currentPage, itemsPerPage);
          const apiOrders = res.data?.orders || [];

          // Transform API data same way as fetchOrders
          orders = apiOrders.map((apiOrder: any) => ({
            id: apiOrder.id?.toString(),
            orderNumber: apiOrder.order_number,
            jobId: apiOrder.job_id?.toString() || 'N/A',
            job_title: apiOrder.job?.job_title || apiOrder.job_title || 'N/A',
            customerName: apiOrder.customer?.customer_name || '',
            contractorName: apiOrder.contractor?.contractor_name || apiOrder.contractor?.company_name || '',
            status: apiOrder.status,
            orderDate: apiOrder.order_date,
          }));
        } else if (hasDateRange) {
          const res = await apiClient.searchOrdersByDateRange(dateFrom, dateTo, currentPage, itemsPerPage);
          console.log('Date range API response:', res);
          const apiOrders = res.data?.orders || [];

          // Transform API data same way as fetchOrders
          orders = apiOrders.map((apiOrder: any) => ({
            id: apiOrder.id?.toString(),
            orderNumber: apiOrder.order_number,
            jobId: apiOrder.job_id?.toString() || 'N/A',
            job_title: apiOrder.job?.job_title || apiOrder.job_title || 'N/A',
            customerName: apiOrder.customer?.customer_name || '',
            contractorName: apiOrder.contractor?.contractor_name || apiOrder.contractor?.company_name || '',
            status: apiOrder.status,
            orderDate: apiOrder.order_date,
          }));
          console.log('Transformed orders from date range:', orders);
        } else {
          // No filters - use the main fetchOrders function
          await fetchOrders(currentPage, itemsPerPage);
          return;
        }
        console.log(orders, "orders")

        setOrders(orders);
        setTotalOrders(orders.length);
        setCurrentPage(1); // Reset to page 1 when filters change
      } catch (error) {
        console.error("Order filter error:", error);
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrdersByFilters();
  }, [statusFilter, dateFrom, dateTo, searchTerm]);






  // Calculate summary statistics from API data
  const totalOrdersCount = orderStats?.total || totalOrders;
  const pendingOrders = orderStats?.pending || orders.filter(o => o.status === 'pending').length
  const processingOrders = orderStats?.processing || orders.filter(o => o.status === 'processing').length
  const completedOrders = orderStats?.completed || orders.filter(o => o.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage customer orders with comprehensive invoice details</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                <div className="text-2xl font-semibold text-foreground">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  ) : (
                    totalOrdersCount
                  )}
                </div>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>

                <div className="text-2xl font-semibold text-yellow-600">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  ) : (
                    pendingOrders
                  )}
                </div>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
                <div className="text-2xl font-semibold text-blue-600">
                  {isLoadingStats ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      processingOrders
                  )}
                  </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
        </Card> */}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <div className="text-2xl font-semibold text-green-600">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  ) : (
                    completedOrders
                  )}
                </div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal relative">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                    {(dateRange.from || dateRange.to) && (
                      <span
                        className="absolute right-[-30px] h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateRange({ from: undefined, to: undefined });
                          setDateFrom("");
                          setDateTo("");
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={(range: any) => {
                      setDateRange(range);

                      if (range?.from) setDateFrom(format(range.from, "yyyy-MM-dd"));
                      else setDateFrom("");

                      if (range?.to) setDateTo(format(range.to, "yyyy-MM-dd"));
                      else setDateTo("");
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort and Export */}
            <div className="flex gap-2">
              {/* <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select> */}

              {/* {hasPermission('orders', 'view') && (
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              )}
              
              {hasPermission('orders', 'view') && (
                <Button variant="outline" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )} */}

              <Button variant="default" onClick={handleOpenAddOrderModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Order
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Customer / Contractor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  {/* <TableHead>Invoice</TableHead> */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOrders ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium font-mono">{order.orderNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium  ">{order.job_title}</div>
                      </TableCell>
                      <TableCell>
                        {order.customerName ? (
                          <div className="font-medium">{order.customerName}</div>
                        ) : order.contractorName ? (
                          <div className="font-medium">{order.contractorName}</div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No contact assigned</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit hover:${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {hasPermission('orders', 'view') && (
                            <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('orders', 'edit') && (
                            <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('orders', 'delete') && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                { }
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}

          {totalOrders > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoadingOrders}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(totalOrders / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalOrders / itemsPerPage) || isLoadingOrders}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-[900px] max-w-[900px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {selectedOrder ? `Order - ${selectedOrder.id}` : 'Order Details'}
            </DialogTitle>
            {/* <DialogDescription>
              Detailed     for order {selectedOrder?.id}
            </DialogDescription> */}
          </DialogHeader>

          {isLoading || !selectedOrder ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading order details...</p>
              </div>
            </div>
          ) : (
            selectedOrder && (
            //           <div
            //   ref={printRef}
            //   id="print-only-invoice"
            //   style={{
            //     position: 'fixed',
            //     left: '-10000px',   // display:none mat use karna; render nahi hoga
            //     top: 0,
            //     width: '794px',     // ~ A4 width @ 96dpi; ya 21cm if you prefer
            //     background: '#fff',
            //     zIndex: -1
            //   }}
            //   className="pdf-export-root"
            // >
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-primary">Order Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order Date: {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                {/* <div className="text-right">
                  <h3 className="text-lg font-semibold">JDP Corporation</h3>
                  <p className="text-sm text-muted-foreground">
                    1234 Business Street<br />
                    New York, NY 10001<br />
                    Phone: (555) 123-4567
                  </p>
                </div> */}
              </div>

              <Separator />

              {/* Order & Billing Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Order Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Order Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="ml-2 font-medium font-mono">{selectedOrder.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Job ID:</span>
                      <span className="ml-2 font-medium text-primary">{selectedOrder.jobId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Order Date:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2">
                        <Badge className={`${getStatusColor(selectedOrder.status)} text-xs`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </Badge>
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Address */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="font-medium">{selectedOrder?.job?.bill_to_address}</div>
                    <div className="text-muted-foreground">
                      {selectedOrder?.job?.bill_to_city_zip}<br />
                      {/* {selectedOrder?.billingAddress?.city}, {selectedOrder?.billingAddress?.state} {selectedOrder?.billingAddress?.zipCode} */}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedOrder?.job?.bill_to_email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedOrder?.job?.bill_to_phone}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer/Contractor Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Customer Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <div className="font-medium">{selectedOrder?.customer?.customerName}</div>
                    </div>
                    {/* {selectedOrder.contractorName && (
                      <div>
                        <span className="text-muted-foreground">Contractor:</span>
                        <div className="font-medium">{selectedOrder?.contractorName}</div>
                      </div>
                    )} */}
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedOrder?.customer?.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedOrder?.customer?.phone}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>JDP Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder?.orderItems?.map((item) => (
                          <TableRow key={item?.id}>
                            <TableCell className="font-medium">{item?.product_name}</TableCell>
                            <TableCell className="font-mono text-sm">{item?.sku}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item?.jdp_price)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item?.total)}</TableCell>
                          </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={4} className="text-right font-semibold">
                            Total:
                          </TableCell>
                          <TableCell className="text-right font-semibold text-lg">
                            {formatCurrency(
                              selectedOrder?.orderItems?.reduce((sum, item) => sum + (item?.total || 0), 0) || 0
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Total Payment */}
              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-green-600">-{formatCurrency(selectedOrder.discount_amount)}</span>
                      </div>
                    )} 
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Payment:</span>
                      <span className="text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            // </div>
            )
          )}

          {/* <DialogFooter className="flex gap-2">
            {hasPermission('orders', 'view') && (
              <Button variant="outline" onClick={handlePrintInvoice}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
            {hasPermission('orders', 'view') && (
        <Button variant="outline" onClick={handleDownload} disabled={isLoading || isGeneratingPdf}>
          <Download className="h-4 w-4 mr-2" />
          {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
        </Button>
      )}
            {hasPermission('orders', 'edit') && (
              <Button onClick={handleEmailInvoice} className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Mail className="h-4 w-4 mr-2" />
        Email Invoice
      </Button>
    )}
  </DialogFooter> */}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>{orderToDelete?.orderNumber}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setOrderToDelete(null);
            }}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOrder} className="bg-red-600 text-white hover:bg-red-700">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
