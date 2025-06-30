'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Euro,
  FileText,
  User,
  Wrench,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/consultant/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Meus Clientes',
    href: '/consultant/clients',
    icon: Users
  },
  {
    title: 'Minhas Comissões',
    href: '/consultant/commissions',
    icon: Euro
  },
  {
    title: 'Relatórios',
    href: '/consultant/reports',
    icon: FileText
  },
  {
    title: 'Ferramentas de Venda',
    href: '/consultant/tools',
    icon: Wrench
  },
  {
    title: 'Meu Perfil',
    href: '/consultant/profile',
    icon: User
  }
]

interface ConsultantSidebarProps {
  className?: string
}

export function ConsultantSidebar({ className }: ConsultantSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-6">
        <h2 className="text-lg font-semibold text-primary">Portal Consultora</h2>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.title}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 opacity-50" />
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="text-xs text-muted-foreground">
            Precisa de ajuda?
          </p>
          <p className="text-sm font-medium">
            suporte@ferreirasme.com
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-3.5 z-40"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex h-screen w-64 flex-col border-r bg-background',
          className
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}