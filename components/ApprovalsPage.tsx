'use client'

import { Card, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { 
  ArrowLeft,
  FileText,
  Hourglass,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  RefreshCw,
  X
} from 'lucide-react'

const bluesheetData = [
  {
    id: 1,
    customer: 'ABC Corporation',
    contractor: 'Elite Electrical Services',
    job: 'Electrical Panel Installation',
    poNumber: 'PO-2025-001-EP',
    submittedBy: 'John Smith',
    date: 'Jan 20, 2025',
    amount: '$1,910',
    supplierInvoice: 'Pending',
    status: 'Pending',
    actions: ['review']
  },
  {
    id: 2,
    customer: 'XYZ Office Complex',
    contractor: 'Customer',
    job: 'Office Lighting Maintenance',
    poNumber: 'PO-2025-002-LM',
    submittedBy: 'Sarah Johnson',
    date: 'Jan 21, 2025',
    amount: '$680',
    supplierInvoice: 'Available',
    status: 'Pending',
    autoFetched: true,
    actions: ['review']
  },
  {
    id: 3,
    customer: 'Healthcare Center',
    contractor: 'PowerGen Solutions',
    job: 'Emergency Generator Setup',
    poNumber: 'PO-2025-003-GEN',
    submittedBy: 'Mike Rodriguez',
    date: 'Jan 19, 2025',
    amount: '$8,200',
    supplierInvoice: 'Available',
    status: 'Approved',
    statusBy: 'Jen Peacock',
    statusDate: 'Jan 23, 2025',
    autoFetched: true,
    actions: ['view', 'edit', 'update']
  },
  {
    id: 4,
    customer: 'Metro Shopping Center',
    contractor: 'ClimateControl Inc',
    job: 'HVAC System Repair',
    poNumber: 'PO-2025-004-HVAC',
    submittedBy: 'Lisa Chen',
    date: 'Jan 22, 2025',
    amount: '$960',
    supplierInvoice: 'Available',
    status: 'Approved',
    statusBy: 'Paul Wayde',
    statusDate: 'Jan 23, 2025',
    actions: ['view', 'edit', 'update']
  },
  {
    id: 5,
    customer: 'Downtown Office Building',
    contractor: 'PlumbPro Supply',
    job: 'Plumbing System Upgrade',
    poNumber: 'PO-2025-005-PLUMB',
    submittedBy: 'Robert Taylor',
    date: 'Jan 24, 2025',
    amount: '$1,450',
    supplierInvoice: 'Pending',
    status: 'Rejected',
    statusBy: 'Sarah Chen',
    statusDate: 'Jan 25, 2025',
    actions: ['view', 'edit', 'update']
  }
]

const getStatusChip = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function ApprovalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">BlueSheet Approvals</h2>
          <p className="text-sm text-muted-foreground">Review and approve material lists for invoice generation</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total BlueSheets</p><p className="text-2xl font-bold">5</p></div>
            <div className="p-3 bg-blue-100 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold">2</p></div>
            <div className="p-3 bg-yellow-100 rounded-lg"><Hourglass className="h-6 w-6 text-yellow-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold">2</p></div>
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Rejected</p><p className="text-2xl font-bold">1</p></div>
            <div className="p-3 bg-red-100 rounded-lg"><XCircle className="h-6 w-6 text-red-600" /></div>
          </CardContent>
        </Card>
      </div>

      {/* BlueSheets Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800 text-slate-50">
            <TableRow>
              <TableHead className="text-white">Customer/Contractor</TableHead>
              <TableHead className="text-white">Job Details</TableHead>
              <TableHead className="text-white">PO Number</TableHead>
              <TableHead className="text-white">Submitted By</TableHead>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Amount</TableHead>
              <TableHead className="text-white">Supplier Invoice</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bluesheetData.map((item) => (
              <TableRow key={item.id} className="odd:bg-white even:bg-slate-50">
                <TableCell>
                  <div className="font-medium">{item.customer}</div>
                  <div className="text-xs text-muted-foreground">{item.contractor}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.job}</div>
                  <div className="text-xs text-muted-foreground max-w-xs truncate">Material list and quantities for electrical panel installation</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{item.poNumber}</TableCell>
                <TableCell>{item.submittedBy}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell className="font-semibold">{item.amount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.supplierInvoice === 'Available' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.supplierInvoice}
                    </span>
                    {item.autoFetched && <span className="text-xs text-blue-600 font-semibold">Auto-fetched</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full text-center ${getStatusChip(item.status)}`}>
                      {item.status}
                    </span>
                    {item.statusBy && <span className="text-xs text-muted-foreground mt-1">by {item.statusBy}</span>}
                    {item.statusDate && <span className="text-xs text-muted-foreground">{item.statusDate}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.actions.includes('review') && <Button size="sm"><Eye className="mr-2 h-4 w-4" /> Review & Approve</Button>}
                    {item.actions.includes('view') && <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" /> View</Button>}
                    {item.actions.includes('edit') && <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>}
                    {item.actions.includes('update') && <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" /> Update</Button>}
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500"><X className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
