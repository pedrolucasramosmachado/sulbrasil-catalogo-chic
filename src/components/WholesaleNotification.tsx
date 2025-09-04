import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";

interface WholesaleNotificationProps {
  hasWholesaleItems: boolean;
}

export const WholesaleNotification = ({ hasWholesaleItems }: WholesaleNotificationProps) => {
  if (!hasWholesaleItems) return null;

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 text-accent">
        <Percent className="w-4 h-4" />
        <span className="text-sm font-medium">Preço de Atacado Aplicado!</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Produtos com 10+ unidades recebem automaticamente o desconto de atacado.
      </p>
    </div>
  );
};