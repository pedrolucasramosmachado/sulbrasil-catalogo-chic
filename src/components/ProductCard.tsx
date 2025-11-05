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
    <Card className="group cursor-pointer overflow-hidden bg-gradient-to-br from-white via-surface to-surface-elevated border border-card-border hover:border-primary/20 hover:shadow-strong transition-all duration-500 hover:-translate-y-2 w-full h-full flex flex-col backdrop-blur-sm">
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
              "w-full h-full object-cover transition-all duration-700 group-hover:scale-125",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Magical Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-700" />

          {/* Sparkle Effect */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 text-white">
            ✨
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_promotion && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold shadow-glow border-0 animate-pulse">
                🔥 PROMOÇÃO
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs font-medium shadow-medium border-0">
                ⭐ Destaque
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white/50 to-surface/30">
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] group-hover:text-primary transition-colors duration-300">
            {product.name}
          </h3>

          {/* Category */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <Badge className="bg-gradient-to-r from-surface-elevated to-surface text-foreground-muted border border-border-subtle text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1">
              {product.category}
            </Badge>
            {product.subcategory && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1">
                {product.subcategory}
              </Badge>
            )}
          </div>

          {/* Prices */}
          <div className="space-y-2">
            {/* Wholesale Price */}
            {product.wholesale_price && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-foreground-muted font-medium">Atacado</span>
                <div className="flex items-center gap-2">
                  {product.is_promotion && product.promotion_wholesale_price ? (
                    <>
                      <span className="text-xs text-foreground-muted line-through">
                        R$ {Number(product.wholesale_price).toFixed(2)}
                      </span>
                      <span className="text-base font-bold text-primary">
                        R$ {Number(product.promotion_wholesale_price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-bold text-foreground">
                      R$ {Number(product.wholesale_price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Retail Price */}
            {product.retail_price && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-foreground-muted font-medium">Varejo</span>
                <div className="flex items-center gap-2">
                  {product.is_promotion && product.promotion_retail_price ? (
                    <>
                      <span className="text-xs text-foreground-muted line-through">
                        R$ {Number(product.retail_price).toFixed(2)}
                      </span>
                      <span className="text-base font-bold text-primary">
                        R$ {Number(product.promotion_retail_price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-bold text-foreground">
                      R$ {Number(product.retail_price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 md:p-5 pt-0 flex flex-col items-stretch gap-2 sm:gap-3">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onConsult(product);
          }}
          className="w-full text-xs sm:text-sm h-9 sm:h-10 md:h-11 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold rounded-lg sm:rounded-xl shadow-medium hover:shadow-glow transition-all duration-300 active:scale-95 sm:hover:scale-105"
        >
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          💬 Consultar
        </Button>
      </CardFooter>
    </Card>
  );
};