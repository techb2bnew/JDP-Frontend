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
  DollarSign
} from 'lucide-react'
import { Product, Branch } from '../types/product'

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

type ProductAction = 'add' | 'edit' | 'view' | 'delete';
type FilterStatus = 'all' | 'active' | 'inactive' | 'draft';
// Mock data
const branchesData: Branch[] = [
  {
    id: 'BR-001',
    name: 'Downtown Main Branch',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '+1 (555) 123-4567',
    manager: 'John Smith'
  },
  {
    id: 'BR-002',
    name: 'Brooklyn Distribution Center',
    address: '456 Industrial Ave',
    city: 'Brooklyn',
    state: 'NY',
    zipCode: '11201',
    phone: '+1 (555) 234-5678',
    manager: 'Sarah Johnson'
  },
  {
    id: 'BR-003',
    name: 'Queens Warehouse',
    address: '789 Warehouse Blvd',
    city: 'Queens',
    state: 'NY',
    zipCode: '11004',
    phone: '+1 (555) 345-6789',
    manager: 'Mike Wilson'
  },
  {
    id: 'BR-004',
    name: 'Manhattan Store',
    address: '321 Commerce Plaza',
    city: 'Manhattan',
    state: 'NY',
    zipCode: '10003',
    phone: '+1 (555) 456-7890',
    manager: 'Lisa Davis'
  }
]

const productsData: Product[] = [
  {
    id: 'PRD-2025-001',
    name: 'Main Electrical Panel 200A',
    category: 'Electrical',
    ptrPrice: 450.00,
    stock: 45,
    status: 'active',
    branches: [branchesData[0], branchesData[1]],
    image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=50&h=50&fit=crop&crop=center',
    description: 'High-quality 200A electrical panel suitable for residential and commercial use.',
    sku: 'ELC-PNL-200A',
    createdDate: '2024-12-15',
    lastUpdated: '2025-01-20',
    minStockLevel: 10,
    maxStockLevel: 100,
    supplier: 'ElectriCorp Supply'
  },
  {
    id: 'PRD-2025-002',
    name: 'Circuit Breakers 20A (10 Pack)',
    category: 'Electrical',
    ptrPrice: 180.00,
    stock: 156,
    status: 'active',
    branches: [branchesData[0], branchesData[2], branchesData[3]],
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=50&h=50&fit=crop&crop=center',
    description: 'Pack of 10 circuit breakers, 20A capacity with safety certification.',
    sku: 'CB-20A-10PK',
    createdDate: '2024-12-10',
    lastUpdated: '2025-01-18',
    minStockLevel: 50,
    maxStockLevel: 200,
    supplier: 'SafeBreaker Inc'
  },
  {
    id: 'PRD-2025-003',
    name: 'Copper Wire 12 AWG (500 ft)',
    category: 'Electrical',
    ptrPrice: 125.00,
    stock: 23,
    status: 'active',
    branches: [branchesData[1]],
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=50&h=50&fit=crop&crop=center',
    description: '500 feet of premium copper wire, 12 AWG for electrical installations.',
    sku: 'CW-12AWG-500FT',
    createdDate: '2024-11-20',
    lastUpdated: '2025-01-15',
    minStockLevel: 20,
    maxStockLevel: 80,
    supplier: 'CopperWire Solutions'
  },
  {
    id: 'PRD-2025-004',
    name: 'Fine Sand (5 Cubic Yards)',
    category: 'Construction Materials',
    ptrPrice: 150.00,
    stock: 12,
    status: 'active',
    branches: [branchesData[1], branchesData[2]],
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=50&h=50&fit=crop&crop=center',
    description: 'High-quality fine sand for construction and landscaping projects.',
    sku: 'SND-FNE-5YD',
    createdDate: '2024-12-01',
    lastUpdated: '2025-01-12',
    minStockLevel: 5,
    maxStockLevel: 50,
    supplier: 'BuildMaterial Corp'
  },
  {
    id: 'PRD-2025-005',
    name: 'Pea Gravel (3 Cubic Yards)',
    category: 'Construction Materials',
    ptrPrice: 120.00,
    stock: 0,
    status: 'inactive',
    branches: [branchesData[2]],
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=50&h=50&fit=crop&crop=center',
    description: 'Premium pea gravel for drainage and decorative applications.',
    sku: 'GRV-PEA-3YD',
    createdDate: '2024-11-15',
    lastUpdated: '2025-01-10',
    minStockLevel: 3,
    maxStockLevel: 30,
    supplier: 'Stone & Gravel Co'
  },
  {
    id: 'PRD-2025-006',
    name: 'Professional Testing Kit',
    category: 'Tools',
    ptrPrice: 350.00,
    stock: 8,
    status: 'draft',
    branches: [branchesData[0], branchesData[3]],
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=50&h=50&fit=crop&crop=center',
    description: 'Comprehensive testing kit for electrical and construction work.',
    sku: 'TST-KIT-PRO',
    createdDate: '2024-12-20',
    lastUpdated: '2025-01-22',
    minStockLevel: 5,
    maxStockLevel: 25,
    supplier: 'ProTools Inc'
  }
]
const suppliersData = [
  { id: 'SUP-001', name: 'ElectriCorp Supply' },
  { id: 'SUP-002', name: 'SafeBreaker Inc' },
  { id: 'SUP-003', name: 'CopperWire Solutions' }
];
const categoriesData = ['Electrical', 'Construction Materials', 'Tools', 'Plumbing', 'Hardware']

export function ProductsPage() {
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
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    supplier: '',
    category: '',
    description: '',
    supplierSku: '',
    jdpSku: '',
    supplierCostPrice: 0,
    markupPercentage: 40,
    markupAmount: 0,
    jdpPrice: 0,
    profitMargin: 28.6,
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

  // Filter products
  const filteredProducts = productsData.filter(product => {
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
      setShowProductModal(true);
    } else if (action === 'edit' && product) {
      setFormData({
        name: product.name,
        supplier: product.supplier || '',
        category: product.category,
        description: product.description || '',
        supplierSku: product.sku || '',
        jdpSku: product.sku ? `JDP-${product.sku.split('-').slice(1).join('-')}` : '',
        supplierCostPrice: product.ptrPrice,
        markupPercentage: 40,
        markupAmount: product.ptrPrice * 0.4,
        jdpPrice: product.ptrPrice * 1.4,
        profitMargin: 28.6,
        stockQuantity: product.stock,
        unit: 'piece',
        branchIds: product.branches.map(b => b.id),
        status: product.status
      });
      setShowProductModal(true);
    } else if (action === 'add') {
      setFormData({
        name: '',
        supplier: '',
        category: '',
        description: '',
        supplierSku: '',
        jdpSku: '',
        supplierCostPrice: 0,
        markupPercentage: 40,
        markupAmount: 0,
        jdpPrice: 0,
        profitMargin: 28.6,
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

  const handleSaveProduct = () => {
    console.log('Saving product:', formData)
    // Here you would typically save to backend
    setShowProductModal(false)
    resetForm()
  }

  const handleDeleteProduct = () => {
    console.log('Deleting product:', productToDelete?.id)
    // Here you would typically delete from backend
    setShowDeleteAlert(false)
    setProductToDelete(null)
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
      markupPercentage: 40,
      markupAmount: 0,
      jdpPrice: 0,
      profitMargin: 28.6,
      stockQuantity: 0,
      unit: 'piece',
      branchIds: [],
      status: 'draft'
    })
    setSelectedProduct(null)
    setCurrentAction('add')
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
  const rows = productsData.map(product => [
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

  // Calculate summary statistics
  const totalProducts = productsData.length
  const activeProducts = productsData.filter(p => p.status === 'active').length
  const inactiveProducts = productsData.filter(p => p.status === 'inactive').length
  const draftProducts = productsData.filter(p => p.status === 'draft').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products Management</h1>
          <p className="text-muted-foreground">Manage your electrical products catalog with dual SKU and pricing system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import Products
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Products
          </Button>
          <Button onClick={() => handleAction('add')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                <div className="text-2xl font-semibold text-foreground">{totalProducts}</div>
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
                <div className="text-2xl font-semibold text-green-600">{activeProducts}</div>
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
                <div className="text-2xl font-semibold text-yellow-600">{inactiveProducts}</div>
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
                <div className="text-2xl font-semibold text-gray-600">${draftProducts}</div>
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
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesData.map((category) => (
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
                {filteredProducts.map((product) => (
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
                        {product.id}
                      </div>
                      </div>
                      </TableCell>
                    <TableCell className="font-medium">{formatCurrency(product.ptrPrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stock}</span>
                        {product.minStockLevel && product.stock <= product.minStockLevel && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">{formatCurrency(product.ptrPrice)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stock}</span>
                        {product.minStockLevel && product.stock <= product.minStockLevel && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                            Low
                          </Badge>
                        )}
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
                        <Button variant="ghost" size="sm" onClick={() => handleAction('view', product)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction('edit', product)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction('delete', product)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Modal (Add/Edit/View) */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl sm:max-w-[700px] max-h-[90vh] overflow-auto">
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
            {currentAction === 'view' && selectedProduct ? (
              // View Mode (keep your existing view code)
              <div>View mode content</div>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="flex items-center gap-1 mb-2">
                        {/* <ListIcon className="h-4 w-4 text-blue-500" /> */}
                        Category *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesData.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="supplier" className="flex items-center gap-1 mb-2">
                        {/* <TruckIcon className="h-4 w-4 text-blue-500" /> */}
                        Supplier *
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.supplier}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliersData.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="mt-1"
                          onClick={() => setShowAddSupplierModal(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, supplierSku: e.target.value }))}
                        placeholder="SL-XXX-XXX-B81"
                        className="mt-1"
                        required
                      />
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
                          onChange={(e) => setFormData(prev => ({ ...prev, supplierCostPrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="pl-8"
                          required
                        />
                      </div>
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
                          onChange={(e) => setFormData(prev => ({ ...prev, markupPercentage: parseInt(e.target.value) || 0 }))}
                          placeholder="40"
                          className="pr-8"
                          required
                        />
                      </div>
                    </div>
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
                      <Label htmlFor="unit" className="flex items-center gap-1 mb-2">
                        {/* <RulerIcon className="h-4 w-4 text-blue-500" /> */}
                        Unit
                      </Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">piece</SelectItem>
                          <SelectItem value="roll">roll</SelectItem>
                          <SelectItem value="box">box</SelectItem>
                          <SelectItem value="pack">pack</SelectItem>
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
                <Button variant="outline" onClick={() => handleAction('edit', selectedProduct!)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => handleAction('delete', selectedProduct!)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowProductModal(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Product
                </Button>
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
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}