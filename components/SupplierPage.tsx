import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package
} from 'lucide-react'

interface Supplier {
  id: string
  supplierId: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  category: string
  products: string[]
  paymentTerms: string
  rating: number
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
  totalOrders: number
  notes?: string
}

interface SupplierFormData {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  category: string
  products: string[]
  paymentTerms: string
  rating: number
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
  totalOrders: number
  notes: string
}

interface SupplierPageProps {
  onViewDetails?: (id: string) => void
}

const initialSupplierData: Supplier[] = [
  {
    id: 'SP001',
    supplierId: 'SP-2025-001',
    companyName: 'ElectroTech Supplies Pty Ltd',
    contactPerson: 'Jennifer Clarke',
    email: 'jennifer@electrotech.com.au',
    phone: '+61 2222 021 501',
    address: '45 Industrial Blvd, Sydney, NSW 2000, Australia',
    category: 'Electrical Components',
    products: ['Cables', 'Switches', 'Circuit Breakers', 'Conduits'],
    paymentTerms: 'Net 30',
    rating: 4.8,
    status: 'active',
    contractStart: '2024-01-15',
    contractEnd: '2025-12-31',
    totalOrders: 127,
    notes: 'Reliable supplier with excellent quality products and fast delivery.'
  },
  {
    id: 'SP002',
    supplierId: 'SP-2025-002',
    companyName: 'Power Components Australia',
    contactPerson: 'Mark Stevens',
    email: 'mark@powercomponents.com.au',
    phone: '+61 2222 021 502',
    address: '78 Commerce St, Melbourne, VIC 3000, Australia',
    category: 'Power Equipment',
    products: ['Transformers', 'Generators', 'Power Supplies', 'UPS Systems'],
    paymentTerms: 'Net 45',
    rating: 4.5,
    status: 'active',
    contractStart: '2023-06-01',
    contractEnd: '2025-05-31',
    totalOrders: 89,
    notes: 'Specialized in high-quality power equipment with competitive pricing.'
  },
  {
    id: 'SP003',
    supplierId: 'SP-2025-003',
    companyName: 'Safety First Equipment',
    contactPerson: 'Lisa Wong',
    email: 'lisa@safetyfirst.com.au',
    phone: '+61 2222 021 503',
    address: '156 Safety Ave, Brisbane, QLD 4000, Australia',
    category: 'Safety Equipment',
    products: ['Hard Hats', 'Safety Glasses', 'Gloves', 'Harnesses'],
    paymentTerms: 'Net 15',
    rating: 4.9,
    status: 'active',
    contractStart: '2024-03-10',
    contractEnd: '2026-03-09',
    totalOrders: 203,
    notes: 'Excellent safety equipment supplier with fast turnaround times.'
  }
]

const categories = [
  'Electrical Components',
  'Power Equipment',
  'Safety Equipment',
  'Tools & Instruments',
  'Lighting Solutions',
  'HVAC Systems',
  'Building Materials'
]

const paymentTermsOptions = [
  'Cash on Delivery',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  '2/10 Net 30'
]

const productOptions = [
  'Cables',
  'Switches',
  'Circuit Breakers',
  'Conduits',
  'Transformers',
  'Generators',
  'Power Supplies',
  'UPS Systems',
  'Hard Hats',
  'Safety Glasses',
  'Gloves',
  'Harnesses',
  'LED Lights',
  'Fixtures',
  'Panels'
]

export function SupplierPage({ onViewDetails }: SupplierPageProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSupplierData)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<SupplierFormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    products: [],
    paymentTerms: '',
    rating: 0,
    status: 'pending',
    contractStart: '',
    contractEnd: '',
    totalOrders: 0,
    notes: ''
  })

  const generateSupplierId = () => {
    const year = new Date().getFullYear()
    const count = suppliers.length + 1
    return `SP-${year}-${String(count).padStart(3, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            Inactive
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            Pending
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Suspended
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone.includes(searchTerm) ||
                         supplier.supplierId.includes(searchTerm)
    
    const matchesCategory = filterCategory === 'all' || supplier.category === filterCategory
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage)

  const handleCreate = () => {
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    const newSupplier: Supplier = {
      id: `SP${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      supplierId: generateSupplierId(),
      ...formData
    }

    setSuppliers([...suppliers, newSupplier])
    resetForm()
    setIsCreateDialogOpen(false)
    toast.success('Supplier created successfully')
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      category: supplier.category,
      products: supplier.products,
      paymentTerms: supplier.paymentTerms,
      rating: supplier.rating,
      status: supplier.status,
      contractStart: supplier.contractStart,
      contractEnd: supplier.contractEnd,
      totalOrders: supplier.totalOrders,
      notes: supplier.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingSupplier) return

    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    setSuppliers(suppliers.map(supplier => 
      supplier.id === editingSupplier.id 
        ? { ...supplier, ...formData }
        : supplier
    ))
    
    setIsEditDialogOpen(false)
    setEditingSupplier(null)
    resetForm()
    toast.success('Supplier updated successfully')
  }

  const handleDelete = (id: string) => {
    setSuppliers(suppliers.filter(supplier => supplier.id !== id))
    toast.success('Supplier deleted successfully')
  }

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      products: [],
      paymentTerms: '',
      rating: 0,
      status: 'pending',
      contractStart: '',
      contractEnd: '',
      totalOrders: 0,
      notes: ''
    })
  }

  const handleProductChange = (product: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, product]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p !== product)
      }))
    }
  }

  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          placeholder="Enter company name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supplierId">Supplier ID (Auto generated)</Label>
        <Input
          id="supplierId"
          value={generateSupplierId()}
          disabled
          className="bg-gray-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPerson">Contact Person *</Label>
        <Input
          id="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
          placeholder="Enter contact person name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Enter phone number"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder="Enter full address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({...formData, paymentTerms: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment terms" />
          </SelectTrigger>
          <SelectContent>
            {paymentTermsOptions.map((term) => (
              <SelectItem key={term} value={term}>{term}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'pending' | 'suspended') => setFormData({...formData, status: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rating">Rating (0-5)</Label>
        <Input
          id="rating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={formData.rating || ''}
          onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
          placeholder="Enter rating"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractStart">Contract Start</Label>
        <Input
          id="contractStart"
          type="date"
          value={formData.contractStart}
          onChange={(e) => setFormData({...formData, contractStart: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractEnd">Contract End</Label>
        <Input
          id="contractEnd"
          type="date"
          value={formData.contractEnd}
          onChange={(e) => setFormData({...formData, contractEnd: e.target.value})}
        />
      </div>
      
      <div className="col-span-2 space-y-2">
        <Label>Products/Services</Label>
        <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {productOptions.map((product) => (
            <div key={product} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`product-${product}`}
                checked={formData.products.includes(product)}
                onChange={(e) => handleProductChange(product, e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor={`product-${product}`} className="text-sm">{product}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2b2b2b]">Supplier Management</h2>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your suppliers and vendor relationships.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2">
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              {renderForm()}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-[#00A1FF] hover:bg-[#0090e6]">
                  Create Supplier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {suppliers.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <Star className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {suppliers.length > 0 ? (suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length).toFixed(1) : '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {suppliers.reduce((acc, s) => acc + s.totalOrders, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: {filteredSuppliers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Table */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">
                  <input type="checkbox" className="rounded border-white/30" />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Company</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Category</TableHead>
                <TableHead className="text-white font-medium">Rating</TableHead>
                <TableHead className="text-white font-medium">Orders</TableHead>
                <TableHead className="text-white font-medium">Payment Terms</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSuppliers.map((supplier, index) => (
                <TableRow key={supplier.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">#{supplier.supplierId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-[#2b2b2b]/80">{supplier.companyName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.address.split(',')[0]}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-[#2b2b2b]/80">{supplier.contactPerson}</div>
                      <div className="text-xs text-gray-500">{supplier.email}</div>
                      <div className="text-xs text-gray-500">{supplier.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{supplier.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getRatingStars(supplier.rating)}
                      <span className="text-xs text-gray-500 ml-1">{supplier.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{supplier.totalOrders}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{supplier.paymentTerms}</TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell>
                    <ActionButtonsPopup
                      onView={onViewDetails ? () => onViewDetails(supplier.id) : undefined}
                      onEdit={() => handleEdit(supplier)}
                      onDelete={() => handleDelete(supplier.id)}
                      itemName={supplier.companyName}
                      itemType="Supplier"
                      showView={!!onViewDetails}
                      showEdit={true}
                      showDelete={true}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-[#00A1FF] hover:bg-[#0090e6]" : ""}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-[#00A1FF] hover:bg-[#0090e6]">
              Update Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}