"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ShoppingBag, 
  Package, 
  DollarSign,
  Settings,
  BarChart3,
  LogOut,
  Shield,
  Download,
  Upload,
  FolderTree
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Consultoras", href: "/admin/consultants", icon: UserCheck },
  { name: "Clientes", href: "/admin/clients", icon: Users },
  { name: "Pedidos", href: "/admin/orders", icon: ShoppingBag },
  { name: "Produtos", href: "/admin/products", icon: Package },
  { name: "Categorias", href: "/admin/categories", icon: FolderTree },
  { name: "Comissões", href: "/admin/commissions", icon: DollarSign },
  { name: "Relatórios", href: "/admin/reports", icon: BarChart3 },
  { name: "Importar Odoo", href: "/admin/import-odoo", icon: Download },
  { name: "Importar Excel", href: "/admin/import-excel", icon: Upload },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success("Logout realizado com sucesso")
      router.push("/admin/login")
    } catch (error) {
      toast.error("Erro ao fazer logout")
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center gap-2 px-6 bg-gray-800">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold text-white">Admin</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href) || false
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}