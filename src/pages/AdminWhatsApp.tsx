import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Save, MessageSquare, List, Phone, Type, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface WhatsAppSettings {
  id?: string;
  phone_number: string;
  header_text: string;
  footer_text: string | null;
  show_prices: boolean;
  show_total: boolean;
  show_out_of_stock: boolean;
}

interface CategoryEmoji {
  id: string;
  name: string;
  whatsapp_emoji: string | null;
}

const AdminWhatsApp = () => {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    phone_number: "5511990000000",
    header_text: "🛍️ *PEDIDO*",
    footer_text: "",
    show_prices: true,
    show_total: true,
    show_out_of_stock: false,
  });
  const [categories, setCategories] = useState<CategoryEmoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (settingsData) setSettings(settingsData);

      // Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, whatsapp_emoji')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações do WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({ 
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações globais salvas com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategoryEmoji = async (id: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ whatsapp_emoji: emoji })
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, whatsapp_emoji: emoji } : cat));
      
      toast({
        title: "Emoji Atualizado",
        description: "O emoji da categoria foi salvo.",
      });
    } catch (error) {
      console.error("Erro ao atualizar emoji:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o emoji.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <AdminHeader 
        title="Configuração do WhatsApp" 
        description="Gerencie como os pedidos chegam no seu WhatsApp." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configurações Globais */}
        <div className="space-y-8">
          <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Dados de Contato</CardTitle>
              </div>
              <CardDescription>O número de destino dos pedidos gerados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número do WhatsApp (com DDI e DDD)</Label>
                <Input 
                  id="phone" 
                  value={settings.phone_number} 
                  onChange={(e) => setSettings({...settings, phone_number: e.target.value})}
                  placeholder="Ex: 5511999999999"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground italic">Use apenas números. Ex: 55 + DDD + Número.</p>
              </div>
              <Button 
                onClick={handleSaveSettings} 
                className="w-full gap-2 transition-all hover:scale-[1.02]" 
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Dados"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <Type className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle>Formatação de Texto</CardTitle>
              </div>
              <CardDescription>Personalize o cabeçalho e rodapé da mensagem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header">Cabeçalho (Início da mensagem)</Label>
                <Input 
                  id="header" 
                  value={settings.header_text} 
                  onChange={(e) => setSettings({...settings, header_text: e.target.value})}
                  placeholder="Ex: 🛍️ *PEDIDO*"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer">Rodapé (Opcional)</Label>
                <Input 
                  id="footer" 
                  value={settings.footer_text || ""} 
                  onChange={(e) => setSettings({...settings, footer_text: e.target.value})}
                  placeholder="Ex: Aguardamos sua confirmação!"
                />
              </div>
              <Button 
                onClick={handleSaveSettings} 
                variant="secondary"
                className="w-full gap-2 transition-all hover:scale-[1.02]" 
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Textos"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Eye className="h-5 w-5 text-emerald-500" />
                </div>
                <CardTitle>Exibição do Catálogo</CardTitle>
              </div>
              <CardDescription>Gerencie como os produtos aparecem para as clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted">
                <div className="space-y-1 pr-4">
                  <Label className="text-sm font-semibold cursor-pointer" htmlFor="show-out-of-stock">
                    Mostrar Peças Esgotadas
                  </Label>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Se ativado, as peças esgotadas continuarão sendo exibidas no catálogo com o selo "Esgotado". Caso desativado, elas sumirão do catálogo automaticamente.
                  </p>
                </div>
                <Switch 
                  id="show-out-of-stock"
                  checked={settings.show_out_of_stock}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_out_of_stock: checked })}
                />
              </div>
              
              <Button 
                onClick={handleSaveSettings} 
                className="w-full gap-2 transition-all hover:scale-[1.02] bg-emerald-600 hover:bg-emerald-700 text-white" 
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configurações de Exibição"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Emojis por Categoria */}
        <div className="space-y-8">
          <Card className="border-accent/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-accent/10 p-2 rounded-lg">
                  <List className="h-5 w-5 text-accent-foreground" />
                </div>
                <CardTitle>Emojis por Categoria</CardTitle>
              </div>
              <CardDescription>Defina o ícone que aparecerá antes de cada categoria no WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-4 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{category.name}</p>
                    </div>
                    <div className="w-24">
                      <Input 
                        value={category.whatsapp_emoji || ""} 
                        onChange={(e) => setCategories(prev => prev.map(c => c.id === category.id ? {...c, whatsapp_emoji: e.target.value} : c))}
                        onBlur={(e) => handleUpdateCategoryEmoji(category.id, e.target.value)}
                        placeholder="Emoji"
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhuma categoria encontrada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Mockup */}
          <Card className="bg-zinc-900 text-white shadow-2xl border-zinc-800 overflow-hidden">
            <div className="bg-emerald-600 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-bold font-mono">WhatsApp Preview</span>
              <Eye className="h-3 w-3 opacity-50" />
            </div>
            <CardContent className="p-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 relative">
                <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  <span className="text-emerald-400">{settings.header_text}</span>{"\n"}
                  {"\n"}
                  {categories.slice(0, 1).map(cat => (
                    <span key={cat.id}>{cat.whatsapp_emoji || "📦"} *{cat.name.toUpperCase()}*{"\n"}- Produto Exemplo (Cor)...</span>
                  ))}
                  {"\n"}{"\n"}
                  ...{"\n"}
                  {"\n"}
                  <span className="text-emerald-400 font-bold">*Total: R$ 0,00*</span>{"\n"}
                  {settings.footer_text && <span className="opacity-70">{"\n"}{settings.footer_text}</span>}
                </div>
                <div className="absolute -left-1 top-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-zinc-800/50 border-b-[8px] border-b-transparent"></div>
              </div>
              <p className="text-[10px] opacity-40 mt-4 text-center">Este é apenas uma visualização aproximada do formato.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
