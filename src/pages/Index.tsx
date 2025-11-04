import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { ChevronDown } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const navigate = useNavigate();
  const { loading, error, getCategoriesWithImages } = useProducts();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCategorySelect = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('promoções') || lowerCategory.includes('promoção')) {
      navigate('/catalogo/promocoes');
    } else {
      navigate(`/catalogo/${encodeURIComponent(category)}`);
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
              Qual categoria deseja visualizar?
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-foreground-muted leading-relaxed px-4 mb-6">
              Clique para ver os modelos e cores disponíveis 👇
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
                  <CategoryCard
                    category={item.category}
                    imageUrl={item.imageUrl}
                    minWholesalePrice={item.minWholesalePrice}
                    minRetailPrice={item.minRetailPrice}
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

export default Index;
