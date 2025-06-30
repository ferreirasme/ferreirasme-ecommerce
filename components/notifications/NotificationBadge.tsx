'use client'

import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore } from '@/store/notifications'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function NotificationBadge({
  className,
  showIcon = true,
  size = 'md',
}: NotificationBadgeProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount)

  if (unreadCount === 0) {
    return showIcon ? (
      <Bell
        className={cn(
          'text-muted-foreground',
          size === 'sm' && 'h-4 w-4',
          size === 'md' && 'h-5 w-5',
          size === 'lg' && 'h-6 w-6',
          className
        )}
      />
    ) : null
  }

  const sizeClasses = {
    sm: 'h-4 w-4 text-[10px]',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {showIcon && <Bell className={cn('text-muted-foreground', iconSizeClasses[size])} />}
      <Badge
        variant="destructive"
        className={cn(
          'absolute -top-1 -right-1 p-0 flex items-center justify-center',
          sizeClasses[size]
        )}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    </div>
  )
}