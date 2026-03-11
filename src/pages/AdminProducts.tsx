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
import { LogOut, Plus, Edit2, Trash2, Search, ArrowLeft, Upload, CheckSquare, Square, ListOrdered } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminBannersSection } from '@/components/AdminBannersSection';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  color: z.string().optional(),
  retail_price: z.string().optional(),
  wholesale_price: z.string().optional(),
  weight_kg: z.string().optional(),
  display_emoji: z.string().optional(),
  model_name: z.string().optional(),
  color_name: z.string().optional(),
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
    is_featured: '' as '' | 'true' | 'false',
    is_promotion: '' as '' | 'true' | 'false',
    is_launch: '' as '' | 'true' | 'false',
    is_out_of_stock: '' as '' | 'true' | 'false',
    promotion_retail_price: '',
    promotion_wholesale_price: '',
  });
  const [isQuickPromoOpen, setIsQuickPromoOpen] = useState(false);
  const [promoWholesalePrice, setPromoWholesalePrice] = useState('');
  const [promoRetailPrice, setPromoRetailPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Size presets by category
  const SIZE_PRESETS: Record<string, string[]> = {
    'default': ['Tamanho Único (36 ao 44)'],
    'plus_size': ['44', '46', '48', '50', '52', '54'],
    'infantil': ['2', '4', '6', '8', '10', '12'],
    'kit': ['Tamanho Único'],
  };

  const getSizePresetForCategory = (category: string): string[] => {
    const lower = category.toLowerCase();
    if (lower.includes('plus') || lower.includes('plus size')) return SIZE_PRESETS.plus_size;
    if (lower.includes('infantil') || lower.includes('infantis') || lower.includes('kids')) return SIZE_PRESETS.infantil;
    if (lower.includes('kit') || lower.includes('kits')) return SIZE_PRESETS.kit;
    return SIZE_PRESETS.default;
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      subcategory: '',
      color: '',
      retail_price: '',
      wholesale_price: '',
      weight_kg: '',
      display_emoji: '',
      model_name: '',
      color_name: '',
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
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg.replace(',', '.')) : null,
        display_emoji: data.display_emoji || null,
        model_name: data.model_name || null,
        color_name: data.color_name || null,
        image_url: imageUrl || null,
        sizes: selectedSizes.length > 0 ? selectedSizes : null,
        display_order: 0,
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
    setSelectedSizes([]);
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
      weight_kg: product.weight_kg ? product.weight_kg.toString() : '',
      display_emoji: (product as any).display_emoji || '',
      model_name: (product as any).model_name || '',
      color_name: (product as any).color_name || '',
    });
    setImagePreview(product.image_url || null);
    setSelectedSizes(product.sizes || []);
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
      weight_kg: '',
      display_emoji: '',
      model_name: '',
      color_name: '',
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
      if (bulkEditData.is_featured !== '') {
        updates.is_featured = bulkEditData.is_featured === 'true';
      }
      if (bulkEditData.is_promotion !== '') {
        updates.is_promotion = bulkEditData.is_promotion === 'true';
        if (bulkEditData.is_promotion === 'false') {
          updates.promotion_retail_price = null;
          updates.promotion_wholesale_price = null;
        }
      }
      if (bulkEditData.is_launch !== '') {
        updates.is_launch = bulkEditData.is_launch === 'true';
      }
      if (bulkEditData.is_out_of_stock !== '') {
        updates.is_out_of_stock = bulkEditData.is_out_of_stock === 'true';
      }
      if (bulkEditData.promotion_retail_price) {
        updates.promotion_retail_price = parseFloat(bulkEditData.promotion_retail_price.replace(',', '.'));
      }
      if (bulkEditData.promotion_wholesale_price) {
        updates.promotion_wholesale_price = parseFloat(bulkEditData.promotion_wholesale_price.replace(',', '.'));
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
        is_featured: '',
        is_promotion: '',
        is_launch: '',
        is_out_of_stock: '',
        promotion_retail_price: '',
        promotion_wholesale_price: '',
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

  const handleRemovePromotion = async () => {
    if (selectedProducts.size === 0) return;

    try {
      for (const productId of Array.from(selectedProducts)) {
        const { error } = await supabase
          .from('products')
          .update({
            is_promotion: false,
            promotion_retail_price: null,
            promotion_wholesale_price: null,
          })
          .eq('id', productId);
        
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: `Promoção removida de ${selectedProducts.size} produto(s)!`,
      });

      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Erro ao remover promoção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover promoção',
        variant: 'destructive',
      });
    }
  };

  const handleToggleLaunch = async (setAsLaunch: boolean) => {
    if (selectedProducts.size === 0) return;

    try {
      for (const productId of Array.from(selectedProducts)) {
        const { error } = await supabase
          .from('products')
          .update({ is_launch: setAsLaunch })
          .eq('id', productId);
        
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: setAsLaunch 
          ? `${selectedProducts.size} produto(s) marcado(s) como lançamento!`
          : `Lançamento removido de ${selectedProducts.size} produto(s)!`,
      });

      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Erro ao alterar lançamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar lançamento',
        variant: 'destructive',
      });
    }
  };

  const handleToggleOutOfStock = async (setAsOutOfStock: boolean) => {
    if (selectedProducts.size === 0) return;

    try {
      for (const productId of Array.from(selectedProducts)) {
        const { error } = await supabase
          .from('products')
          .update({ is_out_of_stock: setAsOutOfStock })
          .eq('id', productId);
        
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: setAsOutOfStock 
          ? `${selectedProducts.size} produto(s) marcado(s) como esgotado!`
          : `Estoque restaurado para ${selectedProducts.size} produto(s)!`,
      });

      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Erro ao alterar estoque:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar estoque',
        variant: 'destructive',
      });
    }
  };

  const handleQuickPromotion = async () => {
    if (selectedProducts.size === 0 || (!promoWholesalePrice && !promoRetailPrice)) {
      toast({
        title: 'Atenção',
        description: 'Selecione produtos e informe pelo menos um preço promocional',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updates: any = { is_promotion: true };
      
      if (promoWholesalePrice) {
        updates.promotion_wholesale_price = parseFloat(promoWholesalePrice.replace(',', '.'));
      }
      if (promoRetailPrice) {
        updates.promotion_retail_price = parseFloat(promoRetailPrice.replace(',', '.'));
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
        description: `${selectedProducts.size} produto(s) marcado(s) como promoção!`,
      });

      setIsQuickPromoOpen(false);
      setSelectedProducts(new Set());
      setPromoWholesalePrice('');
      setPromoRetailPrice('');
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

        {/* Banner Management */}
        <AdminBannersSection />

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
              <div className="flex flex-wrap gap-2">
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
                      🔥 Promoção
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleRemovePromotion}
                      className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      ❌ Tirar Promo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleToggleLaunch(true)}
                      className="flex items-center gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    >
                      ✨ Lançamento
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleToggleLaunch(false)}
                      className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      ❌ Tirar Lanç.
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleToggleOutOfStock(true)}
                      className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      🚫 Esgotado
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleToggleOutOfStock(false)}
                      className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                    >
                      ✅ Em Estoque
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
                <Link to="/admin/categories">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    Ordenar Categorias
                  </Button>
                </Link>
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
                        render={({ field }) => {
                          const existingSubcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))] as string[];
                          return (
                            <FormItem>
                              <FormLabel>Subcategoria (Modelo)</FormLabel>
                              <FormControl>
                                <Select 
                                  value={field.value || undefined} 
                                  onValueChange={(value) => {
                                    if (value === '__new__') {
                                      // Switch to input mode - clear and let user type
                                      field.onChange('');
                                    } else {
                                      field.onChange(value);
                                      updateProductName(form.getValues('category'), value, form.getValues('color') || '');
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione ou crie nova" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__new__">+ Nova Subcategoria</SelectItem>
                                    {existingSubcategories.map(sub => (
                                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              {field.value === '' && (
                                <Input 
                                  placeholder="Digite a nova subcategoria"
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    updateProductName(form.getValues('category'), e.target.value, form.getValues('color') || '');
                                  }}
                                  className="mt-2"
                                />
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
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

                      <FormField
                        control={form.control}
                        name="weight_kg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Ex: 0.5"
                                type="text"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Usado para cálculo de frete. Deixe vazio para usar 0.5kg padrão.
                            </p>
                          </FormItem>
                        )}
                      />

                      {/* WhatsApp Display Fields */}
                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-foreground mb-3">📱 Campos para WhatsApp</p>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="display_emoji"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emoji</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="👗"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="model_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Modelo</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Ex: Celina, Jade"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Usado no agrupamento do WhatsApp</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="color_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Cor</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Ex: Preto, Cereja"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Exibido na lista de cores</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar {selectedProducts.size} produto(s) selecionado(s)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categoria (deixe vazio para não alterar)</label>
                      <Select 
                        value={bulkEditData.category || undefined} 
                        onValueChange={(value) => setBulkEditData({...bulkEditData, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Não alterar" />
                        </SelectTrigger>
                        <SelectContent>
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

                    {/* Status Badges */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">⭐ Destaque</label>
                        <Select 
                          value={bulkEditData.is_featured || undefined} 
                          onValueChange={(value) => setBulkEditData({...bulkEditData, is_featured: value as '' | 'true' | 'false'})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Não alterar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">🔥 Promoção</label>
                        <Select 
                          value={bulkEditData.is_promotion || undefined} 
                          onValueChange={(value) => setBulkEditData({...bulkEditData, is_promotion: value as '' | 'true' | 'false'})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Não alterar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">✨ Lançamento</label>
                        <Select 
                          value={bulkEditData.is_launch || undefined} 
                          onValueChange={(value) => setBulkEditData({...bulkEditData, is_launch: value as '' | 'true' | 'false'})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Não alterar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">🚫 Esgotado</label>
                        <Select 
                          value={bulkEditData.is_out_of_stock || undefined} 
                          onValueChange={(value) => setBulkEditData({...bulkEditData, is_out_of_stock: value as '' | 'true' | 'false'})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Não alterar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Preços Promocionais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">💸 Preço Promo Varejo</label>
                        <Input
                          value={bulkEditData.promotion_retail_price}
                          onChange={(e) => setBulkEditData({...bulkEditData, promotion_retail_price: e.target.value})}
                          placeholder="Ex: 19.90"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">💸 Preço Promo Atacado</label>
                        <Input
                          value={bulkEditData.promotion_wholesale_price}
                          onChange={(e) => setBulkEditData({...bulkEditData, promotion_wholesale_price: e.target.value})}
                          placeholder="Ex: 15.90"
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
                <label className="text-sm font-medium">Preço Promocional Atacado</label>
                <Input
                  placeholder="Ex: 19.90"
                  value={promoWholesalePrice}
                  onChange={(e) => setPromoWholesalePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço Promocional Varejo</label>
                <Input
                  placeholder="Ex: 29.90"
                  value={promoRetailPrice}
                  onChange={(e) => setPromoRetailPrice(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                * Preencha pelo menos um dos campos acima
              </p>
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