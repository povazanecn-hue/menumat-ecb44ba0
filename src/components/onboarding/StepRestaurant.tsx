import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface Props {
  name: string;
  setName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
}

export function StepRestaurant({ name, setName, address, setAddress }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-4">
        <h2 className="font-serif text-xl font-bold text-foreground">Nová reštaurácia</h2>
        <p className="text-sm text-muted-foreground">Zadajte základné údaje vašej prevádzky</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-foreground">Názov reštaurácie *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Koliesko Country Club"
          required
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Adresa
        </Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Banšelová 3, Bratislava"
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
