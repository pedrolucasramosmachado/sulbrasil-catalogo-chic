import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { AddToCartModal } from "@/components/AddToCartModal";
import { FloatingCart } from "@/components/FloatingCart";
import { toast } from "@/hooks/use-toast";
import { Product, useProducts } from "@/hooks/useProducts";

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  
  const { products, loading, error, getProductsByCategory, getCategories } = useProducts();

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConsult = (product: Product) => {
    const message = `Olá! Tenho interesse no produto: ${product.name}. Gostaria de mais informações sobre disponibilidade, cores e condições de compra.`;
    const whatsappUrl = `https://wa.me/5511961890347?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: `Consulta sobre: ${product.name}`,
    });
  };

  const handleToggleFavorite = (productId: string) => {
    // In a real app, this would update the backend
    toast({
      title: "Favorito atualizado",
      description: "Produto adicionado/removido dos favoritos",
    });
  };

  const handleAddToCart = (product: Product) => {
    setProductToAdd(product);
    setIsAddToCartModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Nossos Produtos
            </h2>
            <p className="text-foreground-muted">
              {products.length} produtos disponíveis
            </p>
          </div>

          {/* Category Filter */}
          {!loading && products.length > 0 && (
            <div className="mb-8 flex justify-center">
              <div className="flex gap-3 flex-wrap justify-center">
                {getCategories().map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-full text-base font-semibold transition-all duration-300 transform hover:scale-105 ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted text-muted-foreground hover:bg-muted-hover border-2 border-transparent hover:border-primary/20'
                    }`}
                  >
                    {category === 'todos' ? 'Todos' : category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4">Carregando produtos...</div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-2xl mb-4 text-red-600">Erro: {error}</div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr px-2 sm:px-0">
              {getProductsByCategory(selectedCategory).map((product) => (
                <div key={product.id} className="flex">
                  <ProductCard
                    product={product}
                    onViewDetails={handleViewDetails}
                    onConsult={handleConsult}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={handleAddToCart}
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

      <Footer />

      <FloatingCart />

      {/* Add to Cart Modal */}
      <AddToCartModal
        product={productToAdd}
        isOpen={isAddToCartModalOpen}
        onClose={() => {
          setIsAddToCartModalOpen(false);
          setProductToAdd(null);
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onConsult={handleConsult}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};

export default Index;
