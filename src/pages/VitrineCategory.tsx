import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { ProductCardVitrine } from "@/components/ProductCardVitrine";
import { ProductImageZoom } from "@/components/ProductImageZoom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Product, useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/url";

const VitrineCategory = () => {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  const { products, loading, hasMore, error, loadMore, getProductsByCategory, getSubcategoriesWithData, getProductsBySubcategory, categoryHasSubcategories, getPromotionProducts, getLaunchProducts } = useProducts();
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, subcategory]);

  const handleImageClick = (product: Product) => {
    setZoomProduct(product);
    setIsZoomOpen(true);
  };

  const handleSubcategorySelect = (subcat: string) => {
    navigate(`/vitrine/${category}/${encodeURIComponent(subcat)}`);
  };

  const displayProducts = () => {
    if (category === 'promocoes') {
      return getPromotionProducts();
    }
    if (category === 'lancamentos') {
      return getLaunchProducts();
    }
    if (subcategory) {
      return getProductsBySubcategory(category || '', decodeURIComponent(subcategory));
    }
    if (category && !categoryHasSubcategories(category)) {
      return getProductsByCategory(category);
    }
    return [];
  };

  const displaySubcategories = () => {
    if (category && !subcategory && categoryHasSubcategories(category) && category !== 'promocoes' && category !== 'lancamentos') {
      return getSubcategoriesWithData(category);
    }
    return [];
  };

  const currentProducts = displayProducts();
  const currentSubcategories = displaySubcategories();
  const showProducts = currentProducts.length > 0;
  const showSubcategories = currentSubcategories.length > 0;

  const pageTitle = category === 'promocoes' 
    ? 'Promoções 🔥'
    : category === 'lancamentos'
    ? 'Lançamentos ✨'
    : subcategory 
    ? decodeURIComponent(subcategory)
    : category || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Scroll Indicator for Mobile */}
      <ScrollIndicator />

      {/* Fixed Back Button */}
      <div className="sticky top-[56px] sm:top-[64px] z-40 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <Button
            onClick={() => navigate(subcategory ? `/vitrine/${category}` : '/vitrine')}
            className="group relative gap-2 rounded-full px-5 py-4 font-semibold text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 border-none overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{subcategory ? 'Voltar para Categorias' : 'Voltar para Modinhas'}</span>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 sm:mb-6 px-2 capitalize">
              {pageTitle}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-foreground-muted mb-4 leading-relaxed px-4">
              {showSubcategories ? 'Escolha uma peça para ver as cores' : 'Confira os modelos disponíveis 👇'}
            </p>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Products/Subcategories Section */}
      <section className="py-8 sm:py-12 md:py-16 relative">
        <div className="container mx-auto px-4">
          {loading && products.length === 0 ? (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white rounded-xl border border-border/30 overflow-hidden animate-pulse">
                  <div className="h-full w-full bg-gradient-to-br from-surface-elevated to-surface"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
            </div>
          ) : showSubcategories ? (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {currentSubcategories.map((subcat, index) => (
                <div 
                  key={subcat.subcategory} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <VitrineSubcategoryCard
                    subcategory={subcat.subcategory}
                    imageUrl={subcat.imageUrl}
                    onSelect={() => handleSubcategorySelect(subcat.subcategory)}
                  />
                </div>
              ))}
            </div>
          ) : showProducts ? (
            <>
              <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {currentProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="flex animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProductCardVitrine
                      product={product}
                      onImageClick={handleImageClick}
                    />
                  </div>
                ))}
              </div>
              
              {/* Infinite Scroll Sensor */}
              <div ref={setLoadMoreRef} className="h-20 flex items-center justify-center mt-8">
                {loading && hasMore && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-foreground-muted animate-pulse">Carregando mais modelos...</p>
                  </div>
                )}
                {!hasMore && currentProducts.length > 0 && (
                  <p className="text-foreground-muted text-sm font-medium opacity-50">
                    Você chegou ao fim dos modelos ✨
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4 text-6xl opacity-20">📦</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-foreground-muted">
                Em breve teremos produtos disponíveis
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Image Zoom Modal */}
      <ProductImageZoom
        product={zoomProduct}
        isOpen={isZoomOpen}
        onClose={() => {
          setIsZoomOpen(false);
          setZoomProduct(null);
        }}
      />
    </div>
  );
};

// Card de subcategoria sem preços
const VitrineSubcategoryCard = ({ 
  subcategory, 
  imageUrl, 
  onSelect 
}: { 
  subcategory: string; 
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
            alt={subcategory}
            className={cn(
              "w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-110",
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
            {subcategory}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 text-center">
            Clique para ver
          </p>
        </CardContent>
      </div>
    </Card>
  );
};

export default VitrineCategory;
