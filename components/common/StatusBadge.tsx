import { Badge } from '../ui/badge'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

const statusConfig = {
  active: { variant: 'default' as const, className: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' },
  inactive: { variant: 'secondary' as const, className: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50' },
  pending: { variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50' },
  completed: { variant: 'default' as const, className: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' },
  cancelled: { variant: 'destructive' as const, className: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50' },
  draft: { variant: 'outline' as const, className: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50' },
  sent: { variant: 'default' as const, className: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50' },
  paid: { variant: 'default' as const, className: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50' },
  overdue: { variant: 'destructive' as const, className: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50' },
}

export function StatusBadge({ status, variant, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.inactive
  
  return (
    <Badge 
      variant={variant || config.variant}
      className={`${config.className} ${className}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}