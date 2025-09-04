import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { CartModal } from "@/components/CartModal";

export const FloatingCart = () => {
  const { itemCount, total } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (itemCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsCartOpen(true)}
          size="lg"
          className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-primary hover:bg-primary/90"
        >
          <div className="flex flex-col items-center">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </div>
        </Button>
        
        {/* Mostrar total em tela pequena */}
        <div className="absolute -top-12 right-0 bg-card border border-border rounded-lg px-3 py-1 shadow-md">
          <span className="text-sm font-semibold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};