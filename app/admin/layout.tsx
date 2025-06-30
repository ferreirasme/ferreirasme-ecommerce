import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Link from "next/link"
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Shield, 
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  LogOut
} from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Check if user is admin or manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.metadata?.role || 'user'
  
  if (!['admin', 'manager'].includes(userRole)) {
    redirect('/')
  }

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      permission: 'all'
    },
    {
      title: 'Consultoras',
      href: '/admin/consultants',
      icon: Users,
      permission: 'all'
    },
    {
      title: 'Clientes',
      href: '/admin/clients',
      icon: UserPlus,
      permission: 'all'
    },
    {
      title: 'Comissões',
      href: '/admin/commissions',
      icon: DollarSign,
      permission: 'all'
    },
    {
      title: 'Importar Clientes',
      href: '/admin/clients/import',
      icon: FileSpreadsheet,
      permission: 'all'
    },
    {
      title: 'Consentimentos',
      href: '/admin/consent',
      icon: Shield,
      permission: 'admin'
    },
    {
      title: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
      permission: 'admin'
    }
  ].filter(item => item.permission === 'all' || (item.permission === 'admin' && userRole === 'admin'))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-500 mt-1">Ferreiras ME</p>
          </div>
          
          <nav className="mt-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 w-64 p-6">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sair
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}