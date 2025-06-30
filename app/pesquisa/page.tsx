"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  sale_price?: number | null
  description: string
  category_id: string
  featured: boolean
  active: boolean
  product_images: {
    image_url: string
    is_primary: boolean
  }[]
  category?: {
    name: string
    slug: string
  }
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get("q") || ""
  
  const [query, setQuery] = useState(initialQuery)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim()) {
        setLoading(true)
        setSearched(true)
        
        try {
          const supabase = createClient()
          
          const { data, error } = await supabase
            .from("products")
            .select(`
              *,
              product_images!inner (
                image_url,
                is_primary
              ),
              category:categories (
                name,
                slug
              )
            `)
            .ilike("name", `%${query}%`)
            .eq("active", true)
            .order("featured", { ascending: false })
            
          if (error) throw error
          
          setProducts(data || [])
        } catch (error) {
          console.error("Erro ao buscar produtos:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(searchProducts, 500)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // A busca já é feita automaticamente pelo useEffect
  }

  const clearSearch = () => {
    setQuery("")
    setProducts([])
    setSearched(false)
  }

  const primaryImage = (product: Product) => {
    const primary = product.product_images?.find(img => img.is_primary)
    return primary?.image_url || product.product_images?.[0]?.image_url || "/images/placeholder.svg"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Formulário de busca */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-lg"
            autoFocus
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>

        {/* Resultados */}
        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-24 w-24 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searched && products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum produto encontrado para "{query}"
              </p>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-4">
                {products.map((product) => (
                  <Link key={product.id} href={`/produtos/${product.slug}`}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100">
                            <Image
                              src={primaryImage(product)}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                            {product.category && (
                              <Badge variant="secondary" className="mt-1">
                                {product.category.name}
                              </Badge>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              {product.sale_price ? (
                                <>
                                  <span className="font-bold text-lg">
                                    {formatCurrency(product.sale_price)}
                                  </span>
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatCurrency(product.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-bold text-lg">
                                  {formatCurrency(product.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}