import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function Placeholder() {
  const location = useLocation();
  const pageName = location.pathname.slice(1).replace(/-/g, " ");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <h1 className="font-serif text-2xl font-bold capitalize">{pageName || "Stránka"}</h1>
      <p className="text-muted-foreground max-w-md">
        Táto sekcia bude čoskoro k dispozícii. Pracujeme na nej.
      </p>
    </div>
  );
}
