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
const DEFAULT_WHATSAPP_NUMBER = "5511961890347";
const DEFAULT_WEIGHT_PER_PIECE = 0.15; // 150g por peça

/** Chave única para um item do carrinho (produto + tamanho) */
const buildCartKey = (productId: string, size?: string): string => {
  return size ? `${productId}__${size}` : productId;
};

/**
 * Extrai a contagem de peças do nome do produto.
 * Ex: "Kit 6 Blusas" → 6, "Kit com 3" → 3, padrão → 1
 */
const getPieceCount = (product: Product): number => {
  if (!product) return 1;
  // Prioridade 1: Campo estruturado do banco
  if (product.kit_piece_count) return product.kit_piece_count;
  
  // Prioridade 2: Fallback para o parsing do nome (produtos antigos)
  const name = (product.name || "").toLowerCase();
  const matchPieces = name.match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid(ades?)?|und?|itens)/i);
  if (matchPieces) return Math.max(1, parseInt(matchPieces[1], 10));
  const matchKit = name.match(/(?:kit|combo|conjunto|conj)\s*(?:com\s*|de\s*)?(\d+)/i);
  if (matchKit) return Math.max(1, parseInt(matchKit[1], 10));
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

/**
 * Limpa o texto removendo termos de teste e trims excessivos.
 */
const cleanLabel = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/final test/gi, "")
    .replace(/teste/gi, "")
    .replace(/placeholder/gi, "")
    .replace(/  +/g, " ")
    .trim();
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
  const [whatsappSettings, setWhatsappSettings] = useState<{
    phone_number: string;
    header_text: string;
    footer_text: string | null;
    show_prices: boolean;
    show_total: boolean;
    show_out_of_stock: boolean;
  }>({
    phone_number: DEFAULT_WHATSAPP_NUMBER,
    header_text: "🛍️ *PEDIDO*",
    footer_text: null,
    show_prices: true,
    show_total: true,
    show_out_of_stock: false,
  });
  const [categoryEmojis, setCategoryEmojis] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem("sulbrasil_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("sulbrasil_customer_name", customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem("sulbrasil_customer_zip", customerZipCode);
  }, [customerZipCode]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: settingsData } = await supabase
          .from('whatsapp_settings')
          .select('*')
          .maybeSingle();
        
        if (settingsData) {
          setWhatsappSettings(settingsData);
        }

        const { data: categories } = await supabase
          .from('categories')
          .select('name, whatsapp_emoji');
        
        if (categories) {
          const emojiMap: Record<string, string> = {};
          categories.forEach(cat => {
            if (cat.whatsapp_emoji) {
              emojiMap[cat.name] = cat.whatsapp_emoji;
            }
          });
          setCategoryEmojis(emojiMap);
        }
      } catch (err) {
        console.error("Erro ao carregar configs do WhatsApp:", err);
      }
    };
    fetchSettings();
  }, []);

  const totalPieces = items.reduce((sum, item) => sum + getPieceCount(item.product) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalWeightKg = Number(items.reduce((sum, item) => {
    let weight = item.product.weight_kg;
    const pieces = getPieceCount(item.product);
    
    // Identifica se é um conjunto
    const combined = [item.product.name, item.product.category, item.product.subcategory]
      .join(" ")
      .toLowerCase();
    const isConjunto = combined.includes("conjunto") || combined.includes("conj.");
    
    // Peso padrão: 1kg para conjuntos, 0.15kg por peça para outros
    const fallbackWeight = isConjunto ? 1.0 : (DEFAULT_WEIGHT_PER_PIECE * pieces);

    // Proteção contra pesos absurdos ou ausentes
    // Se for conjunto, o limite é maior (10kg por kit/conjunto)
    const maxLimit = isConjunto ? 10 : (5 * pieces);

    if (!weight || weight > maxLimit) {
      if (weight && weight > maxLimit) {
        console.warn(`Peso anômalo detectado para o produto ${item.product.name}: ${weight}kg. Usando fallback de ${fallbackWeight}kg.`);
      }
      weight = fallbackWeight;
    }
    
    return sum + (weight * item.quantity);
  }, 0).toFixed(2));
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
    return Number((subtotal + (selectedShipping?.price || 0)).toFixed(2));
  }, [items, getItemPrice, selectedShipping]);

  /**
   * Gera a mensagem do pedido para o WhatsApp.
   *
   * Formato:
   * - Emoji contextual por produto (display_emoji do banco ou inferido pelo nome/categoria)
   * - Kits: título em negrito, peças e valor em linha, cores em linha dedicada (🎨)
   * - Produtos normais: nome em negrito, tamanho/qtd/valor compactos em linha única
   * - Rodapé com total, peso real e frete a calcular
   */
  const generateWhatsAppMessage = useCallback(() => {
    const priceType = isWholesale ? "ATACADO" : "VAREJO";
    const divider = "--------------------------------";

    let msg = "";
    msg += `${whatsappSettings.header_text} - ${priceType}\n`;
    if (customerName.trim()) msg += `👤 *Cliente:* ${customerName.trim()}\n`;
    msg += `📦 *Total de itens:* ${totalPieces} peças\n`;
    msg += divider + "\n\n";

    // Agrupar itens por categoria
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      const cat = item.product?.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    // Helper para emoji de categoria
    const getCategoryEmoji = (cat: string) => {
      // Prioridade 1: Emoji configurado no banco por categoria
      if (categoryEmojis[cat]) return categoryEmojis[cat];

      const c = cat.toLowerCase();
      if (c.includes("copa")) return "👒";
      if (c.includes("baby")) return "🎀";
      if (c.includes("sarah")) return "👒";
      if (c.includes("laço") || c.includes("tiara")) return "🎀";
      return "📦";
    };

    Object.entries(groups).forEach(([category, groupItems]) => {
      const c = category.toLowerCase();
      const isKitGroup = c === "kits" || c === "kit" || c === "kit atacado" || c === "combos";

      const emoji = isKitGroup ? "🎁" : getCategoryEmoji(category);

      let headerLabel = category.toUpperCase();
      if (isKitGroup) {
        const cleanName = headerLabel.replace(/^KIT\s*[:\-]?\s*/, "");
        headerLabel = `KIT: ${cleanName || "KITS"}`;
      }

      let groupPieces = 0;
      let groupValue = 0;

      // ─── Sub-agrupamento por model_name ───────────────────────────────────
      type SubItem = { item: typeof groupItems[0]; displayColor: string };
      const subGroupMap: Record<string, { modelLabel: string | null; items: SubItem[] }> = {};

      groupItems.forEach((item) => {
        const unitPrice = getItemPrice(item);
        const itemTotal = unitPrice * item.quantity;
        const piecesPerItem = getPieceCount(item.product);
        const totalPiecesItem = piecesPerItem * item.quantity;

        groupPieces += totalPiecesItem;
        groupValue += itemTotal;

        // Limpeza e Fallback de Nomes/Cores
        const modelLabel = cleanLabel(item.product.model_name) || null;
        let displayColor = cleanLabel(item.product.color_name);
        
        // Fallback: Se a cor ficou vazia após a limpeza, usa o nome do produto limpo
        if (!displayColor) {
          displayColor = cleanLabel(item.product.name);
        }
        
        const key = modelLabel ?? `__solo__${item.product.id}`;

        if (!subGroupMap[key]) {
          subGroupMap[key] = { modelLabel, items: [] };
        }
        subGroupMap[key].items.push({ item, displayColor });
      });

      // Separa itens standalone (sem model_name ou com apenas 1 item no grupo)
      // de sub-grupos nomeados (model_name + múltiplos itens)
      const standaloneGroups = Object.values(subGroupMap).filter(g => !g.modelLabel || g.items.length === 1);
      const namedSubGroups   = Object.values(subGroupMap).filter(g => g.modelLabel && g.items.length > 1);

      // ── Itens standalone: usa cabeçalho da categoria ──
      if (standaloneGroups.length > 0) {
        let sPieces = 0, sValue = 0;
        msg += `${emoji} *${headerLabel}*\n`;
        standaloneGroups.forEach(({ modelLabel, items }) => {
          const { item, displayColor } = items[0];
          const piecesPerItem = getPieceCount(item.product);
          const piecesInfo = piecesPerItem > 1 ? ` (${piecesPerItem} pçs)` : "";
          const cleanModel = cleanLabel(item.product.model_name);
          const cleanColor = cleanLabel(item.product.color_name);
          const showName = (cleanModel && cleanColor)
            ? `${cleanModel} ${cleanColor}`
            : cleanLabel(item.product.name);
          const sizeInfo = item.selectedSize && item.product.sizes && item.product.sizes.length > 1 ? ` (Tam: ${item.selectedSize})` : "";
          msg += `▫️ ${item.quantity}x ${showName}${piecesInfo}${sizeInfo}\n`;

          const itemNameRaw = item.product?.name || "";
          const componentsMatch = itemNameRaw.match(/\(([^)]+)\)/);
          if (componentsMatch?.length && componentsMatch[1].includes(",")) {
            componentsMatch[1].split(",").map(c => c.trim()).forEach(comp => {
              if (!comp.toLowerCase().includes("pçs") && !comp.toLowerCase().includes("peças")) {
                msg += `    ▪️ ${comp}\n`;
              }
            });
          }

          sPieces += getPieceCount(item.product) * item.quantity;
          sValue  += getItemPrice(item) * item.quantity;
        });
        msg += `📦 Subtotal: ${sPieces} peças\n`;
        if (whatsappSettings.show_prices) {
          msg += `💰 Valor: ${formatCurrency(sValue)}\n`;
        }
        msg += "\n";
      }

      // ── Sub-grupos nomeados: cada um com seu próprio emoji + header ──
      namedSubGroups.forEach(({ modelLabel, items }) => {
        let sgPieces = 0;
        let sgValue = 0;
        let unitPrice = 0;
        msg += `${emoji} *${modelLabel}*\n`;
        items.forEach(({ item, displayColor }) => {
          const piecesPerItem = getPieceCount(item.product);
          const piecesInfo = piecesPerItem > 1 ? ` (${piecesPerItem} pçs)` : "";
          const sizeInfo = item.selectedSize && item.product.sizes && item.product.sizes.length > 1 ? ` (Tam: ${item.selectedSize})` : "";
          msg += `▫️ ${item.quantity}x ${displayColor}${piecesInfo}${sizeInfo}\n`;
          sgPieces += piecesPerItem * item.quantity;
          
          const currentItemPrice = getItemPrice(item);
          sgValue  += currentItemPrice * item.quantity;
          if (unitPrice === 0) {
            unitPrice = currentItemPrice;
          }
        });
        const formattedUnitPrice = unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const formattedTotal = sgValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        msg += `Peças: ${sgPieces}\n`;
        if (whatsappSettings.show_prices) {
            msg += `Valor: ${formattedUnitPrice}\n`;
            msg += `Total: ${formattedTotal}\n`;
        }
        msg += "\n";
      });
    });

    msg += divider + "\n";
    if (whatsappSettings.show_prices) {
      msg += `💰 *TOTAL FINAL: ${formatCurrency(getTotal())}*\n`;
    }
    msg += `⚖️ *Peso estimado: ${totalWeightKg.toFixed(2)}kg*\n`;
    msg += `🚚 _Frete a calcular pelo atendente_`;
    if (whatsappSettings.footer_text) {
      msg += `\n\n${whatsappSettings.footer_text}`;
    }

    return msg;
  }, [items, isWholesale, totalPieces, customerName, getItemPrice, getTotal, totalWeightKg]);


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
    const url = `https://wa.me/${whatsappSettings.phone_number}?text=${encodeURIComponent(message)}`;
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
