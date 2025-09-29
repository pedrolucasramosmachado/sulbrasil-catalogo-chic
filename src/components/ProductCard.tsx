import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onConsult: (product: Product) => void;
}

export const ProductCard = ({ 
  product, 
  onViewDetails,
  onConsult 
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
          onClick={() => onViewDetails(product)}
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
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs font-medium shadow-medium border-0">
                ⭐ Destaque
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white/50 to-surface/30">
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors duration-300">
            {product.name}
          </h3>
          
          {/* Prices */}
          {(product.retail_price || product.wholesale_price) && (
            <div className="space-y-2 p-3 bg-white/60 rounded-xl border border-border-subtle">
              {product.retail_price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">💰 Varejo:</span>
                  <span className="font-bold text-primary text-sm">
                    R$ {product.retail_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              {product.wholesale_price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">📦 Atacado:</span>
                  <span className="font-bold text-accent text-sm">
                    R$ {product.wholesale_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div className="flex items-center justify-center">
            <Badge className="bg-gradient-to-r from-surface-elevated to-surface text-foreground-muted border border-border-subtle text-xs font-medium px-3 py-1">
              {product.category}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-0 flex flex-col items-stretch gap-3">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onConsult(product);
          }}
          className="w-full text-sm h-11 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold rounded-xl shadow-medium hover:shadow-glow transition-all duration-300 transform hover:scale-105"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          💬 Consultar Produto
        </Button>
      </CardFooter>
    </Card>
  );
};