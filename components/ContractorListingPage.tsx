'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { JobDetailsPage } from './JobDetailsPage'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import { globalApiCall } from '../utils/globalApiHandler'
import { ArrowUpAZ, Edit, Trash2 } from 'lucide-react'
import { 
  ChevronDown, 
  ChevronRight,
  User,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Users,
  TrendingUp,
  Download,
  Send,
  Building,
  Circle,
  Minus,
  UserCheck,
  Target,
  CreditCard,
  Timer,
  Receipt,
  Activity,
  Settings,
  Package,
  ShoppingCart,
  Printer,
  Mail,
  Eye,
  Plus
} from 'lucide-react'

interface Job {
  id: number
  job_title: string
  job_type: string
  customer_id: number | null
  contractor_id: number
  description: string
  priority: string
  address: string
  city_zip: string
  phone: string | null
  email: string | null
  bill_to_address: string | null
  bill_to_city_zip: string | null
  bill_to_phone: string | null
  bill_to_email: string | null
  same_as_address: boolean
  due_date: string
  estimated_hours: number
  estimated_cost: number
  assigned_lead_labor_ids: string | null
  assigned_labor_ids: string | null
  assigned_material_ids: string | null
  status: string
  created_by: number
  system_ip: string | null
  created_at: string
  updated_at: string
  created_from: string
  total_work_time: string
  work_activity: number
  start_timer: string | null
  end_timer: string | null
  pause_timer: any[]
  labor_timesheets: any[]
  customer: any
  isMainJob: boolean
  isSubJob: boolean
  parentJobId: number | null
  parentAddress: string | null
  subJobs: Job[]
  progress: number
  totalSubJobs: number
  totalJobs: number
  completedSubJobs: number
  completedJobs: number
  totalEstimatedCost: number
  totalEstimatedHours: number
}

interface Contractor {
  id: number
  contractor_name: string
  company_name: string
  email: string
  phone: string
  status: string
  created_at: string
  jobs: Job[]
  total_jobs: number
  active_jobs: number
  completed_jobs: number
}

interface OrderItem {
  id: string
  sku: string
  name: string
  quantityOrdered: number
  quantityUsed: number
  unitPrice: number
  totalPrice: number
  supplier: string
  orderDate: string
  receivedDate?: string
  status: 'ordered' | 'received' | 'partial' | 'cancelled'
}

interface Transaction {
  id: string
  type: 'payment' | 'estimate' | 'invoice' | 'expense'
  description: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
}

interface TimesheetEntry {
  id: string
  laborName: string
  date: string
  hoursWorked: number
  hourlyRate: number
  totalAmount: number
  description: string
  approved: boolean
}

interface SubJobInvoice {
  id: string
  invoiceNumber: string
  type: 'proposed' | 'roughen' | 'progressive' | 'final'
  issueDate: string
  dueDate: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  customer: string
}

interface SubJob {
  id: string
  title: string
  status: 'complete' | 'ongoing' | 'pending'
  progress: number
  estimatedHours: number
  actualHours?: number
  estimatedCost: number
  actualCost?: number
  createdBy: string
  staffAssigned: string[]
  adminAssigned?: string
  leadLabour: string
  completedBy?: string
  completedDate?: string
  transactions: Transaction[]
  timesheets: TimesheetEntry[]
  description: string
  materials: string[]
  priority: 'high' | 'medium' | 'low'
  orders: OrderItem[]
  invoices: SubJobInvoice[]
}


// Sample data removed - using API data instead

// Sample jobs data removed - using API data instead
const jobsData: any[] = [
  {
    id: 'PH209_US_JDP',
    title: '1160 N Willow Dr Near Res.',
    contractorId: 'CONT-001',
    status: 'complete',
    customer: 'ABC Corporation',
    location: '1160 N Willow Dr Near Res.',
    startDate: '2025-01-10',
    dueDate: '2025-01-25',
    estimatedCost: 5000,
    actualCost: 4800,
    estimatedHours: 40,
    actualHours: 38,
    progress: 100,
    priority: 'high',
    invoiceStatus: 'paid',
    approvalStatus: 'approved',
    subJobs: [
      {
        id: 'SUB-001',
        title: 'Electrical Panel Installation',
        status: 'complete',
        progress: 100,
        estimatedHours: 20,
        actualHours: 18,
        estimatedCost: 2500,
        actualCost: 2400,
        createdBy: 'John Smith',
        staffAssigned: ['David Wilson', 'Tom Anderson'],
        adminAssigned: 'Sarah Admin',
        leadLabour: 'David Wilson',
        completedBy: 'David Wilson',
        completedDate: '2025-01-22',
        description: 'Complete installation of new electrical panel with upgraded breakers and safety features.',
        materials: ['Circuit Breakers', 'Electrical Panel', 'Copper Wire', 'Conduits'],
        priority: 'high',
        orders: [
          {
            id: 'ORD-001',
            sku: 'ELC-PNL-200A',
            name: 'Main Electrical Panel 200A',
            quantityOrdered: 1,
            quantityUsed: 1,
            unitPrice: 450,
            totalPrice: 450,
            supplier: 'ElectricPro Supply',
            orderDate: '2025-01-08',
            receivedDate: '2025-01-10',
            status: 'received'
          },
          {
            id: 'ORD-002',
            sku: 'CB-20A-10PK',
            name: 'Circuit Breakers 20A (10 Pack)',
            quantityOrdered: 2,
            quantityUsed: 1,
            unitPrice: 180,
            totalPrice: 360,
            supplier: 'ElectricPro Supply',
            orderDate: '2025-01-08',
            receivedDate: '2025-01-10',
            status: 'received'
          },
          {
            id: 'ORD-003',
            sku: 'CW-12AWG-500FT',
            name: 'Copper Wire 12 AWG (500 ft)',
            quantityOrdered: 3,
            quantityUsed: 2,
            unitPrice: 125,
            totalPrice: 375,
            supplier: 'ElectricPro Supply',
            orderDate: '2025-01-08',
            receivedDate: '2025-01-10',
            status: 'received'
          },
          {
            id: 'ORD-004',
            sku: 'CDT-PVC-1IN',
            name: 'PVC Conduit 1 inch (10 ft)',
            quantityOrdered: 15,
            quantityUsed: 12,
            unitPrice: 8,
            totalPrice: 120,
            supplier: 'BuildMart',
            orderDate: '2025-01-09',
            receivedDate: '2025-01-11',
            status: 'received'
          }
        ],
        invoices: [
          {
            id: 'INV-001',
            invoiceNumber: 'INV-2025-001',
            type: 'final',
            issueDate: '2025-01-23',
            dueDate: '2025-02-07',
            amount: 2400,
            status: 'paid',
            customer: 'ABC Corporation'
          }
        ],
        transactions: [
          {
            id: 'TXN-001',
            type: 'payment',
            description: 'Panel installation payment',
            amount: 2400,
            date: '2025-01-23',
            status: 'completed'
          },
          {
            id: 'TXN-002',
            type: 'estimate',
            description: 'Initial panel estimate',
            amount: 2500,
            date: '2025-01-10',
            status: 'completed'
          }
        ],
        timesheets: [
          {
            id: 'TS-001',
            laborName: 'David Wilson',
            date: '2025-01-20',
            hoursWorked: 8,
            hourlyRate: 35,
            totalAmount: 280,
            description: 'Panel installation setup',
            approved: true
          },
          {
            id: 'TS-002',
            laborName: 'Tom Anderson',
            date: '2025-01-20',
            hoursWorked: 6,
            hourlyRate: 32,
            totalAmount: 192,
            description: 'Wiring assistance',
            approved: true
          },
          {
            id: 'TS-003',
            laborName: 'David Wilson',
            date: '2025-01-21',
            hoursWorked: 4,
            hourlyRate: 35,
            totalAmount: 140,
            description: 'Final testing and cleanup',
            approved: true
          }
        ]
      },
      {
        id: 'SUB-002',
        title: 'Wiring & Circuit Setup',
        status: 'complete',
        progress: 100,
        estimatedHours: 20,
        actualHours: 20,
        estimatedCost: 2500,
        actualCost: 2400,
        createdBy: 'John Smith',
        staffAssigned: ['David Wilson', 'Tom Anderson'],
        adminAssigned: 'Sarah Admin',
        leadLabour: 'Tom Anderson',
        completedBy: 'Tom Anderson',
        completedDate: '2025-01-25',
        description: 'Complete wiring setup for all circuits with proper grounding and safety measures.',
        materials: ['ROMEX Cable', 'Outlets', 'Switches', 'Junction Boxes'],
        priority: 'medium',
        orders: [
          {
            id: 'ORD-005',
            sku: 'RMX-14-250FT',
            name: 'ROMEX Cable 14 AWG (250 ft)',
            quantityOrdered: 4,
            quantityUsed: 4,
            unitPrice: 95,
            totalPrice: 380,
            supplier: 'ElectricPro Supply',
            orderDate: '2025-01-12',
            receivedDate: '2025-01-14',
            status: 'received'
          },
          {
            id: 'ORD-006',
            sku: 'OUT-STD-20PK',
            name: 'Standard Outlets (20 Pack)',
            quantityOrdered: 2,
            quantityUsed: 2,
            unitPrice: 85,
            totalPrice: 170,
            supplier: 'ElectricPro Supply',
            orderDate: '2025-01-12',
            receivedDate: '2025-01-14',
            status: 'received'
          },
          {
            id: 'ORD-007',
            sku: 'SW-SGL-15PK',
            name: 'Single Pole Switches (15 Pack)',
            quantityOrdered: 1,
            quantityUsed: 1,
            unitPrice: 60,
            totalPrice: 60,
            supplier: 'ElectricPro Supply',
            orderDate: '2025-01-12',
            receivedDate: '2025-01-14',
            status: 'received'
          },
          {
            id: 'ORD-008',
            sku: 'JB-4IN-25PK',
            name: 'Junction Boxes 4" (25 Pack)',
            quantityOrdered: 1,
            quantityUsed: 1,
            unitPrice: 45,
            totalPrice: 45,
            supplier: 'BuildMart',
            orderDate: '2025-01-13',
            receivedDate: '2025-01-15',
            status: 'received'
          }
        ],
        invoices: [
          {
            id: 'INV-002',
            invoiceNumber: 'INV-2025-002',
            type: 'final',
            issueDate: '2025-01-26',
            dueDate: '2025-02-10',
            amount: 2400,
            status: 'paid',
            customer: 'ABC Corporation'
          }
        ],
        transactions: [
          {
            id: 'TXN-003',
            type: 'payment',
            description: 'Wiring completion payment',
            amount: 2400,
            date: '2025-01-26',
            status: 'completed'
          }
        ],
        timesheets: [
          {
            id: 'TS-004',
            laborName: 'Tom Anderson',
            date: '2025-01-22',
            hoursWorked: 8,
            hourlyRate: 32,
            totalAmount: 256,
            description: 'Circuit wiring installation',
            approved: true
          },
          {
            id: 'TS-005',
            laborName: 'David Wilson',
            date: '2025-01-23',
            hoursWorked: 8,
            hourlyRate: 35,
            totalAmount: 280,
            description: 'Outlet and switch installation',
            approved: true
          },
          {
            id: 'TS-006',
            laborName: 'Tom Anderson',
            date: '2025-01-24',
            hoursWorked: 4,
            hourlyRate: 32,
            totalAmount: 128,
            description: 'Final testing and documentation',
            approved: true
          }
        ]
      }
    ]
  },
  {
    id: 'PH210_US_JDP',
    title: '11613 W Shores RD NW Jursa Res.',
    contractorId: 'CONT-001',
    status: 'ongoing',
    customer: 'XYZ Company',
    location: '11613 W Shores RD NW Jursa Res.',
    startDate: '2025-01-15',
    dueDate: '2025-02-15',
    estimatedCost: 7500,
    estimatedHours: 60,
    actualHours: 25,
    progress: 45,
    priority: 'medium',
    invoiceStatus: 'partial-paid',
    approvalStatus: 'approved',
    subJobs: [
      {
        id: 'SUB-003',
        title: 'Site Preparation',
        status: 'complete',
        progress: 100,
        estimatedHours: 15,
        actualHours: 12,
        estimatedCost: 1500,
        actualCost: 1200,
        createdBy: 'Mike Johnson',
        staffAssigned: ['Robert Davis', 'Carlos Martinez'],
        adminAssigned: 'John Admin',
        leadLabour: 'Robert Davis',
        completedBy: 'Robert Davis',
        completedDate: '2025-01-18',
        description: 'Site preparation including excavation, utility marking, and material staging.',
        materials: ['Sand', 'Gravel', 'Marking Flags', 'Safety Barriers'],
        priority: 'high',
        orders: [
          {
            id: 'ORD-009',
            sku: 'SND-FNE-5YD',
            name: 'Fine Sand (5 Cubic Yards)',
            quantityOrdered: 1,
            quantityUsed: 1,
            unitPrice: 150,
            totalPrice: 150,
            supplier: 'BuildMart',
            orderDate: '2025-01-13',
            receivedDate: '2025-01-15',
            status: 'received'
          },
          {
            id: 'ORD-010',
            sku: 'GRV-PEA-3YD',
            name: 'Pea Gravel (3 Cubic Yards)',
            quantityOrdered: 1,
            quantityUsed: 1,
            unitPrice: 120,
            totalPrice: 120,
            supplier: 'BuildMart',
            orderDate: '2025-01-13',
            receivedDate: '2025-01-15',
            status: 'received'
          }
        ],
        invoices: [
          {
            id: 'INV-003',
            invoiceNumber: 'INV-2025-003',
            type: 'final',
            issueDate: '2025-01-19',
            dueDate: '2025-02-03',
            amount: 1200,
            status: 'paid',
            customer: 'XYZ Company'
          }
        ],
        transactions: [
          {
            id: 'TXN-004',
            type: 'payment',
            description: 'Site prep completion',
            amount: 1200,
            date: '2025-01-19',
            status: 'completed'
          }
        ],
        timesheets: [
          {
            id: 'TS-007',
            laborName: 'Robert Davis',
            date: '2025-01-16',
            hoursWorked: 8,
            hourlyRate: 30,
            totalAmount: 240,
            description: 'Excavation and site clearing',
            approved: true
          },
          {
            id: 'TS-008',
            laborName: 'Carlos Martinez',
            date: '2025-01-17',
            hoursWorked: 4,
            hourlyRate: 28,
            totalAmount: 112,
            description: 'Material staging and setup',
            approved: true
          }
        ]
      },
      {
        id: 'SUB-004',
        title: 'Main Installation',
        status: 'ongoing',
        progress: 60,
        estimatedHours: 30,
        actualHours: 13,
        estimatedCost: 4500,
        actualCost: 2800,
        createdBy: 'Mike Johnson',
        staffAssigned: ['Robert Davis', 'Carlos Martinez', 'Alex Turner'],
        adminAssigned: 'John Admin',
        leadLabour: 'Alex Turner',
        description: 'Main system installation with advanced configuration and testing protocols.',
        materials: ['Main Unit', 'Control Panels', 'Sensors', 'Cables'],
        priority: 'high',
        orders: [
          {
            id: 'ORD-011',
            sku: 'MU-ADV-5000',
            name: 'Advanced Main Unit 5000W',
            quantityOrdered: 1,
            quantityUsed: 0,
            unitPrice: 2200,
            totalPrice: 2200,
            supplier: 'TechPro Solutions',
            orderDate: '2025-01-18',
            receivedDate: '2025-01-20',
            status: 'received'
          },
          {
            id: 'ORD-012',
            sku: 'CP-DIG-TRIO',
            name: 'Digital Control Panel (3 Pack)',
            quantityOrdered: 1,
            quantityUsed: 0,
            unitPrice: 450,
            totalPrice: 450,
            supplier: 'TechPro Solutions',
            orderDate: '2025-01-18',
            receivedDate: '2025-01-20',
            status: 'received'
          },
          {
            id: 'ORD-013',
            sku: 'SNS-TEMP-10PK',
            name: 'Temperature Sensors (10 Pack)',
            quantityOrdered: 2,
            quantityUsed: 1,
            unitPrice: 180,
            totalPrice: 360,
            supplier: 'TechPro Solutions',
            orderDate: '2025-01-18',
            receivedDate: '2025-01-20',
            status: 'received'
          }
        ],
        invoices: [
          {
            id: 'INV-004',
            invoiceNumber: 'INV-2025-004',
            type: 'progressive',
            issueDate: '2025-01-25',
            dueDate: '2025-02-10',
            amount: 1800,
            status: 'sent',
            customer: 'XYZ Company'
          }
        ],
        transactions: [
          {
            id: 'TXN-005',
            type: 'invoice',
            description: 'Partial invoice for materials',
            amount: 2000,
            date: '2025-01-20',
            status: 'pending'
          },
          {
            id: 'TXN-006',
            type: 'expense',
            description: 'Additional materials cost',
            amount: 500,
            date: '2025-01-22',
            status: 'completed'
          }
        ],
        timesheets: [
          {
            id: 'TS-009',
            laborName: 'Alex Turner',
            date: '2025-01-20',
            hoursWorked: 8,
            hourlyRate: 38,
            totalAmount: 304,
            description: 'Main unit installation',
            approved: false
          },
          {
            id: 'TS-010',
            laborName: 'Carlos Martinez',
            date: '2025-01-21',
            hoursWorked: 5,
            hourlyRate: 28,
            totalAmount: 140,
            description: 'Control panel setup',
            approved: false
          }
        ]
      },
      {
        id: 'SUB-005',
        title: 'Final Testing',
        status: 'pending',
        progress: 0,
        estimatedHours: 15,
        estimatedCost: 1500,
        createdBy: 'Mike Johnson',
        staffAssigned: ['Alex Turner', 'Robert Davis'],
        adminAssigned: 'John Admin',
        leadLabour: 'Alex Turner',
        description: 'Comprehensive testing of all systems, documentation, and client handover.',
        materials: ['Testing Equipment', 'Documentation Forms', 'Calibration Tools'],
        priority: 'medium',
        orders: [
          {
            id: 'ORD-014',
            sku: 'TST-KIT-PRO',
            name: 'Professional Testing Kit',
            quantityOrdered: 1,
            quantityUsed: 0,
            unitPrice: 350,
            totalPrice: 350,
            supplier: 'TechPro Solutions',
            orderDate: '2025-01-20',
            status: 'ordered'
          }
        ],
        invoices: [],
        transactions: [],
        timesheets: []
      }
    ]
  }
]

// Invoice Template Component
const InvoiceTemplate = ({ subJob, job, contractor }: { subJob: SubJob, job: Job, contractor: Contractor }) => {
  const totalMaterialCost = subJob.orders.reduce((sum, order) => sum + (order.unitPrice * order.quantityUsed), 0)
  const totalLaborCost = subJob.timesheets.reduce((sum, timesheet) => sum + timesheet.totalAmount, 0)
  const subtotal = totalMaterialCost + totalLaborCost
  const taxRate = 0.08 // 8% tax
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + taxAmount

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
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
          <div className="text-sm text-muted-foreground">
            <p>Invoice #: {subJob.invoices[0]?.invoiceNumber || `INV-${subJob.id}`}</p>
            <p>Issue Date: {formatDate(subJob.invoices[0]?.issueDate || new Date().toISOString())}</p>
            <p>Due Date: {formatDate(subJob.invoices[0]?.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold mb-2">JDP Corporation</h2>
          <div className="text-sm text-muted-foreground">
            <p>1234 Business Street</p>
            <p>City, State 12345</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: billing@jdpcorp.com</p>
          </div>
        </div>
      </div>

      {/* Bill To & Job Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <div className="text-sm">
            <p className="font-medium">{job.customer?.customer_name || job.customer?.company_name || 'N/A'}</p>
            <p>{job.address}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Job Details:</h3>
          <div className="text-sm">
            <p><span className="font-medium">Job ID:</span> {job.id}</p>
            <p><span className="font-medium">Sub-Job:</span> {subJob.title}</p>
            <p><span className="font-medium">Contractor:</span> {contractor.contractor_name}</p>
            <p><span className="font-medium">Completion Date:</span> {subJob.completedDate ? formatDate(subJob.completedDate) : 'In Progress'}</p>
          </div>
        </div>
      </div>

      {/* Materials Used */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Materials Used</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Qty Used</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subJob.orders.filter(order => order.quantityUsed > 0).map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.sku}</TableCell>
                <TableCell>{order.name}</TableCell>
                <TableCell>{order.quantityUsed}</TableCell>
                <TableCell>{formatCurrency(order.unitPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(order.unitPrice * order.quantityUsed)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Labor Costs */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Labor</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Labor Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subJob.timesheets.filter(ts => ts.approved).map((timesheet) => (
              <TableRow key={timesheet.id}>
                <TableCell>{timesheet.laborName}</TableCell>
                <TableCell>{formatDate(timesheet.date)}</TableCell>
                <TableCell>{timesheet.hoursWorked}h</TableCell>
                <TableCell>{formatCurrency(timesheet.hourlyRate)}/h</TableCell>
                <TableCell className="text-right">{formatCurrency(timesheet.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Summary */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Materials Subtotal:</span>
              <span>{formatCurrency(totalMaterialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Subtotal:</span>
              <span>{formatCurrency(totalLaborCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount:</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2">Payment Terms:</h4>
        <p>Payment is due within 14 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.</p>
        <p className="mt-2">Thank you for your business!</p>
      </div>
    </div>
  )
}

export function ContractorListingPage() {
  const router = useRouter()
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [selectedSubJob, setSelectedSubJob] = useState<string | null>(null)
  const [expandedContractors, setExpandedContractors] = useState<Set<string>>(new Set(['CONT-001']))
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set(['PH210_US_JDP']))
  const [expandedSubJobs, setExpandedSubJobs] = useState<Set<string>>(new Set(['SUB-004']))
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceSubJob, setInvoiceSubJob] = useState<SubJob | null>(null)
  
  // Create Contract Modal State
  const [showCreateContractModal, setShowCreateContractModal] = useState(false)
  const [contractFormData, setContractFormData] = useState({
    contractor_name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
    company_name: '',
    status: 'active'
  })
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Contractor Listing State
  const [contractors, setContractors] = useState<any[]>([])
  const [totalContractors, setTotalContractors] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isLoadingContractors, setIsLoadingContractors] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Edit contractor state
  const [editingContractor, setEditingContractor] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)

  // Delete contractor state
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [contractorToDelete, setContractorToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch contractors data
  const fetchContractorsData = async () => {
    try {
      setIsLoadingContractors(true)
      
      const response = await globalApiCall(`${apiBaseUrl}/contractor/getContractors?include_jobs=true&page=${currentPage}&limit=${itemsPerPage}`, {
        method: 'GET'
      })

      const responseData = await response.json()
      console.log('Contractors with Jobs API Response:', responseData)

      if (responseData.success && responseData.data) {
        setContractors(responseData.data.contractors || [])
        setTotalContractors(responseData.data.pagination?.total || 0)
      } else {
        console.error('Invalid contractors API response structure:', responseData)
        setContractors([])
        setTotalContractors(0)
      }
    } catch (error) {
      console.error('Error fetching contractors:', error)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setContractors([])
        setTotalContractors(0)
      }
    } finally {
      setIsLoadingContractors(false)
    }
  }

  // Filter and sort contractors (client-side for search and status filter)
  const filteredContractors = contractors
    .filter(contractor => {
      const matchesSearch = contractor.contractor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contractor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contractor.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || contractor.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (!sortBy) return 0
      
      const aValue = a[sortBy] || ''
      const bValue = b[sortBy] || ''
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString())
      } else {
        return bValue.toString().localeCompare(aValue.toString())
      }
    })

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Pagination - use API pagination
  const totalPages = Math.ceil(totalContractors / itemsPerPage)
  const displayContractors = filteredContractors

  // Fetch contractor by ID for editing
  const fetchContractorById = async (contractorId: string) => {
    try {
      const response = await globalApiCall(`${apiBaseUrl}/contractor/getContractorById/${contractorId}`, {
        method: 'GET'
      })

      const responseData = await response.json()
      console.log('Get Contractor by ID API Response:', responseData)

      if (responseData.success && responseData.data) {
        const contractorData = responseData.data
        setContractFormData({
          contractor_name: contractorData.contractor_name || '',
          email: contractorData.email || '',
          phone: contractorData.phone || '',
          address: contractorData.address || '',
          note: '',
          company_name: contractorData.company_name || '',
          status: contractorData.status || 'active'
        })
        setEditingContractor(contractorData)
        setIsEditMode(true)
        setShowCreateContractModal(true)
      } else {
        toast.error(responseData.message || 'Failed to fetch contractor data')
      }
    } catch (error) {
      console.error('Error fetching contractor by ID:', error)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        toast.error('Failed to fetch contractor data')
      }
    }
  }

  // Handle edit contractor
  const handleEditContractor = (contractorId: string) => {
    fetchContractorById(contractorId)
  }

  // Handle view contractor
  const handleViewContractor = (contractorId: string) => {
    fetchContractorById(contractorId)
    setIsViewMode(true)
    setIsEditMode(false)
  }

  // Handle switch from view to edit mode
  const handleSwitchToEdit = () => {
    setIsViewMode(false)
    setIsEditMode(true)
  }

  // Handle delete contractor
  const handleDeleteContractor = (contractor: any) => {
    setContractorToDelete(contractor)
    setShowDeleteAlert(true)
  }

  // Confirm delete contractor
  const confirmDeleteContractor = async () => {
    if (!contractorToDelete) return

    setIsDeleting(true)
    try { 
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/contractor/deleteContractor/${contractorToDelete.id}`, {
        method: 'DELETE',
        headers
      });
      const responseData = await response.json()
      console.log('Delete Contractor API Response:', responseData)

      if (responseData.success) {
        toast.success('Contractor deleted successfully!')
        setShowDeleteAlert(false)
        setContractorToDelete(null)
        // Refresh contractors list
        await fetchContractorsData()
      } else {
        toast.error(responseData.message || 'Failed to delete contractor')
      }
    } catch (error) {
      console.error('Error deleting contractor:', error)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        toast.error('Failed to delete contractor. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Fetch data on component mount and page changes
  useEffect(() => {
    fetchContractorsData()
  }, [currentPage])

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!contractFormData.contractor_name.trim()) {
      errors.contractor_name = 'Contractor name is required'
    }
    
    if (!contractFormData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractFormData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!contractFormData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(contractFormData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number must be exactly 10 digits'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Clear validation error for specific field
  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setContractFormData(prev => ({
      ...prev,
      [field]: value
    }))
    clearValidationError(field)
  }

  // Handle form submission
  const handleCreateContract = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Get system IP
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      const system_ip = ipData.ip

      // Prepare payload
      const payload = {
        contractor_name: contractFormData.contractor_name,
        company_name: contractFormData.company_name,
        email: contractFormData.email.toLowerCase(),
        phone: contractFormData.phone,
        address: contractFormData.address,
        status: contractFormData.status,
        system_ip: system_ip
      }

      // Call API - Create or Update
      const apiUrl = isEditMode 
        ? `${apiBaseUrl}/contractor/updateContractor/${editingContractor.id}`
        : `${apiBaseUrl}/contractor/createContractor`
      
      const response = await globalApiCall(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()
      console.log('Create Contractor API Response:', responseData)

      if (responseData.success) {
        const successMessage = isEditMode ? 'Contractor updated successfully!' : 'Contractor created successfully!'
        toast.success(successMessage)
        setShowCreateContractModal(false)
        
        // Reset form and edit state
        setContractFormData({
          contractor_name: '',
          email: '',
          phone: '',
          address: '',
          note: '',
          company_name: '',
          status: 'active'
        })
        setValidationErrors({})
        setEditingContractor(null)
        setIsEditMode(false)
        // Refresh contractors list
        await fetchContractorsData()
      } else {
        const errorMessage = isEditMode ? 'Failed to update contractor' : 'Failed to create contractor'
        toast.error(responseData.message || errorMessage)
      }
    } catch (error) {
      console.error('Error creating contractor:', error)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        toast.error('Failed to create contractor. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowCreateContractModal(false)
    setContractFormData({
      contractor_name: '',
      email: '',
      phone: '',
      address: '',
      note: '',
      company_name: '',
      status: 'active'
    })
    setValidationErrors({})
    setEditingContractor(null)
    setIsEditMode(false)
    setIsViewMode(false)
  }

  const toggleContractor = (contractorId: string) => {
    const newExpanded = new Set(expandedContractors)
    if (newExpanded.has(contractorId)) {
      newExpanded.delete(contractorId)
    } else {
      newExpanded.add(contractorId)
    }
    setExpandedContractors(newExpanded)
    
    if (!newExpanded.has(contractorId) && selectedContractor === contractorId) {
      setSelectedContractor(null)
      setSelectedJob(null)
      setSelectedSubJob(null)
    }
  }

  const toggleJob = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  const toggleSubJob = (subJobId: string) => {
    const newExpanded = new Set(expandedSubJobs)
    if (newExpanded.has(subJobId)) {
      newExpanded.delete(subJobId)
    } else {
      newExpanded.add(subJobId)
    }
    setExpandedSubJobs(newExpanded)
  }

  const selectContractor = (contractorId: string) => {
    setSelectedContractor(contractorId)
    setSelectedJob(null)
    setSelectedSubJob(null)
    if (!expandedContractors.has(contractorId)) {
      toggleContractor(contractorId)
    }
  }

  const selectJob = (jobId: string, contractorId: string) => {
    setSelectedContractor(contractorId)
    setSelectedJob(jobId)
    setSelectedSubJob(null)
  }

  const selectSubJob = (subJobId: string, jobId: string, contractorId: string) => {
    setSelectedContractor(contractorId)
    setSelectedJob(jobId)
    setSelectedSubJob(subJobId)
  }

  const handleGenerateInvoice = (subJob: SubJob) => {
    setInvoiceSubJob(subJob)
    setShowInvoiceModal(true)
  }

  const handlePrintInvoice = () => {
    if (!invoiceSubJob || !selectedJobData || !selectedContractorData) {
      toast.error('Invoice data not available')
      return
    }

    try {
      // First try to open a new window
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow) {
        // If popup is blocked, use alternative method
        toast.error('Popup blocked. Using alternative print method...')
        handlePrintInvoiceAlternative()
        return
      }

      // Generate the HTML content for printing
      const printContent = generateInvoiceHTML(invoiceSubJob, selectedJobData, selectedContractorData)
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${invoiceSubJob.invoices[0]?.invoiceNumber || `INV-${invoiceSubJob.id}`}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              background: white;
              padding: 20px;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
            }
            
            .invoice-details {
              font-size: 10px;
              color: #666;
            }
            
            .company-info {
              text-align: right;
              font-size: 12px;
            }
            
            .company-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .invoice-body {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            
            .bill-to, .job-details {
              flex: 1;
            }
            
            .section-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
            }
            
            .section-content {
              font-size: 10px;
              line-height: 1.5;
            }
            
            .materials-section, .labor-section {
              margin-bottom: 30px;
            }
            
            .section-heading {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 15px;
              color: #333;
            }
            
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .table th {
              background-color: #f3f4f6;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              font-size: 10px;
              border: 1px solid #e5e7eb;
            }
            
            .table td {
              padding: 6px 8px;
              font-size: 10px;
              border: 1px solid #e5e7eb;
            }
            
            .table .text-right {
              text-align: right;
            }
            
            .invoice-summary {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            
            .summary-box {
              background-color: #f3f4f6;
              padding: 15px;
              width: 300px;
              border: 1px solid #e5e7eb;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 10px;
            }
            
            .summary-total {
              font-weight: bold;
              font-size: 12px;
              color: #3b82f6;
              border-top: 1px solid #e5e7eb;
              padding-top: 5px;
              margin-top: 5px;
            }
            
            .payment-terms {
              font-size: 10px;
              color: #666;
              line-height: 1.5;
            }
            
            .payment-terms h4 {
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .invoice-container {
                max-width: none;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Wait for content to load, then print
      setTimeout(() => {
        try {
          printWindow.focus()
          printWindow.print()
          
          // Close window after a delay to allow printing
          setTimeout(() => {
            printWindow.close()
          }, 1000)
          
          toast.success('Print dialog opened successfully!')
        } catch (error) {
          console.error('Error in print timeout:', error)
          toast.error('Failed to open print dialog')
          printWindow.close()
        }
      }, 500)
    } catch (error) {
      console.error('Error printing invoice:', error)
      toast.error('Failed to print invoice. Please try again.')
    }
  }

  // Alternative print method using current window
  const handlePrintInvoiceAlternative = () => {
    if (!invoiceSubJob || !selectedJobData || !selectedContractorData) {
      toast.error('Invoice data not available')
      return
    }

    try {
      // Create a temporary div with print content
      const printContent = generateInvoiceHTML(invoiceSubJob, selectedJobData, selectedContractorData)
      
      // Create a temporary container
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = printContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      
      // Add print styles
      const printStyles = document.createElement('style')
      printStyles.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-invoice, .print-invoice * {
            visibility: visible;
          }
          .print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
        }
      `
      
      // Add classes and styles
      tempDiv.className = 'print-invoice'
      tempDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      tempDiv.style.fontSize = '12px'
      tempDiv.style.lineHeight = '1.4'
      tempDiv.style.color = '#333'
      tempDiv.style.background = 'white'
      tempDiv.style.padding = '20px'
      tempDiv.style.maxWidth = '800px'
      tempDiv.style.margin = '0 auto'
      
      // Add to document
      document.head.appendChild(printStyles)
      document.body.appendChild(tempDiv)
      
      // Print
      window.print()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(tempDiv)
        document.head.removeChild(printStyles)
      }, 1000)
      
      toast.success('Print dialog opened successfully!')
    } catch (error) {
      console.error('Error in alternative print method:', error)
      toast.error('Failed to print invoice. Please try again.')
    }
  }

  // Helper function to generate invoice HTML
  const generateInvoiceHTML = (subJob: SubJob, job: Job, contractor: Contractor) => {
    const totalMaterialCost = subJob.orders.reduce((sum, order) => sum + (order.unitPrice * order.quantityUsed), 0)
    const totalLaborCost = subJob.timesheets.reduce((sum, timesheet) => sum + timesheet.totalAmount, 0)
    const subtotal = totalMaterialCost + totalLaborCost
    const taxRate = 0.08
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

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
        month: 'long',
        day: 'numeric'
      })
    }

    return `
      <div class="invoice-container">
        <!-- Invoice Header -->
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-details">
              <div>Invoice #: ${subJob.invoices[0]?.invoiceNumber || `INV-${subJob.id}`}</div>
              <div>Issue Date: ${formatDate(subJob.invoices[0]?.issueDate || new Date().toISOString())}</div>
              <div>Due Date: ${formatDate(subJob.invoices[0]?.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())}</div>
            </div>
          </div>
          <div class="company-info">
            <div class="company-name">JDP Corporation</div>
            <div>1234 Business Street</div>
            <div>City, State 12345</div>
            <div>Phone: (555) 123-4567</div>
            <div>Email: billing@jdpcorp.com</div>
          </div>
        </div>

        <!-- Bill To & Job Details -->
        <div class="invoice-body">
          <div class="bill-to">
            <div class="section-title">Bill To:</div>
            <div class="section-content">
              <div>${job.customer?.customer_name || job.customer?.company_name || 'N/A'}</div>
              <div>${job.address}</div>
            </div>
          </div>
          <div class="job-details">
            <div class="section-title">Job Details:</div>
            <div class="section-content">
              <div>Job ID: ${job.id}</div>
              <div>Sub-Job: ${subJob.title}</div>
              <div>Contractor: ${contractor.contractor_name}</div>
              <div>Completion: ${subJob.completedDate ? formatDate(subJob.completedDate) : 'In Progress'}</div>
            </div>
          </div>
        </div>

        <!-- Materials Used -->
        <div class="materials-section">
          <div class="section-heading">Materials Used</div>
          <table class="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Qty Used</th>
                <th>Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${subJob.orders.filter(order => order.quantityUsed > 0).map(order => `
                <tr>
                  <td>${order.sku}</td>
                  <td>${order.name}</td>
                  <td>${order.quantityUsed}</td>
                  <td>${formatCurrency(order.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(order.unitPrice * order.quantityUsed)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Labor -->
        <div class="labor-section">
          <div class="section-heading">Labor</div>
          <table class="table">
            <thead>
              <tr>
                <th>Labor Name</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Rate</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${subJob.timesheets.filter(ts => ts.approved).map(timesheet => `
                <tr>
                  <td>${timesheet.laborName}</td>
                  <td>${formatDate(timesheet.date)}</td>
                  <td>${timesheet.hoursWorked}h</td>
                  <td>${formatCurrency(timesheet.hourlyRate)}/h</td>
                  <td class="text-right">${formatCurrency(timesheet.totalAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Invoice Summary -->
        <div class="invoice-summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Materials Subtotal:</span>
              <span>${formatCurrency(totalMaterialCost)}</span>
            </div>
            <div class="summary-row">
              <span>Labor Subtotal:</span>
              <span>${formatCurrency(totalLaborCost)}</span>
            </div>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Tax (8%):</span>
              <span>${formatCurrency(taxAmount)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Total Amount:</span>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <!-- Payment Terms -->
        <div class="payment-terms">
          <h4>Payment Terms:</h4>
          <p>Payment is due within 14 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    `
  }

  const handleDownloadInvoice = () => {
    if (!invoiceSubJob || !selectedJobData || !selectedContractorData) {
      toast.error('Invoice data not available')
      return
    }

    try {
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Set font
      pdf.setFont('helvetica')
      
      // Colors
      const primaryColor: [number, number, number] = [59, 130, 246] // Blue
      const textColor: [number, number, number] = [55, 65, 81] // Gray-700
      const lightGray: [number, number, number] = [243, 244, 246] // Gray-100
      
      let yPosition = 20
      
      // Header
      pdf.setFontSize(24)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.text('INVOICE', 20, yPosition)
      
      // Invoice details
      pdf.setFontSize(10)
      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      yPosition += 15
      pdf.text(`Invoice #: ${invoiceSubJob.invoices[0]?.invoiceNumber || `INV-${invoiceSubJob.id}`}`, 20, yPosition)
      yPosition += 5
      pdf.text(`Issue Date: ${formatDate(invoiceSubJob.invoices[0]?.issueDate || new Date().toISOString())}`, 20, yPosition)
      yPosition += 5
      pdf.text(`Due Date: ${formatDate(invoiceSubJob.invoices[0]?.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())}`, 20, yPosition)
      
      // Company details (right side)
      pdf.setFontSize(12)
      pdf.text('JDP Corporation', pageWidth - 20, 20, { align: 'right' })
      pdf.setFontSize(10)
      pdf.text('1234 Business Street', pageWidth - 20, 25, { align: 'right' })
      pdf.text('City, State 12345', pageWidth - 20, 30, { align: 'right' })
      pdf.text('Phone: (555) 123-4567', pageWidth - 20, 35, { align: 'right' })
      pdf.text('Email: billing@jdpcorp.com', pageWidth - 20, 40, { align: 'right' })
      
      yPosition = 60
      
      // Bill To section
      pdf.setFontSize(12)
      pdf.text('Bill To:', 20, yPosition)
      yPosition += 8
      pdf.setFontSize(10)
      pdf.text(selectedJobData.customer?.customer_name || selectedJobData.customer?.company_name || 'N/A', 20, yPosition)
      yPosition += 5
      pdf.text(selectedJobData.location, 20, yPosition)
      
      // Job Details section
      yPosition = 60
      pdf.setFontSize(12)
      pdf.text('Job Details:', pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 8
      pdf.setFontSize(10)
      pdf.text(`Job ID: ${selectedJobData.id}`, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 5
      pdf.text(`Sub-Job: ${invoiceSubJob.title}`, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 5
      pdf.text(`Contractor: ${selectedContractorData.name}`, pageWidth - 20, yPosition, { align: 'right' })
      yPosition += 5
      pdf.text(`Completion: ${invoiceSubJob.completedDate ? formatDate(invoiceSubJob.completedDate) : 'In Progress'}`, pageWidth - 20, yPosition, { align: 'right' })
      
      yPosition = 100
      
      // Materials Used section
      pdf.setFontSize(12)
      pdf.text('Materials Used', 20, yPosition)
      yPosition += 10
      
      // Table header
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
      pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F')
      pdf.setFontSize(10)
      pdf.text('SKU', 22, yPosition)
      pdf.text('Description', 50, yPosition)
      pdf.text('Qty Used', 120, yPosition)
      pdf.text('Unit Price', 140, yPosition)
      pdf.text('Total', pageWidth - 30, yPosition, { align: 'right' })
      yPosition += 8
      
      // Materials data
      const materialsUsed = invoiceSubJob.orders.filter(order => order.quantityUsed > 0)
      let totalMaterialCost = 0
      
      materialsUsed.forEach((order) => {
        const total = order.unitPrice * order.quantityUsed
        totalMaterialCost += total
        
        pdf.text(order.sku, 22, yPosition)
        pdf.text(order.name, 50, yPosition)
        pdf.text(order.quantityUsed.toString(), 120, yPosition)
        pdf.text(`$${order.unitPrice.toFixed(2)}`, 140, yPosition)
        pdf.text(`$${total.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' })
        yPosition += 6
        
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = 20
        }
      })
      
      yPosition += 10
      
      // Labor section
      pdf.setFontSize(12)
      pdf.text('Labor', 20, yPosition)
      yPosition += 10
      
      // Labor table header
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
      pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F')
      pdf.setFontSize(10)
      pdf.text('Labor Name', 22, yPosition)
      pdf.text('Date', 80, yPosition)
      pdf.text('Hours', 110, yPosition)
      pdf.text('Rate', 130, yPosition)
      pdf.text('Total', pageWidth - 30, yPosition, { align: 'right' })
      yPosition += 8
      
      // Labor data
      const approvedTimesheets = invoiceSubJob.timesheets.filter(ts => ts.approved)
      let totalLaborCost = 0
      
      approvedTimesheets.forEach((timesheet) => {
        totalLaborCost += timesheet.totalAmount
        
        pdf.text(timesheet.laborName, 22, yPosition)
        pdf.text(formatDate(timesheet.date), 80, yPosition)
        pdf.text(`${timesheet.hoursWorked}h`, 110, yPosition)
        pdf.text(`$${timesheet.hourlyRate.toFixed(2)}/h`, 130, yPosition)
        pdf.text(`$${timesheet.totalAmount.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' })
        yPosition += 6
        
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = 20
        }
      })
      
      yPosition += 20
      
      // Invoice summary
      const subtotal = totalMaterialCost + totalLaborCost
      const taxRate = 0.08
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount
      
      // Summary box
      const summaryWidth = 80
      const summaryX = pageWidth - summaryWidth - 20
      
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2])
      pdf.rect(summaryX, yPosition - 5, summaryWidth, 35, 'F')
      
      pdf.setFontSize(10)
      pdf.text('Materials Subtotal:', summaryX + 5, yPosition)
      pdf.text(`$${totalMaterialCost.toFixed(2)}`, summaryX + summaryWidth - 5, yPosition, { align: 'right' })
      yPosition += 6
      
      pdf.text('Labor Subtotal:', summaryX + 5, yPosition)
      pdf.text(`$${totalLaborCost.toFixed(2)}`, summaryX + summaryWidth - 5, yPosition, { align: 'right' })
      yPosition += 6
      
      pdf.text('Subtotal:', summaryX + 5, yPosition)
      pdf.text(`$${subtotal.toFixed(2)}`, summaryX + summaryWidth - 5, yPosition, { align: 'right' })
      yPosition += 6
      
      pdf.text('Tax (8%):', summaryX + 5, yPosition)
      pdf.text(`$${taxAmount.toFixed(2)}`, summaryX + summaryWidth - 5, yPosition, { align: 'right' })
      yPosition += 6
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Total Amount:', summaryX + 5, yPosition)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.text(`$${totalAmount.toFixed(2)}`, summaryX + summaryWidth - 5, yPosition, { align: 'right' })
      
      yPosition += 20
      
      // Payment terms
      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text('Payment Terms:', 20, yPosition)
      yPosition += 6
      pdf.text('Payment is due within 14 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.', 20, yPosition)
      yPosition += 6
      pdf.text('Thank you for your business!', 20, yPosition)
      
      // Generate filename
      const invoiceNumber = invoiceSubJob.invoices[0]?.invoiceNumber || `INV-${invoiceSubJob.id}`
      const filename = `${invoiceNumber}_${(selectedJobData.customer?.customer_name || selectedJobData.customer?.company_name || 'Customer').replace(/\s+/g, '_')}.pdf`
      
      // Download the PDF
      pdf.save(filename)
      
      toast.success('Invoice PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handleSendInvoice = () => {
    // Implementation for sending invoice via email would go here
    console.log('Sending invoice via email...')
  }

  const getStatusBadge = (status: string, type: 'job' | 'invoice' | 'approval' | 'transaction' | 'order' = 'job') => {
    const baseClasses = "text-xs font-medium"
    
    if (type === 'job') {
      switch (status) {
        case 'complete':
          return <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-100`}>Complete</Badge>
        case 'ongoing':
          return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100`}>Ongoing</Badge>
        case 'pending':
          return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100`}>Pending</Badge>
        default:
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100`}>{status}</Badge>
      }
    } else if (type === 'transaction') {
      switch (status) {
        case 'completed':
          return <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-100`}>Completed</Badge>
        case 'pending':
          return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100`}>Pending</Badge>
        case 'failed':
          return <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200 hover:bg-red-100`}>Failed</Badge>
        default:
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100`}>{status}</Badge>
      }
    } else if (type === 'order') {
      switch (status) {
        case 'received':
          return <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-100`}>Received</Badge>
        case 'ordered':
          return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100`}>Ordered</Badge>
        case 'partial':
          return <Badge className={`${baseClasses} bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100`}>Partial</Badge>
        case 'cancelled':
          return <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200 hover:bg-red-100`}>Cancelled</Badge>
        default:
          return <Badge className={`${baseClasses} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100`}>{status}</Badge>
      }
    }
    return <Badge className={`${baseClasses} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100`}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "text-xs font-medium"
    switch (priority) {
      case 'high':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200 hover:bg-red-100`}>High</Badge>
      case 'medium':
        return <Badge className={`${baseClasses} bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100`}>Medium</Badge>
      case 'low':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-100`}>Low</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100`}>{priority}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'ongoing':
        return <Activity className="h-3 w-3 text-blue-600" />
      case 'pending':
        return <Circle className="h-3 w-3 text-yellow-600" />
      default:
        return <Circle className="h-3 w-3 text-gray-400" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const selectedContractorData = selectedContractor ? contractors.find(c => c.id.toString() === selectedContractor) : null
  const selectedJobData = selectedJob ? selectedContractorData?.jobs.find((j: Job) => j.id.toString() === selectedJob) : null
  console.log(selectedJobData, 'selectedJobData')
  console.log(selectedContractorData, 'selectedContractorData')
  const SubJobDetails = ({ subJob }: { subJob: SubJob }) => {
    const isExpanded = expandedSubJobs.has(subJob.id.toString())
    
    return (
      <Card className="mt-4 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
        <Collapsible open={isExpanded} onOpenChange={() => toggleSubJob(subJob.id.toString())}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(subJob.status)}
                    <h4 className="font-medium text-foreground">{subJob.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(subJob.status)}
                    {getPriorityBadge(subJob.priority)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{subJob.progress}% Complete</span>
                  <span>0h / {subJob.estimatedHours}h</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Progress value={subJob.progress} className="flex-1 max-w-xs" />
                <span className="text-sm font-medium text-primary">{subJob.progress}%</span>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Description */}
              <div>
                <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Description
                </h5>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {subJob.description}
                </p>
              </div>

              {/* Orders/Materials Section */}
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                    Orders & Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subJob.orders && subJob.orders.length > 0 ? (
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Ordered</TableHead>
                            <TableHead>Used</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subJob.orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.sku}</TableCell>
                              <TableCell className="font-medium">{order.name}</TableCell>
                              <TableCell>{order.quantityOrdered}</TableCell>
                              <TableCell>
                                <span className={order.quantityUsed > 0 ? "font-medium text-green-600" : "text-muted-foreground"}>
                                  {order.quantityUsed}
                                </span>
                              </TableCell>
                              <TableCell>{formatCurrency(order.unitPrice)}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(order.unitPrice * order.quantityUsed)}
                              </TableCell>
                              <TableCell>{getStatusBadge(order.status, 'order')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Materials Cost:</span>
                        <span className="font-medium text-primary">
                          {formatCurrency(subJob.orders.reduce((sum, order) => sum + (order.unitPrice * order.quantityUsed), 0))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No orders recorded yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Estimation vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Estimation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Hours:</span>
                      <span className="font-medium">{subJob.estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                      <span className="font-medium text-primary">{formatCurrency(subJob.estimatedCost)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Actual Work Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Actual Hours:</span>
                      <span className="font-medium">0h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Actual Cost:</span>
                      <span className="font-medium text-green-600">
                        {subJob.actualCost ? formatCurrency(subJob.actualCost) : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress & Team */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Progress Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Progress:</span>
                        <span className="font-medium">{subJob.progress}%</span>
                      </div>
                      <Progress value={subJob.progress} className="w-full" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(subJob.status)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Team Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Lead Labour:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <UserCheck className="h-3 w-3 text-primary" />
                        <span className="font-medium">{subJob.leadLabour}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Staff Assigned:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {subJob.staffAssigned && subJob.staffAssigned.map((staff, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {staff}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Job Metadata */}
              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-600" />
                    Job Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Created By:</span>
                      <p className="font-medium">{subJob.createdBy}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Admin Assigned:</span>
                      <p className="font-medium">{subJob.adminAssigned || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Priority:</span>
                      <div className="mt-1">{getPriorityBadge(subJob.priority)}</div>
                    </div>
                    {subJob.completedBy && (
                      <div>
                        <span className="text-sm text-muted-foreground">Completed By:</span>
                        <p className="font-medium text-green-600">{subJob.completedBy}</p>
                        {subJob.completedDate && (
                          <p className="text-xs text-muted-foreground">on {formatDate(subJob.completedDate)}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Transactions */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Financial Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subJob.transactions && subJob.transactions.length > 0 ? (
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subJob.transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{transaction.description}</TableCell>
                              <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status, 'transaction')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No transactions recorded yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Labour Timesheet */}
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-600" />
                    Labour Timesheet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subJob.timesheets && subJob.timesheets.length > 0 ? (
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Labour Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subJob.timesheets.map((timesheet) => (
                            <TableRow key={timesheet.id}>
                              <TableCell className="font-medium">{timesheet.laborName}</TableCell>
                              <TableCell className="text-sm">{formatDate(timesheet.date)}</TableCell>
                              <TableCell>{timesheet.hoursWorked}h</TableCell>
                              <TableCell>{formatCurrency(timesheet.hourlyRate)}/h</TableCell>
                              <TableCell className="font-medium">{formatCurrency(timesheet.totalAmount)}</TableCell>
                              <TableCell>
                                {timesheet.approved ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Hours:</span>
                        <span className="font-medium">
                          {subJob.timesheets.reduce((sum, ts) => sum + ts.hoursWorked, 0)}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-medium text-primary">
                          {formatCurrency(subJob.timesheets.reduce((sum, ts) => sum + ts.totalAmount, 0))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No timesheet entries recorded yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Invoices */}
              <Card className="border-indigo-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-indigo-600" />
                      Invoices
                    </CardTitle>
                    <Button 
                      onClick={() => handleGenerateInvoice(subJob)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Generate Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {subJob.invoices && subJob.invoices.length > 0 ? (
                    <div className="space-y-3">
                      {subJob.invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Receipt className="h-4 w-4 text-indigo-600" />
                            <div>
                              <p className="font-medium">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(invoice.issueDate)} • Due: {formatDate(invoice.dueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                              {getStatusBadge(invoice.status, 'transaction')}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No invoices generated yet</p>
                      <Button 
                        onClick={() => handleGenerateInvoice(subJob)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create First Invoice
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Contractor Listings */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Contractors & Jobs</h2>
              <p className="text-sm text-gray-500">Select to view details</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <input 
            type="text" 
            placeholder="Search contractors or jobs..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
          />
        </div>

        {/* Contractor Listings */}
        <ScrollArea className="flex-1 bg-white">
          <div className="p-2">
            {contractors.map((contractor) => {
              const contractorJobs = contractor.jobs || []
              const isExpanded = expandedContractors.has(contractor.id.toString())
              const isSelected = selectedContractor === contractor.id.toString() && !selectedJob

              return (
                <div key={contractor.id} className="mb-2">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleContractor(contractor.id.toString())}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start p-3 text-left h-auto hover:bg-primary/5 ${
                          isSelected ? 'bg-primary/10 shadow-sm border border-primary/20' : ''
                        }`}
                        onClick={() => selectContractor(contractor.id.toString())}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-primary" />
                              )}
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{contractor.contractor_name}</div>
                              <div className="text-xs text-gray-500">{contractor.total_jobs} jobs</div>
                            </div>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="ml-6 mt-1">
                      {contractorJobs.map((job: Job) => {
                        const hasSubJobs = job.subJobs && job.subJobs.length > 0
                        const isJobExpanded = expandedJobs.has(job.id.toString())
                        const isJobSelected = selectedJob === job.id.toString() && !selectedSubJob

                        return (
                          <div key={job.id} className="mb-1">
                            <div className="flex items-start">
                              <Minus className="h-4 w-4 text-primary/40 mt-2 mr-2" />
                              <div className="flex-1">
                                <Collapsible
                                  open={isJobExpanded}
                                  onOpenChange={() => toggleJob(job.id.toString())}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className={`w-full justify-start p-2 text-left h-auto text-sm hover:bg-primary/5 ${
                                        isJobSelected ? 'bg-primary/10 shadow-sm border border-primary/20' : ''
                                      }`}
                                      onClick={() => selectJob(job.id.toString(), contractor.id.toString())}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                          {hasSubJobs && (
                                            isJobExpanded ? (
                                              <ChevronDown className="h-3 w-3 text-primary" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3 text-primary" />
                                            )
                                          )}
                                          {getStatusIcon(job.status)}
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-gray-800 truncate">
                                              {job.job_title}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {job.status} • {job.progress}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  </CollapsibleTrigger>

                                  {hasSubJobs && (
                                    <CollapsibleContent className="ml-4 mt-1">
                                      {job.subJobs?.map((subJob) => {
                                        const isSubJobSelected = selectedSubJob === subJob.id.toString()

                                        return (
                                          <div key={subJob.id} className="flex items-start mb-1">
                                            <Minus className="h-3 w-3 text-primary/30 mt-1.5 mr-2" />
                                            <Button
                                              variant="ghost"
                                              className={`flex-1 justify-start p-1.5 text-left h-auto text-xs hover:bg-primary/5 ${
                                                isSubJobSelected ? 'bg-primary/10 shadow-sm border border-primary/20' : ''
                                              }`}
                                              onClick={() => selectSubJob(subJob.id.toString(), job.id.toString(), contractor.id.toString())}
                                            >
                                              <div className="flex items-center gap-2 w-full">
                                                {getStatusIcon(subJob.status)}
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-xs text-gray-700 truncate">
                                                    {subJob.job_title}
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    {subJob.progress}% • 0h
                                                  </div>
                                                </div>
                                              </div>
                                            </Button>
                                          </div>
                                        )
                                      })}
                                    </CollapsibleContent>
                                  )}
                                </Collapsible>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Content - Job Details */}
      <div className="flex-1 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-end">
            <Button 
              className="gap-2 text-white" 
              onClick={() => setShowCreateContractModal(true)}
            >
              <Plus className="h-4 w-4" />
              Create Contract
            </Button>
          </div>
        </div>

        {/* Contractor Listing Table */}
        <div className="p-6 space-y-6">
           <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-medium text-gray-900">Contractors</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your contractors and their information</p>
            </div>
          </div>
 
          
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search contractors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => handleSort('contractor_name')}
                    className="gap-2"
                  >
                    <ArrowUpAZ className="h-4 w-4" />
                    A-Z
                  </Button>
                </div>
              </div>  
 
          <Card>
            <CardContent className="p-0">
              {isLoadingContractors ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading contractors...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contractor Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayContractors.length > 0 ? (
                        displayContractors.map((contractor) => (
                          <TableRow key={contractor.id}>
                            <TableCell className="font-medium">
                              {contractor.contractor_name}
                            </TableCell>
                            <TableCell>{contractor.company_name || '-'}</TableCell>
                            <TableCell>{contractor.email}</TableCell>
                            <TableCell>{contractor.phone}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              -
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  contractor.status === 'active' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }
                              >
                                {contractor.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewContractor(contractor.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditContractor(contractor.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteContractor(contractor)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="text-center">
                              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
                              <p className="text-gray-500">Get started by creating your first contractor.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
 
          {totalContractors > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalContractors)} of {totalContractors} contractors
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isLoadingContractors}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(totalContractors / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalContractors / itemsPerPage) || isLoadingContractors}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {selectedJobData && selectedContractorData ? (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-medium text-gray-900">
                  {selectedJobData.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Job Details • {selectedContractorData.name}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
                <Button className="bg-primary text-white hover:bg-primary/90 gap-2">
                  <Send className="h-4 w-4" />
                  Generate Invoice
                </Button>
              </div>
            </div>

            {/* Job Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Job Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {getStatusBadge(selectedJobData.status)}
                  </div>
                  {/* <div>
                    <p className="text-sm text-gray-600 mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedJobData.progress} className="flex-1" />
                      <span className="text-sm font-medium text-primary">{selectedJobData.progress}%</span>
                    </div>
                  </div> */}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Job Title</p>
                    <p className="font-medium">{selectedJobData.job_title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="font-medium">{selectedJobData.address}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium">{formatDate(selectedJobData.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                    <p className="font-medium">{formatDate(selectedJobData.due_date)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
                    <p className="font-medium text-primary">{formatCurrency(selectedJobData.estimated_cost)}</p>
                  </div>
                  {selectedJobData.actualCost && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Actual Cost</p>
                      <p className="font-medium text-green-600">{formatCurrency(selectedJobData.actualCost)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sub-Jobs Details */}
            {selectedJobData.subJobs && selectedJobData.subJobs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-medium text-gray-900">Sub-Jobs Details</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {selectedJobData.subJobs.length} Sub-Jobs
                  </Badge>
                </div>
                
                {selectedJobData.subJobs.map((subJob: Job) => {
                  // Ensure the subJob has the customer data properly structured
                  const jobWithCustomerData = {
                    ...subJob,
                    // CRITICAL: Ensure ID matches what we pass to JobDetailsPage
                    id: subJob.id.toString(),
                    // Map customer data to the format JobDetailsPage expects
                    customer: subJob.customer?.id?.toString() || subJob.customer_id?.toString(),
                    customerName: subJob.customer?.customer_name || subJob.customer?.company_name,
                    customerEmail: subJob.customer?.email,
                    contractor: subJob.contractor_id?.toString(),
                    // Map other fields that JobDetailsPage might expect
                    title: subJob.job_title,
                    type: subJob.job_type === 'contract_based' ? 'contract-based' : 'service-based',
                    location: subJob.address,
                    address: subJob.address,
                    cityZip: subJob.city_zip,
                    estimatedCost: subJob.estimated_cost,
                    estimatedHours: subJob.estimated_hours,
                    startDate: subJob.created_at,
                    dueDate: subJob.due_date,
                    priority: subJob.priority,
                    status: subJob.status,
                    progress: subJob.progress || 0
                  }
                  
                  const allJobs = [jobWithCustomerData]
                  
                  // Create a proper setJobs function that updates the contractor data
                  const handleSetJobs = (updatedJobs: any[]) => {
                    if (updatedJobs.length > 0) {
                      const updatedJob = updatedJobs[0]
                      // Update the contractor's jobs array with the updated job data
                      setContractors(prevContractors => 
                        prevContractors.map(contractor => {
                          if (contractor.id.toString() === selectedContractor) {
                            return {
                              ...contractor,
                              jobs: contractor.jobs.map((job: Job) => {
                                if (job.id.toString() === selectedJob) {
                                  return {
                                    ...job,
                                    subJobs: job.subJobs?.map((subJobItem: Job) => 
                                      subJobItem.id.toString() === updatedJob.id 
                                        ? { ...subJobItem, ...updatedJob }
                                        : subJobItem
                                    ) || []
                                  }
                                }
                                return job
                              })
                            }
                          }
                          return contractor
                        })
                      )
                    }
                  }
                  
                  return (
                    <JobDetailsPage 
                      key={subJob.id} 
                      jobId={subJob.id.toString()} 
                      onBack={() => setSelectedSubJob(null)}
                      jobs={allJobs} 
                      setJobs={handleSetJobs}
                    />
                  )
                })}
              </div>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job</h3>
              <p className="text-sm text-gray-500">Choose a contractor and job from the sidebar to view detailed information</p>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-6xl sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Sub-Job Invoice Preview
            </DialogTitle>
            <DialogDescription>
              Review and download the invoice for {invoiceSubJob?.title}
            </DialogDescription>
          </DialogHeader>
          
          {invoiceSubJob && selectedJobData && selectedContractorData && (
            <InvoiceTemplate 
              subJob={invoiceSubJob} 
              job={selectedJobData} 
              contractor={selectedContractorData} 
            />
          )}
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleSendInvoice} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Mail className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Contract Modal */}
      <Dialog open={showCreateContractModal} onOpenChange={setShowCreateContractModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"> 
              {isViewMode ? 'View Contractor' : isEditMode ? 'Edit Contractor' : 'Create New Contractor'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'View contractor information and details.' : isEditMode ? 'Update contractor information and status.' : 'Add a new contractor to the system with their contact information and status.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
            {/* Contractor Name */}
            <div className="space-y-2">
              <Label htmlFor="contractor_name" className="text-sm font-medium">
                Contractor Name *
              </Label>
              <Input
                id="contractor_name"
                value={contractFormData.contractor_name}
                onChange={(e) => handleInputChange('contractor_name', e.target.value)}
                placeholder="Enter contractor's name"
                disabled={isViewMode}
                className={validationErrors.contractor_name ? 'border-red-500 focus:border-red-500' : ''}
              />
              {validationErrors.contractor_name && (
                <p className="text-sm text-red-600">{validationErrors.contractor_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={contractFormData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={isViewMode}
                className={validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={contractFormData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter 10-digit phone number"
                disabled={isViewMode}
                className={validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>

            <div>
                  <Label className="mb-2" htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={contractFormData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    disabled={isViewMode}
                    className="mt-1"
                  />
                </div>
              </div>
            {/* address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
              Address
              </Label>
              <Textarea
                id="address"
                value={contractFormData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter contractor's address"
                disabled={isViewMode}
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={contractFormData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {isViewMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCloseModal}
                >
                  Close
                </Button>
                <Button 
                  onClick={handleSwitchToEdit}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Contractor
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateContract}
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      {isEditMode ? 'Update Contractor' : 'Create Contractor'}
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contractorToDelete?.contractor_name}</strong>? 
              This action cannot be undone and will permanently remove the contractor from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContractor}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Contractor'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}