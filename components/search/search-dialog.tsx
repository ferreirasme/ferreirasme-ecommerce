"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"
import Image from "next/image"
import Link from "next/link"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  sale_price?: number | null
  product_images: {
    image_url: string
    is_primary: boolean
  }[]
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setSearched(false)
    }
  }, [open])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([])
        setSearched(false)
        return
      }

      setLoading(true)
      setSearched(true)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          sale_price,
          product_images(image_url, is_primary)
        `)
        .ilike('name', `%${query}%`)
        .eq('active', true)
        .limit(10)

      if (error) {
        console.error('Search error:', error)
      } else {
        setResults(data || [])
      }
      
      setLoading(false)
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleProductClick = (slug: string) => {
    onOpenChange(false)
    router.push(`/produtos/${slug}`)
  }

  const getPrimaryImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary)
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || '/images/placeholder.svg'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Pesquisar Produtos</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produtos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searched && results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum produto encontrado para "{query}"
              </p>
            </div>
          ) : results.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.slug)}
                    className="w-full text-left hover:bg-muted rounded-lg p-3 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted flex-shrink-0">
                        <Image
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {product.sale_price ? (
                            <>
                              <span className="text-sm font-semibold">
                                {formatCurrency(product.sale_price)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : query.length >= 2 ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">Sugestões populares:</p>
              <div className="flex flex-wrap gap-2">
                {["Anéis", "Colares", "Brincos", "Pulseiras"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Digite pelo menos 2 caracteres para pesquisar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}