import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Loader2, Calculator, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ShippingResult {
  carrier: string;
  service: string;
  price: number;
  delivery_days: number;
  error?: string;
}

interface ShippingEstimatorProps {
  products: Array<{ id: string; quantity: number }>;
  onShippingSelected?: (shipping: ShippingResult) => void;
  selectedShipping?: ShippingResult | null;
}

export const ShippingEstimator = ({ products, onShippingSelected, selectedShipping }: ShippingEstimatorProps) => {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ShippingResult[]>([]);
  const [selected, setSelected] = useState<ShippingResult | null>(null);
  const { toast } = useToast();

  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const calculateShipping = async () => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
      toast({
        title: "CEP Inválido",
        description: "Por favor, digite um CEP válido com 8 dígitos.",
        variant: "destructive"
      });
      return;
    }

    if (products.length === 0) return;

    setLoading(true);
    setResults([]);
    setSelected(null);

    try {
      const productIds = products.map(p => p.id);
      const productQuantities: Record<string, number> = {};
      products.forEach(p => {
        productQuantities[p.id] = p.quantity;
      });

      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          origin_cep: '03053-000', // CEP Padrão Sulbrasil
          destination_cep: cleanedCep,
          product_ids: productIds,
          product_quantities: productQuantities,
          carrier: 'all',
        },
      });

      if (error) throw error;

      if (data && data.results) {
        setResults(data.results);
      } else {
        throw new Error('Nenhum resultado de frete retornado');
      }
    } catch (err) {
      console.error('Error estimating shipping:', err);
      toast({
        title: "Erro ao calcular frete",
        description: "Não foi possível calcular o frete. Verifique o CEP e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (res: ShippingResult) => {
    if (res.error) return;
    setSelected(res);
    if (onShippingSelected) {
      onShippingSelected(res);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Truck className="w-4 h-4 text-primary" />
        Estimar Frete
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          maxLength={9}
          className="h-9 font-mono"
        />
        <Button 
          size="sm" 
          onClick={calculateShipping} 
          disabled={loading || cep.replace(/\D/g, '').length !== 8}
          className="h-9"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
          Calcular
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {results.map((res, i) => (
            <div
              key={i}
              onClick={() => handleSelect(res)}
              className={`p-3 border rounded-lg cursor-pointer transition-all text-left ${
                res.error 
                  ? 'bg-orange-50 border-orange-200 opacity-60 cursor-not-allowed'
                  : (selected?.service === res.service || selectedShipping?.service === res.service)
                    ? 'bg-primary/10 border-primary ring-1 ring-primary'
                    : 'bg-surface hover:border-primary border-border-subtle'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs uppercase text-primary/80">{res.carrier}</span>
                    <span className="font-medium text-sm truncate">{res.service}</span>
                  </div>
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    Prazo: {res.delivery_days} dias úteis
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-primary">{formatPrice(res.price)}</span>
                </div>
              </div>
              {res.error && (
                <p className="text-[10px] text-orange-600 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {res.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
