import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExportValidationBannerProps {
  menu: any;
}

interface Issue {
  type: "missing_price" | "zero_cost";
  dishName: string;
  dishId: string;
}

export function ExportValidationBanner({ menu }: ExportValidationBannerProps) {
  const navigate = useNavigate();

  if (!menu?.menu_items?.length) return null;

  const issues: Issue[] = [];

  for (const item of menu.menu_items) {
    const dish = item.dish;
    if (!dish) continue;

    const effectivePrice = item.override_price ?? dish.final_price ?? dish.recommended_price ?? 0;
    if (!effectivePrice || effectivePrice === 0) {
      issues.push({ type: "missing_price", dishName: dish.name, dishId: dish.id });
    }

    if (dish.cost === 0) {
      issues.push({ type: "zero_cost", dishName: dish.name, dishId: dish.id });
    }
  }

  if (issues.length === 0) return null;

  const missingPrices = issues.filter((i) => i.type === "missing_price");
  const zeroCosts = issues.filter((i) => i.type === "zero_cost");

  return (
    <Alert variant="destructive" className="border-amber-500/40 bg-amber-500/10 [&>svg]:text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-sm font-semibold">
        Upozornenie pred exportom
      </AlertTitle>
      <AlertDescription className="space-y-2 mt-1">
        {missingPrices.length > 0 && (
          <div className="flex items-start gap-2">
            <DollarSign className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            <div className="text-xs">
              <strong>{missingPrices.length} jedál bez ceny:</strong>{" "}
              {missingPrices.length <= 4
                ? missingPrices.map((i) => i.dishName).join(", ")
                : `${missingPrices.slice(0, 3).map((i) => i.dishName).join(", ")} a ${missingPrices.length - 3} ďalších`}
            </div>
          </div>
        )}
        {zeroCosts.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            <div className="text-xs">
              <strong>{zeroCosts.length} jedál bez kalkulácie nákladov:</strong>{" "}
              {zeroCosts.length <= 4
                ? zeroCosts.map((i) => i.dishName).join(", ")
                : `${zeroCosts.slice(0, 3).map((i) => i.dishName).join(", ")} a ${zeroCosts.length - 3} ďalších`}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate("/dishes")}
          >
            Upraviť jedlá <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate("/ingredients")}
          >
            Suroviny <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
