import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';
import { ArrowUp, ArrowDown, GripVertical, Save, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    const updatedCategories = newCategories.map((cat, idx) => ({ ...cat, display_order: (idx + 1) * 10 }));
    setCategories(updatedCategories);
    setHasChanges(true);
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      for (const category of categories) {
        await supabase.from('categories').update({ 
          display_order: category.display_order,
          cover_image_url: category.cover_image_url 
        }).eq('id', category.id);
      }
      toast({ title: 'Sucesso', description: 'Alterações salvas!' });
      setHasChanges(false);
      fetchCategories();
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openCoverPicker = async (category: Category) => {
    setSelectedCategory(category);
    setIsCoverDialogOpen(true);
    setLoadingProducts(true);
    try {
      const { data } = await supabase.from('products').select('id, name, image_url').eq('category', category.name).order('created_at', { ascending: false });
      setCategoryProducts(data || []);
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectCover = (imageUrl: string | null) => {
    if (!selectedCategory) return;
    setCategories(prev => prev.map(cat => cat.id === selectedCategory.id ? { ...cat, cover_image_url: imageUrl } : cat));
    setHasChanges(true);
    setIsCoverDialogOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `category-covers/${selectedCategory.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('catalog')
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        selectCover(data.publicUrl);
        toast({ title: 'Sucesso', description: 'Imagem carregada com sucesso!' });
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar imagem', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminHeader title="Ordenar Categorias" description="Reorganize e escolha capas" />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Categorias & Capas (V3 - Oficial)</h1>
          <Button onClick={saveOrder} disabled={!hasChanges || saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? <p>Carregando...</p> : categories.map((category, index) => (
            <Card key={category.id} className="overflow-hidden border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
                
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border shrink-0">
                  {category.cover_image_url ? (
                    <img src={category.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-8 h-8" /></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">Posição: {index + 1}</p>
                  <Button variant="link" size="sm" onClick={() => openCoverPicker(category)} className="p-0 h-auto text-primary">
                    Trocar Imagem de Capa
                  </Button>
                </div>

                <div className="flex flex-col gap-1">
                  <Button variant="outline" size="icon" onClick={() => moveCategory(index, 'up')} disabled={index === 0}><ArrowUp className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => moveCategory(index, 'down')} disabled={index === categories.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isCoverDialogOpen} onOpenChange={setIsCoverDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Capa para {selectedCategory?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-wrap gap-4 mb-6 pt-4 border-t">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Carregando...' : 'Fazer Upload de Foto Customizada'}
              </Button>
              
              {selectedCategory?.cover_image_url && (
                <Button 
                  variant="destructive" 
                  onClick={() => selectCover(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remover Capa Atual
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Ou escolha uma foto de um produto desta categoria:</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {categoryProducts.map(p => (
                  <button key={p.id} onClick={() => selectCover(p.image_url)} className="aspect-square relative group rounded-lg overflow-hidden border-2 hover:border-primary transition-all">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-[10px] font-bold bg-primary px-2 py-1 rounded">Usar esta</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminCategoryOrder;
