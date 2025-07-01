"use client"

import { AdminAuthWrapper } from "@/components/admin/AdminAuthWrapper"

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthWrapper>
      <div className="p-8">
        {children}
      </div>
    </AdminAuthWrapper>
  )
}