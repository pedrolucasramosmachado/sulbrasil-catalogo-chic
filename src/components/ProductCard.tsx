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
    <Card className="group cursor-pointer overflow-hidden bg-gradient-to-br from-card to-surface border-card-border hover:shadow-medium transition-all duration-300 hover:-translate-y-1 w-full h-full flex flex-col">
      <div className="relative overflow-hidden flex-shrink-0">
        <div 
          className={cn(
            "aspect-[3/4] bg-surface-elevated relative overflow-hidden cursor-pointer",
            !imageLoaded && "animate-pulse"
          )}
          onClick={() => onViewDetails(product)}
        >
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_featured && (
              <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                Destaque
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          {/* Prices */}
          {(product.retail_price || product.wholesale_price) && (
            <div className="space-y-1">
              {product.retail_price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-muted">Varejo:</span>
                  <span className="font-semibold text-primary">
                    R$ {product.retail_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              {product.wholesale_price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-muted">Atacado:</span>
                  <span className="font-semibold text-accent">
                    R$ {product.wholesale_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col items-stretch gap-2">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onConsult(product);
          }}
          className="w-full text-xs h-9"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Consultar
        </Button>
      </CardFooter>
    </Card>
  );
};