import { useProducts } from "@/hooks/useProducts";
import { optimizeImageUrl } from "@/lib/url";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickAccessMenuProps {
  isCatalog?: boolean;
}

export const QuickAccessMenu = ({ isCatalog = false }: QuickAccessMenuProps) => {
  const { getCategoriesWithImages, loading } = useProducts();
  const navigate = useNavigate();

  if (loading) return null;

  const categories = getCategoriesWithImages();

  const handleSelect = (category: string) => {
    const lowerCategory = category.toLowerCase();
    const prefix = isCatalog ? '/catalogo' : '/vitrine';
    
    if (lowerCategory.includes('promoções') || lowerCategory.includes('promoção')) {
      navigate(`${prefix}/promocoes`);
    } else if (lowerCategory.includes('lançamentos') || lowerCategory.includes('lançamento')) {
      navigate(`${prefix}/lancamentos`);
    } else {
      navigate(`${prefix}/${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="w-full bg-[#FCE4EC] border-b border-primary/10 overflow-visible relative z-30">
      <div className="container mx-auto px-4 overflow-visible">
        <div className="flex items-start gap-5 sm:gap-8 overflow-x-auto pt-4 pb-4 scrollbar-hide snap-x overflow-y-visible">
          {categories.map((item) => {
            const isSpecial = item.category.toLowerCase().includes('promo') || 
                            item.category.toLowerCase().includes('lança');
            
            return (
              <button
                key={item.category}
                onClick={() => handleSelect(item.category)}
                className="flex flex-col items-center gap-3 min-w-[85px] sm:min-w-[110px] snap-start group outline-none overflow-visible"
              >
                <div className={cn(
                  "relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full p-[3px] transition-all duration-300 group-hover:scale-105 group-active:scale-95",
                  isSpecial 
                    ? "bg-gradient-to-tr from-primary via-accent to-primary ring-2 ring-primary/20 ring-offset-2" 
                    : "bg-primary/30 border-2 border-primary/20 group-hover:bg-primary/40"
                )}>
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-surface relative">
                    <img
                      src={optimizeImageUrl(item.imageUrl) || "/placeholder.svg"}
                      alt={item.category}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  {isSpecial && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 z-50">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white"></span>
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] sm:text-sm font-bold transition-colors duration-200 text-center max-w-[85px] sm:max-w-[110px] leading-tight",
                   isSpecial ? "text-primary font-black" : "text-foreground-muted group-hover:text-primary"
                )}>
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
