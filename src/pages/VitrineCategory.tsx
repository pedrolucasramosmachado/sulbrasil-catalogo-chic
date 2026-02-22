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

const VitrineCategory = () => {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  const { products, loading, error, getProductsByCategory, getSubcategoriesWithData, getProductsBySubcategory, categoryHasSubcategories, getPromotionProducts, getLaunchProducts } = useProducts();

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
            variant="default"
            className="gap-2 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all"
            size="default"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            {subcategory ? 'Voltar às subcategorias' : 'Voltar à vitrine'}
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
          {loading ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4">Carregando...</div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
            </div>
          ) : showSubcategories ? (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
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
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {currentProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="flex animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCardVitrine
                    product={product}
                    onImageClick={handleImageClick}
                  />
                </div>
              ))}
            </div>
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
            src={imageUrl || "/placeholder.svg"}
            alt={subcategory}
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
