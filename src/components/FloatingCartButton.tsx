import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

export const FloatingCartButton = () => {
  const { totalItems, setIsCartOpen, isWholesale } = useCart();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-strong transition-all duration-300 hover:scale-105 active:scale-95",
        isWholesale
          ? "bg-accent text-accent-foreground"
          : "bg-primary text-primary-foreground"
      )}
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="font-bold text-sm">{totalItems}</span>
    </button>
  );
};
