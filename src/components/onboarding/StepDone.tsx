import { Rocket } from "lucide-react";

interface Props {
  restaurantName: string;
  dishName: string;
  dishSkipped: boolean;
  menuModeChosen: boolean;
}

export function StepDone({ restaurantName, dishName, dishSkipped, menuModeChosen }: Props) {
  return (
    <div className="space-y-5 text-center py-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
        <Rocket className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-bold text-foreground">Všetko pripravené!</h2>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{restaurantName}</strong> je nastavená. Začnite tvoriť menu.
        </p>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>✓ Reštaurácia vytvorená</p>
        {!dishSkipped && dishName && <p>✓ Prvé jedlo pridané: {dishName}</p>}
        {menuModeChosen && <p>✓ Preferovaný režim menu uložený</p>}
        <p>✓ Dashboard a menu generátor čakajú</p>
      </div>
    </div>
  );
}
