import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  image: string;
  colors: string[];
  retailPrice: number;
  wholesalePrice: number;
  category: string;
  isNew?: boolean;
  isFavorite?: boolean;
}

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
            src={product.image}
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
              <Heart className={cn(
                "w-4 h-4 transition-colors",
                product.isFavorite ? "fill-accent text-accent" : "text-foreground-muted"
              )} />
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
            {product.isNew && (
              <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                Novo
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
          
          {/* Colors */}
          <div className="flex flex-wrap gap-1">
            {product.colors.slice(0, 6).map((color, index) => (
              <div
                key={index}
                className="text-xs bg-accent-soft text-accent-foreground px-2 py-1 rounded-full font-medium"
              >
                {color}
              </div>
            ))}
            {product.colors.length > 6 && (
              <div className="text-xs bg-surface-elevated text-foreground-muted px-2 py-1 rounded-full font-medium">
                +{product.colors.length - 6}
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted">Varejo:</span>
              <span className="font-semibold text-price-retail">
                R$ {product.retailPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted">Atacado:</span>
              <span className="font-semibold text-price-wholesale">
                R$ {product.wholesalePrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
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