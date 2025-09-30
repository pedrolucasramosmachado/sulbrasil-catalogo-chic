import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  category: string;
  imageUrl: string;
  onSelect: () => void;
}

export const CategoryCard = ({ category, imageUrl, onSelect }: CategoryCardProps) => {
  return (
    <Card 
      onClick={onSelect}
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-strong active:scale-95 sm:hover:-translate-y-2 bg-gradient-to-br from-white via-surface to-surface-elevated border-2 border-border-subtle hover:border-primary"
    >
      <div className="aspect-[3/4] sm:aspect-[3/4] relative overflow-hidden">
        {/* Image */}
        <img
          src={imageUrl}
          alt={category}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Category Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-center">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">
            {category}
          </h3>
          <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Click Indicator */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 sm:p-3 shadow-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
        <span className="text-xl sm:text-2xl">👗</span>
      </div>
    </Card>
  );
};
