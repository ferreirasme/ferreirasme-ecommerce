import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface Admin {
  id: string
  email: string
  full_name: string
  phone: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface AdminPermission {
  id: string
  admin_id: string
  permission: string
  granted_at: string
  granted_by: string | null
}

export async function getAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Admins are identified by email in the RLS policies
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email)
    .eq('active', true)
    .single()

  return admin as Admin | null
}

export async function requireAdmin() {
  const admin = await getAdmin()
  
  if (!admin) {
    redirect('/admin/login')
  }
  
  return admin
}

export async function getAdminPermissions(adminId: string) {
  const supabase = await createClient()
  
  const { data: permissions } = await supabase
    .from('admin_permissions')
    .select('permission')
    .eq('admin_id', adminId)

  return permissions?.map(p => p.permission) || []
}

export async function hasPermission(permission: string): Promise<boolean> {
  const admin = await getAdmin()
  
  if (!admin) return false

  const permissions = await getAdminPermissions(admin.id)
  
  return permissions.includes(permission) || permissions.includes('super_admin')
}

export async function requirePermission(permission: string) {
  const hasAccess = await hasPermission(permission)
  
  if (!hasAccess) {
    redirect('/admin/unauthorized')
  }
}

export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) {
  const supabase = await createClient()
  const admin = await getAdmin()
  
  if (!admin) return

  await supabase.from('admin_logs').insert({
    admin_id: admin.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: '', // Será preenchido pela API
    user_agent: '' // Será preenchido pela API
  })
}