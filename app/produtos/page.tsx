"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter, Grid2X2, Grid3X3 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"
import { ProductFilters } from "@/components/products/product-filters"

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
  created_at?: string
  product_images: {
    image_url: string
    is_primary: boolean
  }[]
  category?: {
    name: string
    slug: string
  }
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoria = searchParams.get("categoria")
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("relevance")
  const [gridCols, setGridCols] = useState(3)
  const [filterOpen, setFilterOpen] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  const categories = [
    { name: "Todas", slug: "" },
    { name: "Novidades", slug: "novidades" },
    { name: "Anéis", slug: "aneis" },
    { name: "Colares", slug: "colares" },
    { name: "Brincos", slug: "brincos" },
    { name: "Pulseiras", slug: "pulseiras" },
  ]

  const colors = [
    { name: "Dourado", value: "dourado" },
    { name: "Prateado", value: "prateado" },
    { name: "Rosé", value: "rose" },
  ]

  const sizes = [
    { name: "PP", value: "pp" },
    { name: "P", value: "p" },
    { name: "M", value: "m" },
    { name: "G", value: "g" },
    { name: "GG", value: "gg" },
  ]

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories!products_category_id_fkey(name, slug),
          product_images(image_url, is_primary)
        `)
        .eq('active', true)

      if (categoria) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categoria)
          .single()

        if (categoryData) {
          query = query.eq('category_id', categoryData.id)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        let sortedData = data || []
        
        if (sortBy === "price-asc") {
          sortedData.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price))
        } else if (sortBy === "price-desc") {
          sortedData.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price))
        } else if (sortBy === "newest") {
          sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }
        
        setProducts(sortedData)
      }
      
      setLoading(false)
    }

    fetchProducts()
  }, [categoria, sortBy])

  // Filter products based on selected filters
  useEffect(() => {
    let filtered = [...products]

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.sale_price || product.price
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Apply sorting
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price))
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price))
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    }

    setFilteredProducts(filtered)
  }, [products, priceRange, selectedColors, selectedSizes, sortBy])

  const currentCategory = categories.find(c => c.slug === categoria) || categories[0]

  const getPrimaryImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary)
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || '/images/placeholder.svg'
  }

  const handleResetFilters = () => {
    setPriceRange([0, 500])
    setSelectedColors([])
    setSelectedSizes([])
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{currentCategory.name || "Todos os Produtos"}</h1>
        <p className="text-muted-foreground">
          {filteredProducts.length} produtos encontrados
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3">Categorias</Label>
                  <div className="space-y-2 mt-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={cat.slug ? `/produtos?categoria=${cat.slug}` : "/produtos"}
                        className={`block px-3 py-2 rounded-md transition-colors ${
                          currentCategory.slug === cat.slug
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setFilterOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3">Preço</Label>
                  <div className="space-y-4 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{formatCurrency(priceRange[0])}</span>
                      <span>{formatCurrency(priceRange[1])}</span>
                    </div>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange as any}
                      min={0}
                      max={500}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3">Cor</Label>
                  <div className="space-y-2 mt-3">
                    {colors.map((color) => (
                      <div key={color.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={color.value}
                          checked={selectedColors.includes(color.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedColors([...selectedColors, color.value])
                            } else {
                              setSelectedColors(selectedColors.filter(c => c !== color.value))
                            }
                          }}
                        />
                        <Label
                          htmlFor={color.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {color.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3">Tamanho</Label>
                  <div className="space-y-2 mt-3">
                    {sizes.map((size) => (
                      <div key={size.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={size.value}
                          checked={selectedSizes.includes(size.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSizes([...selectedSizes, size.value])
                            } else {
                              setSelectedSizes(selectedSizes.filter(s => s !== size.value))
                            }
                          }}
                        />
                        <Label
                          htmlFor={size.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {size.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPriceRange([0, 500])
                      setSelectedColors([])
                      setSelectedSizes([])
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden lg:flex items-center gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.slug}
                variant={currentCategory.slug === cat.slug ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={cat.slug ? `/produtos?categoria=${cat.slug}` : "/produtos"}>
                  {cat.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="newest">Mais recentes</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden md:flex items-center gap-1">
            <Button
              variant={gridCols === 2 ? "default" : "ghost"}
              size="icon"
              onClick={() => setGridCols(2)}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridCols === 3 ? "default" : "ghost"}
              size="icon"
              onClick={() => setGridCols(3)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="hidden lg:block">
          <ProductFilters
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            onReset={handleResetFilters}
          />
        </aside>

        <div className="lg:col-span-3">
          <div className={`grid grid-cols-2 ${gridCols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4">
                <Skeleton className="h-4 mb-2" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/produtos/${product.slug}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative bg-muted">
                  {product.sale_price && (
                    <Badge className="absolute top-2 left-2 z-10" variant="destructive">
                      Promoção
                    </Badge>
                  )}
                  <Image
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    {product.sale_price ? (
                      <>
                        <span className="text-lg font-bold">
                          {formatCurrency(Number(product.sale_price))}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(Number(product.price))}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">
                        {formatCurrency(Number(product.price))}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4">
                <Skeleton className="h-4 mb-2" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}