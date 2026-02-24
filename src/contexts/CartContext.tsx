import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";

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
  customerName: string;
  setCustomerName: (name: string) => void;
  setIsCartOpen: (open: boolean) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemPrice: (item: CartItem) => number;
  getTotal: () => number;
  sendToWhatsApp: () => void;
  generateWhatsAppMessage: () => string;
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
  const [customerName, setCustomerName] = useState("");

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

  /** Get display color for a product — prefers color_name field, falls back to extraction */
  const getDisplayColor = useCallback((product: Product, model: string): string => {
    // Use explicit color_name if set
    if (product.color_name) return product.color_name;

    // Fallback: extract from name
    let name = product.name.trim();
    name = name.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+\s*/gu, "").trim();

    const prefixes: string[] = [];
    const sub = (product.subcategory || "").trim();
    const cat = (product.category || "").trim();
    const typeWords = ["regata", "vestidos", "vestido", "blusa", "body", "cropped", "camiseta", "t-shirt", "conjunto", "kit"];

    if (sub) {
      typeWords.forEach(tw => prefixes.push(`lançamento ${tw} ${sub}`, `${tw} ${sub}`));
      prefixes.push(`lançamento ${sub}`, sub);
    }
    if (cat) {
      typeWords.forEach(tw => prefixes.push(`lançamento ${tw} ${cat}`, `${tw} ${cat}`));
      prefixes.push(`lançamento ${cat}`, cat);
    }
    typeWords.forEach(tw => prefixes.push(`lançamento ${tw} ${model}`, `${tw} ${model}`));
    prefixes.push(`lançamento ${model}`, model);
    typeWords.forEach(tw => prefixes.push(`lançamento ${tw}`, tw));

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
  }, []);

  /** Get display model name — prefers model_name field, falls back to subcategory/category */
  const getDisplayModel = useCallback((product: Product): string => {
    if (product.model_name) return product.model_name;
    return product.subcategory || product.category || product.name;
  }, []);

  /** Get display emoji — prefers display_emoji field */
  const getDisplayEmoji = useCallback((product: Product, index: number): string => {
    if (product.display_emoji) return product.display_emoji;
    const clothingEmojis = ["👗", "👚", "👕", "🧥", "👔", "🩱", "👘", "🎽"];
    return clothingEmojis[index % clothingEmojis.length];
  }, []);

  const generateWhatsAppMessage = useCallback(() => {
    const priceType = isWholesale ? "ATACADO" : "VAREJO";
    let message = `🛒 *PEDIDO - ${priceType}*\n`;
    if (customerName.trim()) {
      message += `👤 *Cliente: ${customerName.trim()}*\n`;
    }
    message += `📦 Total de peças: *${totalPieces}*\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    // Group items by model
    const groupedByModel: Record<string, CartItem[]> = {};
    items.forEach((item) => {
      const key = getDisplayModel(item.product);
      if (!groupedByModel[key]) groupedByModel[key] = [];
      groupedByModel[key].push(item);
    });

    let idx = 1;
    Object.entries(groupedByModel).forEach(([model, groupItems]) => {
      const groupTotalQty = groupItems.reduce((s, i) => s + i.quantity, 0);
      const groupTotalPieces = groupItems.reduce((s, i) => s + getPieceCount(i.product) * i.quantity, 0);
      const totalModelValue = groupItems.reduce((s, i) => s + getItemPrice(i) * i.quantity, 0);
      const emoji = getDisplayEmoji(groupItems[0].product, idx - 1);

      message += `*${idx}. ${emoji} ${model}*\n`;
      message += `   Cores:\n`;
      groupItems.forEach((i) => {
        const color = getDisplayColor(i.product, model);
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

    return message;
  }, [items, isWholesale, totalPieces, customerName, getItemPrice, getTotal, getDisplayColor, getDisplayModel, getDisplayEmoji]);

  const saveOrderToDb = useCallback(async (message: string) => {
    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        model_name: getDisplayModel(item.product),
        color_name: getDisplayColor(item.product, getDisplayModel(item.product)),
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        total: getItemPrice(item) * item.quantity,
      }));

      await supabase.from('orders').insert({
        customer_name: customerName.trim() || 'Sem nome',
        items: orderItems,
        total: getTotal(),
        total_pieces: totalPieces,
        is_wholesale: isWholesale,
        whatsapp_message: message,
        status: 'pending',
      });
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }, [items, customerName, totalPieces, isWholesale, getItemPrice, getTotal, getDisplayModel, getDisplayColor]);

  const sendToWhatsApp = useCallback(() => {
    const message = generateWhatsAppMessage();
    
    // Save order to DB
    saveOrderToDb(message);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }, [generateWhatsAppMessage, saveOrderToDb]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPieces,
        isWholesale,
        isCartOpen,
        customerName,
        setCustomerName,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemPrice,
        getTotal,
        sendToWhatsApp,
        generateWhatsAppMessage,
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
