'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  UserPlus, 
  Share2, 
  FileText, 
  ShoppingBag,
  Copy,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface QuickActionsProps {
  consultantCode?: string
}

export function QuickActions({ consultantCode = 'CONS001' }: QuickActionsProps) {
  const [copied, setCopied] = useState(false)
  
  const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ferreirasme.com'}?ref=${consultantCode}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ferreiras ME - Semijoias',
          text: 'Confira as lindas semijoias da Ferreiras ME!',
          url: shareLink
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Erro ao compartilhar')
        }
      }
    } else {
      handleCopyLink()
    }
  }

  const actions = [
    {
      title: 'Adicionar Cliente',
      description: 'Cadastre um novo cliente',
      icon: UserPlus,
      href: '/consultant/clients',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Compartilhar Loja',
      description: 'Envie seu link personalizado',
      icon: Share2,
      onClick: handleShare,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Gerar Relatório',
      description: 'Exporte seus dados',
      icon: FileText,
      href: '/consultant/reports',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Ver Catálogo',
      description: 'Explore os produtos',
      icon: ShoppingBag,
      href: '/produtos',
      color: 'text-orange-600 bg-orange-50'
    }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ações Rápidas</h3>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon
          
          if (action.href) {
            return (
              <Link key={action.title} href={action.href}>
                <Card className="group h-full cursor-pointer p-4 transition-all hover:shadow-md">
                  <div className="flex flex-col items-center text-center">
                    <div className={`mb-3 rounded-lg p-3 ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Card>
              </Link>
            )
          }
          
          return (
            <Card
              key={action.title}
              className="group h-full cursor-pointer p-4 transition-all hover:shadow-md"
              onClick={action.onClick}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`mb-3 rounded-lg p-3 ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-medium">{action.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Seu Link Personalizado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {shareLink}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="ml-4"
          >
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}