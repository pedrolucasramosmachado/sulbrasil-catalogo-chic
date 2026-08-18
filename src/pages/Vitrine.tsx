import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BannerCarousel } from "@/components/BannerCarousel";
import { optimizeImageUrl } from "@/lib/url";
import { QuickAccessMenu } from "@/components/QuickAccessMenu";
import { SectorSelector } from "@/components/SectorSelector";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";


const Vitrine = () => {
  const navigate = useNavigate();
  const { loading, error, getCategoriesWithImages, sectors, getSectorsWithData } = useProducts();
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('activeSectorId');
    if (saved === 'promocoes' || saved === 'lancamentos') return null;
    return saved;
  });

  useEffect(() => {
    if (selectedSectorId) {
      sessionStorage.setItem('activeSectorId', selectedSectorId);
    } else {
      sessionStorage.removeItem('activeSectorId');
    }
  }, [selectedSectorId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectSector = (sectorId: string | null) => {
    if (sectorId === 'promocoes') {
      navigate('/vitrine/promocoes');
    } else if (sectorId === 'lancamentos') {
      navigate('/vitrine/lancamentos');
    } else {
      setSelectedSectorId(sectorId);
    }
  };

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

      {/* Sector Selector */}
      <SectorSelector
        sectors={sectors}
        activeSectorId={selectedSectorId}
        onSelectSector={handleSelectSector}
      />

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Quick Access Menu "Stories" Style */}
      <QuickAccessMenu isCatalog={false} activeSectorId={selectedSectorId} />

      {/* Scroll Indicator for Mobile */}
      <ScrollIndicator />

      <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden min-h-[10vh]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          
          {/* Header com breadcrumb / Título do Setor */}
          {!loading && !error && (
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
                {selectedSectorId === null 
                  ? "Nossas Modinhas" 
                  : (sectors.find(s => s.id === selectedSectorId)?.name || "Outros")
                }
              </h2>
              <p className="text-sm sm:text-base text-foreground-muted">
                {selectedSectorId === null 
                  ? "Explore as nossas modinhas e novidades que preparamos para você" 
                  : "Selecione uma categoria para ver os modelos"
                }
              </p>
              {selectedSectorId !== null && (
                <div className="mt-6 flex justify-center animate-fade-in">
                  <Button 
                    onClick={() => setSelectedSectorId(null)}
                    className="group relative gap-2 rounded-full px-6 py-5 font-semibold text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 border-none overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Voltar para Modinhas</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white/50 backdrop-blur-sm rounded-xl border border-border/30 overflow-hidden animate-pulse">
                  <div className="h-full w-full bg-gradient-to-br from-surface-elevated to-surface"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {selectedSectorId === null ? (
                getSectorsWithData().map((sector, index) => (
                  <div 
                    key={sector.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <VitrineCategoryCard
                      category={sector.name}
                      imageUrl={sector.imageUrl}
                      onSelect={() => handleSelectSector(sector.id)}
                    />
                  </div>
                ))
              ) : (
                <>
                  {getCategoriesWithImages(selectedSectorId).map((item, index) => (
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
                </>
              )}
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
            src={optimizeImageUrl(imageUrl) || "/placeholder.svg"}
            alt={category}
            className={cn(
              "w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-110",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/placeholder.svg") {
                target.src = "/placeholder.svg";
              }
            }}
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
