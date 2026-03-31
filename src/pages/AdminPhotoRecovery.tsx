import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Search, Trash2, X, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import sitemapData from '@/data/sulbrasil_sitemap.json';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  category: string;
}

interface MatchResult {
  file?: File;
  productId: string | null;
  productName: string | null;
  status: 'pending' | 'matching' | 'matched' | 'uploading' | 'success' | 'error';
  error?: string;
  source: 'local' | 'magic';
  suggestedUrl?: string;
}

const AdminPhotoRecovery = () => {
  const [brokenProducts, setBrokenProducts] = useState<Product[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const OLD_PROJECT_ID = 'xgjinyfnauwjjgjzyiju';

  const fetchBrokenProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, category')
        .ilike('image_url', `%${OLD_PROJECT_ID}%`);

      if (error) throw error;
      setBrokenProducts(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos com links quebrados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBrokenProducts();
  }, [fetchBrokenProducts]);

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  const findBestMatchLocal = (fileName: string, productsList: Product[]) => {
    const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
    const normalizedFile = normalize(nameWithoutExt);

    let match = productsList.find(p => normalize(p.name) === normalizedFile);
    if (match) return match;

    match = productsList.find(p => normalize(p.name).includes(normalizedFile));
    if (match) return match;

    match = productsList.find(p => normalizedFile.includes(normalize(p.name)));
    return match || null;
  };

  const runMagicFix = () => {
    if (brokenProducts.length === 0) return;

    toast({
      title: 'Mágica em andamento',
      description: 'Buscando fotos no sitemap da Sulbrasil...',
    });

    const magicMatches: MatchResult[] = [];

    brokenProducts.forEach(product => {
      const normalizedProductName = normalize(product.name);
      
      const sitemapMatch = sitemapData.find(item => {
        const normalizedSitemapName = normalize(item.produto);
        return normalizedSitemapName === normalizedProductName || 
               normalizedSitemapName.includes(normalizedProductName) ||
               normalizedProductName.includes(normalizedSitemapName);
      });

      if (sitemapMatch) {
         magicMatches.push({
           productId: product.id,
           productName: product.name,
           status: 'matched',
           source: 'magic',
           suggestedUrl: sitemapMatch.imagem
         });
      }
    });

    setMatches(prev => [...prev, ...magicMatches]);

    toast({
      title: 'Busca Concluída',
      description: `Encontramos ${magicMatches.length} fotos correspondentes!`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMatches: MatchResult[] = files.map(file => {
      const bestMatch = findBestMatchLocal(file.name, brokenProducts);
      return {
        file,
        productId: bestMatch?.id || null,
        productName: bestMatch?.name || null,
        status: bestMatch ? 'matched' : 'pending',
        source: 'local'
      };
    });

    setMatches(prev => [...prev, ...newMatches]);
  };

  const removeMatch = (index: number) => {
    setMatches(prev => prev.filter((_, i) => i !== index));
  };

  const processSync = async (match: MatchResult, index: number) => {
    if (!match.productId) return;

    try {
      setMatches(prev => {
        const next = [...prev];
        next[index].status = 'uploading';
        return next;
      });

      let finalUrl = '';

      if (match.source === 'local' && match.file) {
        const fileExt = match.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('catalog')
          .upload(filePath, match.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('catalog')
          .getPublicUrl(filePath);
        
        finalUrl = publicUrl;
      } else if (match.source === 'magic' && match.suggestedUrl) {
        finalUrl = match.suggestedUrl;
      }

      const { error: dbError } = await supabase
        .from('products')
        .update({ image_url: finalUrl })
        .eq('id', match.productId);

      if (dbError) throw dbError;

      setMatches(prev => {
        const next = [...prev];
        next[index].status = 'success';
        return next;
      });
    } catch (error: any) {
      console.error(`Erro ao sincronizar ${match.productName}:`, error);
      setMatches(prev => {
        const next = [...prev];
        next[index].status = 'error';
        next[index].error = error.message;
        return next;
      });
    }
  };

  const syncAll = async () => {
    const matchesToProcess = matches.filter(m => m.productId && (m.status === 'matched' || m.status === 'error'));
    if (matchesToProcess.length === 0) return;

    setSyncing(true);
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
      if (match.productId && (match.status === 'matched' || match.status === 'error')) {
        await processSync(match, i);
      }
    }
    setSyncing(false);
    toast({
      title: 'Sincronização Concluída',
      description: 'As fotos foram processadas.',
    });
    fetchBrokenProducts();
  };

  const filteredBroken = brokenProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <AdminHeader 
            title="Recuperação de Fotos em Lote" 
            description="Arrumar produtos com links de imagens do projeto antigo" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  Recuperação Mágica
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Tenta encontrar as fotos automaticamente no site oficial da Sulbrasil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={runMagicFix}
                  disabled={loading || brokenProducts.length === 0}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar no Sitemap Oficial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/20">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5" />
                  Upload Manual
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Selecione fotos do seu computador se a Mágica não encontrar tudo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Produtos aguardando:</span>
                  <Badge variant="outline" className="text-amber-600 border-amber-200">{brokenProducts.length}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Prontos para subir:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {matches.filter(m => m.productId && m.status !== 'success').length}
                  </Badge>
                </div>

                <Button 
                  className="w-full" 
                  disabled={syncing || matches.filter(m => m.productId && m.status !== 'success').length === 0}
                  onClick={syncAll}
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Sincronizar {matches.filter(m => m.productId && m.status !== 'success').length} itens
                    </>
                  )}
                </Button>
                
                {matches.length > 0 && (
                  <Button variant="outline" className="w-full text-destructive" onClick={() => setMatches([])}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Lista
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Fila de Processamento</CardTitle>
                  <CardDescription>Confirme se a foto corresponde ao produto</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                    <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                    <p>Nenhuma foto na fila.</p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fonte</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {match.source === 'magic' ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Mágica</Badge>
                              ) : (
                                <Badge variant="outline">Manual</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold truncate max-w-[200px]">{match.productName}</div>
                                  {match.source === 'magic' && <div className="text-[10px] text-blue-600 truncate max-w-[200px]">{match.suggestedUrl}</div>}
                                </div>
                            </TableCell>
                            <TableCell>
                              {match.status === 'matched' && <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Pronto</Badge>}
                              {match.status === 'uploading' && <Badge variant="secondary" className="bg-amber-50 text-amber-700 animate-pulse">Processando...</Badge>}
                              {match.status === 'success' && <Badge variant="secondary" className="bg-green-50 text-green-700">✓ OK</Badge>}
                              {match.status === 'error' && <Badge variant="destructive">Erro</Badge>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeMatch(idx)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Produtos Pendentes ({brokenProducts.length})</CardTitle>
                    <Button variant="ghost" size="icon" onClick={fetchBrokenProducts} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      placeholder="Filtrar produtos..." 
                      className="pl-7 h-8 text-xs" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-xs">
                  {filteredBroken.length > 0 ? (
                    filteredBroken.map(p => (
                      <div key={p.id} className="p-2 border rounded bg-muted/30 flex justify-between items-center group">
                        <span className="truncate flex-1 mr-2">{p.name}</span>
                        <Badge variant="outline" className="text-[10px] opacity-70 shrink-0">{p.category}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center text-muted-foreground italic text-sm">
                      {loading ? 'Buscando produtos...' : 'Tudo limpo por aqui!'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPhotoRecovery;
