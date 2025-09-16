'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'
import { usePermissions } from '../contexts/PermissionContext'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Package,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  FileDown,
  X,
  Save,
  MapPin,
  Phone,
  User,
  BoxIcon,
  TagIcon,
  ListIcon,
  TruckIcon,
  FileTextIcon,
  BarcodeIcon,
  DollarSignIcon,
  PercentIcon,
  CalculatorIcon,
  PackageIcon,
  PackageOpenIcon,
  RulerIcon,
  Tag,
  Users,
  TriangleAlert,
  DollarSign,
  ArrowUpAZ
} from 'lucide-react'
import { Product, Branch } from '../types/product'
import { globalApiCall } from '../utils/globalApiHandler'
import { AutoSuggestInput } from './ui/auto-suggest-input'

interface ProductFormData {
  name: string;
  supplier: string;
  category: string;
  description: string;
  supplierSku: string;
  jdpSku: string;
  supplierCostPrice: number;
  markupPercentage: number;
  markupAmount: number;
  jdpPrice: number;
  profitMargin: number;
  stockQuantity: number;
  unit: string;
  branchIds: string[];
  status: 'active' | 'inactive' | 'draft';
}

interface Supplier {
  id: string;
  supplierId: string;
  fullName: string;
  role: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  contractStart: string;
  contractEnd: string;
  totalOrders: number;
  notes: string;
}

type ProductAction = 'add' | 'edit' | 'view' | 'delete';
type FilterStatus = 'all' | 'active' | 'inactive' | 'draft';
// Mock data
// Static branchesData removed - not currently used in the component

// Static productsData removed - now using API data from /products/getAllProducts
// Remove static suppliersData - will be replaced with API data

export function ProductsPage() {
  const { hasPermission } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all')
  const [showProductModal, setShowProductModal] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [currentAction, setCurrentAction] = useState<ProductAction>('add')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [viewProductData, setViewProductData] = useState<any>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [productStats, setProductStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [categories, setCategories] = useState<string[]>(['Electrical', 'Construction Materials', 'Tools', 'Plumbing', 'Hardware']);
  const [units, setUnits] = useState<string[]>(['piece', 'roll', 'box', 'pack', 'kg', 'meter', 'liter', 'set']);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    supplier: '',
    category: '',
    description: '',
    supplierSku: '',
    jdpSku: '',
    supplierCostPrice: 0,
    markupPercentage: 0,
    markupAmount: 0,
    jdpPrice: 0,
    profitMargin: 0,
    stockQuantity: 0,
    unit: 'piece',
    branchIds: [],
    status: 'draft'
  })
  // Auto-generate JDP SKU when supplier SKU changes
  useEffect(() => {
    if (formData.supplierSku) {
      const generatedJdpSku = `JDP-${formData.supplierSku.split('-').slice(1).join('-')}`;
      setFormData(prev => ({ ...prev, jdpSku: generatedJdpSku }));
    }
  }, [formData.supplierSku]);

  // Calculate pricing when cost or markup changes
  useEffect(() => {
    const markupAmount = formData.supplierCostPrice * (formData.markupPercentage / 100);
    const jdpPrice = formData.supplierCostPrice + markupAmount;
    const profitMargin = (markupAmount / jdpPrice) * 100;

    setFormData(prev => ({
      ...prev,
      markupAmount,
      jdpPrice,
      profitMargin: parseFloat(profitMargin.toFixed(1))
    }));
  }, [formData.supplierCostPrice, formData.markupPercentage]);

  // Fetch suppliers and products data on component mount
  useEffect(() => {
    fetchSuppliersData(1, 100); // Fetch first 100 suppliers
    fetchProductsData(currentPage, itemsPerPage); // Fetch products for current page
    fetchProductStats(); // Fetch product statistics
  }, [currentPage, itemsPerPage]);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus

    const matchesBranches = selectedBranches.length === 0 ||
      product.branches.some(branch => selectedBranches.includes(branch.id))

    return matchesSearch && matchesCategory && matchesStatus && matchesBranches
  })
    .sort((a, b) => {
      // Only sort if sortBy is set (button clicked)
      if (!sortBy) return 0;
      
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'inactive': return <AlertCircle className="h-3 w-3" />
      case 'draft': return <Clock className="h-3 w-3" />
      default: return null
    }
  }

  const handleAction = (action: ProductAction, product?: Product) => {
    setCurrentAction(action);
    setSelectedProduct(product || null);

    if (action === 'delete' && product) {
      setProductToDelete(product);
      setShowDeleteAlert(true);
    } else if (action === 'view' && product) {
      // Fetch product details from API for view
      fetchProductForView(product.id).then(() => {
      setShowProductModal(true);
      }).catch((error) => {
        console.error('Failed to load product for viewing:', error);
      });
    } else if (action === 'edit' && product) {
      // Fetch product details from API
      fetchProductById(product.id).then(() => {
      setShowProductModal(true);
      }).catch((error) => {
        console.error('Failed to load product for editing:', error);
      });
    } else if (action === 'add') {
      setFormData({
        name: '',
        supplier: '',
        category: '',
        description: '',
        supplierSku: '',
        jdpSku: '',
        supplierCostPrice: 0,
        markupPercentage: 0,
        markupAmount: 0,
        jdpPrice: 0,
        profitMargin: 0,
        stockQuantity: 0,
        unit: 'piece',
        branchIds: [],
        status: 'draft'
      });
      setShowProductModal(true);
    }
  };

  const handleBranchToggle = (branchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBranches(prev => [...prev, branchId])
    } else {
      setSelectedBranches(prev => prev.filter(id => id !== branchId))
    }
  }

  const handleFormBranchToggle = (branchId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, branchIds: [...prev.branchIds, branchId] }))
    } else {
      setFormData(prev => ({ ...prev, branchIds: prev.branchIds.filter(id => id !== branchId) }))
    }
  }

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    if (!formData.supplier) {
      errors.supplier = 'Supplier is required';
    }
    if (!formData.supplierSku.trim()) {
      errors.supplierSku = 'Supplier SKU is required';
    }
    if (!formData.supplierCostPrice || formData.supplierCostPrice <= 0) {
      errors.supplierCostPrice = 'Supplier cost price must be greater than 0';
    }
    if (!formData.markupPercentage || formData.markupPercentage < 0) {
      errors.markupPercentage = 'Markup percentage must be 0 or greater';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Get system IP address
      const getSystemIP = async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          return data.ip;
        } catch (error) {
          console.error('Error fetching IP:', error);
          return 'unknown';
        }
      };

      const systemIP = await getSystemIP();

      const payload = {
        product_name: formData.name,
        category: formData.category,
        supplier_id: parseInt(formData.supplier),
        description: formData.description,
        supplier_sku: formData.supplierSku,
        jdp_sku: formData.jdpSku,
        supplier_cost_price: formData.supplierCostPrice,
        markup_percentage: formData.markupPercentage,
        stock_quantity: formData.stockQuantity,
        unit: formData.unit,
        status: formData.status,
        system_ip: systemIP
      };

      let response;
      let successMessage;

      if (currentAction === 'edit' && selectedProduct) {
        // Update existing product
        console.log('Updating product with payload:', payload);
        response = await globalApiCall(`${apiBaseUrl}/products/updateProduct/${selectedProduct.id}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        successMessage = 'Product updated successfully!';
      } else {
        // Create new product
        console.log('Creating product with payload:', payload);
        response = await globalApiCall(`${apiBaseUrl}/products/createProduct`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        successMessage = 'Product created successfully!';
      }

      const responseData = await response.json();
      console.log('Product operation response:', responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== 'undefined') {
          const { toast } = await import('sonner');
          toast.success(successMessage);
        }
        
        setShowProductModal(false);
        resetForm();
        
        // Update categories if a new category was added
        if (formData.category && !categories.includes(formData.category)) {
          setCategories(prevCategories => [...prevCategories, formData.category].sort());
        }
        
        // Update units if a new unit was added
        if (formData.unit && !units.includes(formData.unit)) {
          setUnits(prevUnits => [...prevUnits, formData.unit].sort());
        }
        
        // Refresh the products list and stats
        fetchProductsData(currentPage, itemsPerPage);
        fetchProductStats();
      } else {
        throw new Error(responseData.message || `Failed to ${currentAction === 'edit' ? 'update' : 'create'} product`);
      }
    } catch (error) {
      console.error(`Error ${currentAction === 'edit' ? 'updating' : 'creating'} product:`, error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : `Failed to ${currentAction === 'edit' ? 'update' : 'create'} product`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setIsLoading(true); 
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/products/deleteProduct/${productToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      const responseData = await response.json();
      console.log('Product deletion response:', responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== 'undefined') {
          const { toast } = await import('sonner');
          toast.success('Product deleted successfully!');
        }
        
        setShowDeleteAlert(false);
        setProductToDelete(null);
        // Close view modal if it's open
        setShowProductModal(false);
        setViewProductData(null);
        // Refresh the products list and stats
        fetchProductsData(currentPage, itemsPerPage);
        fetchProductStats();
      } else {
        throw new Error(responseData.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to delete product');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      supplier: '',
      category: '',
      description: '',
      supplierSku: '',
      jdpSku: '',
      supplierCostPrice: 0,
      markupPercentage: 0,
      markupAmount: 0,
      jdpPrice: 0,
      profitMargin: 0,
      stockQuantity: 0,
      unit: 'piece',
      branchIds: [],
      status: 'draft'
    })
    setSelectedProduct(null)
    setCurrentAction('add')
    setValidationErrors({})
  }

 const handleExport = () => {
  // Prepare CSV headers
  const headers = [
    'ID',
    'Name',
    'Category',
    'Supplier',
    'Supplier SKU',
    'JDP SKU',
    'Supplier Cost Price',
    'Markup Percentage',
    'Markup Amount',
    'JDP Price',
    'Profit Margin',
    'Stock Quantity',
    'Status',
    'Branches',
    'Description',
    'Created Date',
    'Last Updated'
  ];

  // Prepare CSV rows
  const rows = products.map(product => [
    product.id,
    product.name,
    product.category,
    product.supplier,
    product.sku || '',
    product.id, // Using product ID as JDP SKU in this example
    product.ptrPrice,
    '40%', // Default markup percentage
    (product.ptrPrice * 0.4).toFixed(2), // Markup amount
    (product.ptrPrice * 1.4).toFixed(2), // JDP price
    '28.6%', // Default profit margin
    product.stock,
    product.status,
    product.branches.map(b => b.name).join(', '),
    product.description || '',
    product.createdDate,
    product.lastUpdated
  ]);

  // Convert to CSV string
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(field => `"${field}"`).join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'products_export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const handleImport = () => {
    console.log('Importing products...')
    // Implementation for import functionality
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

  const fetchSuppliersData = async (page: number, limit: number) => {
    try {
      setIsLoading(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers?page=${page}&limit=${limit}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Suppliers API Response:', responseData);

      if (responseData.success && responseData.data) {
        // Transform API response to match component's expected format
        const transformedSuppliers = responseData.data?.data.map((apiSupplier: any) => ({
          id: apiSupplier.id.toString(),
          supplierId: apiSupplier.supplier_code || '',
          fullName: apiSupplier.users.full_name || '',
          role: apiSupplier.role || '',
          companyName: apiSupplier.company_name || '',
          contactPerson: apiSupplier.contact_person || '',
          email: apiSupplier.users.email || '',
          phone: apiSupplier.users.phone || '',
          address: apiSupplier.address || '',
          status: apiSupplier.users.status?.toLowerCase() || '',
          contractStart: apiSupplier.contract_start || '',
          contractEnd: apiSupplier.contract_end || '',
          totalOrders: apiSupplier.total_orders || 0,
          notes: apiSupplier.notes || ''
        }));

        setSuppliers(transformedSuppliers);  
        setTotalSuppliers(responseData.data.pagination.totalItems || transformedSuppliers.length);
      } else {
        console.error('Invalid suppliers API response structure:', responseData);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      // Error is already handled by globalApiCall (token revocation, etc.)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setSuppliers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductsData = async (page: number, limit: number) => {
    try {
      setIsLoadingProducts(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/products/getAllProducts?page=${page}&limit=${limit}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Products API Response:', responseData);

      if (responseData.success && responseData.data) {
        // Transform API response to match component's expected format
        const transformedProducts = responseData.data?.data.map((apiProduct: any) => ({
          id: apiProduct.id?.toString() || `PRD-${Date.now()}`,
          name: apiProduct.product_name || '',
          category: apiProduct.category || '',
          ptrPrice: apiProduct.supplier_cost_price || 0,
          jdp_price: apiProduct.jdp_price || 0,
          stock: apiProduct.stock_quantity || 0,
          markup_amount: apiProduct.markup_amount || 0,
          status: apiProduct.status || 'active',
          jdpSku: apiProduct.jdp_sku || '', 
          branches: [], // Will be populated if branch data is available in API
          image: '', // Will be populated if image data is available in API
          description: apiProduct.description || '',
          sku: apiProduct.supplier_sku || '',
          unit: apiProduct.unit || 'piece',
          createdDate: apiProduct.created_at ? new Date(apiProduct.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastUpdated: apiProduct.updated_at ? new Date(apiProduct.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          minStockLevel: 0, // Default value, can be updated if available in API
          maxStockLevel: 100, // Default value, can be updated if available in API
          supplier: apiProduct.supplier_name || 'Unknown Supplier'
        }));

        setProducts(transformedProducts);
        setTotalProducts(responseData.data.pagination?.totalItems || transformedProducts.length);
        
        // Extract unique categories from products
        const uniqueCategories = Array.from(new Set(transformedProducts.map((product:any) => product.category).filter(Boolean))) as string[];
        setCategories(prevCategories => {
          const combined = Array.from(new Set([...prevCategories, ...uniqueCategories]));
          return combined.sort();
        });
        
        // Extract unique units from products
        const uniqueUnits = Array.from(new Set(transformedProducts.map((product:any) => product.unit).filter(Boolean))) as string[];
        setUnits(prevUnits => {
          const combined = Array.from(new Set([...prevUnits, ...uniqueUnits]));
          return combined.sort();
        });
      } else {
        console.error('Invalid products API response structure:', responseData);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Error is already handled by globalApiCall (token revocation, etc.)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setProducts([]);
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchProductById = async (productId: string) => {
    try {
      setIsLoading(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/products/getProductById/${productId}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Product by ID API Response:', responseData);

      if (responseData.success && responseData.data) {
        const apiProduct = responseData.data;
        
        // Transform API response to match form data format
        const productData: ProductFormData = {
          name: apiProduct.product_name || '',
          supplier: apiProduct.supplier_id?.toString() || '',
          category: apiProduct.category || '',
          description: apiProduct.description || '',
          supplierSku: apiProduct.supplier_sku || '',
          jdpSku: apiProduct.jdp_sku || '',
          supplierCostPrice: apiProduct.supplier_cost_price || 0,
          markupPercentage: apiProduct.markup_percentage || 0,
          markupAmount: apiProduct.markup_amount || 0,
          jdpPrice: apiProduct.jdp_price || 0,
          profitMargin: apiProduct.profit_margin || 0,
          stockQuantity: apiProduct.stock_quantity || 0,
          unit: apiProduct.unit || 'piece',
          branchIds: [], // Will be populated if branch data is available
          status: apiProduct.status || 'draft' // Use API status or default to draft
        };

        setFormData(productData);
        return productData;
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

  const fetchProductForView = async (productId: string) => {
    try {
      setIsLoadingView(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/products/getProductById/${productId}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Product View API Response:', responseData);

      if (responseData.success && responseData.data) {
        setViewProductData(responseData.data);
        return responseData.data;
      } else {
        throw new Error(responseData.message || 'Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product for view:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to fetch product details');
      }
      throw error;
    } finally {
      setIsLoadingView(false);
    }
  };

  const fetchProductStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/products/getProductStats/stats`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Product Stats API Response:', responseData);

      if (responseData.success && responseData.data) {
        setProductStats(responseData.data);
      } else {
        console.error('Invalid product stats API response structure:', responseData);
        setProductStats(null);
      }
    } catch (error) {
      console.error('Error fetching product stats:', error);
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setProductStats(null);
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Calculate summary statistics from API data
  const totalProductsCount = productStats?.total || totalProducts
  const activeProductsCount = productStats?.active || products.filter(p => p.status === 'active').length
  const inactiveProductsCount = productStats?.inactive || products.filter(p => p.status === 'inactive').length
  const draftProductsCount = productStats?.draft || products.filter(p => p.status === 'draft').length
  const lowStockCount = productStats?.lowStock || 0
  const totalInventoryValue = productStats?.totalInventoryValue || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products Management</h1>
          <p className="text-muted-foreground">Manage your electrical products catalog with dual SKU and pricing system</p>
        </div>
        <div className="flex gap-2">
         
          {hasPermission('products', 'create') && (
            <Button variant="outline" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import Products
            </Button>
          )}
          {hasPermission('products', 'view') && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Products
            </Button>
          )}
          {hasPermission('products', 'create') && (
            <Button onClick={() => handleAction('add')} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                <div className="text-2xl font-semibold text-foreground">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  ) : (
                    totalProductsCount
                  )}
                </div>
                {!isLoadingStats && productStats && (
                  <p className="text-xs text-muted-foreground mt-1">All products in inventory</p>
                )}
              </div>
               <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-black-600" />
              </div> 
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
                <div className="text-2xl font-semibold text-green-600">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  ) : (
                    activeProductsCount
                  )}
                </div>
                {!isLoadingStats && productStats && (
                  <p className="text-xs text-muted-foreground mt-1">{productStats.activePercentage}% of total</p>
                )}
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                <div className="text-2xl font-semibold text-yellow-600">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  ) : (
                    lowStockCount
                  )}
                </div>
                {!isLoadingStats && productStats && (
                  <p className="text-xs text-muted-foreground mt-1">{productStats.lowStockPercentage}% of total</p>
                )}
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
                <div className="text-2xl font-semibold text-gray-600">
                  {isLoadingStats ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  ) : (
                    `$${totalInventoryValue}`
                  )}
                </div>
                {!isLoadingStats && productStats && (
                  <p className="text-xs text-muted-foreground mt-1">Current inventory worth</p>
                )}
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-gray-600" />
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
                  placeholder="Search products by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>


            {/* Category Filter */}
            <div className='flex flex-wrap gap-2'>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[fit-content]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={(value: FilterStatus) => setSelectedStatus(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
            variant="outline"
            size="icon"
            className='w-[70px]'
            onClick={() => {
              setSortBy('name');
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
          >
            <ArrowUpAZ className="w-4 h-4" />
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Button>
            {/* Branch Filter */}
            {/* <div className="flex gap-2">
              <div className="flex flex-wrap gap-2">
                {branchesData.map((branch) => (
                  <div key={branch.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={branch.id}
                      checked={selectedBranches.includes(branch.id)}
                      onCheckedChange={(checked) => handleBranchToggle(branch.id, checked as boolean)}
                    />
                    <Label htmlFor={branch.id} className="text-sm cursor-pointer">
                      {branch.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier SKU</TableHead>
                  <TableHead>	JDP SKU</TableHead>
                  <TableHead>Supplier Price</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>JDP Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading products...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        /> */}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-muted-foreground font-mono">{product.sku}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className='flex gap-3 items-center'>
                          <Building  className='w-4 h-4 text-blue-500'/>
                      <div className='bg-[#75a7eb17] text-blue-500 p-[5px] rounded w-auto'>
                        {product.sku}
                      </div>
                      </div> 
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-3 items-center'>
                          <Tag className='w-4 h-4 text-gray-500'/>
                      <div className='bg-gray-100 text-black-500 p-[5px] rounded w-auto'>
                        {product.jdpSku}
                      </div>
                      </div>
                      </TableCell>
                    <TableCell className="font-medium">{formatCurrency(product.ptrPrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.markup_amount}</span>
                        
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">{formatCurrency(product.jdp_price || 0)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stock}</span>
                       
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(product.status)} flex items-center gap-1 w-fit hover:${getStatusColor(product.status)}`}>
                        {getStatusIcon(product.status)}
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {hasPermission('products', 'view') && (
                          <Button variant="outline" size="sm" onClick={() => handleAction('view', product)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {hasPermission('products', 'edit') && (
                          <Button variant="outline" size="sm" onClick={() => handleAction('edit', product)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {hasPermission('products', 'delete') && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction('delete', product)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalProducts > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoadingProducts}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(totalProducts / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalProducts / itemsPerPage) || isLoadingProducts}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Modal (Add/Edit/View) */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl   max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {currentAction === 'add' ? 'Add New Product' :
                currentAction === 'edit' ? 'Edit Product' :
                  'Product Details'}
            </DialogTitle>
            <DialogDescription>
              {currentAction === 'add' ? 'Create a new product in your inventory' :
                currentAction === 'edit' ? 'Update product information' :
                  'View complete product details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {currentAction === 'view' && viewProductData ? (
              // View Mode - Product Details
              <div className="space-y-6">
                {isLoadingView ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading product details...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Product Information Section */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Product Name</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewProductData.product_name}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewProductData.category}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Supplier SKU</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 font-mono">
                          {viewProductData.supplier_sku}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">JDP SKU</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 font-mono">
                          {viewProductData.jdp_sku}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Information Section */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Supplier Cost Price</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {formatCurrency(viewProductData.supplier_cost_price || 0)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">JDP Price</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {formatCurrency(viewProductData.jdp_price || 0)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Markup Percentage</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewProductData.markup_percentage}%
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Markup Amount</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {formatCurrency(viewProductData.markup_amount || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Stock and Unit Information */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Stock Quantity</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewProductData.stock_quantity}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Unit</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 capitalize">
                          {viewProductData.unit}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 min-h-[60px]">
                        {viewProductData.description || 'No description provided'}
                      </div>
                    </div>

                    {/* Supplier Information */}
                    {viewProductData.suppliers && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Supplier Information</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Company Name</Label>
                            <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                              {viewProductData.suppliers.company_name}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Contact Person</Label>
                            <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                              {viewProductData.suppliers.contact_person}
                            </div>
                          </div>
                          {viewProductData.suppliers.users && (
                            <>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                                  {viewProductData.suppliers.users.email}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone</Label>
                                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                                  {viewProductData.suppliers.users.phone}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Created At</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {new Date(viewProductData.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Updated</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {new Date(viewProductData.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Add/Edit Mode - redesigned to match the image
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="rounded-lg">
                  <div className="flex items-center gap-2 border-b pb-2 mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <BoxIcon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-1 mb-2">
                        {/* <TagIcon className="h-4 w-4 text-blue-500" /> */}
                        Product Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, name: e.target.value }));
                          clearValidationError('name');
                        }}
                        placeholder="Enter product name"
                        className={`mt-1 ${validationErrors.name ? 'border-red-500' : ''}`}
                        required
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="category" className="flex items-center gap-1 mb-2">
                        {/* <ListIcon className="h-4 w-4 text-blue-500" /> */}
                        Category *
                      </Label>
                      <AutoSuggestInput
                        label=""
                        value={formData.category}
                        onChange={(value) => {
                          setFormData(prev => ({ ...prev, category: value }));
                          clearValidationError('category');
                        }}
                        suggestions={categories}
                        placeholder="Enter category"
                        error={validationErrors.category}
                         
                      />
                      
                    </div>
                    <div>
                      <Label htmlFor="supplier" className="flex items-center gap-1 mb-2">
                        {/* <TruckIcon className="h-4 w-4 text-blue-500" /> */}
                        Supplier *
                      </Label>
                      <div className="">
                        <Select
                          value={formData.supplier}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, supplier: value }));
                            clearValidationError('supplier');
                          }}
                          required
                        >
                          <SelectTrigger className={`mt-1 ${validationErrors.supplier ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.companyName} - {supplier.contactPerson}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="mt-1"
                          onClick={() => setShowAddSupplierModal(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button> */}
                      </div>
                      {validationErrors.supplier && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.supplier}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description" className="flex items-center gap-1 mb-2">
                        {/* <FileTextIcon className="h-4 w-4 text-blue-500" /> */}
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Product description" 
                      />
                    </div>
                  </div>
                </div>

                {/* SKU Information Section */}
                <div className="rounded-lg">
                  <div className="flex items-center gap-2 border-b pb-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarcodeIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="font-semibold">SKU Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplierSku" className="flex items-center gap-1 mb-2">
                        {/* <BarcodeIcon className="h-4 w-4 text-blue-500" /> */}
                        Supplier SKU *
                      </Label>
                      <Input
                        id="supplierSku"
                        value={formData.supplierSku}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, supplierSku: e.target.value }));
                          clearValidationError('supplierSku');
                        }}
                        placeholder="SL-XXX-XXX-B81"
                        className={`mt-1 ${validationErrors.supplierSku ? 'border-red-500' : ''}`}
                        required
                      />
                      {validationErrors.supplierSku && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.supplierSku}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="jdpSku" className="flex items-center gap-1 mb-2">
                        {/* <Tag className="h-4 w-4 text-blue-500" /> */}
                        JDP SKU
                      </Label>
                      <Input
                        id="jdpSku"
                        value={formData.jdpSku}
                        readOnly
                        placeholder="JDP-XXX-XXX-B81 (auto-gen)"
                        className="mt-1 bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Information Section */}
                <div className="rounded-lg">
                  <div className="flex items-center gap-2 border-b pb-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSignIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <h3 className="font-semibold">Pricing Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplierCostPrice" className="flex items-center gap-1">
                        {/* <DollarSignIcon className="h-4 w-4 text-blue-500" /> */}
                        Supplier Cost Price *
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                        <Input
                          id="supplierCostPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.supplierCostPrice}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, supplierCostPrice: parseFloat(e.target.value) || 0 }));
                            clearValidationError('supplierCostPrice');
                          }}
                          placeholder="0.00"
                          className={`pl-8 ${validationErrors.supplierCostPrice ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {validationErrors.supplierCostPrice && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.supplierCostPrice}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="markupPercentage" className="flex items-center gap-1">
                        {/* <PercentIcon className="h-4 w-4 text-blue-500" /> */}
                        Markup Percentage *
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2">%</span>
                        <Input
                          id="markupPercentage"
                          type="number"
                          step="1"
                          min="0"
                          value={formData.markupPercentage}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, markupPercentage: parseInt(e.target.value) || 0 }));
                            clearValidationError('markupPercentage');
                          }}
                          placeholder="0"
                          className={`pr-8 ${validationErrors.markupPercentage ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {validationErrors.markupPercentage && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.markupPercentage}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="unit" className="flex items-center gap-1 mb-2">
                        {/* <RulerIcon className="h-4 w-4 text-blue-500" /> */}
                        Unit
                      </Label>
                      <AutoSuggestInput
                        label=""
                        value={formData.unit}
                        onChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                        suggestions={units}
                        placeholder="Enter unit"
                      />
                    </div>
                    {/* <div>
                      <Label htmlFor="markupPercentage" className="flex items-center gap-1"> 
                        Markup Percentage *
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2">%</span>
                        <Input
                          id="markupPercentage"
                          type="number"
                          step="1"
                          min="0"
                          value={formData.markupPercentage}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, markupPercentage: parseInt(e.target.value) || 0 }));
                            clearValidationError('markupPercentage');
                          }}
                          placeholder="0"
                          className={`pr-8 ${validationErrors.markupPercentage ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {validationErrors.markupPercentage && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.markupPercentage}</p>
                      )}
                    </div> */}
                  </div>
                </div>

                {/* Calculated Pricing Section */}
                <div>
                  <div className="flex items-center gap-3 border-b pb-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Calculated Pricing</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-5 flex flex-col items-center text-center min-h-[120px] justify-center">
                      <div className="w-10 h-10 bg-[#fed7aa] rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-[#ea580c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3v18h18" />
                          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-[#ea580c] mb-1">Markup Amount</div>
                      <div className="text-xl font-bold text-[#ea580c]">${formData.markupAmount.toFixed(2)}</div>
                    </div>

                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 flex flex-col items-center text-center min-h-[120px] justify-center">
                      <div className="w-10 h-10 bg-[#e2e8f0] rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-500 mb-1">JDP Price</div>
                      <div className="text-xl font-bold text-gray-900">${formData.jdpPrice.toFixed(2)}</div>
                    </div>

                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 flex flex-col items-center text-center min-h-[120px] justify-center">
                      <div className="w-10 h-10 bg-[#bbf7d0] rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-[#16a34a] mb-1">Profit Margin</div>
                      <div className="text-xl font-bold text-[#16a34a]">{formData.profitMargin}%</div>
                    </div>
                  </div>
                </div>



                {/* Inventory Details Section */}
                <div className="rounded-lg">
                  <div className="flex items-center gap-2 border-b pb-2 mb-4">
                    <div className="w-8 h-8 bg-[#fff7ed] rounded-lg flex items-center justify-center">
                      <PackageIcon className="h-4 w-4 text-[#ea580c]" />
                    </div>
                    <h3 className="font-semibold">Inventory Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockQuantity" className="flex items-center gap-1 mb-2">
                        {/* <PackageOpenIcon className="h-4 w-4 text-blue-500" /> */}
                        Stock Quantity
                      </Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  
                    <div>
                      <Label htmlFor="status" className="flex items-center gap-1 mb-2">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {currentAction === 'view' ? (
              <div className="flex gap-2">
                {hasPermission('products', 'edit') && (
                  <Button variant="outline" onClick={() => handleAction('edit', selectedProduct!)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {hasPermission('products', 'delete') && (
                  <Button variant="outline" onClick={() => handleAction('delete', selectedProduct!)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowProductModal(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                {hasPermission('products', currentAction === 'add' ? 'create' : 'edit') && (
                  <Button 
                    onClick={handleSaveProduct} 
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Product'}
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Supplier Modal */}
      <Dialog open={showAddSupplierModal} onOpenChange={setShowAddSupplierModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add New Supplier
            </DialogTitle>
            <DialogDescription>
              Add a new supplier to your database
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                placeholder="Enter supplier name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                placeholder="+1 555-0123"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                placeholder="supplier@email.com"
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplierModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{productToDelete?.name}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct} 
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Yes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}