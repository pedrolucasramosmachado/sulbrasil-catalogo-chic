import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, Send, ArrowLeft } from "lucide-react";

export const CartDrawer = () => {
  const {
    items,
    totalItems,
    totalPieces,
    isWholesale,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    getItemPrice,
    getTotal,
    sendToWhatsApp,
  } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Carrinho ({totalPieces} {totalPieces === 1 ? "peça" : "peças"})
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-foreground-muted"
              onClick={() => setIsCartOpen(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </div>

          {/* Wholesale indicator */}
          {isWholesale ? (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mt-3">
              <p className="text-sm font-semibold text-accent flex items-center gap-1">
                💎 Preço de Atacado Aplicado!
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                Com {totalPieces} peças, você recebe o melhor preço.
              </p>
            </div>
          ) : totalItems > 0 ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
              <p className="text-sm font-medium text-primary">
                🔥 Faltam {10 - totalPieces} peça(s) para preço de atacado!
              </p>
            </div>
          ) : null}
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-foreground-subtle mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">Carrinho vazio</p>
              <p className="text-sm text-foreground-muted">
                Adicione produtos ao carrinho para enviar seu pedido.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const price = getItemPrice(item);
              return (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-surface rounded-xl p-3 border border-border-subtle"
                >
                  <img
                    src={item.product.image_url || "/placeholder.svg"}
                    alt={item.product.name}
                    className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-foreground-muted">{item.product.category}</p>
                      <p className="text-sm font-bold text-primary mt-1">
                        R$ {price.toFixed(2)}
                        <span className="text-xs font-normal text-foreground-muted ml-1">
                          ({isWholesale ? "atacado" : "varejo"})
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">Total</span>
              <div className="text-right">
                <span className="text-xl font-bold text-primary">
                  R$ {getTotal().toFixed(2)}
                </span>
                <Badge className="ml-2 text-xs" variant={isWholesale ? "default" : "secondary"}>
                  {isWholesale ? "Atacado" : "Varejo"}
                </Badge>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
              onClick={sendToWhatsApp}
            >
              <Send className="w-5 h-5 mr-2" />
              Enviar Pedido via WhatsApp
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={clearCart}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Carrinho
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
