import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getPriceAdjustment } from "@/lib/format";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface ShippingResult {
  carrier: string;
  service: string;
  price: number;
  delivery_days: number;
  error?: string;
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
  addItem: (product: Product, size?: string) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  getItemPrice: (item: CartItem) => number;
  getTotal: () => number;
  getCartKey: (item: CartItem) => string;
  sendToWhatsApp: () => void;
  generateWhatsAppMessage: () => string;
  selectedShipping: ShippingResult | null;
  setSelectedShipping: (shipping: ShippingResult | null) => void;
  totalWeightKg: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const WHOLESALE_THRESHOLD = 10;
const WHATSAPP_NUMBER = "5511961890347";

/** Chave única para um item do carrinho (produto + tamanho) */
const buildCartKey = (productId: string, size?: string): string => {
  return size ? `${productId}__${size}` : productId;
};

/**
 * Extrai a contagem de peças do nome do produto.
 * Ex: "Kit 6 Blusas" → 6, "Kit com 3" → 3, padrão → 1
 */
const getPieceCount = (product: Product): number => {
  // Prioridade 1: Campo estruturado do banco
  if (product.kit_piece_count) return product.kit_piece_count;
  
  // Prioridade 2: Fallback para o parsing do nome (produtos antigos)
  const name = product.name.toLowerCase();
  const matchPieces = name.match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid(ades?)?|und?|itens)/i);
  if (matchPieces) return parseInt(matchPieces[1], 10);
  const matchKit = name.match(/(?:kit|combo|conjunto|conj)\s*(?:com\s*|de\s*)?(\d+)/i);
  if (matchKit) return parseInt(matchKit[1], 10);
  return 1;
};

/**
 * Retorna o emoji mais adequado para o produto com base em categoria/nome.
 */
const getProductEmoji = (product: Product): string => {
  const combined = [product.name, product.category, product.subcategory]
    .join(" ")
    .toLowerCase();

  if (combined.includes("kit")) return "\uD83C\uDF81"; // 🎁
  if (combined.includes("vestido") || combined.includes("chemise")) return "\uD83D\uDC57"; // 👗
  if (combined.includes("conjunto") || combined.includes("conj.")) return "\uD83D\uDCE6"; // 📦
  if (combined.includes("t-shirt") || combined.includes("tshirt") || combined.includes("camiseta")) return "\uD83D\uDC55"; // 👕
  if (combined.includes("cal\u00e7a") || combined.includes("calca") || combined.includes("jeans") || combined.includes("pantalona")) return "\uD83D\uDC56"; // 👖
  if (combined.includes("casaco") || combined.includes("jaqueta") || combined.includes("blazer") || combined.includes("tricot") || combined.includes("moletom") || combined.includes("cardigan")) return "\uD83E\uDDE5"; // 🧥
  if (combined.includes("blusa") || combined.includes("blusinha") || combined.includes("camisa") || combined.includes("bata")) return "\uD83D\uDC5A"; // 👚
  if (combined.includes("regata")) return "\u2600\uFE0F"; // ☀️
  if (combined.includes("body") || combined.includes("collant")) return "\uD83D\uDC83"; // 💃
  if (combined.includes("short") || combined.includes("bermuda")) return "\uD83E\uDE73"; // 🩳
  if (combined.includes("cropped")) return "\u2728"; // ✨
  if (combined.includes("saia") || combined.includes("minissaia")) return "\uD83D\uDC57"; // 👗
  if (combined.includes("macac\u00e3o") || combined.includes("macaquinho") || combined.includes("kimono")) return "\uD83D\uDC58"; // 👘
  if (combined.includes("pijama") || combined.includes("camisola")) return "\uD83D\uDE34"; // 😴
  if (combined.includes("lingerie") || combined.includes("biquini")) return "\uD83D\uDC59"; // 👙
  if (combined.includes("top") || combined.includes("fitness") || combined.includes("academia")) return "\uD83C\uDFBD"; // 🎽
  return "\uD83D\uDC57"; // 👗 (fallback)
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("sulbrasil_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem("sulbrasil_customer_name") || "";
  });
  const [customerZipCode, setCustomerZipCode] = useState(() => {
    return localStorage.getItem("sulbrasil_customer_zip") || "";
  });
  const [selectedShipping, setSelectedShipping] = useState<ShippingResult | null>(null);

  useEffect(() => {
    localStorage.setItem("sulbrasil_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("sulbrasil_customer_name", customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem("sulbrasil_customer_zip", customerZipCode);
  }, [customerZipCode]);

  const totalPieces = items.reduce((sum, item) => sum + getPieceCount(item.product) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = items.reduce((sum, item) => {
    const weight = item.product.weight_kg || 0.15;
    return sum + weight * item.quantity;
  }, 0);
  const isWholesale = totalPieces >= WHOLESALE_THRESHOLD;

  const getCartKey = useCallback((item: CartItem) => buildCartKey(item.product.id, item.selectedSize), []);

  const addItem = useCallback((product: Product, size?: string) => {
    const key = buildCartKey(product.id, size);
    setItems((prev) => {
      const existing = prev.find((i) => buildCartKey(i.product.id, i.selectedSize) === key);
      if (existing) {
        return prev.map((i) =>
          buildCartKey(i.product.id, i.selectedSize) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selectedSize: size }];
    });
  }, []);

  const removeItem = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((i) => buildCartKey(i.product.id, i.selectedSize) !== cartKey));
  }, []);

  const updateQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => buildCartKey(i.product.id, i.selectedSize) !== cartKey));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        buildCartKey(i.product.id, i.selectedSize) === cartKey ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getItemPrice = useCallback(
    (item: CartItem) => {
      const { product } = item;
      let price = 0;

      const wholesalePrice = Number(product.wholesale_price || product.retail_price || 0);
      const retailPrice = Number(product.retail_price || product.wholesale_price || 0);

      if (isWholesale) {
        price = product.is_promotion
          ? Number(product.promotion_wholesale_price || product.promotion_retail_price || wholesalePrice)
          : wholesalePrice;
      } else {
        price = product.is_promotion
          ? Number(product.promotion_retail_price || product.promotion_wholesale_price || retailPrice)
          : retailPrice;
      }

      // Acréscimo por tamanho/categoria (ex: G1 em Conjuntos = +R$10)
      price += getPriceAdjustment(product.category, item.selectedSize);

      return price;
    },
    [isWholesale]
  );

  const getTotal = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
    return subtotal + (selectedShipping?.price || 0);
  }, [items, getItemPrice, selectedShipping]);

  /**
   * Gera a mensagem do pedido para o WhatsApp.
   *
   * Kits: cores exibidas uma abaixo da outra para facilitar separação física.
   *   Fonte (prioridade): color_name do banco → parte após " - " no nome → genérico.
   * Produtos normais: nome, tamanho, quantidade e preço em linha única.
   * Quebra de linha: apenas \n (compatível com WhatsApp).
   */
  const generateWhatsAppMessage = useCallback(() => {
    const priceType = isWholesale ? "ATACADO" : "VAREJO";
    const div = "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550";

    let msg = "";
    // ── Cabeçalho ──────────────────────────────────
    msg += `*NOVO PEDIDO \u2014 ${priceType}*\n`;
    msg += div + "\n";
    if (customerName.trim()) msg += `*Cliente:* ${customerName.trim()}\n`;
        msg += `*Total de peças:* ${totalPieces} | *Peso Est:* ${totalWeightKg.toFixed(2)}kg\n`;
    msg += div + "\n\n";

    // ── Listagem ────────────────────────────────────
    items.forEach((item, index) => {
      const { product, quantity, selectedSize } = item;
      const unitPrice = getItemPrice(item);
      const itemTotal = unitPrice * quantity;
      const pieceCount = getPieceCount(product);

      const isKit =
        product.is_kit === true ||
        product.name.toLowerCase().includes("kit") ||
        (product.category || "").toLowerCase().includes("kit");

      const emoji = product.display_emoji || getProductEmoji(product);

      if (isKit) {
        // Título do kit: parte antes do " - " (ou nome completo)
        const kitTitle = product.name.includes(" - ")
          ? product.name.split(" - ")[0].trim()
          : product.name;
        const qtyTag = quantity > 1 ? ` (x${quantity})` : "";
        msg += `*${index + 1}.* *${kitTitle}${qtyTag}*\n`;

        // ── Cores do kit ── uma por linha ──
        let kitColors: string[] = [];

        // Prioridade 1: campo color_name do banco (ex: "Rosa, Bege, Off White")
        // Prioridade 1: campo color_name do banco (que agora é gerenciado pela lista de cores no admin)
        if (product.color_name && product.color_name.trim()) {
          // Se for kit, o color_name já vem como "Cor1, Cor2, Cor3"
          kitColors = product.color_name.split(",").map((c) => c.trim()).filter(Boolean);
        }
        // Prioridade 2: Fallback para parsing do nome (produtos legado)
        else if (product.name.includes(" - ")) {
          const afterDash = product.name.split(" - ").slice(1).join(" - ").replace(/[()]/g, "").trim();
          const commaParts = afterDash.split(",").map((c) => c.trim()).filter(Boolean);
          if (commaParts.length > 1) {
            const last = commaParts[commaParts.length - 1].replace(/^e\s+/i, "").trim();
            kitColors = [...commaParts.slice(0, -1), last].filter(Boolean);
          } else {
            const andParts = afterDash.split(/ e /i).map((c) => c.trim()).filter(Boolean);
            kitColors = andParts.length > 1 ? andParts : [afterDash];
          }
        }

        if (kitColors.length > 0) {
          kitColors.forEach((cor) => {
            const numberMatch = cor.match(/^(\d+)([xX\s]*)(.*)/);
            
            if (numberMatch) {
              const baseQty = parseInt(numberMatch[1], 10);
              const colorName = numberMatch[3].trim();
              const finalQty = baseQty * quantity;
              const qtyDisplay = finalQty > 1 ? `${finalQty} ` : "";
              msg += `   - ${qtyDisplay}${colorName}\n`;
            } else {
              const qtyDisplay = quantity > 1 ? `${quantity} ` : "";
              msg += `   - ${qtyDisplay}${cor}\n`;
            }
          });
        } else {
          const totalPiecesItem = pieceCount * quantity;
          const qtyDisplay = totalPiecesItem > 1 ? `${totalPiecesItem} ` : "";
          msg += `   - ${qtyDisplay}peças\n`;
        }

        msg += `   ${formatCurrency(unitPrice)}/kit = *${formatCurrency(itemTotal)}*\n\n`;

      } else {
        // ── Produto normal ──
        msg += `*${index + 1}.* ${product.name}\n`;

        const parts: string[] = [];
        if (selectedSize) {
          const norm = selectedSize.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          if (!norm.includes("unico") && norm !== "u") {
            parts.push(`Tam: *${selectedSize}*`);
          }
        }
        if (quantity > 1) parts.push(`Qtd: *${quantity}*`);
        parts.push(`${formatCurrency(unitPrice)}/un = *${formatCurrency(itemTotal)}*`);
        msg += `   ${parts.join(" | ")}\n\n`;
      }
    });

    // ── Rodapé ──────────────────────────────────────
    const totalWeight = totalPieces * 0.150; // 150g por peça
    msg += div + "\n";
    msg += `*TOTAL: ${formatCurrency(getTotal())}*\n`;
    msg += `*Peso Est.:* ${totalWeight.toFixed(2)}kg\n`;
    msg += `*Frete:* (A calcular)\n`;
    msg += div + "\n";

    return msg;
  }, [items, isWholesale, totalPieces, totalItems, customerName, getItemPrice, getTotal]);

  const saveOrderToDb = useCallback(async (message: string) => {
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        selected_size: item.selectedSize || null,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        total: getItemPrice(item) * item.quantity,
      }));

      await supabase.from("orders").insert({
        customer_name: customerName.trim() || "Sem nome",
        items: orderItems,
        total: getTotal(),
        total_pieces: totalPieces,
        is_wholesale: isWholesale,
        shipping_method: selectedShipping?.service || null,
        shipping_cost: selectedShipping?.price || 0,
        whatsapp_message: message,
        status: "pending",
      });
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
    }
  }, [items, customerName, totalPieces, isWholesale, getItemPrice, getTotal]);

  const sendToWhatsApp = useCallback(() => {
    const message = generateWhatsAppMessage();
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
        getCartKey,
        sendToWhatsApp,
        generateWhatsAppMessage,
        selectedShipping,
        setSelectedShipping,
        totalWeightKg,
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
