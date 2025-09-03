import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Heart, Share2, ShoppingBag } from "lucide-react";
import { Product } from "@/components/ProductCard";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConsult: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
}

export const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onConsult, 
  onToggleFavorite 
}: ProductDetailModalProps) => {
  const [selectedColor, setSelectedColor] = useState<string>("");

  if (!product) return null;

  const handleConsult = () => {
    onConsult(product);
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Confira este produto da Sulbrasil: ${product.name}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-surface-elevated rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Additional Images Placeholder */}
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="w-20 h-20 bg-surface-elevated rounded-lg border border-card-border cursor-pointer hover:border-primary transition-colors"
                >
                  <img
                    src={product.image}
                    alt={`${product.name} - ${i}`}
                    className="w-full h-full object-cover rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-foreground leading-tight">
                    {product.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-accent-soft text-accent-foreground">
                      {product.category}
                    </Badge>
                    {product.isNew && (
                      <Badge className="bg-accent text-accent-foreground">
                        Novo
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleFavorite?.(product.id)}
                  >
                    <Heart className={cn(
                      "w-5 h-5",
                      product.isFavorite ? "fill-accent text-accent" : "text-foreground-muted"
                    )} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Prices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <p className="text-sm text-foreground-muted">Preço de Varejo</p>
                  <p className="text-2xl font-bold text-price-retail">
                    R$ {product.retailPrice.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground-muted">Preço de Atacado</p>
                  <p className="text-2xl font-bold text-price-wholesale">
                    R$ {product.wholesalePrice.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-foreground-muted text-center">
                *Consulte condições para compra no atacado
              </p>
            </div>

            <Separator />

            {/* Colors */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Cores Disponíveis</h4>
              <div className="grid grid-cols-3 gap-2">
                {product.colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                    className="text-sm"
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Product Description */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Descrição do Produto</h4>
              <div className="text-sm text-foreground-muted space-y-2">
                <p>
                  Peça confeccionada com tecidos de alta qualidade, seguindo os mais altos 
                  padrões da indústria têxtil brasileira. Design moderno e elegante que 
                  combina conforto e estilo.
                </p>
                <p>
                  <strong>Características:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tecido premium com toque macio</li>
                  <li>Modelagem que valoriza o corpo feminino</li>
                  <li>Fácil de lavar e manter</li>
                  <li>Disponível em diversos tamanhos</li>
                </ul>
              </div>
            </div>

            {/* Size Guide */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Tamanhos Disponíveis</h4>
              <div className="flex flex-wrap gap-2">
                {["PP", "P", "M", "G", "GG", "XG"].map((size) => (
                  <Button
                    key={size}
                    variant="outline"
                    size="sm"
                    className="w-12 h-12 p-0"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleConsult}
                className="w-full h-12 text-base font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Consultar Produto
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Adicionar à Lista
                </Button>
                <Button variant="outline" className="h-12" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};