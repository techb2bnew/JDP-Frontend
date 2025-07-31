export interface Branch {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  manager: string
}

export interface Product {
  id: string
  name: string
  category: string
  ptrPrice: number
  stock: number
  status: 'active' | 'inactive' | 'draft'
  branches: Branch[]
  image?: string
  description?: string
  sku?: string
  createdDate: string
  lastUpdated: string
  minStockLevel?: number
  maxStockLevel?: number
  supplier?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

export interface ProductFormData {
  name: string
  category: string
  ptrPrice: number
  stock: number
  status: 'active' | 'inactive' | 'draft'
  branchIds: string[]
  description?: string
  sku?: string
  minStockLevel?: number
  maxStockLevel?: number
  supplier?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

export type ProductAction = 'view' | 'edit' | 'delete' | 'add'
export type FilterStatus = 'all' | 'active' | 'inactive' | 'draft'