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


const Index = () => {
  const navigate = useNavigate();
  const { loading, error, getCategoriesWithImages } = useProducts();
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const handleConsult = (product: Product) => {
    const productUrl = `${window.location.origin}/produto/${product.id}`;
    const message = `Olá! Tenho interesse no produto: ${product.name}. Link: ${productUrl}`;
    const whatsappUrl = `https://wa.me/5511961890347?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleImageClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
  };

  const isSearching = searchQuery.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header onSearchResults={handleSearchResults} />

      {/* Banner Carousel */}
      {!isSearching && <BannerCarousel />}

      {/* Quick Access Menu "Stories" Style */}
      {!isSearching && <QuickAccessMenu isCatalog={true} />}

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
                    onConsult={handleConsult}
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
        <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden min-h-[10vh] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
          <div className="container mx-auto px-4 relative z-10">
            {loading ? (
              <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
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
      )}

      {/* Overlap indicator - Shows part of next section */}
      {!isSearching && (
        <div className="block sm:hidden h-20 -mt-16 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      )}
    </div>
  );
};

export default Index;