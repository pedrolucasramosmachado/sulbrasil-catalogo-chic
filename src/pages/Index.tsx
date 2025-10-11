import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageZoom } from "@/components/ProductImageZoom";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Product, useProducts } from "@/hooks/useProducts";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  const { products, loading, error, getProductsByCategory, getCategoriesWithImages, getSubcategoriesWithData, getProductsBySubcategory, categoryHasSubcategories } = useProducts();

  // Scroll to top whenever category, subcategory or view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, selectedSubcategory, showCategorySelection]);

  const handleImageClick = (product: Product) => {
    setZoomProduct(product);
    setIsZoomOpen(true);
  };

  const handleConsult = (product: Product) => {
    const productUrl = `${window.location.origin}/?produto=${product.id}`;
    const message = `Olá! Tenho interesse no produto: ${product.name}. Link do produto: ${productUrl}. Gostaria de mais informações sobre disponibilidade, cores e condições de compra.`;
    const whatsappUrl = `https://wa.me/5511961890347?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setShowCategorySelection(false);
    
    // Se a categoria não tem subcategorias, podemos pré-carregar os produtos
    if (!categoryHasSubcategories(category)) {
      // Marca que não há subcategorias para mostrar produtos diretamente
      setSelectedSubcategory('__NO_SUBCATEGORY__');
    }
  };

  const handleBackToCategories = () => {
    setShowCategorySelection(true);
    setSelectedCategory('todos');
    setSelectedSubcategory(null);
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Quiz Section - Category Selection */}
      {showCategorySelection ? (
        <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
                Qual categoria deseja visualizar?
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-foreground-muted leading-relaxed px-4">
                Escolha uma categoria para ver todas as cores disponíveis
              </p>
              <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-4 sm:mt-6"></div>
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
      ) : (
        <>
          {/* Fixed Back Button */}
          <div className="sticky top-[56px] sm:top-[64px] z-40 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
            <div className="container mx-auto px-4 py-3">
              <Button
                onClick={selectedSubcategory && selectedSubcategory !== '__NO_SUBCATEGORY__' ? handleBackToSubcategories : handleBackToCategories}
                variant="default"
                className="gap-2 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all"
                size="default"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                {selectedSubcategory && selectedSubcategory !== '__NO_SUBCATEGORY__' ? 'Voltar às subcategorias' : 'Voltar às categorias'}
              </Button>
            </div>
          </div>

          {/* Hero Section - Products View */}
          <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
                  {selectedSubcategory && selectedSubcategory !== '__NO_SUBCATEGORY__' 
                    ? selectedSubcategory 
                    : selectedCategory}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-foreground-muted mb-6 sm:mb-8 leading-relaxed px-4">
                  {selectedSubcategory && selectedSubcategory !== '__NO_SUBCATEGORY__' 
                    ? 'Todas as cores disponíveis' 
                    : selectedSubcategory === '__NO_SUBCATEGORY__'
                    ? 'Todos os produtos disponíveis'
                    : 'Escolha uma peça para ver as cores'}
                </p>
                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
              </div>
            </div>
          </section>

          {/* Products Section */}
          <section className="py-8 sm:py-12 md:py-16 relative">
            <div className="container mx-auto px-4">
              {loading ? (
                <div className="text-center py-16">
                  <div className="text-2xl mb-4">Carregando produtos...</div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
                </div>
              ) : products.length > 0 ? (
                <div className={`grid gap-4 sm:gap-6 md:gap-8 auto-rows-fr ${
                  selectedSubcategory === null 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto' 
                    : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                  {selectedSubcategory && selectedSubcategory !== '__NO_SUBCATEGORY__' ? (
                    // Mostrar produtos de uma subcategoria específica
                    getProductsBySubcategory(selectedCategory, selectedSubcategory).map((product, index) => (
                      <div 
                        key={product.id} 
                        className="flex animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <ProductCard
                          product={product}
                          onConsult={handleConsult}
                          onImageClick={handleImageClick}
                          isSubcategoryView={false}
                        />
                      </div>
                    ))
                  ) : selectedSubcategory === '__NO_SUBCATEGORY__' ? (
                    // Categoria sem subcategorias - mostrar produtos diretamente
                    getProductsByCategory(selectedCategory).map((product, index) => (
                      <div 
                        key={product.id} 
                        className="flex animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <ProductCard
                          product={product}
                          onConsult={handleConsult}
                          onImageClick={handleImageClick}
                          isSubcategoryView={false}
                        />
                      </div>
                    ))
                  ) : (
                    // Mostrar subcategorias (usando CategoryCard)
                    getSubcategoriesWithData(selectedCategory).map((subcat, index) => (
                      <div 
                        key={subcat.subcategory} 
                        className="flex animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CategoryCard
                          category={subcat.subcategory}
                          imageUrl={subcat.imageUrl}
                          minWholesalePrice={subcat.minWholesale}
                          minRetailPrice={subcat.minRetail}
                          onSelect={() => handleSubcategorySelect(subcat.subcategory)}
                        />
                      </div>
                    ))
                  )}
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
        </>
      )}

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

export default Index;
