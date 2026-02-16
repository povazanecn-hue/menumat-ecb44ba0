import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DISH_CATEGORIES } from "@/lib/constants";

interface MenuPreviewProps {
  menu: any;
}

export function MenuPreview({ menu }: MenuPreviewProps) {
  if (!menu) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Vyberte menu pre náhľad.
        </CardContent>
      </Card>
    );
  }

  const items = [...(menu.menu_items ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const cat = item.dish?.category ?? "ine";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const getPrice = (item: any) => {
    const p = item.override_price ?? item.dish?.final_price ?? item.dish?.recommended_price ?? 0;
    return `${Number(p).toFixed(2)} €`;
  };

  const dateStr = menu.menu_date
    ? new Date(menu.menu_date + "T00:00:00").toLocaleDateString("sk-SK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Náhľad menu</CardTitle>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        <Badge variant={menu.status === "published" ? "default" : "secondary"} className="w-fit">
          {menu.status === "published" ? "Publikované" : "Koncept"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groups).map(([cat, catItems]) => (
          <div key={cat}>
            <h4 className="font-serif font-semibold text-sm text-accent uppercase tracking-wider mb-2">
              {DISH_CATEGORIES[cat] || cat}
            </h4>
            <div className="space-y-1.5">
              {catItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-baseline text-sm">
                  <span>
                    {item.dish?.name}
                    {item.dish?.grammage && (
                      <span className="text-muted-foreground ml-1">({item.dish.grammage})</span>
                    )}
                  </span>
                  <span className="font-semibold ml-4 whitespace-nowrap">{getPrice(item)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="text-sm text-muted-foreground text-center">Toto menu nemá žiadne jedlá.</p>
        )}
      </CardContent>
    </Card>
  );
}
