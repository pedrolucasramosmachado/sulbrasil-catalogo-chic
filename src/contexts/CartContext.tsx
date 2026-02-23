import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPieces: number;
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

/** Extract piece count from product name, e.g. "Kit X 4 peças" → 4, default 1 */
const getPieceCount = (product: Product): number => {
  const match = product.name.match(/(\d+)\s*pe[cç]as?/i);
  return match ? parseInt(match[1], 10) : 1;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalPieces = items.reduce((sum, item) => sum + getPieceCount(item.product) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isWholesale = totalPieces >= WHOLESALE_THRESHOLD;

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
    let message = `🛒 *PEDIDO - ${priceType}*\n`;
    message += `📦 Total de peças: *${totalPieces}*\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    // Clothing emojis to alternate per model
    const clothingEmojis = ["👗", "👚", "👕", "🧥", "👔", "🩱", "👘", "🎽"];

    // Group items by model (subcategory if available, otherwise category)
    const groupedByModel: Record<string, CartItem[]> = {};
    items.forEach((item) => {
      const key = item.product.subcategory || item.product.category || item.product.name;
      if (!groupedByModel[key]) groupedByModel[key] = [];
      groupedByModel[key].push(item);
    });

    /** Extract color from product name by removing known prefixes */
    const getColor = (product: Product, model: string): string => {
      let name = product.name.trim();
      // Remove leading emojis and whitespace
      name = name.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+\s*/gu, "").trim();

      // Build a list of possible prefixes to strip (longest first)
      const prefixes: string[] = [];
      const sub = (product.subcategory || "").trim();
      const cat = (product.category || "").trim();
      if (sub) {
        prefixes.push(`lançamento ${sub}`, sub);
      }
      if (cat) {
        prefixes.push(`lançamento ${cat}`, cat);
      }
      prefixes.push(`lançamento ${model}`, model);

      // Sort by length descending to match longest first
      prefixes.sort((a, b) => b.length - a.length);

      const nameLower = name.toLowerCase();
      for (const prefix of prefixes) {
        const pLower = prefix.toLowerCase();
        if (nameLower.startsWith(pLower)) {
          const remainder = name.slice(prefix.length).replace(/^[\s🔥✨⭐💎]+/gu, "").trim();
          if (remainder) return remainder;
        }
      }
      return name;
    };

    let idx = 1;
    Object.entries(groupedByModel).forEach(([model, groupItems]) => {
      const groupTotalQty = groupItems.reduce((s, i) => s + i.quantity, 0);
      const groupTotalPieces = groupItems.reduce((s, i) => s + getPieceCount(i.product) * i.quantity, 0);
      const unitPrice = getItemPrice(groupItems[0]);
      const totalModelValue = groupItems.reduce((s, i) => s + getItemPrice(i) * i.quantity, 0);
      const emoji = clothingEmojis[(idx - 1) % clothingEmojis.length];

      message += `*${idx}. ${emoji} ${model}*\n`;
      message += `   Cores:\n`;
      groupItems.forEach((i) => {
        const color = getColor(i.product, model);
        message += `      • ${i.quantity} ${color}\n`;
      });
      message += `   Quant. Total: ${groupTotalQty}`;
      if (groupTotalPieces !== groupTotalQty) message += ` (${groupTotalPieces} peças)`;
      message += `\n`;
      message += `   Valor pçs: R$ ${totalModelValue.toFixed(2)}\n\n`;
      idx++;
    });

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL DO PEDIDO: R$ ${getTotal().toFixed(2)}*\n`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }, [items, isWholesale, totalPieces, getItemPrice, getTotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPieces,
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
