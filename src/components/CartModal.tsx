import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    const orderDetails = items.map(item => 
      `• ${item.product.name}${item.selectedSize ? ` (Tamanho: ${item.selectedSize})` : ''} - Qtd: ${item.quantity} - R$ ${((item.product.retail_price || 0) * item.quantity).toFixed(2).replace('.', ',')}`
    ).join('\n');

    const totalFormatted = total.toFixed(2).replace('.', ',');
    const message = `Olá! Gostaria de fazer um pedido:\n\n${orderDetails}\n\n*Total: R$ ${totalFormatted}*\n\nPoderia me dar mais informações sobre disponibilidade e formas de pagamento?`;
    
    const phoneNumber = "5511999999999"; // Substitua pelo número real
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Carrinho vazio</h3>
            <p className="text-muted-foreground mb-4">
              Adicione produtos ao seu carrinho para começar
            </p>
            <Button onClick={onClose}>Continuar Comprando</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto space-y-4 py-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize || 'no-size'}`} 
                     className="flex gap-4 p-4 border border-border rounded-lg bg-card">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.product.image_url || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm">{item.product.name}</h4>
                      {item.selectedSize && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.selectedSize}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon" 
                          className="w-8 h-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          R$ {((item.product.retail_price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {(item.product.retail_price || 0).toFixed(2).replace('.', ',')} cada
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="flex-1"
                >
                  Limpar Carrinho
                </Button>
                <Button 
                  onClick={handleWhatsAppOrder}
                  className="flex-1"
                >
                  Finalizar pelo WhatsApp
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};