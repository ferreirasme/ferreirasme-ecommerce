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
    
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No user found:', error?.message)
      return null
    }

    console.log('Checking admin status for user:', user.email)

    // Check if user is in admins table by email
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .eq('active', true)
      .single()

    if (adminError || !admin) {
      console.log('User is not an admin:', adminError?.message)
      return null
    }

    console.log('Admin found:', admin.email)

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