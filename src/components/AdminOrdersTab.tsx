import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, User, Clock, Truck, RefreshCw } from 'lucide-react';

interface OrderItem {
  product_id: string;
  product_name: string;
  model_name: string;
  color_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  total_pieces: number;
  is_wholesale: boolean;
  whatsapp_message: string | null;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export interface OrderProductItem {
  product_id: string;
  quantity: number;
}

interface AdminOrdersTabProps {
  onSimulateShipping?: (items: OrderProductItem[]) => void;
}

export const AdminOrdersTab = ({ onSimulateShipping }: AdminOrdersTabProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar pedidos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: 'Status atualizado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleSimulate = (order: Order) => {
    const orderItems = (order.items as OrderItem[])
      .filter(item => item.product_id)
      .map(item => ({ product_id: item.product_id, quantity: item.quantity }));
    if (orderItems.length === 0) {
      toast({ title: 'Erro', description: 'Pedido sem produtos identificados', variant: 'destructive' });
      return;
    }
    onSimulateShipping?.(orderItems);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          {orders.length} pedido(s)
        </h3>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="h-8">
          <RefreshCw className="h-3 w-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum pedido recebido ainda.
          </CardContent>
        </Card>
      ) : (
        orders.map(order => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{order.customer_name}</span>
                  <Badge variant={order.is_wholesale ? "default" : "secondary"} className="text-xs">
                    {order.is_wholesale ? 'Atacado' : 'Varejo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(order.created_at)}
                </span>
                <span>{order.total_pieces} peças</span>
                <span className="font-semibold text-primary">{formatPrice(order.total)}</span>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {/* Items summary */}
              <div className="bg-muted/50 rounded-lg p-2 space-y-1">
                {(order.items as OrderItem[]).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{item.quantity}x {item.model_name} - {item.color_name}</span>
                    <span className="text-muted-foreground">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Simulate shipping from order */}
              {onSimulateShipping && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulate(order)}
                  className="w-full h-7 text-xs"
                >
                  <Truck className="h-3 w-3 mr-1" /> Simular Frete
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
