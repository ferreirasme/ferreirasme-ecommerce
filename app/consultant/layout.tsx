'use client'

import { ConsultantSidebar } from '@/components/consultant/ConsultantSidebar'
import { ConsultantHeader } from '@/components/consultant/ConsultantHeader'

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <ConsultantSidebar />
      <div className="flex flex-col lg:pl-64">
        <ConsultantHeader />
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}