export interface AdminProfile {
  id: string
  fullName: string
  email: string
  phone: string
  city: string
  state: string
  address: string
  profilePicture?: string
  joinDate: string
  lastLogin: string
  role: 'super_admin' | 'admin'
  status: 'active' | 'inactive'
}

export interface AdminStaffProfile {
  id: string
  // Personal Details
  legalName: string
  fullName: string
  printOnCheckAs: string
  socialSecurityNo: string
  mediaNo?: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  usStatus: 'online' | 'offline'
  disabilityDescription?: string
  dateOfJoining: string
  status: 'active' | 'inactive'
  
  // Contact Details
  email: string
  mainPhone: string
  altPhone?: string
  mobilePhone?: string
  faxNumber?: string
  ccMail?: string
  address: string
  city: string
  state: string
  zipCode: string
  website?: string
  otherInfo?: string
  
  // Employment Details
  hireDate: string
  originalHireDate: string
  adjustedServiceDate?: string
  employmentType: 'full_time' | 'part_time'
  jobTitle: string
  supervisor: string
  department: string
  targetBonus?: number
  description?: string
  
  // Permissions & Access
  permissions: {
    dashboard: { view: boolean; edit: boolean; update: boolean }
    products: { view: boolean; edit: boolean; update: boolean }
    orders: { view: boolean; edit: boolean; update: boolean }
    customers: { view: boolean; edit: boolean; update: boolean }
    analytics: { view: boolean; edit: boolean; update: boolean }
    invoices: { view: boolean; edit: boolean; update: boolean }
    staff: { view: boolean; edit: boolean; update: boolean }
    jobs: { view: boolean; edit: boolean; update: boolean }
  }
  
  // Profile Picture
  profilePicture?: string
}

export interface LabourLeadProfile {
  id: string
  // Personal Info
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  
  // Job Details
  department: string
  position: string
  dateOfJoining: string
  status: 'active' | 'inactive'
  supervisor: string
  employeeId: string
  
  // Documents
  documents: {
    idProof?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
    drivingLicense?: {
      fileName: string
      uploadDate: string
      fileUrl: string
      licenseNumber: string
      expiryDate: string
    }
    resume?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
  }
  
  // Permissions
  permissions: {
    createJob: boolean
    viewInventoryPrice: boolean
    invoiceSending: boolean
    updateBluesheet: boolean
    manageSubordinates: boolean
    approveTimesheets: boolean
  }
  
  profilePicture?: string
}

export interface SupplierProfile {
  id: string
  // Basic Info
  fullName: string
  email: string
  phoneNumber: string
  gender: 'male' | 'female' | 'other'
  address: string
  city: string
  state: string
  zipCode: string
  status: 'active' | 'inactive'
  
  // Business Details
  companyName: string
  gstVatNo: string
  website?: string
  businessContactNumber: string
  businessEmail?: string
  businessAddress?: string
  paymentTerms?: string
  creditLimit?: number
  
  // Documents
  documents: {
    idProof?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
    drivingLicense?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
    businessLicense?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
    gstCertificate?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
  }
  
  // Branch Locations
  branches: {
    id: string
    branchName: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string
    contactPerson: string
    email?: string
  }[]
  
  // Other Details
  notes?: string
  contractStartDate?: string
  contractEndDate?: string
  profilePicture?: string
}

export type ProfileType = 'admin' | 'staff' | 'labour_lead' | 'supplier'

export interface ProfilePermission {
  module: string
  view: boolean
  edit: boolean
  update: boolean
  delete?: boolean
}

export interface LeaveRecord {
  id: string
  date: string
  leaveType: 'full-day' | 'half-day' | 'sick' | 'casual' | 'emergency'
  reason: string
  status: 'approved' | 'pending' | 'rejected'
  approvedBy?: string
  appliedDate: string
  documents?: {
    fileName: string
    uploadDate: string
    fileUrl: string
  }[]
}

export interface TimesheetEntry {
  date: string
  inTime?: string
  outTime?: string
  hoursWorked: number
  isLeave: boolean
  isHoliday: boolean
  leaveType?: string
  notes?: string
  overtime?: number
}

export interface TimesheetSummary {
  totalWorkingDays: number
  totalLeavesTaken: number
  totalHolidays: number
  totalHoursWorked: number
  overtimeHours: number
}

export interface ExtendedPermissions {
  dashboard: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  products: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  orders: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  customers: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  analytics: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  invoices: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  staff: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  jobs: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  leaves: { view: boolean; edit: boolean; create: boolean; delete: boolean }
  inventory: { view: boolean; edit: boolean; create: boolean; delete: boolean }
}