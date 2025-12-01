import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ChevronDown } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

const Vitrine = () => {
  const navigate = useNavigate();
  const { loading, error, getCategoriesWithImages } = useProducts();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCategorySelect = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('promoções') || lowerCategory.includes('promoção')) {
      navigate('/vitrine/promocoes');
    } else if (lowerCategory.includes('lançamentos') || lowerCategory.includes('lançamento')) {
      navigate('/vitrine/lancamentos');
    } else {
      navigate(`/vitrine/${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Scroll Indicator for Mobile */}
      <div className="block sm:hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
        <div className="bg-primary text-white p-3 rounded-full shadow-glow">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>

      {/* Hero Section - Category Selection */}
      <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden min-h-[40vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
              Vitrine Sulbrasil
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-foreground-muted leading-relaxed px-4 mb-6">
              Confira nossos produtos disponíveis 👇
            </p>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4">Carregando categorias...</div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {getCategoriesWithImages().map((item, index) => (
                <div 
                  key={item.category}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <VitrineCategoryCard
                    category={item.category}
                    imageUrl={item.imageUrl}
                    onSelect={() => handleCategorySelect(item.category)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Overlap indicator - Shows part of next section */}
      <div className="block sm:hidden h-20 -mt-16 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
    </div>
  );
};

// Card de categoria sem preços
const VitrineCategoryCard = ({ 
  category, 
  imageUrl, 
  onSelect 
}: { 
  category: string; 
  imageUrl: string | null; 
  onSelect: () => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-0 shadow-elegant hover:shadow-glow transition-all duration-500 transform hover:scale-[1.02] bg-white/90 backdrop-blur-sm"
      onClick={onSelect}
    >
      <div className="relative">
        <div className={cn(
          "aspect-[3/4] relative overflow-hidden",
          !imageLoaded && "animate-pulse bg-surface"
        )}>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={category}
            className={cn(
              "w-full h-full object-cover transition-all duration-700 group-hover:scale-110",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
        </div>
        
        <CardContent className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 drop-shadow-lg text-center">
            {category}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 text-center">
            Clique para ver
          </p>
        </CardContent>
      </div>
    </Card>
  );
};

export default Vitrine;
