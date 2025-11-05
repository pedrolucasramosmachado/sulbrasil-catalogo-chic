import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
  onConsult: (product: Product) => void;
  onImageClick: (product: Product) => void;
  isSubcategoryView?: boolean;
}

export const ProductCard = ({ 
  product, 
  onConsult,
  onImageClick,
  isSubcategoryView = false
}: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);


  return (
    <Card className="group cursor-pointer overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-border/50 hover:border-primary/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 w-full h-full flex flex-col rounded-2xl">
      <div className="relative overflow-hidden flex-shrink-0">
        <div 
          className={cn(
            "aspect-[3/4] bg-gradient-to-br from-surface-elevated to-surface relative overflow-hidden cursor-pointer",
            !imageLoaded && "animate-pulse"
          )}
          onClick={() => onImageClick(product)}
        >
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-all duration-700" />

          {/* Sparkle Effect */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 text-white text-xl drop-shadow-lg">
            ✨
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.is_promotion && (
              <Badge className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white text-xs font-bold shadow-xl border-0 px-3 py-1.5 animate-pulse">
                🔥 PROMOÇÃO
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white text-xs font-bold shadow-xl border-0 px-3 py-1.5">
                ⭐ Destaque
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-3 sm:p-5 md:p-6 flex-1 flex flex-col justify-between bg-gradient-to-b from-white via-surface/5 to-surface/20">
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-bold text-foreground text-sm sm:text-lg leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[3rem] group-hover:text-primary transition-colors duration-300 text-center">
            {product.name}
          </h3>

          {/* Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Badge className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
              {product.category}
            </Badge>
            {product.subcategory && (
              <Badge className="bg-gradient-to-r from-accent/10 to-accent/5 text-accent border border-accent/20 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                {product.subcategory}
              </Badge>
            )}
          </div>

          {/* Enhanced Prices Section */}
          <div className="space-y-2 mt-2">
            {/* Wholesale Price */}
            {product.wholesale_price && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-2.5 sm:p-3 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wide">💼 Atacado</span>
                  <div className="flex items-center gap-1.5">
                    {product.is_promotion && product.promotion_wholesale_price ? (
                      <>
                        <span className="text-xs text-foreground-muted/60 line-through font-medium">
                          R$ {Number(product.wholesale_price).toFixed(2)}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                          R$ {Number(product.promotion_wholesale_price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300">
                        R$ {Number(product.wholesale_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Retail Price */}
            {product.retail_price && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-2.5 sm:p-3 border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wide">🛍️ Varejo</span>
                  <div className="flex items-center gap-1.5">
                    {product.is_promotion && product.promotion_retail_price ? (
                      <>
                        <span className="text-xs text-foreground-muted/60 line-through font-medium">
                          R$ {Number(product.retail_price).toFixed(2)}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                          R$ {Number(product.promotion_retail_price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300">
                        R$ {Number(product.retail_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-5 md:p-6 pt-0">
        <Button
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            onConsult(product);
          }}
          className="w-full text-xs sm:text-base h-10 sm:h-13 bg-gradient-to-r from-primary via-primary-hover to-primary hover:from-primary-hover hover:via-primary hover:to-primary-hover text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95 sm:hover:scale-[1.02] border-2 border-white/20"
        >
          <MessageCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          Consultar WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
};