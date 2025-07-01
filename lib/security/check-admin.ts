import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

export interface AdminUser {
  id: string
  email: string
  full_name: string
  isAdmin: boolean
}

export async function checkIsAdmin(request: NextRequest): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.log('No session found')
      return null
    }

    // Check if user is in admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', session.user.id)
      .eq('active', true)
      .single()

    if (adminError || !admin) {
      console.log('User is not an admin:', adminError?.message)
      return null
    }

    return {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      isAdmin: true
    }
  } catch (error) {
    console.error('Error checking admin:', error)
    return null
  }
}