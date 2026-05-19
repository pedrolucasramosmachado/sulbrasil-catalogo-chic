import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, getPriceAdjustment } from "@/lib/format";
import { optimizeImageUrl } from "@/lib/url";


interface ProductCardProps {
  product: Product;
  onImageClick: (product: Product) => void;
  isSubcategoryView?: boolean;
}

export const ProductCard = ({ 
  product, 
  onImageClick,
  isSubcategoryView = false
}: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes && product.sizes.length === 1 ? product.sizes[0] : undefined
  );
  const { addItem } = useCart();
  const adjustment = getPriceAdjustment(product.category, selectedSize);

  const getPrice = (type: 'retail' | 'wholesale') => {
    const wholesalePrice = Number(product.wholesale_price || product.retail_price || 0);
    const retailPrice = Number(product.retail_price || product.wholesale_price || 0);
    
    let basePrice = 0;
    if (type === 'retail') {
      basePrice = product.is_promotion 
        ? Number(product.promotion_retail_price || product.promotion_wholesale_price || retailPrice)
        : retailPrice;
    } else {
      basePrice = product.is_promotion 
        ? Number(product.promotion_wholesale_price || product.promotion_retail_price || wholesalePrice)
        : wholesalePrice;
    }
    return basePrice + adjustment;
  };

  const hasSizes = product.sizes && product.sizes.length > 0;
  const needsSizeSelection = hasSizes && product.sizes!.length > 1;
  const canAdd = !product.is_out_of_stock && (!needsSizeSelection || selectedSize);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (needsSizeSelection && !selectedSize) {
      setShowSizeWarning(true);
      setTimeout(() => setShowSizeWarning(false), 2000);
      return;
    }
    if (!canAdd) return;
    
    addItem(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Card className="group cursor-pointer overflow-hidden bg-white/70 backdrop-blur-sm border border-white/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all duration-500 w-full h-full flex flex-col rounded-[2rem]">
      <div className="relative overflow-hidden flex-shrink-0">
        <div 
          className={cn(
            "aspect-[3/4] bg-gradient-to-br from-surface-elevated to-surface relative overflow-hidden cursor-pointer",
            !imageLoaded && "animate-pulse"
          )}
          onClick={() => onImageClick(product)}
        >
          <img
            src={optimizeImageUrl(product.image_url)}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1",
              imageLoaded ? "opacity-100" : "opacity-0",
              product.is_out_of_stock && "opacity-50"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/placeholder.svg") {
                target.src = "/placeholder.svg";
              }
            }}
          />
          
          {/* Out of Stock Badge */}
          {product.is_out_of_stock && (
            <div className="absolute bottom-3 right-3 z-20">
              <span className="text-sm font-semibold text-white bg-black/80 px-4 py-2 rounded-full shadow-lg">
                Esgotado
              </span>
            </div>
          )}
          
          {/* Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-all duration-700" />

          {/* Sparkle Effect */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 text-white text-xl drop-shadow-lg">
            ✨
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {product.is_promotion && (
              <Badge className="bg-gradient-to-r from-orange-500/90 via-red-500/90 to-pink-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-lg border border-white/20 px-3 py-1.5 animate-pulse uppercase tracking-wider">
                🔥 PROMOÇÃO
              </Badge>
            )}
            {product.is_launch && (
              <Badge className="bg-gradient-to-r from-green-400/90 via-emerald-500/90 to-teal-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-lg border border-white/20 px-3 py-1.5 uppercase tracking-wider">
                ✨ LANÇAMENTO
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-yellow-400/90 via-amber-500/90 to-orange-500/90 backdrop-blur-md text-white text-[10px] font-bold shadow-lg border border-white/20 px-3 py-1.5 uppercase tracking-wider">
                ⭐ Destaque
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-2.5 sm:p-5 flex-1 flex flex-col bg-white">
        <div className="space-y-3 sm:space-y-4">
          {/* Product Name */}
          <h3 className="font-bold text-[#1A1A1A] group-hover:text-primary transition-colors duration-300 text-sm sm:text-lg leading-tight text-center line-clamp-2">
            {product.name}
          </h3>

          {/* Preços: Varejo discreto | Atacado em destaque */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Varejo - Neutro */}
            {product.retail_price && (
              <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-3 flex flex-col items-center gap-1 transition-colors duration-300">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Varejo</span>
                <div className="flex items-baseline text-gray-500">
                  <span className="text-lg sm:text-xl font-bold tracking-tighter">
                    {formatCurrency(getPrice('retail'))}
                  </span>
                </div>
              </div>
            )}

            {/* Atacado - Destaque claro */}
            {product.wholesale_price && (
              <div className="bg-gradient-to-br from-[#fce4ec] to-[#fdf2f8] border-2 border-primary/40 rounded-2xl p-3 flex flex-col items-center gap-1 group-hover:border-primary/70 group-hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Atacado</span>
                  <span className="text-primary text-[10px] leading-none">✦</span>
                </div>
                <div className="flex items-baseline text-primary">
                  <span className="text-xl sm:text-2xl font-black tracking-tighter">
                    {formatCurrency(getPrice('wholesale'))}
                  </span>
                </div>
              </div>
            )}
          </div>
            
            {/* Piece Count Badge for Kits */}
            {product.name.toLowerCase().includes('kit') && (
              <div className="flex items-center justify-center pt-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full">
                  📦 {product.name.match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid?|und?)/i)?.[1] || "1"} PEÇAS
                </Badge>
              </div>
            )}

            {/* Size selector - MOVED HERE to eliminate gap, right after prices */}
          {hasSizes && (
            <div className="w-full flex flex-col items-center gap-2 pt-1">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                Escolha seu Tamanho:
              </span>
              <div className={cn(
                "flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 w-full transition-all duration-300",
                showSizeWarning && "ring-4 ring-destructive/20 ring-offset-2 rounded-2xl p-2 bg-destructive/5"
              )}>
                {product.sizes!.map(size => (
                <div key={size} className="flex flex-col items-center">
                  {/* Single size: show as info chip (not selectable CTA style) */}
                  {!needsSizeSelection ? (
                    <span className="text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full border-2 border-primary/30 bg-primary/8 text-primary">
                      {size}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSize(prev => prev === size && needsSizeSelection ? undefined : size);
                        if (showSizeWarning) setShowSizeWarning(false);
                      }}
                      className={cn(
                        "text-xs sm:text-base font-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 transition-all duration-300 min-w-[3.5rem] shadow-sm",
                        selectedSize === size
                          ? "bg-primary text-white border-primary scale-110 shadow-lg ring-4 ring-primary/20"
                          : "bg-white text-foreground border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      {size}
                    </button>
                  )}
                  {size === 'G1' && product.category?.toLowerCase() === 'conjuntos' && (
                    <span className="text-[9px] sm:text-[10px] text-accent font-black leading-none mt-1 bg-accent/10 px-1.5 rounded-full">+ R$ 10</span>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2.5 sm:p-5 pt-0 flex flex-col gap-3 sm:gap-4">

        {/* Add to cart hint */}
        {needsSizeSelection && !selectedSize && (
          <p className={cn(
            "text-[10px] sm:text-xs font-semibold text-center transition-colors duration-300 -mt-1 mb-1",
            showSizeWarning ? "text-destructive animate-pulse" : "text-muted-foreground"
          )}>
            {showSizeWarning ? "⚠️ Selecione um tamanho" : "Selecione o tamanho"}
          </p>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 w-full mt-1">
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={product.is_out_of_stock}
            className={cn(
              "flex-1 text-[11px] sm:text-base h-9 sm:h-11 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300",
              justAdded
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground",
              showSizeWarning && "bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none border border-destructive"
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                Adicionado!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Adicionar</span>
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
