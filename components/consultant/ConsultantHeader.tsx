'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { NotificationCenter } from '@/components/notifications'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, User, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ConsultantData {
  name: string
  email: string
  code: string
  avatar_url?: string
}

export function ConsultantHeader() {
  const [consultant, setConsultant] = useState<ConsultantData | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchConsultantData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('consultants')
          .select('name, email, code, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setConsultant(data)
        }
      }
    }

    fetchConsultantData()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/consultant/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:pl-64">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
          <div className="flex flex-col">
            <h1 className="text-sm font-medium text-muted-foreground">
              Bem-vinda de volta
            </h1>
            {consultant && (
              <p className="text-lg font-semibold">
                {consultant.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={consultant?.avatar_url} 
                    alt={consultant?.name} 
                  />
                  <AvatarFallback>
                    {consultant ? getInitials(consultant.name) : 'C'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {consultant?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {consultant?.email}
                  </p>
                  {consultant?.code && (
                    <p className="text-xs leading-none text-muted-foreground">
                      Código: {consultant.code}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/consultant/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/consultant/preferences" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferências</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contacto" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Suporte</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}