"use client"

import { useEffect, useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  FolderTree,
  Search,
  Save,
  X,
  ChevronRight
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  parent?: Category
  children?: Category[]
  products_count?: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: "",
    display_order: 0,
    is_active: true
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [searchTerm])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id(name),
          children:categories!parent_id(id, name)
        `)
        .order('display_order', { ascending: true })

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('product_categories')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
          
          return {
            ...category,
            products_count: count || 0
          }
        })
      )

      setCategories(categoriesWithCounts)
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        parent_id: category.parent_id || "",
        display_order: category.display_order,
        is_active: category.is_active
      })
    } else {
      setSelectedCategory(null)
      setFormData({
        name: "",
        slug: "",
        description: "",
        parent_id: "",
        display_order: 0,
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedCategory(null)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáäâ]/g, 'a')
      .replace(/[èéëê]/g, 'e')
      .replace(/[ìíïî]/g, 'i')
      .replace(/[òóöô]/g, 'o')
      .replace(/[ùúüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const categoryData = {
        ...formData,
        parent_id: formData.parent_id || null,
        updated_at: new Date().toISOString()
      }

      if (selectedCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', selectedCategory.id)

        if (error) throw error

        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({
            ...categoryData,
            created_at: new Date().toISOString()
          })

        if (error) throw error

        toast.success('Categoria criada com sucesso!')
      }

      closeDialog()
      fetchCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error.message || 'Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      // Check if category has products
      if (selectedCategory.products_count && selectedCategory.products_count > 0) {
        toast.error('Não é possível excluir categoria com produtos')
        return
      }

      // Check if category has children
      if (selectedCategory.children && selectedCategory.children.length > 0) {
        toast.error('Não é possível excluir categoria com subcategorias')
        return
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id)

      if (error) throw error

      toast.success('Categoria excluída com sucesso!')
      setDeleteDialogOpen(false)
      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error('Erro ao excluir categoria')
    }
  }

  const toggleStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          is_active: !category.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', category.id)

      if (error) throw error

      toast.success(`Categoria ${!category.is_active ? 'ativada' : 'desativada'} com sucesso!`)
      fetchCategories()
    } catch (error: any) {
      console.error('Error toggling status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const buildCategoryTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }))
  }

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const rows = []
    
    rows.push(
      <TableRow key={category.id}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {level > 0 && <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />}
            <div>
              <div className="font-medium">{category.name}</div>
              <div className="text-sm text-muted-foreground">{category.slug}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {category.description ? (
            <span className="text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {category.parent?.name || '-'}
        </TableCell>
        <TableCell>
          <Badge variant="outline">{category.products_count || 0} produtos</Badge>
        </TableCell>
        <TableCell>
          <Switch
            checked={category.is_active}
            onCheckedChange={() => toggleStatus(category)}
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDialog(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory(category)
                setDeleteDialogOpen(true)
              }}
              disabled={
                (category.products_count && category.products_count > 0) ||
                (category.children && category.children.length > 0)
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )

    // Render children recursively
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        rows.push(...renderCategoryRow(child, level + 1))
      })
    }

    return rows
  }

  const categoryTree = buildCategoryTree(categories)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gestão de Categorias</CardTitle>
          <CardDescription>
            Organize seus produtos em categorias hierárquicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <FolderTree className="h-4 w-4 mr-2" />
              Visualizar Árvore
            </Button>
          </div>

          <Table>
            <TableCaption>
              Total de {categories.length} categorias cadastradas
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria Pai</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
                categoryTree.map(category => renderCategoryRow(category))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory 
                ? 'Atualize as informações da categoria' 
                : 'Preencha os dados para criar uma nova categoria'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parent_id">Categoria Pai</Label>
                <select
                  id="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Nenhuma (categoria principal)</option>
                  {categories
                    .filter(cat => cat.id !== selectedCategory?.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Categoria ativa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A categoria "{selectedCategory?.name}" 
              será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}