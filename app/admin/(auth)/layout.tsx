import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAdmin } from "@/lib/auth-admin"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default async function AdminAuthLayout({
  children,
}: {
  children: ReactNode
}) {
  try {
    const admin = await getAdmin()
    
    if (!admin) {
      redirect("/admin/login")
    }

    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Erro no layout admin:", error)
    redirect("/admin/login")
  }
}