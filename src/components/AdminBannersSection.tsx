import { useState } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, GripVertical, Image, Video } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const AdminBannersSection = () => {
  const { banners, loading, fetchBanners } = useBanners();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  // New banner form state
  const [newTitle, setNewTitle] = useState('');
  const [newAspect, setNewAspect] = useState<'16:9' | '9:16'>('16:9');
  const [newLink, setNewLink] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const detectMediaType = (file: File): 'image' | 'video' => {
    return file.type.startsWith('video/') ? 'video' : 'image';
  };

  const handleAdd = async () => {
    if (!newFile) {
      toast({ title: 'Selecione um arquivo', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = newFile.name.split('.').pop();
      const fileName = `banners/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('catalog')
        .upload(fileName, newFile);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('catalog')
        .getPublicUrl(fileName);

      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 0;

      const { error: insertErr } = await supabase.from('banners').insert({
        title: newTitle || null,
        media_url: urlData.publicUrl,
        media_type: detectMediaType(newFile),
        aspect_ratio: newAspect,
        display_order: maxOrder,
        link_url: newLink || null,
        is_active: true,
      });

      if (insertErr) throw insertErr;

      toast({ title: 'Banner adicionado!' });
      setNewTitle('');
      setNewFile(null);
      setPreview(null);
      setNewLink('');
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao adicionar banner', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from('banners').delete().eq('id', id);
    toast({ title: 'Banner removido' });
    fetchBanners();
  };

  const moveOrder = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(b => b.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const orderA = sorted[idx].display_order;
    const orderB = sorted[swapIdx].display_order;

    await Promise.all([
      supabase.from('banners').update({ display_order: orderB }).eq('id', sorted[idx].id),
      supabase.from('banners').update({ display_order: orderA }).eq('id', sorted[swapIdx].id),
    ]);
    fetchBanners();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Image className="h-5 w-5" />
          Banners Promocionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new banner */}
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Adicionar novo banner</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Título (opcional)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <Select value={newAspect} onValueChange={(v: '16:9' | '9:16') => setNewAspect(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">Paisagem (16:9)</SelectItem>
                <SelectItem value="9:16">Retrato (9:16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Link ao clicar (opcional)"
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{newFile ? newFile.name : 'Selecionar imagem ou vídeo'}</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          {preview && (
            <div className="max-w-xs">
              {newFile?.type.startsWith('video/') ? (
                <video src={preview} className="rounded-lg w-full" controls muted />
              ) : (
                <img 
                  src={preview} 
                  className="rounded-lg w-full" 
                  alt="Preview" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "/placeholder.svg") {
                      target.src = "/placeholder.svg";
                    }
                  }}
                />
              )}
            </div>
          )}
          <Button onClick={handleAdd} disabled={uploading || !newFile} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {uploading ? 'Enviando...' : 'Adicionar Banner'}
          </Button>
        </div>

        {/* List existing banners */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : banners.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum banner cadastrado</p>
        ) : (
          <div className="space-y-2">
            {[...banners].sort((a, b) => a.display_order - b.display_order).map(banner => (
              <div key={banner.id} className="flex items-center gap-3 border rounded-lg p-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveOrder(banner.id, 'up')} className="text-xs text-muted-foreground hover:text-foreground">▲</button>
                  <button onClick={() => moveOrder(banner.id, 'down')} className="text-xs text-muted-foreground hover:text-foreground">▼</button>
                </div>

                <div className="w-16 h-10 rounded overflow-hidden bg-muted shrink-0">
                  {banner.media_type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <img 
                      src={banner.media_url} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/placeholder.svg") {
                          target.src = "/placeholder.svg";
                        }
                      }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{banner.title || 'Sem título'}</p>
                  <p className="text-xs text-muted-foreground">
                    {banner.media_type === 'video' ? 'Vídeo' : 'Imagem'} • {banner.aspect_ratio}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={() => toggleActive(banner)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteBanner(banner.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
