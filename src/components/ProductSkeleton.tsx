import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProductSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-white border border-border/30 rounded-xl flex flex-col h-full animate-in fade-in duration-500">
      <div className="aspect-[3/4] relative overflow-hidden bg-muted">
        <Skeleton className="w-full h-full" />
      </div>
      
      <CardContent className="p-2.5 sm:p-5 flex-1 flex flex-col justify-center">
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-4 sm:h-5 w-3/4 mx-auto" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2.5 sm:p-5 pt-0 flex flex-col gap-2">
        <div className="w-full flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-20" />
          <div className="flex gap-1.5 justify-center w-full">
            <Skeleton className="h-7 w-8 rounded-md" />
            <Skeleton className="h-7 w-8 rounded-md" />
            <Skeleton className="h-7 w-8 rounded-md" />
          </div>
        </div>
        
        <div className="flex gap-2 w-full mt-1">
          <Skeleton className="h-9 sm:h-11 flex-1 rounded-lg" />
          <Skeleton className="h-9 sm:h-11 w-9 sm:w-11 rounded-lg" />
        </div>
      </CardFooter>
    </Card>
  );
};
