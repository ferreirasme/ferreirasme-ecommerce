import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Ferreira\'s Me',
  description: 'Área administrativa',
}

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}