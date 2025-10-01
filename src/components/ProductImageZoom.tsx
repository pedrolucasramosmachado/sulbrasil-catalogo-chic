import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface ProductImageZoomProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImageZoom = ({ product, isOpen, onClose }: ProductImageZoomProps) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent shadow-none">
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Botão de fechar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-50 w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300 flex items-center justify-center group border-2 border-white/20"
          >
            <X className="w-8 h-8 text-white" strokeWidth={2.5} />
          </button>

          {/* Imagem com zoom */}
          <div className="relative max-w-[90vw] max-h-[90vh] pointer-events-none">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Nome do produto */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
            <p className="text-white font-semibold text-center">{product.name}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
