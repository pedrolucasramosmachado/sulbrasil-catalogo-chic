import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';
import { ArrowUp, ArrowDown, GripVertical, Save, Image as ImageIcon, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  display_order: number;
  cover_image_url?: string | null;
}

const AdminCategoryOrder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    
    // Update display_order values
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      display_order: (idx + 1) * 10,
    }));

    setCategories(updatedCategories);
    setHasChanges(true);
  };

  const saveOrder = async () => {
    try {
      setSaving(true);

      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .update({ 
            display_order: category.display_order,
            cover_image_url: category.cover_image_url 
          })
          .eq('id', category.id);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Alterações salvas com sucesso!',
      });
      setHasChanges(false);
      fetchCategories();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar alterações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openCoverPicker = async (category: Category) => {
    setSelectedCategory(category);
    setIsCoverDialogOpen(true);
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url')
        .eq('category', category.name)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCategoryProducts(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectCover = (imageUrl: string) => {
    if (!selectedCategory) return;
    
    setCategories(prev => prev.map(cat => 
      cat.id === selectedCategory.id ? { ...cat, cover_image_url: imageUrl } : cat
    ));
    setHasChanges(true);
    setIsCoverDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Ordenar Categorias" description="Reorganize as categorias do catálogo" />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ordenar Categorias</h1>
            <p className="text-foreground-muted mt-1">
              Arraste ou use as setas para reorganizar as categorias na página inicial
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/products')}>
              Voltar
            </Button>
            <Button 
              onClick={saveOrder} 
              disabled={!hasChanges || saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Ordem'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-foreground-muted">
                Carregando categorias...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-foreground-muted">
                Nenhuma categoria encontrada
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category, index) => {
                  console.log('Category item:', category.name, category.cover_image_url);
                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-foreground-muted shrink-0" />
                      
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                        {category.cover_image_url ? (
                          <img 
                            src={category.cover_image_url} 
                            alt={category.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block font-medium text-foreground truncate">
                          {category.name}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          Posição: {index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCoverPicker(category)}
                          className="text-xs flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Escolher Capa
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveCategory(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveCategory(index, 'down')}
                            disabled={index === categories.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full shadow-lg animate-bounce z-50">
            Você tem alterações não salvas!
          </div>
        )}

        {/* Modal de Seleção de Capa */}
        <Dialog open={isCoverDialogOpen} onOpenChange={setIsCoverDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Escolher Capa para {selectedCategory?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione um produto desta categoria para usar como imagem de capa.
              </p>

              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {categoryProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => selectCover(product.image_url)}
                      className={cn(
                        "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary",
                        selectedCategory?.cover_image_url === product.image_url ? "border-primary" : "border-transparent"
                      )}
                    >
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-2 py-1 bg-primary/80 rounded">Selecionar</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-[10px] text-white truncate">
                        {product.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminCategoryOrder;
