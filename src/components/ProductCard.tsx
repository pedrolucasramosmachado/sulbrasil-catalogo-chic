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
    <Card className="group cursor-pointer overflow-hidden bg-white border border-border/30 hover:shadow-xl transition-all duration-300 w-full h-full flex flex-col rounded-xl">
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
            {product.is_launch && (
              <Badge className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 text-white text-xs font-bold shadow-xl border-0 px-3 py-1.5">
                ✨ LANÇAMENTO
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

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col bg-white">
        <div className="space-y-4">
          {/* Product Name */}
          <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight text-center">
            {product.name}
          </h3>

          {/* Prices Stacked */}
          <div className="space-y-2">
            {/* Retail Price */}
            {product.retail_price && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <span>🔥</span>
                  <span>Varejo:</span>
                </div>
                <div className="text-sm font-bold text-[#E91E63]">
                  R$ {product.is_promotion && product.promotion_retail_price
                    ? Number(product.promotion_retail_price).toFixed(2)
                    : Number(product.retail_price).toFixed(2)}
                </div>
              </div>
            )}

            {/* Wholesale Price */}
            {product.wholesale_price && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <span>💎</span>
                  <span>Atacado:</span>
                </div>
                <div className="text-sm font-bold text-[#9C27B0]">
                  R$ {product.is_promotion && product.promotion_wholesale_price
                    ? Number(product.promotion_wholesale_price).toFixed(2)
                    : Number(product.wholesale_price).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs px-3 py-1 rounded-full border-border/50 text-foreground-muted">
              {product.category}
            </Badge>
            {product.subcategory && (
              <Badge variant="outline" className="text-xs px-3 py-1 rounded-full border-border/50 text-foreground-muted">
                {product.subcategory}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-0">
        <Button
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            onConsult(product);
          }}
          className="w-full text-sm sm:text-base h-12 bg-[#E91E63] hover:bg-[#D81B60] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Consultar
        </Button>
      </CardFooter>
    </Card>
  );
};