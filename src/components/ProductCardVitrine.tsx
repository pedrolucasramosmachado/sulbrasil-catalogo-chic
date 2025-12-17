import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/hooks/useProducts";

interface ProductCardVitrineProps {
  product: Product;
  onImageClick: (product: Product) => void;
}

export const ProductCardVitrine = ({ 
  product, 
  onImageClick,
}: ProductCardVitrineProps) => {
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
              imageLoaded ? "opacity-100" : "opacity-0",
              product.is_out_of_stock && "grayscale opacity-70"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Subtle Out of Stock Badge */}
          {product.is_out_of_stock && (
            <div className="absolute bottom-3 right-3 z-20">
              <span className="text-xs font-medium text-gray-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
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
    </Card>
  );
};
