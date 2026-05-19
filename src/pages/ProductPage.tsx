import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Share2, MessageCircle, ShoppingCart, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById } = useProducts();
  const { addItem } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [justAdded, setJustAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(true);

  useEffect(() => {
    const fetchFullDetails = async () => {
      if (id) {
        setFetchingDetails(true);
        const fullProduct = await getProductById(id);
        setProduct(fullProduct);
        setFetchingDetails(false);
      }
    };
    fetchFullDetails();
  }, [id]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes && product.sizes.length === 1 ? product.sizes[0] : undefined);
    }
  }, [product]);

  const extraPrice = (selectedSize === 'G1' && product?.category?.toLowerCase() === 'conjuntos') ? 10 : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name}${selectedSize ? ` - Tam: ${selectedSize}` : ""}`,
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);


  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Confira este produto: ${product.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };
  
  const getPrice = (type: 'retail' | 'wholesale') => {
    if (!product) return 0;
    const basePrice = type === 'retail' ? product.retail_price : product.wholesale_price;
    if (!basePrice) return 0;
    
    let price = basePrice;
    
    // Add size surcharge if applicable (matched logic from ProductCard)
    if (selectedSize === 'G1' && product.category?.toLowerCase() === 'conjuntos') {
      price += 10;
    }
    
    return price;
  };

  if (fetchingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
        <Header />

        {/* Sticky back bar skeleton */}
        <div className="sticky top-[56px] sm:top-[64px] z-40 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
          <div className="container mx-auto px-4 py-3">
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Content skeleton — espelha o layout real: 1 col mobile / 2 col desktop */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Imagem */}
              <Skeleton className="w-full aspect-[3/4] rounded-2xl" />

              {/* Info */}
              <div className="flex flex-col gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-3/4 rounded-xl" />
                  <Skeleton className="h-5 w-full rounded-lg" />
                  <Skeleton className="h-5 w-2/3 rounded-lg" />
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.08)] space-y-8">
                  {/* Tamanhos */}
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-48 rounded-lg" />
                    <div className="flex gap-3">
                      <Skeleton className="h-14 w-16 rounded-2xl" />
                      <Skeleton className="h-14 w-16 rounded-2xl" />
                      <Skeleton className="h-14 w-16 rounded-2xl" />
                    </div>
                  </div>
                  {/* Preços */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-28 rounded-3xl" />
                    <Skeleton className="h-28 rounded-3xl" />
                  </div>
                  {/* Botão */}
                  <Skeleton className="h-20 w-full rounded-[1.5rem]" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 rounded-2xl" />
                    <Skeleton className="h-16 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mb-4 text-6xl opacity-20">😢</div>
          <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
          <Button onClick={() => navigate('/catalogo')}>
            Voltar ao Catálogo
          </Button>
        </div>
      </div>
    );
  }

  const displayPrice = product.is_promotion && (product.promotion_wholesale_price || product.promotion_retail_price)
    ? (product.promotion_retail_price || product.promotion_wholesale_price) 
    : product.retail_price || product.wholesale_price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <Header />

      {/* Back Button */}
      <div className="sticky top-[56px] sm:top-[64px] z-40 bg-background/95 backdrop-blur-md border-b border-card-border shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <Button
            onClick={() => navigate(`/catalogo/${encodeURIComponent(product.category)}`)}
            variant="default"
            className="gap-2 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all"
            size="default"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden bg-surface-elevated shadow-strong">
              <div className="aspect-[3/4] relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated to-surface animate-pulse" />
                )}
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== window.location.origin + "/placeholder.svg") {
                      target.src = "/placeholder.svg";
                    }
                    setImageLoaded(true); // garante que o skeleton desaparece mesmo com erro
                  }}
                />
                {product.is_promotion && (
                  <Badge className="absolute top-4 left-4 bg-gradient-to-r from-accent to-primary text-white text-sm font-medium shadow-medium border-0">
                    🔥 PROMOÇÃO
                  </Badge>
                )}
              </div>
            </div>

            {/* Info Section - Premium & Accessible */}
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm px-4 py-1 rounded-full uppercase font-bold tracking-widest">
                    {product.category}
                  </Badge>
                  {product.subcategory && (
                    <Badge variant="outline" className="text-xs sm:text-sm px-4 py-1 rounded-full uppercase font-bold tracking-widest border-gray-200">
                      {product.subcategory}
                    </Badge>
                  )}
                  {product.name.toLowerCase().match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid?|und?)/i) && (
                    <Badge className="bg-blue-600 text-white border-0 font-black px-4 py-1 rounded-full shadow-md animate-pulse">
                      📦 {product.name.match(/(\d+)\s*(pe[cç]as?|p[cç]s?|unid?|und?)/i)?.[1] || "1"} PEÇAS
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1A1A1A] leading-[1.1] tracking-tight">
                  {product.name}
                </h1>
                
                {product.description && (
                  <p className="text-xl text-gray-500 leading-relaxed font-medium">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Selection & Price Card - THE ACTION ZONE */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.12)] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                
                {/* Step 1: Tamanhos */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md">1</div>
                      <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-wider">Escolha o Tamanho:</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {product.sizes.map(size => (
                        <div key={size} className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSize(prev => prev === size ? undefined : size)}
                            className={cn(
                              "min-w-[65px] h-14 sm:h-16 text-lg sm:text-xl font-black px-6 py-2 rounded-2xl border-2 transition-all duration-300 shadow-sm",
                              selectedSize === size
                                ? "bg-primary text-white border-primary shadow-[0_10px_25px_rgba(233,30,99,0.3)] scale-110 ring-4 ring-primary/20"
                                : "bg-gray-50 text-gray-400 border-gray-100 hover:border-primary/50 hover:bg-white hover:text-primary"
                            )}
                          >
                            {size}
                          </button>
                          {size === 'G1' && product.category?.toLowerCase() === 'conjuntos' && (
                            <span className="text-xs text-accent font-black bg-accent/10 px-2 py-0.5 rounded-full">+ R$ 10,00</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Preços */}
                {displayPrice !== undefined && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md">2</div>
                      <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-wider">Confira o Valor:</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Varejo - Rosa claro visível */}
                      <div className="bg-pink-100 border border-pink-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-2">
                        <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-widest">Varejo</span>
                        <div className="text-2xl font-bold text-gray-700 tracking-tighter">
                          {formatCurrency(getPrice('retail'))}
                        </div>
                        <span className="text-[10px] font-medium text-pink-300 uppercase">Por peça avulsa</span>
                      </div>

                      {/* Atacado - Destaque vantajoso, sem badge de desconto */}
                      <div className="bg-gradient-to-br from-[#fce4ec] to-[#fdf2f8] border-2 border-primary/50 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 relative shadow-md">
                        {/* Selo de melhor preço */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap">
                          ★ Melhor Preço
                        </div>
                        <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mt-2">Atacado</span>
                        <div className="text-5xl font-black text-primary tracking-tighter drop-shadow-sm flex items-baseline gap-1">
                          <span className="text-xl font-bold">R$</span>
                          {getPrice('wholesale').toFixed(2).split('.')[0]}
                          <span className="text-xl font-bold">,{getPrice('wholesale').toFixed(2).split('.')[1]}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-widest">A partir de 10 peças</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions Section */}
                <div className="pt-4 space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4 text-gray-500">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">💡</div>
                    <p className="text-sm font-medium leading-tight">Combine tamanhos e modelos diferentes para atingir o valor de atacado!</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={product.is_out_of_stock || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                      className={cn(
                        "w-full text-xl h-20 sm:h-24 font-black rounded-[1.5rem] shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-95",
                        justAdded 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white hover:shadow-[0_15px_40px_rgba(233,30,99,0.4)]"
                      )}
                    >
                      {justAdded ? (
                        <div className="flex items-center justify-center gap-3">
                          <Check className="w-8 h-8" />
                          <span>Adicionado ao Carrinho!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <ShoppingCart className="w-8 h-8" />
                          <span>Adicionar ao Carrinho</span>
                        </div>
                      )}
                    </Button>
                    
                     <Button
                      size="lg"
                      variant="outline"
                      onClick={handleShare}
                      className="h-16 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-all font-bold gap-2 w-full"
                    >
                      <Share2 className="w-6 h-6 text-primary" />
                      Enviar p/ Amiga
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center font-bold uppercase tracking-[0.2em]">
                  🔒 Site Oficial Sulbrasil Fashion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;
