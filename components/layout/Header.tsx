'use client'

import { Bell, User, Search, Sun, Moon, Settings } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../ui/dropdown-menu"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { useState } from "react"
import { NotificationPopup } from "../NotificationPopup"
import { useTheme } from "../../contexts/ThemeContext"
import {
  Plus,
  Filter,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Users,
  Briefcase,
  CheckSquare
} from 'lucide-react'
import Link from "next/link"
interface HeaderProps {
  currentPath: string
  onLogout: () => void
  onNotificationViewAll: () => void
  onProfileClick: () => void
}

export function Header({
  currentPath,
  onLogout,
  onNotificationViewAll,
  onProfileClick
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const { theme, toggleTheme, isLoading } = useTheme()

  const getPageTitle = (path: string): string => {
    const titles: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/analytics": "Analytics",
      "/products": "Products",
      "/orders": "Orders",
      "/invoices": "Invoices & Billing",
      "/customers": "Customers",
      "/jobs": "Job Management",
      "/tracking": "Live Tracking",
      "/contractors": "Contractor Listing",
      "/configuration": "Configuration",
      "/staff": "Staff Management",
      "/notifications": "Notifications",
      "/profile": "Profile",
      "/profiles": "Profiles",
      "/profiles/staff": "Staff Profile",
      "/profiles/lead-labour": "Lead Labour Profile",
      "/profiles/labour": "Labour Profile"
    }
    return titles[path] || "Dashboard"
  }

  const notifications = [
    {
      id: "1",
      title: "New Order Received",
      message: "Order #12345 has been placed by John Doe",
      time: "2 minutes ago",
      type: "order" as const,
      unread: true
    },
    {
      id: "2",
      title: "Payment Confirmed",
      message: "Payment of $1,250 has been confirmed for Invoice #INV-001",
      time: "15 minutes ago",
      type: "payment" as const,
      unread: true
    },
    {
      id: "3",
      title: "Low Stock Alert",
      message: "Product 'Steel Beams' is running low in inventory",
      time: "1 hour ago",
      type: "inventory" as const,
      unread: false
    },
    {
      id: "4",
      title: "Task Completed",
      message: "John Smith has completed the installation task",
      time: "3 hours ago",
      type: "task" as const,
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <TooltipProvider>
      <header className="bg-card border-b px-6 py-4 animate-fade-in shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 gap-3 w-[70%]">
            <h1 className="text-2xl font-medium text-foreground w-[25%]">
              {getPageTitle(currentPath)}
            </h1>

            {/* Search */}
            <div className="relative hidden md:block w-[35%]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className=" pl-9 transition-all duration-200 focus:w-80 bg-[#f8f8f8]"
              />
            </div>
            <Link href={'/jobs'}
              className="flex items-center w-[120px] p-2 justify-center border rounded gap-2"
            >
              <Briefcase className="h-4 w-4" />
              View Jobs
            </Link>
            <Button
              className="bg-primary text-white hover:bg-[#0090e6] gap-2 text-[#fff]"
            >
              <Plus className="h-4 w-4" />
              Create New Estimate
            </Button>
          </div>

          <div className="flex items-center space-x-3">


            {/* Theme Toggle */}
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="theme-toggle"
                  disabled={isLoading}
                >
                  <div className="relative w-4 h-4">
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
                    ) : (
                      <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
                    )}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to {theme === 'light' ? 'dark' : 'light'} mode</p>
              </TooltipContent>
            </Tooltip> */}

            {/* Notifications */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="notification-button"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs notification-badge animate-bounce-in"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</p>
                </TooltipContent>
              </Tooltip>

              {showNotifications && (
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <NotificationPopup
                      notifications={notifications}
                      onClose={() => setShowNotifications(false)}
                      onViewAll={onNotificationViewAll}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="profile-button">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/assets/images/avatars/admin-user.jpg" alt="Admin" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 animate-scale-in"
                sideOffset={5}
              >
                <DropdownMenuLabel>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/assets/images/avatars/admin-user.jpg" alt="Admin" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Admin User</p>
                      <p className="text-sm text-muted-foreground">admin@jdp.com</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="logout-button cursor-pointer"
                >
                  <div className="flex items-center">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}