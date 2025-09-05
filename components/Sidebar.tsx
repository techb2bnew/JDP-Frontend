'use client'

import { useState } from "react"
import { Button } from "./ui/button"
import { 
  LayoutDashboard, 
  BarChart3, 
  Package, 
  ShoppingCart, 
  FileText, 
  Users, 
  Briefcase, 
  MapPin, 
  UserCheck, 
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Bell
} from "lucide-react"
import { cn } from "../lib/utils"
import { LogoutConfirmationDialog } from "./LogoutConfirmationDialog"

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  onLogout: () => void
  isSuperAdmin?: boolean
}

export function Sidebar({ currentPage, onPageChange, onLogout, isSuperAdmin = false }: SidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [expandedProfiles, setExpandedProfiles] = useState(false)

  // If super admin, don't show navigation
  if (isSuperAdmin) {
    return null;
  }

  const navigation = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview of key metrics and summaries"
    },
    {
      id: "analytics",
      name: "Analytics", 
      icon: BarChart3,
      description: "Reports, performance charts, and usage stats"
    },
    {
      id: "products",
      name: "Products",
      icon: Package,
      description: "Manage product listings and details"
    },
    {
      id: "orders",
      name: "Orders",
      icon: ShoppingCart,
      description: "Track and manage customer orders"
    },
    {
      id: "invoices",
      name: "Invoices",
      icon: FileText,
      description: "View and generate billing documents"
    },
    {
      id: "customers",
      name: "Customers",
      icon: Users,
      description: "Customer database and interactions"
    },
    {
      id: "job-management",
      name: "Job Management",
      icon: Briefcase,
      description: "Create and manage job postings"
    },
    {
      id: "live-tracking",
      name: "Live Tracking",
      icon: MapPin,
      description: "Real-time job progress and resource tracking"
    },
    {
      id: "contractor-listing",
      name: "Contractor Listing",
      icon: UserCheck,
      description: "Directory of available contractors"
    },
    {
      id: "staff-management",
      name: "Staff Management",
      icon: Settings,
      description: "Administer staff accounts and permissions"
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      description: "Manage and view system alerts and messages"
    }
  ]

  const profileSubItems = [
    {
      id: "staff-profile",
      name: "Staff Profile",
      description: "Manage staff member profiles"
    },
    {
      id: "lead-labour-profile", 
      name: "Lead Labour Profile",
      description: "Manage lead labour profiles"
    },
    {
      id: "labour-profile",
      name: "Labour Profile", 
      description: "Manage labour profiles"
    }
  ]

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false)
    onLogout()
  }

  const toggleProfiles = () => {
    setExpandedProfiles(!expandedProfiles)
  }

  return (
    <>
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col animate-fade-in shadow-sm">
        <div className="p-6 border-b border-sidebar-border bg-gradient-to-r from-sidebar to-sidebar-accent/20">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-sm">JDP</span>
            </div>
            <div>
              <span className="font-semibold text-sidebar-foreground text-lg">JDP</span>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPage === item.id
            const Icon = item.icon

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "w-full justify-start text-left sidebar-item h-10",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={item.description}
              >
                <Icon className="mr-3 h-4 w-4" />
                <span className="font-medium">{item.name}</span>
              </Button>
            )
          })}

          {/* Profiles Section */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleProfiles}
              className={cn(
                "w-full justify-start text-left sidebar-item h-10",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="mr-3 h-4 w-4" />
              <span className="font-medium">Profiles</span>
              <div className="ml-auto transition-transform duration-200">
                {expandedProfiles ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </Button>

            {expandedProfiles && (
              <div className="ml-6 mt-1 space-y-1 animate-slide-up">
                {profileSubItems.map((subItem) => {
                  const isActive = currentPage === subItem.id
                  
                  return (
                    <Button
                      key={subItem.id}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onPageChange(subItem.id)}
                      className={cn(
                        "w-full justify-start text-left text-sm sidebar-item h-8",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      title={subItem.description}
                    >
                      <div className="w-2 h-2 rounded-full bg-current mr-3 opacity-60" />
                      <span>{subItem.name}</span>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogoutClick}
            className="w-full justify-start text-left logout-button h-10"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      <LogoutConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  )
}