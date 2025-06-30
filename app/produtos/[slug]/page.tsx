"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Minus, Plus, ShoppingBag, Heart, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"

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

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const addToCart = useCartStore((state) => state.addItem)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories!products_category_id_fkey(name, slug),
          product_images(image_url, is_primary)
        `)
        .eq('slug', slug)
        .eq('active', true)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
      } else {
        setProduct(data)
      }
      
      setLoading(false)
    }

    fetchProduct()
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      product_id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image_url: product.product_images?.[0]?.image_url || '/images/placeholder.svg',
      quantity
    })

    toast.success(`${product.name} adicionado ao carrinho!`)
  }

  const getProductImages = () => {
    if (!product?.product_images?.length) {
      return ['/images/placeholder.svg']
    }
    return product.product_images.map(img => img.image_url)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button asChild>
            <Link href="/produtos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos produtos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const images = getProductImages()
  const currentPrice = product.sale_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/produtos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {hasDiscount && (
              <Badge className="absolute top-4 left-4" variant="destructive">
                Promoção
              </Badge>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative bg-muted rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            {product.category && (
              <Link 
                href={`/produtos?categoria=${product.category.slug}`}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold">{formatCurrency(currentPrice)}</span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold">Quantidade:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Adicionar ao Carrinho
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">✓</span>
              <span>Envio grátis em compras acima de 50€</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">✓</span>
              <span>Garantia de qualidade</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">✓</span>
              <span>Trocas e devoluções em até 30 dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}