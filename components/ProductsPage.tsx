'use client'

import { useState } from 'react'
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
  User
} from 'lucide-react'
import { Product, Branch, ProductFormData, ProductAction, FilterStatus } from '../types/product'

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
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    ptrPrice: 0,
    stock: 0,
    status: 'draft',
    branchIds: [],
    description: '',
    sku: ''
  })

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
    setCurrentAction(action)
    setSelectedProduct(product || null)
    
    if (action === 'delete' && product) {
      setProductToDelete(product)
      setShowDeleteAlert(true)
    } else if (action === 'view' && product) {
      setShowProductModal(true)
    } else if (action === 'edit' && product) {
      setFormData({
        name: product.name,
        category: product.category,
        ptrPrice: product.ptrPrice,
        stock: product.stock,
        status: product.status,
        branchIds: product.branches.map(b => b.id),
        description: product.description || '',
        sku: product.sku || ''
      })
      setShowProductModal(true)
    } else if (action === 'add') {
      setFormData({
        name: '',
        category: '',
        ptrPrice: 0,
        stock: 0,
        status: 'draft',
        branchIds: [],
        description: '',
        sku: ''
      })
      setShowProductModal(true)
    }
  }

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
      category: '',
      ptrPrice: 0,
      stock: 0,
      status: 'draft',
      branchIds: [],
      description: '',
      sku: ''
    })
    setSelectedProduct(null)
    setCurrentAction('add')
  }

  const handleExport = () => {
    console.log('Exporting products...')
    // Implementation for export functionality
  }

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
          <p className="text-muted-foreground">Manage your product inventory across all branches</p>
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
          <Button onClick={() => handleAction('add')} className="bg-primary hover:bg-primary/90">
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
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
                <div className="text-2xl font-semibold text-red-600">{inactiveProducts}</div>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
                <div className="text-2xl font-semibold text-yellow-600">{draftProducts}</div>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
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
              
              {/* Category Filter */}
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
            <div className="flex gap-2">
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
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>PTR Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Branch Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-muted-foreground font-mono">{product.sku}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium font-mono">{product.id}</div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
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
                      <div className="space-y-1">
                        {product.branches.map((branch, index) => (
                          <div key={branch.id} className="text-sm">
                            {index > 0 && <span className="text-muted-foreground">, </span>}
                            {branch.name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {product.branches.map((branch, index) => (
                          <div key={branch.id} className="text-sm text-muted-foreground">
                            {index > 0 && <span>, </span>}
                            {branch.address}, {branch.city}, {branch.state}
                          </div>
                        ))}
                      </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
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
              // View Mode
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {selectedProduct.image && (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                    <p className="text-muted-foreground">{selectedProduct.id}</p>
                    <Badge className={getStatusColor(selectedProduct.status)}>
                      {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <p>{selectedProduct.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">PTR Price</Label>
                    <p className="font-medium">{formatCurrency(selectedProduct.ptrPrice)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Stock</Label>
                    <p>{selectedProduct.stock} Units</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">SKU</Label>
                    <p className="font-mono">{selectedProduct.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created Date</Label>
                    <p>{formatDate(selectedProduct.createdDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                    <p>{formatDate(selectedProduct.lastUpdated)}</p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedProduct.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Branches</Label>
                  <div className="mt-2 space-y-3">
                    {selectedProduct.branches.map((branch) => (
                      <Card key={branch.id} className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="font-medium">{branch.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{branch.address}, {branch.city}, {branch.state} {branch.zipCode}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{branch.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Manager: {branch.manager}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Add/Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
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
                    <Label htmlFor="sku">SKU (Optional)</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Product SKU"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">PTR Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.ptrPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, ptrPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Branch Assignment</Label>
                  <div className="mt-2 space-y-2">
                    {branchesData.map((branch) => (
                      <div key={branch.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`form-${branch.id}`}
                          checked={formData.branchIds.includes(branch.id)}
                          onCheckedChange={(checked) => handleFormBranchToggle(branch.id, checked as boolean)}
                        />
                        <Label htmlFor={`form-${branch.id}`} className="text-sm cursor-pointer">
                          {branch.name} - {branch.address}
                        </Label>
                      </div>
                    ))}
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
                <Button onClick={handleSaveProduct} className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Product
                </Button>
              </div>
            )}
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