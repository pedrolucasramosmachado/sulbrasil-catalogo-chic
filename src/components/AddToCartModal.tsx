import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";

interface AddToCartModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCartModal = ({ product, isOpen, onClose }: AddToCartModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Auto-selecionar tamanho se houver apenas uma opção
  useEffect(() => {
    if (product && product.sizes && product.sizes.length === 1) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize("");
    }
  }, [product]);

  const handleClose = () => {
    setSelectedSize("");
    setQuantity(1);
    onClose();
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!selectedSize) {
      toast({
        title: "Tamanho obrigatório",
        description: "Por favor, selecione um tamanho antes de adicionar ao carrinho",
        variant: "destructive"
      });
      return;
    }

    // Adicionar múltiplas vezes baseado na quantidade
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize);
    }

    toast({
      title: "Produto adicionado",
      description: `${quantity}x ${product.name} (${selectedSize}) adicionado ao carrinho`,
    });

    handleClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Adicionar ao Carrinho</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{product.name}</h3>
              <div className="mt-2">
                {product.retail_price && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Varejo: </span>
                    <span className="font-semibold text-primary">
                      R$ {product.retail_price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                {product.wholesale_price && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Atacado: </span>
                    <span className="font-semibold text-accent">
                      R$ {product.wholesale_price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Tamanho <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((size, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSize === size
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted-hover border border-border'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {product.sizes?.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum tamanho disponível</p>
            )}
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Quantidade
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Total Preview */}
          {selectedSize && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-semibold text-primary">
                  R$ {((product.retail_price || 0) * quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {quantity}x {product.name} ({selectedSize})
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddToCart} className="flex-1">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};