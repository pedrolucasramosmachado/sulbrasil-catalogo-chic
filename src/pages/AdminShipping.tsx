import { useState, useRef } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminOrdersTab, OrderProductItem } from '@/components/AdminOrdersTab';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Package, Calculator, Search, Loader2, Copy, Check, X, ClipboardList } from 'lucide-react';

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
const DEFAULT_ORIGIN_CEP = '03053-000';

const AdminShipping = () => {
  const { products, loading } = useProducts();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [originCep, setOriginCep] = useState(DEFAULT_ORIGIN_CEP);
  const [destinationCep, setDestinationCep] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingResults, setShippingResults] = useState<ShippingResponse | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('shipping');
  const resultsRef = useRef<HTMLDivElement>(null);

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

  const removeProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    newSelected.delete(productId);
    setSelectedProducts(newSelected);
  };

  const clearAllProducts = () => {
    setSelectedProducts(new Set());
    setProductQuantities({});
    setShippingResults(null);
    setSelectedShipping(null);
  };

  const handleSimulateFromOrder = (items: OrderProductItem[]) => {
    const ids = new Set(items.map(i => i.product_id));
    const qtys: Record<string, number> = {};
    items.forEach(i => {
      qtys[i.product_id] = (qtys[i.product_id] || 0) + i.quantity;
    });
    setSelectedProducts(ids);
    setProductQuantities(qtys);
    setShippingResults(null);
    setSelectedShipping(null);
    setActiveTab('shipping');
    const totalPieces = items.reduce((s, i) => s + i.quantity, 0);
    toast({ title: 'Produtos carregados', description: `${totalPieces} peça(s) do pedido selecionadas` });
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
          product_quantities: productQuantities,
          carrier: 'all',
        },
      });

      if (error) throw error;

      setShippingResults(data as ShippingResponse);
      
      toast({
        title: 'Cálculo realizado',
        description: `Frete calculado para ${data.products_count} produto(s)`,
      });

      // Auto-scroll para os resultados
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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
      const qty = productQuantities[id] || 1;
      return total + ((product as any)?.weight_kg || DEFAULT_WEIGHT_KG) * qty;
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

  const selectedProductsList = getSelectedProductsList();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 max-w-4xl">
        <AdminHeader 
          title="Frete & Pedidos" 
          description="Calcule frete e gerencie pedidos" 
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="shipping" className="flex-1 gap-2">
              <Calculator className="h-4 w-4" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 gap-2">
              <ClipboardList className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shipping">
            {/* CEP Section */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">CEP Origem</label>
                    <Input
                      placeholder="00000-000"
                      value={originCep}
                      onChange={(e) => setOriginCep(formatCep(e.target.value))}
                      maxLength={9}
                      className="text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">CEP Destino</label>
                    <Input
                      placeholder="00000-000"
                      value={destinationCep}
                      onChange={(e) => setDestinationCep(formatCep(e.target.value))}
                      maxLength={9}
                      className="text-center font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Products Summary */}
            {selectedProducts.size > 0 && (
              <Card className="mb-4 border-primary/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {selectedProducts.size} produto(s) • {getSelectedProductsWeight().toFixed(2)}kg
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllProducts}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Limpar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductsList.map(product => (
                      <Badge 
                        key={product.id} 
                        variant="secondary" 
                        className="flex items-center gap-1 pr-1 text-xs"
                      >
                        <span className="max-w-[120px] truncate">
                          {productQuantities[product.id] > 1 ? `${productQuantities[product.id]}x ` : ''}{product.name}
                        </span>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Search & List */}
            <Card className="mb-4">
              <CardHeader className="p-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto divide-y">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        selectedProducts.has(product.id) 
                          ? 'bg-primary/10' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {(product as any).weight_kg ? `${(product as any).weight_kg}kg` : '150g'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calculate Button */}
            <Button 
              onClick={calculateShipping} 
              className="w-full mb-4 h-12 text-base"
              disabled={isCalculating || selectedProducts.size === 0 || !destinationCep}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Calcular Frete ({selectedProducts.size} itens)
                </>
              )}
            </Button>

            {/* Shipping Results */}
            <div ref={resultsRef} />
            {shippingResults && (
              <Card className="mb-4">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Opções de Envio
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {shippingResults.results.map((result, index) => (
                    <div 
                      key={index}
                      onClick={() => !result.error && setSelectedShipping(result)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        result.error 
                          ? 'border-orange-300 bg-orange-50 cursor-not-allowed opacity-60' 
                          : selectedShipping?.service === result.service && selectedShipping?.carrier === result.carrier
                            ? 'border-primary bg-primary/10 ring-2 ring-primary'
                            : 'border-muted hover:border-primary'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {result.carrier}
                            </Badge>
                            <span className="font-medium text-sm">{result.service}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.delivery_days} dias úteis
                          </p>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(result.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Order Preview */}
            {selectedShipping && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">📋 Preview do Pedido</CardTitle>
                    <Button 
                      size="sm" 
                      onClick={copyOrderPreview}
                      className="h-8"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <Textarea
                    readOnly
                    value={generateOrderPreview()}
                    className="min-h-[250px] font-mono text-xs bg-muted resize-none"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrdersTab onSimulateShipping={handleSimulateFromOrder} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminShipping;