'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
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

interface Contractor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive'
  totalJobs: number
  completedJobs: number
  ongoingJobs: number
  pendingJobs: number
  totalRevenue: number
  rating: number
  joinDate: string
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

interface Job {
  id: string
  title: string
  contractorId: string
  status: 'complete' | 'ongoing' | 'pending'
  customer: string
  location: string
  startDate: string
  dueDate: string
  estimatedCost: number
  actualCost?: number
  estimatedHours: number
  actualHours?: number
  progress: number
  priority: 'high' | 'medium' | 'low'
  invoiceStatus: 'paid' | 'partial-paid' | 'pending' | 'overdue'
  approvalStatus: 'approved' | 'pending' | 'rejected'
  subJobs?: SubJob[]
}

const contractorsData: Contractor[] = [
  {
    id: 'CONT-001',
    name: 'John Carter',
    email: 'john@gmail.com',
    phone: '+1 415‑555‑0132',
    address: '1160 N Willow Dr Near Res.',
    status: 'active',
    totalJobs: 15,
    completedJobs: 12,
    ongoingJobs: 2,
    pendingJobs: 1,
    totalRevenue: 45000,
    rating: 4.8,
    joinDate: '2024-01-15'
  },
  {
    id: 'CONT-002',
    name: 'Sarah Johnson',
    email: 'sarah@contracting.com',
    phone: '+1 415‑555‑0133',
    address: '2805 Maplewood Cir E palladino',
    status: 'active',
    totalJobs: 8,
    completedJobs: 7,
    ongoingJobs: 1,
    pendingJobs: 0,
    totalRevenue: 32000,
    rating: 4.6,
    joinDate: '2024-03-20'
  },
  {
    id: 'CONT-003',
    name: 'Mike Wilson',
    email: 'mike@electrical.com',
    phone: '+1 415‑555‑0134',
    address: '6149 CR 13 Batzer Res.',
    status: 'active',
    totalJobs: 22,
    completedJobs: 18,
    ongoingJobs: 3,
    pendingJobs: 1,
    totalRevenue: 68000,
    rating: 4.9,
    joinDate: '2023-11-10'
  }
]

const jobsData: Job[] = [
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
            <p className="font-medium">{job.customer}</p>
            <p>{job.location}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Job Details:</h3>
          <div className="text-sm">
            <p><span className="font-medium">Job ID:</span> {job.id}</p>
            <p><span className="font-medium">Sub-Job:</span> {subJob.title}</p>
            <p><span className="font-medium">Contractor:</span> {contractor.name}</p>
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
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [selectedSubJob, setSelectedSubJob] = useState<string | null>(null)
  const [expandedContractors, setExpandedContractors] = useState<Set<string>>(new Set(['CONT-001']))
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set(['PH210_US_JDP']))
  const [expandedSubJobs, setExpandedSubJobs] = useState<Set<string>>(new Set(['SUB-004']))
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceSubJob, setInvoiceSubJob] = useState<SubJob | null>(null)

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
    window.print()
  }

  const handleDownloadInvoice = () => {
    // Implementation for PDF generation would go here
    console.log('Downloading invoice as PDF...')
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

  const selectedContractorData = selectedContractor ? contractorsData.find(c => c.id === selectedContractor) : null
  const selectedJobData = selectedJob ? jobsData.find(j => j.id === selectedJob) : null

  const SubJobDetails = ({ subJob }: { subJob: SubJob }) => {
    const isExpanded = expandedSubJobs.has(subJob.id)
    
    return (
      <Card className="mt-4 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
        <Collapsible open={isExpanded} onOpenChange={() => toggleSubJob(subJob.id)}>
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
                  <span>{subJob.actualHours || 0}h / {subJob.estimatedHours}h</span>
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
                  {subJob.orders.length > 0 ? (
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
                      <span className="font-medium">{subJob.actualHours || 0}h</span>
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
                        {subJob.staffAssigned.map((staff, index) => (
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
                  {subJob.transactions.length > 0 ? (
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
                  {subJob.timesheets.length > 0 ? (
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
                  {subJob.invoices.length > 0 ? (
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
            {contractorsData.map((contractor) => {
              const contractorJobs = jobsData.filter(job => job.contractorId === contractor.id)
              const isExpanded = expandedContractors.has(contractor.id)
              const isSelected = selectedContractor === contractor.id && !selectedJob

              return (
                <div key={contractor.id} className="mb-2">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleContractor(contractor.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start p-3 text-left h-auto hover:bg-primary/5 ${
                          isSelected ? 'bg-primary/10 shadow-sm border border-primary/20' : ''
                        }`}
                        onClick={() => selectContractor(contractor.id)}
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
                              <div className="font-medium text-gray-900">{contractor.name}</div>
                              <div className="text-xs text-gray-500">{contractor.totalJobs} jobs</div>
                            </div>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="ml-6 mt-1">
                      {contractorJobs.map((job) => {
                        const hasSubJobs = job.subJobs && job.subJobs.length > 0
                        const isJobExpanded = expandedJobs.has(job.id)
                        const isJobSelected = selectedJob === job.id && !selectedSubJob

                        return (
                          <div key={job.id} className="mb-1">
                            <div className="flex items-start">
                              <Minus className="h-4 w-4 text-primary/40 mt-2 mr-2" />
                              <div className="flex-1">
                                <Collapsible
                                  open={isJobExpanded}
                                  onOpenChange={() => toggleJob(job.id)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className={`w-full justify-start p-2 text-left h-auto text-sm hover:bg-primary/5 ${
                                        isJobSelected ? 'bg-primary/10 shadow-sm border border-primary/20' : ''
                                      }`}
                                      onClick={() => selectJob(job.id, contractor.id)}
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
                                              {job.title}
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
                                        const isSubJobSelected = selectedSubJob === subJob.id

                                        return (
                                          <div key={subJob.id} className="flex items-start mb-1">
                                            <Minus className="h-3 w-3 text-primary/30 mt-1.5 mr-2" />
                                            <Button
                                              variant="ghost"
                                              className={`flex-1 justify-start p-1.5 text-left h-auto text-xs hover:bg-primary/5 ${
                                                isSubJobSelected ? 'bg-primary/10 shadow-sm border border-primary/20' : ''
                                              }`}
                                              onClick={() => selectSubJob(subJob.id, job.id, contractor.id)}
                                            >
                                              <div className="flex items-center gap-2 w-full">
                                                {getStatusIcon(subJob.status)}
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-xs text-gray-700 truncate">
                                                    {subJob.title}
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    {subJob.progress}% • {subJob.actualHours || 0}h
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
      <div className="flex-1 bg-white overflow-auto">
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
                <Button className="bg-primary hover:bg-primary/90 gap-2">
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
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedJobData.progress} className="flex-1" />
                      <span className="text-sm font-medium text-primary">{selectedJobData.progress}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-medium">{selectedJobData.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium">{selectedJobData.location}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium">{formatDate(selectedJobData.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                    <p className="font-medium">{formatDate(selectedJobData.dueDate)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
                    <p className="font-medium text-primary">{formatCurrency(selectedJobData.estimatedCost)}</p>
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
                
                {selectedJobData.subJobs.map((subJob) => (
                  <SubJobDetails key={subJob.id} subJob={subJob} />
                ))}
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
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
            <Button onClick={handleSendInvoice} className="bg-primary hover:bg-primary/90">
              <Mail className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}