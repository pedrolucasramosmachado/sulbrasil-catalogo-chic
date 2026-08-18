import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { useProducts, Product } from "@/hooks/useProducts";
import { toast } from "@/hooks/use-toast";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategorySkeleton } from "@/components/CategorySkeleton";
import { QuickAccessMenu } from "@/components/QuickAccessMenu";
import { SectorSelector } from "@/components/SectorSelector";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";


const Index = () => {
  const navigate = useNavigate();
  const { loading, error, getCategoriesWithImages, sectors, getSectorsWithData } = useProducts();
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
      navigate('/catalogo/promocoes');
    } else if (sectorId === 'lancamentos') {
      navigate('/catalogo/lancamentos');
    } else {
      setSelectedSectorId(sectorId);
    }
  };

  const handleCategorySelect = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('promoções') || lowerCategory.includes('promoção')) {
      navigate('/catalogo/promocoes');
    } else if (lowerCategory.includes('lançamentos') || lowerCategory.includes('lançamento')) {
      navigate('/catalogo/lancamentos');
    } else {
      navigate(`/catalogo/${encodeURIComponent(category)}`);
    }
  };

  const handleSearchResults = (results: Product[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
  };


  const handleImageClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
  };

  const isSearching = searchQuery.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header onSearchResults={handleSearchResults} />

      {/* Sector Selector */}
      {!isSearching && (
        <SectorSelector
          sectors={sectors}
          activeSectorId={selectedSectorId}
          onSelectSector={handleSelectSector}
        />
      )}

      {/* Banner Carousel */}
      {!isSearching && <BannerCarousel />}

      {/* Quick Access Menu "Stories" Style */}
      {!isSearching && <QuickAccessMenu isCatalog={true} activeSectorId={selectedSectorId} />}

      {/* Scroll Indicator for Mobile */}
      {!isSearching && <ScrollIndicator />}

      {/* Search Results Section */}
      {isSearching && (
        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {searchResults.length > 0 
                  ? `${searchResults.length} produto${searchResults.length > 1 ? 's' : ''} encontrado${searchResults.length > 1 ? 's' : ''}`
                  : 'Nenhum produto encontrado'}
              </h2>
              <p className="text-foreground-muted">Buscando por: "{searchQuery}"</p>
            </div>

            {searchResults.length > 0 && (
              <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onImageClick={handleImageClick}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hero Section - Category Selection (hidden during search) */}
      {!isSearching && (
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
              <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                {[...Array(6)].map((_, i) => (
                  <CategorySkeleton key={i} />
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
                      <CategoryCard
                        category={sector.name}
                        imageUrl={sector.imageUrl}
                        minWholesalePrice={sector.minWholesalePrice}
                        minRetailPrice={sector.minRetailPrice}
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
                        <CategoryCard
                          category={item.category}
                          imageUrl={item.imageUrl}
                          minWholesalePrice={item.minWholesalePrice}
                          minRetailPrice={item.minRetailPrice}
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
      )}

      {/* Overlap indicator - Shows part of next section */}
      {!isSearching && (
        <div className="block sm:hidden h-20 -mt-16 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      )}
    </div>
  );
};

export default Index;