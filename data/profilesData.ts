import { ProfileType } from '../types/profiles'

export interface ProfileStats {
  total: number
  active: number
  inactive: number
}

export interface ProfileTypeConfig {
  id: ProfileType
  title: string
  description: string
  icon: string
  stats: ProfileStats
}

export const profileStats = {
  admin: {
    total: 3,
    active: 2,
    inactive: 1
  },
  staff: {
    total: 15,
    active: 12,
    inactive: 3
  },
  labourLead: {
    total: 8,
    active: 7,
    inactive: 1
  },
  supplier: {
    total: 25,
    active: 22,
    inactive: 3
  }
}

export const profileTypeConfigs: ProfileTypeConfig[] = [
  {
    id: 'admin',
    title: 'Admin Profile',
    description: 'System administrators with full access privileges',
    icon: 'Shield',
    stats: profileStats.admin
  },
  {
    id: 'staff',
    title: 'Admin Staff Profile',
    description: 'Staff members with departmental access and permissions',
    icon: 'Users',
    stats: profileStats.staff
  },
  {
    id: 'labour_lead',
    title: 'Labour Lead Details',
    description: 'Lead supervisors managing construction teams',
    icon: 'HardHat',
    stats: profileStats.labourLead
  },
  {
    id: 'supplier',
    title: 'Supplier Details',
    description: 'Business partners providing materials and services',
    icon: 'Truck',
    stats: profileStats.supplier
  }
]