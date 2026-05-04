import { useState, useEffect, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Plus, Edit2, Trash2, Search, ArrowLeft, Upload, CheckSquare, Square, ListOrdered, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminBannersSection } from '@/components/AdminBannersSection';
import { ProductCard } from '@/components/ProductCard';
import { cn } from '@/lib/utils';

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
  is_launch: z.boolean().default(false),
  is_promotion: z.boolean().default(false),
  promotion_retail_price: z.string().optional(),
  promotion_wholesale_price: z.string().optional(),
  is_out_of_stock: z.boolean().default(false),
  is_kit: z.boolean().default(false),
  kit_piece_count: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const AdminProducts = () => {
  const { user, signOut } = useAuth();
  const { products, loading, error, fetchProducts, getCategories, categoryOrders } = useProducts();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState('todos');
  const [filterLaunches, setFilterLaunches] = useState(false);
  const [filterPromotions, setFilterPromotions] = useState(false);
  const [filterDataHealth, setFilterDataHealth] = useState(false);
  const scrollPosRef = useRef<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewSubcategory, setIsNewSubcategory] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    retail_price: '',
    wholesale_price: '',
    category: 'keep',
    subcategory: '',
    is_launch: 'keep' as 'keep' | 'yes' | 'no',
    is_promotion: 'keep' as 'keep' | 'yes' | 'no',
    promotion_retail_price: '',
    promotion_wholesale_price: '',
    display_emoji: '',
    model_name: '',
    color_name: '',
    weight_kg: '',
    sizes: [] as string[],
    is_out_of_stock: 'keep' as 'keep' | 'yes' | 'no',
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  // ── Estado específico para kits ──
  const [kitColors, setKitColors] = useState<string[]>([]);
  const [kitColorInput, setKitColorInput] = useState('');

  // Size presets by category
  const SIZE_PRESETS: Record<string, string[]> = {
    'adult': ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'],
    'numeric': ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'],
    'plus_size': ['44', '46', '48', '50', '52', '54', 'G1', 'G2', 'G3'],
    'infantil': ['2', '4', '6', '8', '10', '12', '14', '16'],
    'unico': ['Tamanho Único', 'Tamanho Único (36 ao 44)'],
  };

  const getSizePresetForCategory = (category: string): string[] => {
    const lower = category.toLowerCase();
    if (lower.includes('plus') || lower.includes('plus size')) return SIZE_PRESETS.plus_size;
    if (lower.includes('infantil') || lower.includes('infantis') || lower.includes('kids')) return SIZE_PRESETS.infantil;
    if (lower.includes('kit') || lower.includes('kits') || lower.includes('acessórios')) return SIZE_PRESETS.unico;
    return SIZE_PRESETS.adult;
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
      is_launch: false,
      is_promotion: false,
      promotion_retail_price: '',
      promotion_wholesale_price: '',
      is_out_of_stock: false,
      is_kit: false,
      kit_piece_count: '',
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
    if ((category || subcategory) && !editingProduct && !isNameManuallyEdited) {
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
    const matchesSubcategory = selectedSubcategory === 'todos' || product.subcategory === selectedSubcategory;
    const matchesLaunch = !filterLaunches || product.is_launch;
    const matchesPromotion = !filterPromotions || product.is_promotion;
    
    const isProblematic = (
      product.name.toLowerCase().includes('test') || 
      product.model_name?.toLowerCase().includes('test') || 
      product.color_name?.toLowerCase().includes('test') ||
      product.name.toLowerCase().includes('placeholder')
    );
    
    const matchesDataHealth = !filterDataHealth || isProblematic;
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesLaunch && matchesPromotion && matchesDataHealth;
  });

  // Sync kit colors with color_name form field
  useEffect(() => {
    const isKit = form.watch('is_kit');
    if (isKit && kitColors.length > 0) {
      const colorsString = kitColors.join(', ');
      form.setValue('color_name', colorsString);
      
      // Auto-update name for kits if not manually edited
      const category = form.watch('category');
      const subcategory = form.watch('subcategory');
      const pieceCount = form.watch('kit_piece_count');
      const baseName = subcategory || category;
      
      if (!isNameManuallyEdited && baseName) {
        const kitPrefix = pieceCount ? `Kit ${pieceCount} Peças` : 'Kit';
        form.setValue('name', `${kitPrefix} ${baseName}`);
      }
    }
  }, [kitColors, form.watch('is_kit'), form.watch('kit_piece_count'), form.watch('category'), form.watch('subcategory'), isNameManuallyEdited]);

  // Restauração de Scroll reativa
  useEffect(() => {
    if (shouldRestoreScroll && !loading && products.length > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPosRef.current);
        setShouldRestoreScroll(false);
      }, 50); // Delay mínimo apenas para garantir render do DOM
      return () => clearTimeout(timer);
    }
  }, [products, shouldRestoreScroll, loading]);

  const addKitColor = (color: string) => {
    const trimmed = color.trim();
    if (trimmed && !kitColors.includes(trimmed)) {
      setKitColors([...kitColors, trimmed]);
      setKitColorInput('');
    }
  };

  const removeKitColor = (index: number) => {
    setKitColors(kitColors.filter((_, i) => i !== index));
  };

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
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Tentando upload para Supabase no bucket "catalog":', filePath);

      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error('Erro detalhado Supabase Storage:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('catalog')
        .getPublicUrl(filePath);

      console.log('Upload bem-sucedido. URL:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: 'Erro no Upload',
        description: `Não foi possível salvar a imagem no Supabase: ${error.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      setIsSubmitting(true);

      // Validação de termos de teste
      const forbiddenTerms = ['final test', 'teste', 'placeholder'];
      const fieldsToWatch = [data.name, data.model_name, data.color_name, data.category, data.subcategory];
      
      const hasForbiddenTerm = forbiddenTerms.some(term => 
        fieldsToWatch.some(field => field?.toLowerCase().includes(term))
      );

      if (hasForbiddenTerm) {
        toast({
          title: "Dados Inválidos",
          description: "Os termos 'final test', 'teste' ou 'placeholder' não são permitidos nos dados do produto.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      let imageUrl = editingProduct?.image_url || '';
      
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const categoryObj = categoryOrders.find(c => c.name.toLowerCase() === data.category.toLowerCase());

      const productData = {
        name: data.name,
        category: data.category,
        category_id: categoryObj ? categoryObj.id : null,
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
        is_launch: data.is_launch,
        is_promotion: data.is_promotion,
        is_out_of_stock: data.is_out_of_stock,
        is_kit: data.is_kit,
        kit_piece_count: data.is_kit && data.kit_piece_count ? parseInt(data.kit_piece_count) : null,
        promotion_retail_price: data.is_promotion && data.promotion_retail_price ? parseFloat(data.promotion_retail_price.replace(',', '.')) : null,
        promotion_wholesale_price: data.is_promotion && data.promotion_wholesale_price ? parseFloat(data.promotion_wholesale_price.replace(',', '.')) : null,
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

      scrollPosRef.current = window.scrollY;
      setShouldRestoreScroll(true);
      
      setIsDialogOpen(false);
      resetForm();
      await fetchProducts(true, true);
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
    setIsNewSubcategory(false);
    setSelectedSizes([]);
    setKitColors([]);
    setKitColorInput('');
    form.setValue('is_launch', false);
    form.setValue('is_promotion', false);
    form.setValue('is_out_of_stock', false);
    form.setValue('is_kit', false);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsNameManuallyEdited(true);
    
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
      is_launch: product.is_launch || false,
      is_promotion: product.is_promotion || false,
      is_out_of_stock: product.is_out_of_stock || false,
      is_kit: product.is_kit || false,
      kit_piece_count: product.kit_piece_count ? product.kit_piece_count.toString() : '',
      promotion_retail_price: product.promotion_retail_price ? product.promotion_retail_price.toString() : '',
      promotion_wholesale_price: product.promotion_wholesale_price ? product.promotion_wholesale_price.toString() : '',
    });

    if (product.is_kit && product.color_name) {
      setKitColors(product.color_name.split(',').map(c => c.trim()).filter(Boolean));
    } else {
      setKitColors([]);
    }
    setImagePreview(product.image_url || null);
    setSelectedSizes(product.sizes || []);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsNameManuallyEdited(false);
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
      is_launch: false,
      is_promotion: false,
      is_out_of_stock: false,
      is_kit: false,
      kit_piece_count: '',
      promotion_retail_price: '',
      promotion_wholesale_price: '',
    });
    setKitColors([]);
    setKitColorInput('');
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
      setIsSubmitting(true);

      // Validação de termos de teste na edição em massa
      const forbiddenTerms = ['final test', 'teste', 'placeholder'];
      const bulkFields = [bulkEditData.model_name, bulkEditData.color_name, bulkEditData.subcategory];
      const hasForbiddenTerm = forbiddenTerms.some(term => 
        bulkFields.some(field => field?.toLowerCase().includes(term))
      );

      if (hasForbiddenTerm) {
        toast({
          title: "Dados Inválidos",
          description: "Não é permitido usar termos de teste ('final test', 'teste', etc) na edição em massa.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const updates: any = {};
      if (bulkEditData.retail_price) {
        updates.retail_price = parseFloat(bulkEditData.retail_price.replace(',', '.'));
      }
      if (bulkEditData.wholesale_price) {
        updates.wholesale_price = parseFloat(bulkEditData.wholesale_price.replace(',', '.'));
      }
      if (bulkEditData.category && bulkEditData.category !== 'keep') {
        updates.category = bulkEditData.category;
        const categoryObj = categoryOrders.find(c => c.name.toLowerCase() === bulkEditData.category.toLowerCase());
        if (categoryObj) updates.category_id = categoryObj.id;
      }
      if (bulkEditData.subcategory) {
        updates.subcategory = bulkEditData.subcategory;
      }
      
      // Boolean fields
      if (bulkEditData.is_launch !== 'keep') {
        updates.is_launch = bulkEditData.is_launch === 'yes';
      }
      if (bulkEditData.is_promotion !== 'keep') {
        updates.is_promotion = bulkEditData.is_promotion === 'yes';
      }
      if (bulkEditData.is_out_of_stock !== 'keep') {
        updates.is_out_of_stock = bulkEditData.is_out_of_stock === 'yes';
      }

      // Promotion prices
      if (bulkEditData.promotion_retail_price) {
        updates.promotion_retail_price = parseFloat(bulkEditData.promotion_retail_price.replace(',', '.'));
      }
      if (bulkEditData.promotion_wholesale_price) {
        updates.promotion_wholesale_price = parseFloat(bulkEditData.promotion_wholesale_price.replace(',', '.'));
      }

      // Other fields
      if (bulkEditData.display_emoji) updates.display_emoji = bulkEditData.display_emoji;
      if (bulkEditData.model_name) updates.model_name = bulkEditData.model_name;
      if (bulkEditData.color_name) updates.color_name = bulkEditData.color_name;
      if (bulkEditData.weight_kg) updates.weight_kg = parseFloat(bulkEditData.weight_kg.replace(',', '.'));
      if (bulkEditData.sizes.length > 0) updates.sizes = bulkEditData.sizes;

      if (Object.keys(updates).length === 0) {
        toast({
          title: 'Atenção',
          description: 'Nenhum campo foi preenchido para edição',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .in('id', Array.from(selectedProducts));
      
      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${selectedProducts.size} produto(s) atualizado(s) com sucesso!`,
      });

      scrollPosRef.current = window.scrollY;
      setShouldRestoreScroll(true);
      
      setIsBulkEditOpen(false);
      setSelectedProducts(new Set());
      setBulkEditData({
        retail_price: '',
        wholesale_price: '',
        category: 'keep',
        subcategory: '',
        is_launch: 'keep',
        is_promotion: 'keep',
        promotion_retail_price: '',
        promotion_wholesale_price: '',
        display_emoji: '',
        model_name: '',
        color_name: '',
        weight_kg: '',
        sizes: [],
        is_out_of_stock: 'keep',
      });
      await fetchProducts(true, true);
    } catch (error) {
      console.error('Erro ao atualizar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar produtos em massa',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStock = async (id: string, currentStatus: boolean) => {
    try {
      scrollPosRef.current = window.scrollY;
      setShouldRestoreScroll(true);
      
      const { error } = await supabase
        .from('products')
        .update({ is_out_of_stock: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Estoque atualizado',
        description: !currentStatus ? 'Produto marcado como esgotado' : 'Produto agora está em estoque!',
      });
      await fetchProducts(true, true);
    } catch (error) {
      console.error('Error toggling stock:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar estoque',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePromotion = async () => {
    if (selectedProducts.size === 0) return;

    try {
      setIsSubmitting(true);
      scrollPosRef.current = window.scrollY;
      setShouldRestoreScroll(true);
      
      const { error } = await supabase
        .from('products')
        .update({
          is_promotion: false,
          promotion_retail_price: null,
          promotion_wholesale_price: null,
        })
        .in('id', Array.from(selectedProducts));
      
      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Promoção removida de ${selectedProducts.size} produto(s)!`,
      });

      setSelectedProducts(new Set());
      await fetchProducts(true, true);
    } catch (error) {
      console.error('Erro ao remover promoção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover promoção',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

// Funções de toggle de status removidas

// Lógica de promoção rápida removida

  const deleteProduct = async (productId: string) => {
    try {
      scrollPosRef.current = window.scrollY;
      setShouldRestoreScroll(true);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso!',
      });
      
      await fetchProducts(true, true);
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
                <Select value={selectedCategory} onValueChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubcategory('todos');
                }}>
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

                {selectedCategory !== 'todos' && (
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as subcategorias</SelectItem>
                      {[...new Set(products
                        .filter(p => p.category === selectedCategory)
                        .map(p => p.subcategory)
                        .filter(Boolean))].map(sub => (
                        <SelectItem key={sub!} value={sub!}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                  <div className="flex items-center gap-2">
                    <Switch 
                      id="filter-data-health" 
                      checked={filterDataHealth} 
                      onCheckedChange={setFilterDataHealth} 
                    />
                    <label htmlFor="filter-data-health" className="text-sm font-medium cursor-pointer text-destructive">Saúde dos Dados</label>
                  </div>
                </div>
              </div>

              {/* Data Health Warning */}
              {products.some(p => (
                p.name.toLowerCase().includes('test') || 
                (p as any).model_name?.toLowerCase().includes('test') || 
                (p as any).color_name?.toLowerCase().includes('test')
              )) && (
                <div className="w-full mt-4 p-4 bg-red-100 border-2 border-red-200 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 rounded-full">
                      <X className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-red-900">Atenção: Dados de Teste Detectados!</p>
                      <p className="text-sm text-red-700">Existem produtos com "final test" ou outros termos de teste. Use o filtro <span className="font-bold underline cursor-pointer" onClick={() => setFilterDataHealth(true)}>Saúde dos Dados</span> para corrigi-los.</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setFilterDataHealth(true)}>Ver Problemas</Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/categories">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    Ordenar Categorias
                  </Button>
                </Link>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="max-w-2xl max-h-[90vh] overflow-y-auto"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
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
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== "/placeholder.svg") {
                                    target.src = "/placeholder.svg";
                                  }
                                }}
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
                                          // Auto-populate sizes
                                          setSelectedSizes(getSizePresetForCategory(value));
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
                                {isNewSubcategory ? (
                                  <div className="space-y-2">
                                    <Input 
                                      {...field} 
                                      placeholder="Digite a nova subcategoria"
                                      onChange={(e) => {
                                        field.onChange(e);
                                        updateProductName(form.getValues('category'), e.target.value, form.getValues('color') || '');
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setIsNewSubcategory(false);
                                        form.setValue('subcategory', '');
                                        updateProductName(form.getValues('category'), '', form.getValues('color') || '');
                                      }}
                                      className="text-xs"
                                    >
                                      Selecionar subcategoria existente
                                    </Button>
                                  </div>
                                ) : (
                                  <Select 
                                    value={field.value || undefined} 
                                    onValueChange={(value) => {
                                      if (value === '__new__') {
                                        setIsNewSubcategory(true);
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
                                )}
                              </FormControl>
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
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setIsNameManuallyEdited(true);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Configuração de Kit */}
                      <div className="space-y-4 border p-4 rounded-xl bg-muted/20 shadow-sm border-dashed">
                        <FormField
                          control={form.control}
                          name="is_kit"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-semibold">Este produto é um Kit? 🎁</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Ative para listar as cores peça por peça na separação do pedido.
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch('is_kit') && (
                          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                            <FormField
                              control={form.control}
                              name="kit_piece_count"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Qtd. de peças no Kit</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="Ex: 6" 
                                      type="number" 
                                      className="max-w-[120px]"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-3">
                              <FormLabel>Cores do Kit (Adicione uma por uma)</FormLabel>
                              <div className="flex gap-2">
                                <Input 
                                  value={kitColorInput} 
                                  onChange={(e) => setKitColorInput(e.target.value)}
                                  placeholder="Digite uma cor e dê Enter"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addKitColor(kitColorInput);
                                    }
                                  }}
                                />
                                <Button 
                                  type="button" 
                                  onClick={() => addKitColor(kitColorInput)} 
                                  variant="secondary"
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                                </Button>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 pt-1">
                                {kitColors.length === 0 ? (
                                  <p className="text-xs italic text-muted-foreground">Nenhuma cor adicionada ainda.</p>
                                ) : (
                                  kitColors.map((color, index) => (
                                    <Badge key={index} variant="outline" className="pl-3 pr-1 py-1 gap-1 bg-background text-sm">
                                      {color}
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full" 
                                        onClick={() => removeKitColor(index)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
                        render={({ field }) => {
                          const weightValue = parseFloat(field.value?.replace(',', '.') || '0');
                          const isSuspicious = weightValue > 5;
                          
                          return (
                            <FormItem>
                              <FormLabel className={isSuspicious ? "text-destructive font-bold" : ""}>
                                Peso (kg) {isSuspicious && "⚠️ VALOR ALTO"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ex: 0.250"
                                  type="text"
                                  className={isSuspicious ? "border-destructive bg-destructive/5" : ""}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className={cn("text-xs", isSuspicious ? "text-destructive font-semibold animate-pulse" : "text-muted-foreground")}>
                                {isSuspicious 
                                  ? "Atenção: Pesos acima de 5kg são incomuns para roupas. Verifique se não digitou gramas (ex: 350) em vez de kg (0.350)." 
                                  : "Usado para cálculo de frete. Deixe vazio para usar o padrão de 0.15kg por peça."}
                              </p>
                            </FormItem>
                          );
                        }}
                      />

                      {/* Tamanhos */}
                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-foreground mb-3">📏 Tamanhos</p>
                        <div className="space-y-4">
                          {/* Categorias de Tamanhos */}
                          <div className="space-y-3">
                            {Object.entries(SIZE_PRESETS).map(([key, sizes]) => (
                                <div key={key} className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                      {key === 'adult' ? 'Adulto' : 
                                       key === 'numeric' ? 'Numérico' : 
                                       key === 'plus_size' ? 'Plus Size' : 
                                       key === 'infantil' ? 'Infantil' : 'Único'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {sizes.map(size => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => toggleSize(size)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
                                                    selectedSizes.includes(size)
                                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                        : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                                                )}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                          </div>

                          {/* Tamanho Personalizado */}
                          <div className="flex gap-2 items-end">
                              <div className="flex-1 space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Personalizado</label>
                                  <Input 
                                    value={customSize}
                                    onChange={(e) => setCustomSize(e.target.value)}
                                    placeholder="Ex: PP, XG, 56"
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (customSize.trim()) {
                                                toggleSize(customSize.trim());
                                                setCustomSize('');
                                            }
                                        }
                                    }}
                                  />
                              </div>
                              <Button 
                                type="button"
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                    if (customSize.trim()) {
                                        toggleSize(customSize.trim());
                                        setCustomSize('');
                                    }
                                }}
                                className="h-8"
                              >
                                  Add
                              </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSizes(getSizePresetForCategory(form.getValues('category') || ''))}
                              className="text-xs"
                            >
                              Sugerir p/ Categoria
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSizes([])}
                              className="text-xs"
                            >
                              Limpar
                            </Button>
                          </div>
                          {selectedSizes.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Selecionados: {selectedSizes.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

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

                      {/* Configurações de Status */}
                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-foreground mb-3">⚙️ Status do Produto</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="is_launch"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Lançamento</FormLabel>
                                  <p className="text-xs text-muted-foreground">Novidade no catálogo</p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="is_promotion"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Promoção</FormLabel>
                                  <p className="text-xs text-muted-foreground">Produto em oferta</p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="is_out_of_stock"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-accent/5">
                                <div className="space-y-0.5">
                                  <FormLabel className="flex items-center gap-2">
                                    {field.value ? "❌ Sem Estoque" : "✅ Em Estoque"}
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    {field.value 
                                      ? "Oculto do catálogo público" 
                                      : "Visível no catálogo público"}
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={!field.value}
                                    onCheckedChange={(checked) => field.onChange(!checked)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {form.watch('is_promotion') && (
                            <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2 bg-destructive/5 p-4 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                              <FormField
                                control={form.control}
                                name="promotion_retail_price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-destructive font-bold">Preço Varejo PROMO</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Ex: 19.90" className="border-destructive/30" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="promotion_wholesale_price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-destructive font-bold">Preço Atacado PROMO</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Ex: 15.90" className="border-destructive/30" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
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
                    <TableHead>Estoque</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {searchTerm || selectedCategory !== 'todos' 
                          ? 'Nenhum produto encontrado com os filtros aplicados.'
                          : 'Nenhum produto cadastrado ainda.'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProductSelection(product.id);
                      }}
                    >
                      <div className="flex items-center justify-center h-full w-full">
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== "/placeholder.svg") {
                                  target.src = "/placeholder.svg";
                                }
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            {product.name}
                            <div className="flex flex-wrap gap-1">
                              {product.is_launch && (
                                <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-[10px] h-4 py-0">Lançamento</Badge>
                              )}
                              {product.is_promotion && (
                                <Badge variant="destructive" className="text-[10px] h-4 py-0">Promoção</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!product.is_out_of_stock}
                              onCheckedChange={() => toggleStock(product.id, !!product.is_out_of_stock)}
                            />
                            <span className={cn(
                              "text-xs font-medium",
                              !product.is_out_of_stock ? "text-green-600" : "text-destructive"
                            )}>
                              {!product.is_out_of_stock ? "Em estoque" : "Esgotado"}
                            </span>
                          </div>
                        </TableCell>
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
                              <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
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

      </div>
    </div>
  );
};

export default AdminProducts;