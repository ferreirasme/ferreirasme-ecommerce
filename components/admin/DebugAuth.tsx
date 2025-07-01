"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugAuth() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setAuthInfo({ error: userError.message })
        } else {
          setAuthInfo({
            userId: user?.id,
            email: user?.email,
            role: user?.role,
            metadata: user?.user_metadata
          })
        }

        // Check admin status
        if (user?.email) {
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', user.email)
            .single()

          if (adminError) {
            setAdminInfo({ error: adminError.message })
          } else {
            setAdminInfo(admin)
          }

          // Run debug function
          const { data: debugData, error: debugError } = await supabase
            .rpc('check_admin_auth')

          if (!debugError && debugData) {
            setAuthInfo(prev => ({ ...prev, debug: debugData[0] }))
          }
        }
      } catch (error: any) {
        console.error('Debug auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) return <div>Loading auth debug info...</div>

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Authentication Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">User Info:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(authInfo, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">Admin Info:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(adminInfo, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}