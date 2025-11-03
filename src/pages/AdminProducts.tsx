import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Plus, Edit2, Trash2, Search, ArrowLeft, Upload, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AdminHeader } from '@/components/AdminHeader';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  color: z.string().optional(),
  retail_price: z.string().optional(),
  wholesale_price: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const AdminProducts = () => {
  const { user, signOut } = useAuth();
  const { products, loading, error, fetchProducts, getCategories } = useProducts();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    retail_price: '',
    wholesale_price: '',
    category: '',
    subcategory: '',
  });
  const [isQuickPromoOpen, setIsQuickPromoOpen] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      subcategory: '',
      color: '',
      retail_price: '',
      wholesale_price: '',
    },
  });

  // Função para encontrar preços padrão de uma categoria
  const getDefaultPricesForCategory = (category: string) => {
    const productInCategory = products.find(p => p.category === category);
    return {
      retail_price: productInCategory?.retail_price?.toString() || '',
      wholesale_price: productInCategory?.wholesale_price?.toString() || '',
    };
  };

  // Atualizar nome quando categoria, subcategoria ou cor mudam
  const updateProductName = (category: string, subcategory: string, color: string) => {
    if ((category || subcategory) && !editingProduct) {
      // Prioriza subcategoria se existir, senão usa categoria
      const baseName = subcategory || category;
      const fullName = color ? `${baseName} ${color}` : baseName;
      form.setValue('name', fullName);
    }
  };

  const categories = getCategories();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('catalog')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da imagem',
        variant: 'destructive',
      });
      return null;
    }
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      setIsSubmitting(true);
      
      let imageUrl = editingProduct?.image_url || '';
      
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const productData = {
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || null,
        retail_price: data.retail_price ? parseFloat(data.retail_price.replace(',', '.')) : null,
        wholesale_price: data.wholesale_price ? parseFloat(data.wholesale_price.replace(',', '.')) : null,
        image_url: imageUrl || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Produto atualizado com sucesso!',
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        
        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Produto criado com sucesso!',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar produto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setIsNewCategory(false);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    
    // Tentar extrair a cor do nome do produto
    const categoryRegex = new RegExp(`^${product.category}\\s*(.*)$`, 'i');
    const match = product.name.match(categoryRegex);
    const extractedColor = match ? match[1].trim() : '';
    
    form.reset({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      color: extractedColor,
      retail_price: product.retail_price ? product.retail_price.toString() : '',
      wholesale_price: product.wholesale_price ? product.wholesale_price.toString() : '',
    });
    setImagePreview(product.image_url || null);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    form.reset({
      name: '',
      category: '',
      subcategory: '',
      color: '',
      retail_price: '',
      wholesale_price: '',
    });
    setIsDialogOpen(true);
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkEdit = async () => {
    if (selectedProducts.size === 0) return;

    try {
      const updates: any = {};
      if (bulkEditData.retail_price) {
        updates.retail_price = parseFloat(bulkEditData.retail_price.replace(',', '.'));
      }
      if (bulkEditData.wholesale_price) {
        updates.wholesale_price = parseFloat(bulkEditData.wholesale_price.replace(',', '.'));
      }
      if (bulkEditData.category) {
        updates.category = bulkEditData.category;
      }
      if (bulkEditData.subcategory) {
        updates.subcategory = bulkEditData.subcategory;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: 'Atenção',
          description: 'Nenhum campo foi preenchido para edição',
          variant: 'destructive',
        });
        return;
      }

      for (const productId of Array.from(selectedProducts)) {
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', productId);
        
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: `${selectedProducts.size} produto(s) atualizado(s) com sucesso!`,
      });

      setIsBulkEditOpen(false);
      setSelectedProducts(new Set());
      setBulkEditData({
        retail_price: '',
        wholesale_price: '',
        category: '',
        subcategory: '',
      });
      fetchProducts();
    } catch (error) {
      console.error('Erro ao atualizar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar produtos em massa',
        variant: 'destructive',
      });
    }
  };

  const handleQuickPromotion = async () => {
    if (selectedProducts.size === 0 || !promoPrice) {
      toast({
        title: 'Atenção',
        description: 'Selecione produtos e informe o preço promocional',
        variant: 'destructive',
      });
      return;
    }

    try {
      const priceValue = parseFloat(promoPrice.replace(',', '.'));
      
      for (const productId of Array.from(selectedProducts)) {
        const { error } = await supabase
          .from('products')
          .update({
            is_promotion: true,
            promotion_price: priceValue,
          })
          .eq('id', productId);
        
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: `${selectedProducts.size} produto(s) marcado(s) como promoção!`,
      });

      setIsQuickPromoOpen(false);
      setSelectedProducts(new Set());
      setPromoPrice('');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar promoção rápida',
        variant: 'destructive',
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso!',
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir produto',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader 
          title="Gerenciar Produtos" 
          description={`${products.length} produtos cadastrados`} 
        />

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'todos' ? 'Todas as categorias' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {selectedProducts.size > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsBulkEditOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar {selectedProducts.size}
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => setIsQuickPromoOpen(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-accent to-primary"
                    >
                      🔥 Promoção Rápida
                    </Button>
                  </>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Imagem do Produto *</label>
                        <div className="flex flex-col gap-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="flex-1"
                          />
                          {imagePreview && (
                            <div className="relative w-32 h-32 mx-auto">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg border-2 border-border shadow-md"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria *</FormLabel>
                            <FormControl>
                              {isNewCategory ? (
                                <div className="space-y-2">
                                  <Input 
                                    {...field} 
                                    placeholder="Digite a nova categoria"
                                    onChange={(e) => {
                                      field.onChange(e);
                                      updateProductName(e.target.value, form.getValues('subcategory') || '', form.getValues('color') || '');
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setIsNewCategory(false);
                                      form.setValue('category', '');
                                      form.setValue('name', '');
                                    }}
                                    className="text-xs"
                                  >
                                    Selecionar categoria existente
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Select 
                                    value={field.value} 
                                    onValueChange={(value) => {
                                      if (value === '__new__') {
                                        setIsNewCategory(true);
                                        form.setValue('category', '');
                                        form.setValue('name', '');
                                      } else {
                                        field.onChange(value);
                                        // Pré-preencher preços da categoria
                                        if (!editingProduct) {
                                          const defaultPrices = getDefaultPricesForCategory(value);
                                          form.setValue('retail_price', defaultPrices.retail_price);
                                          form.setValue('wholesale_price', defaultPrices.wholesale_price);
                                        }
                                        // Atualizar nome
                                        updateProductName(value, form.getValues('subcategory') || '', form.getValues('color') || '');
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__new__">
                                        + Nova Categoria
                                      </SelectItem>
                                      {categories
                                        .filter(cat => cat !== 'todos')
                                        .map(category => (
                                          <SelectItem key={category} value={category}>
                                            {category}
                                          </SelectItem>
                                        ))
                                      }
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoria</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Ex: Blusas, Calças, Vestidos"
                                onChange={(e) => {
                                  field.onChange(e);
                                  updateProductName(form.getValues('category'), e.target.value, form.getValues('color') || '');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cor</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ex: Argila, Preto, Azul"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    updateProductName(form.getValues('category'), form.getValues('subcategory'), e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Final *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!editingProduct}
                                  className="bg-muted"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="retail_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Varejo</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ex: 29.90"
                                  type="text"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="wholesale_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Atacado</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ex: 25.90"
                                  type="text"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Dialog de Edição em Massa */}
              <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar {selectedProducts.size} produto(s) selecionado(s)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categoria (deixe vazio para não alterar)</label>
                      <Select 
                        value={bulkEditData.category} 
                        onValueChange={(value) => setBulkEditData({...bulkEditData, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Não alterar</SelectItem>
                          {categories
                            .filter(cat => cat !== 'todos')
                            .map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subcategoria</label>
                      <Input
                        value={bulkEditData.subcategory}
                        onChange={(e) => setBulkEditData({...bulkEditData, subcategory: e.target.value})}
                        placeholder="Ex: Blusas (deixe vazio para não alterar)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preço Varejo</label>
                        <Input
                          value={bulkEditData.retail_price}
                          onChange={(e) => setBulkEditData({...bulkEditData, retail_price: e.target.value})}
                          placeholder="Ex: 29.90"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preço Atacado</label>
                        <Input
                          value={bulkEditData.wholesale_price}
                          onChange={(e) => setBulkEditData({...bulkEditData, wholesale_price: e.target.value})}
                          placeholder="Ex: 25.90"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsBulkEditOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleBulkEdit}>
                        Aplicar Alterações
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                Erro ao carregar produtos: {error}
              </div>
            )}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSelectAll}
                        className="h-8 w-8 p-0"
                      >
                        {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-16">Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead>Varejo</TableHead>
                    <TableHead>Atacado</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchTerm || selectedCategory !== 'todos' 
                          ? 'Nenhum produto encontrado com os filtros aplicados.'
                          : 'Nenhum produto cadastrado ainda.'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleProductSelection(product.id)}
                            className="h-8 w-8 p-0"
                          >
                            {selectedProducts.has(product.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.subcategory ? (
                            <Badge variant="secondary">{product.subcategory}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatPrice(product.retail_price)}</TableCell>
                        <TableCell>{formatPrice(product.wholesale_price)}</TableCell>
                        <TableCell>{formatDate(product.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o produto "{product.name}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProduct(product.id)}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Promotion Dialog */}
        <Dialog open={isQuickPromoOpen} onOpenChange={setIsQuickPromoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🔥 Promoção Rápida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedProducts.size} produto(s) selecionado(s)
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço Promocional *</label>
                <Input
                  placeholder="Ex: 29.90"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsQuickPromoOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleQuickPromotion} className="bg-gradient-to-r from-accent to-primary">
                  Aplicar Promoção
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminProducts;