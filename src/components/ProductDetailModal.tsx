import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Share2, ZoomIn, X } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { optimizeImageUrl } from "@/lib/url";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConsult: (product: Product) => void;
}

export const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onConsult 
}: ProductDetailModalProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  
  if (!product) return null;

  const handleConsult = () => {
    onConsult(product);
    onClose();
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/?produto=${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Confira este produto da Sulbrasil: ${product.name}. Link: ${productUrl}`,
          url: productUrl
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(productUrl);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="space-y-4">
              <div 
                className="relative aspect-[3/4] bg-surface-elevated rounded-lg overflow-hidden cursor-zoom-in group"
                onClick={() => setIsZoomed(true)}
              >
                <img
                  src={optimizeImageUrl(product.image_url) || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "/placeholder.svg") {
                      target.src = "/placeholder.svg";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  Clique para ampliar
                </div>
              </div>
              
              {/* Additional Images Placeholder */}
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="w-20 h-20 bg-surface-elevated rounded-lg border border-card-border cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setIsZoomed(true)}
                  >
                    <img
                      src={optimizeImageUrl(product.image_url) || "/placeholder.svg"}
                      alt={`${product.name} - ${i}`}
                      className="w-full h-full object-cover rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/placeholder.svg") {
                          target.src = "/placeholder.svg";
                        }
                      }}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-accent-soft text-accent-foreground">
                      {product.category}
                    </Badge>
                    {product.name.toLowerCase().match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid?|und?)/i) && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                        📦 {product.name.match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid?|und?)/i)?.[1] || "1"} PEÇAS
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="bg-accent text-accent-foreground">
                        Destaque
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Prices */}
            {(product.retail_price || product.wholesale_price) ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(product.retail_price || product.promotion_retail_price) && (
                    <div className="flex items-center justify-center p-4 bg-surface rounded-lg border border-border/20">
                      <div className="text-center">
                        <p className="text-xs text-foreground-muted mb-1">Varejo</p>
                        {product.is_promotion && product.retail_price && (product.promotion_retail_price || product.promotion_wholesale_price) && (
                          <p className="text-xs text-destructive line-through opacity-70">
                            R$ {product.retail_price.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                        <p className={cn("text-2xl font-bold", product.is_promotion ? "text-destructive" : "text-primary")}>
                          R$ {(product.is_promotion 
                            ? (product.promotion_retail_price || product.promotion_wholesale_price || product.retail_price || 0)
                            : (product.retail_price || product.wholesale_price || 0)
                          ).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  )}
                  {(product.wholesale_price || product.promotion_wholesale_price) && (
                    <div className="flex items-center justify-center p-4 bg-surface rounded-lg border border-border/20">
                      <div className="text-center">
                        <p className="text-xs text-foreground-muted mb-1">Atacado</p>
                        {product.is_promotion && product.wholesale_price && (product.promotion_wholesale_price || product.promotion_retail_price) && (
                          <p className="text-xs text-destructive line-through opacity-70">
                            R$ {product.wholesale_price.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                        <p className={cn("text-2xl font-bold", product.is_promotion ? "text-destructive" : "text-accent")}>
                          R$ {(product.is_promotion 
                            ? (product.promotion_wholesale_price || product.promotion_retail_price || product.wholesale_price || 0)
                            : (product.wholesale_price || product.retail_price || 0)
                          ).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-foreground-muted text-center">
                  *Consulte condições especiais para compra
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-4 bg-surface rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-foreground-muted">Consulte o preço</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Tamanhos disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <span key={size} className="px-3 py-1 rounded-full text-xs font-medium bg-surface border border-card-border text-foreground">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-foreground text-center sm:text-left">Descrição:</p>
                <div className="text-sm text-foreground-muted bg-surface/50 p-3 rounded-lg border border-dashed border-border/50 text-center sm:text-left italic whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleConsult}
                className="w-full h-12 text-base font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Consultar Produto
              </Button>
              
              <Button variant="outline" className="w-full h-12" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Zoom Modal */}
    {isZoomed && (
      <div 
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={() => setIsZoomed(false)}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 w-14 h-14 text-white hover:bg-white/20 z-10 rounded-full bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(false);
          }}
        >
          <X className="w-8 h-8" strokeWidth={2.5} />
        </Button>
        
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <img
            src={optimizeImageUrl(product.image_url) || "/placeholder.svg"}
            alt={product.name}
            className="max-w-full max-h-full object-contain pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/placeholder.svg") {
                target.src = "/placeholder.svg";
              }
            }}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm pointer-events-none">
            Toque fora da imagem para fechar
          </div>
        </div>
      </div>
    )}
    </>
  );
};