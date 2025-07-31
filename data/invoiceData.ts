import { Customer, Job, Invoice } from '../types/invoice'

export const customersData: Customer[] = [
  {
    id: 'CUST-001',
    name: 'ABC Corporation',
    email: 'billing@abccorp.com',
    phone: '(555) 123-4567',
    address: '1160 N Willow Dr Near Res., New York, NY 10001'
  },
  {
    id: 'CUST-002',
    name: 'XYZ Company',
    email: 'accounts@xyzcompany.com',
    phone: '(555) 234-5678',
    address: '11613 W Shores RD NW Jursa Res., New York, NY 10002'
  },
  {
    id: 'CUST-003',
    name: 'DEF Industries',
    email: 'finance@defindustries.com',
    phone: '(555) 345-6789',
    address: '4211 Aiden Dr Frakes Res., New York, NY 10003'
  }
]

export const jobsData: Job[] = [
  {
    id: 'PH209_US_JDP',
    title: '1160 N Willow Dr Near Res.',
    customerId: 'CUST-001',
    customerName: 'ABC Corporation',
    location: '1160 N Willow Dr Near Res.',
    status: 'completed'
  },
  {
    id: 'PH210_US_JDP',
    title: '11613 W Shores RD NW Jursa Res.',
    customerId: 'CUST-002',
    customerName: 'XYZ Company',
    location: '11613 W Shores RD NW Jursa Res.',
    status: 'active'
  },
  {
    id: 'PH211_US_JDP',
    title: '4211 Aiden Dr Frakes Res.',
    customerId: 'CUST-003',
    customerName: 'DEF Industries',
    location: '4211 Aiden Dr Frakes Res.',
    status: 'pending'
  }
]

export const invoicesData: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2025-001',
    customerId: 'CUST-001',
    customerName: 'ABC Corporation',
    jobId: 'PH209_US_JDP',
    jobTitle: '1160 N Willow Dr Near Res.',
    type: 'final',
    issueDate: '2025-01-23',
    dueDate: '2025-02-07',
    items: [
      {
        id: 'ITEM-001',
        sku: 'ELC-PNL-200A',
        description: 'Main Electrical Panel 200A',
        quantity: 1,
        unitPrice: 450,
        total: 450
      },
      {
        id: 'ITEM-002',
        sku: 'CB-20A-10PK',
        description: 'Circuit Breakers 20A (10 Pack)',
        quantity: 1,
        unitPrice: 180,
        total: 180
      }
    ],
    labor: [
      {
        id: 'LAB-001',
        laborName: 'David Wilson',
        hours: 12,
        hourlyRate: 35,
        total: 420,
        description: 'Panel installation and testing'
      },
      {
        id: 'LAB-002',
        laborName: 'Tom Anderson',
        hours: 10,
        hourlyRate: 32,
        total: 320,
        description: 'Wiring assistance and cleanup'
      }
    ],
    additionalCosts: [
      { description: 'Transportation', amount: 50 },
      { description: 'Disposal Fee', amount: 25 }
    ],
    subtotal: 1445,
    taxRate: 0.08,
    taxAmount: 115.6,
    totalAmount: 1560.6,
    status: 'paid',
    notes: 'Payment received in full. Thank you for your business.',
    createdBy: 'John Smith',
    createdAt: '2025-01-23T10:30:00Z'
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2025-002',
    customerId: 'CUST-002',
    customerName: 'XYZ Company',
    jobId: 'PH210_US_JDP',
    jobTitle: '11613 W Shores RD NW Jursa Res.',
    type: 'progressive',
    issueDate: '2025-01-25',
    dueDate: '2025-02-10',
    items: [
      {
        id: 'ITEM-003',
        sku: 'MU-ADV-5000',
        description: 'Advanced Main Unit 5000W',
        quantity: 1,
        unitPrice: 2200,
        total: 2200
      }
    ],
    labor: [
      {
        id: 'LAB-003',
        laborName: 'Alex Turner',
        hours: 8,
        hourlyRate: 38,
        total: 304,
        description: 'Initial installation setup'
      }
    ],
    additionalCosts: [
      { description: 'Crane Rental', amount: 200 }
    ],
    subtotal: 2704,
    taxRate: 0.08,
    taxAmount: 216.32,
    totalAmount: 2920.32,
    status: 'sent',
    notes: 'Phase 1 completion - Main unit installation',
    createdBy: 'Mike Johnson',
    createdAt: '2025-01-25T14:15:00Z'
  },
  {
    id: 'INV-003',
    invoiceNumber: 'INV-2025-003',
    customerId: 'CUST-003',
    customerName: 'DEF Industries',
    jobId: 'PH211_US_JDP',
    jobTitle: '4211 Aiden Dr Frakes Res.',
    type: 'proposed',
    issueDate: '2025-01-20',
    dueDate: '2025-02-05',
    items: [
      {
        id: 'ITEM-004',
        sku: 'EST-PROJ-001',
        description: 'Project Estimation - Complete Installation',
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      }
    ],
    labor: [],
    additionalCosts: [],
    subtotal: 5000,
    taxRate: 0.08,
    taxAmount: 400,
    totalAmount: 5400,
    status: 'draft',
    notes: 'Proposed estimate for complete installation project',
    createdBy: 'Sarah Admin',
    createdAt: '2025-01-20T09:45:00Z'
  }
]