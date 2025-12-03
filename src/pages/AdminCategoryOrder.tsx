import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';
import { ArrowUp, ArrowDown, GripVertical, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  display_order: number;
}

const AdminCategoryOrder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
          .update({ display_order: category.display_order })
          .eq('id', category.id);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem das categorias salva com sucesso!',
      });
      setHasChanges(false);
    } catch (err) {
      console.error('Erro ao salvar ordem:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar ordem das categorias',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <GripVertical className="w-5 h-5 text-foreground-muted" />
                    <span className="flex-1 font-medium text-foreground">
                      {category.name}
                    </span>
                    <span className="text-sm text-foreground-muted mr-4">
                      Posição: {index + 1}
                    </span>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
            Você tem alterações não salvas!
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCategoryOrder;
