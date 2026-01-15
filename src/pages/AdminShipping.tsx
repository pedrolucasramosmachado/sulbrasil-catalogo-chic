import { useState } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AdminHeader } from '@/components/AdminHeader';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Package, Calculator, Search, Loader2, Copy, Check } from 'lucide-react';

interface ShippingResult {
  carrier: string;
  service: string;
  price: number;
  delivery_days: number;
  error?: string;
}

interface ShippingResponse {
  success: boolean;
  origin_cep: string;
  destination_cep: string;
  total_weight_kg: number;
  products_count: number;
  results: ShippingResult[];
}

const DEFAULT_WEIGHT_KG = 0.15; // 150g padrão

const AdminShipping = () => {
  const { products, loading } = useProducts();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [originCep, setOriginCep] = useState('');
  const [destinationCep, setDestinationCep] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingResults, setShippingResults] = useState<ShippingResponse | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const calculateShipping = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'Selecione produtos',
        description: 'Selecione ao menos um produto para calcular o frete',
        variant: 'destructive',
      });
      return;
    }

    if (!originCep || !destinationCep) {
      toast({
        title: 'CEP obrigatório',
        description: 'Preencha os CEPs de origem e destino',
        variant: 'destructive',
      });
      return;
    }

    setIsCalculating(true);
    setShippingResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          origin_cep: originCep.replace(/\D/g, ''),
          destination_cep: destinationCep.replace(/\D/g, ''),
          product_ids: Array.from(selectedProducts),
          carrier: 'all',
        },
      });

      if (error) throw error;

      setShippingResults(data as ShippingResponse);
      
      toast({
        title: 'Cálculo realizado',
        description: `Frete calculado para ${data.products_count} produto(s)`,
      });
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao calcular frete. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getSelectedProductsWeight = () => {
    return Array.from(selectedProducts).reduce((total, id) => {
      const product = products.find(p => p.id === id);
      return total + ((product as any)?.weight_kg || DEFAULT_WEIGHT_KG);
    }, 0);
  };

  const getSelectedProductsList = () => {
    return Array.from(selectedProducts).map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  };

  const generateOrderPreview = () => {
    if (!selectedShipping || selectedProducts.size === 0) return '';

    const selectedProductsList = getSelectedProductsList();
    const totalWeight = getSelectedProductsWeight();
    
    const productLines = selectedProductsList.map(p => {
      const price = p.is_promotion && p.promotion_wholesale_price 
        ? p.promotion_wholesale_price 
        : p.wholesale_price;
      return `• ${p.name} - ${formatPrice(price || 0)}`;
    }).join('\n');

    const subtotal = selectedProductsList.reduce((sum, p) => {
      const price = p.is_promotion && p.promotion_wholesale_price 
        ? p.promotion_wholesale_price 
        : p.wholesale_price;
      return sum + (price || 0);
    }, 0);

    const total = subtotal + selectedShipping.price;

    return `📦 *PEDIDO SULBRASIL*

🛍️ *Produtos:*
${productLines}

📍 *Envio:*
• ${selectedShipping.carrier} - ${selectedShipping.service}
• CEP: ${destinationCep}
• Prazo: ${selectedShipping.delivery_days} dias úteis
• Frete: ${formatPrice(selectedShipping.price)}

💰 *Resumo:*
• Subtotal: ${formatPrice(subtotal)}
• Frete: ${formatPrice(selectedShipping.price)}
• *TOTAL: ${formatPrice(total)}*

✅ Peso total: ${totalWeight.toFixed(2)}kg`;
  };

  const copyOrderPreview = async () => {
    const preview = generateOrderPreview();
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Preview do pedido copiado para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto',
        variant: 'destructive',
      });
    }
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
          title="Simulador de Frete" 
          description="Calcule o frete de produtos usando SEDEX, PAC e Loggi" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Selecionar Produtos
              </CardTitle>
              <CardDescription>
                Selecione os produtos para calcular o frete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Peso (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(product as any).weight_kg ? 
                            `${(product as any).weight_kg} kg` : 
                            <span className="text-muted-foreground">150g (padrão)</span>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedProducts.size > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>{selectedProducts.size}</strong> produto(s) selecionado(s) • 
                    Peso total: <strong>{getSelectedProductsWeight().toFixed(2)} kg</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calcular Frete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CEP de Origem</label>
                <Input
                  placeholder="00000-000"
                  value={originCep}
                  onChange={(e) => setOriginCep(formatCep(e.target.value))}
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">CEP de Destino</label>
                <Input
                  placeholder="00000-000"
                  value={destinationCep}
                  onChange={(e) => setDestinationCep(formatCep(e.target.value))}
                  maxLength={9}
                />
              </div>

              <Button 
                onClick={calculateShipping} 
                className="w-full"
                disabled={isCalculating || selectedProducts.size === 0}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Calcular Frete
                  </>
                )}
              </Button>

              {/* Results */}
              {shippingResults && (
                <div className="mt-6 space-y-4">
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Origem:</strong> {shippingResults.origin_cep}</p>
                    <p><strong>Destino:</strong> {shippingResults.destination_cep}</p>
                    <p><strong>Peso Total:</strong> {shippingResults.total_weight_kg.toFixed(2)} kg</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Selecione uma opção de envio:</p>
                    {shippingResults.results.map((result, index) => (
                      <div 
                        key={index}
                        onClick={() => !result.error && setSelectedShipping(result)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          result.error 
                            ? 'border-orange-300 bg-orange-50 cursor-not-allowed' 
                            : selectedShipping?.service === result.service && selectedShipping?.carrier === result.carrier
                              ? 'border-primary bg-primary/10 ring-2 ring-primary'
                              : 'border-green-300 bg-green-50 hover:border-primary'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {result.carrier}
                            </Badge>
                            <h4 className="font-semibold">{result.service}</h4>
                            {result.error && (
                              <p className="text-xs text-orange-600 mt-1">{result.error}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-700">
                              {formatPrice(result.price)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {result.delivery_days} dias úteis
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Preview */}
                  {selectedShipping && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">📋 Preview do Pedido</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={copyOrderPreview}
                          className="flex items-center gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        readOnly
                        value={generateOrderPreview()}
                        className="min-h-[300px] font-mono text-sm bg-muted"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminShipping;