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
import { toast } from "sonner"
import { usePermissions } from '../../contexts/PermissionContext'

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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  const { hasPermission } = usePermissions()

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const authData = localStorage.getItem('jdp_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user || null;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };

  const userData = getUserData();

  const handleLogout = async () => {
    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Logging out...');

      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Logged out successfully!');
          // Clear localStorage
          localStorage.removeItem('jdp_auth');
          // Call the original onLogout function
          onLogout();
        } else {
          toast.error(responseData.message || 'Failed to logout');
          // Still call onLogout to clear local state
          onLogout();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to logout');
        // Still call onLogout to clear local state
        onLogout();
      }
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error during logout:', error);
      toast.error('An error occurred during logout');
      // Still call onLogout to clear local state
      onLogout();
    }
  };

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
      "/role": "Role & Permission",
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
            {/* <div className="relative hidden md:block w-[35%]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className=" pl-9 transition-all duration-200 focus:w-80 bg-[#f8f8f8]"
              />
            </div> */}

          </div>

          <div className="flex items-center space-x-3">
              {hasPermission('jobs', 'create') && (
            <Link href={'/jobs'}
              className="flex items-center w-[120px] p-2 justify-center border rounded gap-2"
            >
              <Briefcase className="h-4 w-4" />
              View Jobs
            </Link>
              )}
              {/* {hasPermission('jobs', 'create') && (
            <Button
              className="bg-primary text-white hover:bg-[#0090e6] gap-2 text-[#fff]"
            >
              <Plus className="h-4 w-4" />
              Create New Estimate
            </Button>
              )} */}

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
              {hasPermission('notification', 'view') && (

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
              )}
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
                      <AvatarImage
                        src={userData?.photo_url || "/assets/images/avatars/admin-user.jpg"}
                        alt={userData?.full_name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userData?.full_name ? userData.full_name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userData?.full_name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{userData?.email || "user@example.com"}</p>
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
                  onClick={handleLogout}
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