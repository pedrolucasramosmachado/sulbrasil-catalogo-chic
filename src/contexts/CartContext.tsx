import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  isWholesale: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemPrice: (item: CartItem) => number;
  getTotal: () => number;
  sendToWhatsApp: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const WHOLESALE_THRESHOLD = 10;
const WHATSAPP_NUMBER = "5511961890347";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isWholesale = totalItems >= WHOLESALE_THRESHOLD;

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getItemPrice = useCallback(
    (item: CartItem) => {
      const { product } = item;
      if (isWholesale) {
        if (product.is_promotion && product.promotion_wholesale_price) {
          return Number(product.promotion_wholesale_price);
        }
        return Number(product.wholesale_price || product.retail_price || 0);
      }
      if (product.is_promotion && product.promotion_retail_price) {
        return Number(product.promotion_retail_price);
      }
      return Number(product.retail_price || product.wholesale_price || 0);
    },
    [isWholesale]
  );

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  }, [items, getItemPrice]);

  const sendToWhatsApp = useCallback(() => {
    const priceType = isWholesale ? "ATACADO" : "VAREJO";
    let message = `🛒 *Pedido - ${priceType}* (${totalItems} peças)\n\n`;

    items.forEach((item, idx) => {
      const price = getItemPrice(item);
      const subtotal = price * item.quantity;
      message += `${idx + 1}. *${item.product.name}*\n`;
      message += `   Qtd: ${item.quantity} × R$ ${price.toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
      if (item.product.category) message += `   Categoria: ${item.product.category}\n`;
      message += `\n`;
    });

    message += `──────────────\n`;
    message += `*Total: R$ ${getTotal().toFixed(2)}*\n`;
    message += `*Modalidade: ${priceType}*\n`;
    if (isWholesale) {
      message += `✅ Preço de atacado aplicado (${totalItems} peças)\n`;
    } else {
      message += `ℹ️ Adicione mais ${WHOLESALE_THRESHOLD - totalItems} peça(s) para preço de atacado\n`;
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }, [items, isWholesale, totalItems, getItemPrice, getTotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        isWholesale,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemPrice,
        getTotal,
        sendToWhatsApp,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
