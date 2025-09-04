import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { WholesaleNotification } from "@/components/WholesaleNotification";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const { items, total, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  
  const isWholesaleOrder = itemCount >= 10;
  const hasWholesaleItems = isWholesaleOrder && items.some(item => item.product.wholesale_price);

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    const orderDetails = items.map(item => {
      const price = isWholesaleOrder && item.product.wholesale_price 
        ? item.product.wholesale_price 
        : item.product.retail_price || 0;
      const itemTotal = price * item.quantity;
      
      return `🧾 Pedido: ${item.product.name}
• ${item.quantity} ${item.selectedSize || 'Sem tamanho especificado'}
${item.quantity} peças
R$${itemTotal.toFixed(2).replace('.', ',')}`;
    }).join('\n\n');

    const totalFormatted = total.toFixed(2).replace('.', ',');
    const message = `${orderDetails}

🧮 Total: ${itemCount} peças
💸 Valor total: R$${totalFormatted}

Poderia me dar mais informações sobre disponibilidade e formas de pagamento?`;
    
    const phoneNumber = "5511961890347";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-0 mx-4">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingBag className="w-5 h-5" />
            Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Carrinho vazio</h3>
            <p className="text-muted-foreground mb-4">
              Adicione produtos ao seu carrinho para começar
            </p>
            <Button onClick={onClose}>Continuar Comprando</Button>
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6">
              <WholesaleNotification hasWholesaleItems={hasWholesaleItems} />
            </div>
            
            <div className="flex-1 overflow-auto space-y-3 sm:space-y-4 py-4 px-4 sm:px-6">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize || 'no-size'}`} 
                     className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg bg-card">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.product.image_url || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                      {item.selectedSize && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.selectedSize}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 sm:w-7 sm:h-7 flex-shrink-0"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 sm:w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon" 
                          className="w-8 h-8 sm:w-7 sm:h-7 flex-shrink-0"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-primary text-sm">
                          R$ {((isWholesaleOrder && item.product.wholesale_price 
                            ? item.product.wholesale_price 
                            : item.product.retail_price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {(isWholesaleOrder && item.product.wholesale_price 
                            ? item.product.wholesale_price 
                            : item.product.retail_price || 0).toFixed(2).replace('.', ',')} cada
                          {isWholesaleOrder && item.product.wholesale_price && (
                            <span className="text-accent font-medium"> (Atacado)</span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 sm:w-7 sm:h-7 text-destructive flex-shrink-0"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="w-full h-12"
                >
                  Limpar Carrinho
                </Button>
                <Button 
                  onClick={handleWhatsAppOrder}
                  className="w-full h-12 text-base font-semibold"
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