import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onConsult: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
}

export const ProductCard = ({ 
  product, 
  onViewDetails, 
  onConsult, 
  onToggleFavorite 
}: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(product.id);
  };

  return (
    <Card className="group cursor-pointer overflow-hidden bg-gradient-to-br from-card to-surface border-card-border hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <div 
          className={cn(
            "aspect-[3/4] bg-surface-elevated relative overflow-hidden",
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
          
          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8 rounded-full bg-background/90 hover:bg-background border-card-border"
              onClick={handleToggleFavorite}
            >
              <Heart className="w-4 h-4 text-foreground-muted" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8 rounded-full bg-background/90 hover:bg-background border-card-border"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
            >
              <Eye className="w-4 h-4 text-foreground-muted" />
            </Button>
          </div>

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

      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 6).map((tag, index) => (
                <div
                  key={index}
                  className="text-xs bg-accent-soft text-accent-foreground px-2 py-1 rounded-full font-medium"
                >
                  {tag}
                </div>
              ))}
              {product.tags.length > 6 && (
                <div className="text-xs bg-surface-elevated text-foreground-muted px-2 py-1 rounded-full font-medium">
                  +{product.tags.length - 6}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-xs text-foreground-muted line-clamp-2">
              {product.description}
            </p>
          )}

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

      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product);
          }}
          className="flex-1 text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver Detalhes
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onConsult(product);
          }}
          className="flex-1 text-xs"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Consultar
        </Button>
      </CardFooter>
    </Card>
  );
};