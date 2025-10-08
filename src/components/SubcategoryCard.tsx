import { Card } from "@/components/ui/card";

interface SubcategoryCardProps {
  subcategory: string;
  imageUrl: string;
  minWholesalePrice?: number | null;
  minRetailPrice?: number | null;
  onSelect: () => void;
}

export const SubcategoryCard = ({
  subcategory,
  imageUrl,
  minWholesalePrice,
  minRetailPrice,
  onSelect
}: SubcategoryCardProps) => {
  return (
    <Card
      onClick={onSelect}
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 rounded-2xl h-[280px] sm:h-[320px] md:h-[360px]"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ 
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* Subcategory Name */}
        <div className="flex-1 flex items-center justify-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center drop-shadow-2xl">
            {subcategory}
          </h3>
        </div>
        
        {/* Price Buttons */}
        <div className="flex gap-3 justify-center">
          {minWholesalePrice && (
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg">
              Atacado: R$ {minWholesalePrice.toFixed(2)}
            </div>
          )}
          {minRetailPrice && (
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg">
              Varejo: R$ {minRetailPrice.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
