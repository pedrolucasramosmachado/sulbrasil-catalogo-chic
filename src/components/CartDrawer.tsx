import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, Send, ArrowLeft, User, Truck } from "lucide-react";

import { formatCurrency } from "@/lib/format";

export const CartDrawer = () => {
  const {
    items,
    totalItems,
    totalPieces,
    isWholesale,
    isCartOpen,
    customerName,
    setCustomerName,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    getItemPrice,
    getTotal,
    getCartKey,
    sendToWhatsApp,
  } = useCart();


  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 sm:p-5 border-b border-border-subtle/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Carrinho ({totalPieces})
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-foreground-muted hover:text-destructive flex items-center gap-1.5"
                onClick={clearCart}
                disabled={items.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">Limpar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 font-semibold shadow-sm text-xs"
                onClick={() => setIsCartOpen(false)}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Voltar
              </Button>
            </div>
          </div>

          {/* Wholesale indicator - More compact */}
          {items.length > 0 && (
            isWholesale ? (
              <div className="bg-accent/5 border border-accent/20 rounded-md p-2 mt-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                  💎 Atacado Ativado!
                </p>
                <p className="text-[10px] text-foreground-muted">Preços reduzidos aplicados</p>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-2 mt-2">
                <p className="text-[10px] font-medium text-primary text-center">
                  🔥 Faltam {10 - totalPieces} peças para o ATACADO
                </p>
              </div>
            )
          )}
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface/30">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-12 h-12 text-foreground-subtle mb-3 opacity-20" />
              <p className="text-base font-semibold text-foreground mb-1">Carrinho vazio</p>
              <p className="text-xs text-foreground-muted max-w-[200px] mx-auto">
                Explore o catálogo e adicione produtos para iniciar seu pedido.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const price = getItemPrice(item);
              const key = getCartKey(item);
              return (
                <div
                  key={key}
                  className="flex gap-3 bg-surface rounded-xl p-2.5 border border-border-subtle shadow-sm group hover:border-primary/20 transition-all"
                >
                  <img
                    src={item.product.image_url || "/placeholder.svg"}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-foreground truncate flex-1 pr-2">
                          {item.product.name}
                        </p>
                        <button 
                          onClick={() => removeItem(key)}
                          className="text-foreground-muted hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {(() => {
                        const lowerName = item.product.name.toLowerCase();
                        const lowerCategory = (item.product.category || "").toLowerCase();
                        const isKit = lowerName.includes("kit") || lowerCategory.includes("kit");
                        const normalizedSize = (item.selectedSize || '')
                          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                        const isUniqueSize = normalizedSize.includes('unico') || normalizedSize === 'u';
                        
                        if (item.selectedSize && !isUniqueSize && !isKit) {
                          return (
                            <p className="text-[10px] font-bold text-primary/80 mt-0.5 uppercase tracking-tighter">
                              Tam: {item.selectedSize}
                            </p>
                          );
                        }
                        return null;
                      })()}
                      <p className="text-sm font-black text-primary mt-0.5 tracking-tighter">
                        R$ {price.toFixed(2)}
                        <span className="text-[9px] font-bold text-foreground-muted ml-1 uppercase opacity-60">
                          {isWholesale ? "atacado" : "varejo"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 grayscale group-hover:grayscale-0 transition-all">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-6 h-6 rounded-md bg-foreground/5"
                        onClick={() => updateQuantity(key, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-black">
                        {item.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-6 h-6 rounded-md bg-foreground/5"
                        onClick={() => updateQuantity(key, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer - Optimized and Compact */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 bg-surface/50 backdrop-blur-md space-y-3">
            {/* Unified Name and Total Panel */}
            <div className="bg-background/80 rounded-2xl p-3.5 border border-primary/10 shadow-inner space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/60" />
                  <Input
                    placeholder="Seu Nome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-8 h-9 text-xs bg-transparent border-border-subtle focus-visible:ring-primary/30"
                  />
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                  <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-widest leading-none mb-1">Subtotal</span>
                  <span className="text-xl font-black text-primary tracking-tighter leading-none">
                    {formatCurrency(getTotal())}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-medium text-foreground-muted pt-1 border-t border-border-subtle/30 px-1">
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5" />
                  {totalPieces} peças
                </span>
                <span className="flex items-center gap-1 text-primary/80">
                  <Truck className="w-2.5 h-2.5" />
                  Frete p/ separar
                </span>
                <Badge className="text-[8px] h-3.5 px-1.5 uppercase font-bold" variant={isWholesale ? "default" : "secondary"}>
                  {isWholesale ? "Atacado" : "Varejo"}
                </Badge>
              </div>
            </div>

            <Button
              className={`w-full h-11 text-sm font-black uppercase tracking-widest transition-all ${
                customerName.trim() 
                  ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 text-white translate-y-0 active:translate-y-0.5" 
                  : "bg-surface-muted text-foreground-subtle cursor-not-allowed"
              }`}
              onClick={sendToWhatsApp}
              disabled={!customerName.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {customerName.trim() ? "Enviar via WhatsApp" : "Digite seu nome"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
