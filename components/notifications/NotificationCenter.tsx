'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotificationStore, type NotificationType } from '@/store/notifications'
import { cn } from '@/lib/utils'

export function NotificationCenter() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore()

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'commission':
        return '💰'
      case 'payment':
        return '💳'
      case 'client':
        return '👤'
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'commission':
        return 'text-green-600'
      case 'payment':
        return 'text-blue-600'
      case 'client':
        return 'text-purple-600'
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
      default:
        return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} min atrás`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`
    } else if (diffInHours < 48) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificações não lidas`
              : 'Todas as notificações foram lidas'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="text-sm text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar tudo
          </Button>
        </div>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-200px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative p-4 rounded-lg border transition-colors cursor-pointer hover:bg-accent',
                    !notification.read && 'bg-accent/50 border-accent'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                    className="absolute top-2 right-2 p-1 hover:bg-background rounded"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <div className="flex items-start gap-3 pr-6">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            'font-semibold text-sm',
                            getNotificationColor(notification.type)
                          )}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}