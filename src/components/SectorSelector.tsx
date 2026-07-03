import { Sector } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";

interface SectorSelectorProps {
  sectors: Sector[];
  activeSectorId: string | null;
  onSelectSector: (sectorId: string | null) => void;
}

export const SectorSelector = ({
  sectors,
  activeSectorId,
  onSelectSector,
}: SectorSelectorProps) => {
  if (!sectors || sectors.length === 0) return null;

  return (
    <div className="w-full bg-surface-elevated/40 backdrop-blur-md py-4 border-b border-primary/5 sticky top-[72px] z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x">
          <button
            onClick={() => onSelectSector(null)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 snap-start whitespace-nowrap border",
              activeSectorId === null
                ? "bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-glow scale-105"
                : "bg-white text-foreground-muted hover:text-primary border-primary/10 hover:border-primary/30"
            )}
          >
            Todas as Modinhas
          </button>
          
          {sectors.map((sector) => (
            <button
              key={sector.id}
              onClick={() => onSelectSector(sector.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 snap-start whitespace-nowrap border",
                activeSectorId === sector.id
                  ? "bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-glow scale-105"
                  : "bg-white text-foreground-muted hover:text-primary border-primary/10 hover:border-primary/30"
              )}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
