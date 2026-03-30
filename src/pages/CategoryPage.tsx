import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageZoom } from "@/components/ProductImageZoom";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Product, useProducts } from "@/hooks/useProducts";
import { ProductSkeleton } from "@/components/ProductSkeleton";


const CategoryPage = () => {
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

  const handleConsult = (product: Product) => {
    const productUrl = `${window.location.origin}/produto/${product.id}`;
    const message = `Olá! Tenho interesse no produto: ${product.name}. Link do produto: ${productUrl}. Gostaria de mais informações sobre disponibilidade, cores e condições de compra.`;
    const whatsappUrl = `https://wa.me/5511961890347?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleSubcategorySelect = (subcat: string) => {
    navigate(`/catalogo/${category}/${encodeURIComponent(subcat)}`);
  };

  const displayProducts = () => {
    console.log('CategoryPage - category:', category, 'subcategory:', subcategory);
    if (category === 'promocoes') {
      const promoProducts = getPromotionProducts();
      console.log('Produtos em promoção encontrados:', promoProducts.length);
      return promoProducts;
    }
    if (category === 'lancamentos') {
      const launchProducts = getLaunchProducts();
      console.log('Produtos em lançamento encontrados:', launchProducts.length);
      return launchProducts;
    }
    if (subcategory) {
      return getProductsBySubcategory(category || '', subcategory);
    }
    if (category) {
      return getProductsByCategory(category);
    }
    return [];
  };

  const displaySubcategories = () => {
    if (category && categoryHasSubcategories(category) && category !== 'promocoes' && category !== 'lancamentos') {
      return getSubcategoriesWithData(category);
    }
    return [];
  };

  const currentProducts = displayProducts();
  const currentSubcategories = displaySubcategories();
  const showProducts = currentProducts.length > 0;
  const showSubcategories = currentSubcategories.length > 0;

  const pageTitle = category === 'promocoes' 
    ? 'Promoções da Semana 🔥'
    : category === 'lancamentos'
    ? 'Lançamentos ✨'
    : subcategory 
    ? subcategory
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
            onClick={() => navigate(subcategory ? `/catalogo/${category}` : '/catalogo')}
            variant="default"
            className="gap-2 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all"
            size="default"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            {subcategory ? 'Voltar às subcategorias' : 'Voltar ao catálogo'}
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
              {showSubcategories ? 'Escolha uma peça para ver as cores' : 'Clique para ver os modelos e cores disponíveis 👇'}
            </p>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Subcategories Horizontal Filter (Pills) */}
      {showSubcategories && (
        <section className="border-b border-border/50 bg-surface/95 backdrop-blur-md sticky top-[106px] sm:top-[116px] z-30 shadow-none">
          <div className="container mx-auto px-4 py-3">
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 snap-x">
              <Button
                variant={!subcategory ? "default" : "outline"}
                size="sm"
                className="rounded-full whitespace-nowrap snap-start shadow-sm"
                onClick={() => navigate(`/catalogo/${category}`)}
              >
                Todos
              </Button>
              {currentSubcategories.map((subcat) => (
                <Button
                  key={subcat.subcategory}
                  variant={subcategory === subcat.subcategory ? "default" : "outline"}
                  size="sm"
                  className="rounded-full whitespace-nowrap snap-start shadow-sm"
                  onClick={() => handleSubcategorySelect(subcat.subcategory)}
                >
                  {subcat.subcategory}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="py-8 sm:py-12 md:py-16 relative">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : error ? (

            <div className="text-center py-16">
              <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
            </div>
          ) : showProducts ? (
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {currentProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="flex animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ProductCard
                    product={product}
                    onConsult={handleConsult}
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
                Pode não haver itens selecionados no momento.
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

export default CategoryPage;
