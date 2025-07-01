"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  MoreVertical, 
  Package,
  Filter,
  Download,
  Upload
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Image from "next/image"

interface Category {
  id: string
  name: string
}

interface ProductCategory {
  category: Category | null
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  sale_price: number | null
  sku: string | null
  stock_quantity: number
  featured: boolean
  active: boolean
  odoo_image: string | null
  odoo_id: number | null
  created_at: string
  updated_at: string
  product_categories?: ProductCategory[]
  product_images?: Array<{
    id: string
    image_url: string
    alt_text: string | null
    is_primary: boolean
  }>
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [categories, setCategories] = useState<Category[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const itemsPerPage = 10

  const supabase = createClient()

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Auth error:', authError)
        setError('Não autenticado')
        return
      }
      console.log('Authenticated user:', user.email)
      fetchCategories()
      fetchProducts()
    }
    checkAuth()
  }, [currentPage, searchTerm, statusFilter, categoryFilter])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Build the main query - simplified to avoid relationship errors
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          sale_price,
          sku,
          stock_quantity,
          featured,
          active,
          odoo_image,
          odoo_id,
          created_at,
          updated_at
        `, { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // Status filter disabled - column doesn't exist
      // if (statusFilter !== "all") {
      //   query = query.eq('status', statusFilter)
      // }

      // Category filter temporarily disabled due to relationship issues
      // if (categoryFilter !== "all") {
      //   query = query.contains('product_categories', [{ category_id: categoryFilter }])
      // }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) {
        console.error('Query error:', error)
        throw error
      }

      console.log('Products data:', data)
      
      setProducts(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
      setError(null)
    } catch (error: any) {
      console.error('Error fetching products:', error)
      setError(error.message || 'Erro desconhecido')
      toast.error(`Erro ao carregar produtos: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const updateData = {
        active: newStatus === 'active'
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

      if (error) throw error

      toast.success('Status atualizado com sucesso')
      fetchProducts()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      out_of_stock: { label: 'Sem Estoque', variant: 'destructive' as const },
      discontinued: { label: 'Descontinuado', variant: 'outline' as const }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Sem estoque</Badge>
    } else if (quantity < 10) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Baixo estoque</Badge>
    }
    return <Badge variant="default" className="text-green-600 border-green-600">Em estoque</Badge>
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getProductImage = (product: Product) => {
    // Use odoo_image if available
    if (product.odoo_image) {
      return `data:image/jpeg;base64,${product.odoo_image}`
    }
    
    return null
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
        <div className="flex gap-2">
          <Link href="/admin/import-odoo">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar de Odoo
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, SKU ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                <SelectItem value="discontinued">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              Mostrando {products.length} de {totalPages * itemsPerPage} produtos
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Odoo ID</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-red-600">
                    Erro: {error}
                  </TableCell>
                </TableRow>
              ) : loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const imageUrl = getProductImage(product)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                console.error('Product image error:', product.name)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          {product.sale_price ? (
                            <>
                              <div className="font-medium text-red-600">
                                {formatPrice(product.sale_price)}
                              </div>
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.price)}
                              </div>
                            </>
                          ) : (
                            <div className="font-medium">{formatPrice(product.price)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium">{product.stock_quantity}</span>
                          {getStockBadge(product.stock_quantity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? "default" : "secondary"}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.odoo_id || '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={`/admin/products/${product.id}`}>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            {product.active ? (
                              <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'inactive')}>
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'active')}>
                                Ativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}