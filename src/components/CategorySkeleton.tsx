import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CategorySkeleton = () => {
  return (
    <Card className="relative overflow-hidden bg-muted border-2 border-border-subtle rounded-xl aspect-[3/4] animate-in fade-in duration-500">
      <Skeleton className="w-full h-full" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col items-center gap-2">
        <Skeleton className="h-6 sm:h-8 w-3/4 bg-white/20" />
        <Skeleton className="h-4 w-1/2 bg-white/20" />
      </div>
    </Card>
  );
};
