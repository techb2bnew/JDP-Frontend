'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "../ui/button"
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
  ChevronLeft,
  LogOut,
  Settings2,
  Bell,
  Clock,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react"
import { cn } from "../../lib/utils"
import { LogoutConfirmationDialog } from "../LogoutConfirmationDialog"
import { usePermissions } from "../../contexts/PermissionContext"
import Image from "next/image"
interface SidebarProps {
  currentPath: string
  onLogout: () => void
}

export function Sidebar({ currentPath, onLogout }: SidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [expandedProfiles, setExpandedProfiles] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const { hasAnyPermission } = usePermissions()

  const navigation = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      description: "Overview of key metrics and summaries",
      module: "dashboard",
      requiredActions: ["view"]
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      description: "Reports, performance charts, and usage stats",
      module: "reports",
      requiredActions: ["view"]
    },
    {
      id: "products",
      name: "Products",
      icon: Package,
      href: "/products",
      description: "Manage product listings and details",
      module: "products",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "orders",
      name: "Purchase Orders",
      icon: ShoppingCart,
      href: "/orders",
      description: "Track and manage customer orders",
      module: "orders",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "invoices",
      name: "Invoices & Billing",
      icon: FileText,
      href: "/invoices",
      description: "View and generate billing documents",
      module: "invoices",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "timesheets",
      name: "Time sheets",
      icon: Clock,
      href: "/timesheets",
      description: "Review and approve employee timesheets",
      module: "invoices",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "customers",
      name: "Customers",
      icon: Users,
      href: "/customers",
      description: "Customer database and interactions",
      module: "customers",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    // {
    //   id: "jobs",
    //   name: "Job Management",
    //   icon: Briefcase,
    //   href: "/jobs",
    //   description: "Create and manage job postings",
    //   module: "jobs",
    //   requiredActions: ["view", "create", "edit", "delete"]
    // },
    {
      id: "tracking",
      name: "Live Tracking",
      icon: MapPin,
      href: "/tracking",
      description: "Real-time job progress and resource tracking",
      module: "tracking",
      requiredActions: ["view"]
    },
    {
      id: "contractors",
      name: "Contractor Listing",
      icon: UserCheck,
      href: "/contractors",
      description: "Directory of available contractors",
      module: "contractors",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "staff",
      name: "Staff Management",
      icon: Users,
      href: "/staff",
      description: "Administer staff accounts and permissions",
      module: "staff",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      href: "/notifications",
      description: "Manage and view system alerts and messages",
      module: "notification",
      requiredActions: ["view", "create", "edit", "delete"]
    }, 
    {
      id: "role",
      name: "Role & Permission",
      icon: Users,
      href: "/role",
      description: "Role & Permission",
      module: "role_permission",
      requiredActions: ["view", "create", "edit", "delete"]
    },
    {
      id: "configuration",
      name: "Configuration",
      icon: Settings,
      href: "/configuration",
      description: "Configure system-wide settings for pricing and rates",
      module: "configuration",
      requiredActions: ["view", "create", "edit", "delete"]
    },
  ]

  // Filter navigation items based on permissions
  const filteredNavigation = navigation.filter(item => {
    // Special handling for Staff Management - check for labour or lead_labour permissions
    if (item.id === 'staff') {
      return hasAnyPermission('labour', item.requiredActions) || 
             hasAnyPermission('lead_labour', item.requiredActions) ||
             hasAnyPermission('staff', item.requiredActions) ||
             hasAnyPermission('suppliers', item.requiredActions)
    }
    
    
    
    // For all other items, use standard permission check
    return hasAnyPermission(item.module, item.requiredActions)
  })

  // const profileSubItems = [
  //   {
  //     id: "staff-profile",
  //     name: "Staff Profile",
  //     href: "/profiles/staff",
  //     description: "Manage staff member profiles"
  //   },
  //   {
  //     id: "lead-labour-profile", 
  //     name: "Lead Labour Profile",
  //     href: "/profiles/lead-labour",
  //     description: "Manage lead labour profiles"
  //   },
  //   {
  //     id: "labour-profile",
  //     name: "Labour Profile", 
  //     href: "/profiles/labour",
  //     description: "Manage labour profiles"
  //   }
  // ]

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

  const isActive = (href: string) => {
    return currentPath === href || currentPath.startsWith(href + '/')
  }

  return (
    <>
      <aside className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col animate-fade-in shadow-sm transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-5 border-b border-sidebar-border bg-gradient-to-r from-sidebar to-sidebar-accent/20 relative">
          {!isCollapsed && (
            <div className="flex items-center justify-center space-x-3">
              <div className="text-center">
                <Image
                  src='/assets/logos/logo-jdp.png'
                  alt="logo"
                  width={168}
                  height={63}
                  className='w-[140px] '
                />
                <p className="font-semibold text-md pt-3">JDP Electrical Services</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center">
              <Image
                src='/assets/logos/logo-jdp.png'
                alt="logo"
                width={40}
                height={30}
                className='w-10 h-6'
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-3 h-[45px] w-[45px] p-0 hover:bg-sidebar-accent bg-sidebar-accent",
              isCollapsed ? "right-[-50px]" : "right-[-50px]"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-[35px] w-[35px]" />
            ) : (
              <PanelLeftClose className="h-[35px] w-[35px]" />
            )}
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavigation.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link key={item.id} href={item.href} prefetch={true}>
                <Button
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full sidebar-item h-10",
                    isCollapsed ? "justify-center p-0" : "justify-start text-left",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={isCollapsed ? item.name : item.description}
                >
                  <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Button>
              </Link>
            )
          })}

          {/* Profiles Section */}
          {/* <div className="pt-2">
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
                  const active = isActive(subItem.href)
                  
                  return (
                    <Link key={subItem.id} href={subItem.href} prefetch={true}>
                      <Button
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left text-sm sidebar-item h-8",
                          active 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                        title={subItem.description}
                      >
                        <div className="w-2 h-2 rounded-full bg-current mr-3 opacity-60" />
                        <span>{subItem.name}</span>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div> */}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={handleLogoutClick}
            className="w-full justify-start text-left logout-button h-10"
          >
            <Settings className="mr-3 h-4 w-4" />
            <span className="font-medium">Configuration</span>
          </Button> */}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogoutClick}
            className={cn(
              "w-full logout-button h-10",
              isCollapsed ? "justify-center p-0" : "justify-start text-left"
            )}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
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