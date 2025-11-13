'use client'

import { X, Bell, DollarSign, Package, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { useRouter } from 'next/navigation';

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: "order" | "payment" | "inventory" | "task"
  unread: boolean
}

interface NotificationPopupProps {
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onClose: () => void
  onViewAll: () => void
}

export function NotificationPopup({
  notifications,
  setNotifications,
  onClose,
  onViewAll,
}: NotificationPopupProps) {
  const getNotificationIcon = (type: Notification["type"]) => {
    const iconProps = "h-4 w-4"
    switch (type) {
      case "order":
        return <Bell className={`${iconProps} text-primary`} />
      case "payment":
        return <DollarSign className={`${iconProps} text-green-500`} />
      case "inventory":
        return <Package className={`${iconProps} text-orange-500`} />
      case "task":
        return <CheckCircle className={`${iconProps} text-blue-500`} />
      default:
        return <AlertTriangle className={`${iconProps} text-muted-foreground`} />
    }
  }
  const router = useRouter();

  const getNotificationBadgeColor = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return "bg-primary/10 text-primary border-primary/20"
      case "payment":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "inventory":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
      case "task":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length


  const handleViewInvoice = () => { 
    // router.push(`/invoiceDetail?id=INV-001`);
  }

  return (
    <Card className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] z-50 shadow-xl border-border animate-scale-in bg-card bg-white overflow-auto">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="notification-badge">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-96 overflow-auto">
        <div className="p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id} onClick={() => handleViewInvoice()}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 group ${
                      notification.unread 
                        ? "bg-primary/5 border border-primary/10" 
                        : "hover:bg-muted/30"
                    } animate-slide-up`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 p-1.5 rounded-full ${getNotificationBadgeColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate pr-2">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            {notification.unread && (
                              <div className="h-2 w-2 bg-primary rounded-full notification-badge" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && (
                    <Separator className="my-1 opacity-30" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="flex-1 button-bounce"
            >
              View All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}