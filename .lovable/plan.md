
# Zobraziť Extra doplnok v dennom menu karte

## Zmena

V komponente `src/components/daily-menu/DayMenuCard.tsx` sa pri každom jedle zobrazí jeho `subtype` (Extra doplnok) ako Badge vedľa existujúcich side_dish a extras badge-ov.

### Konkrétna úprava

V sekcii kde sa vypisuje názov jedla (riadok ~82), pridať za názov jedla a alergény aj zobrazenie `item.dish.subtype` ak existuje -- napríklad ako malý text v zátvorke alebo Badge.

Taktiež v `MenuPreview.tsx` (exportový náhľad) pridať subtype vedľa názvu jedla, aby sa zobrazoval aj v náhľade pre export.

## Technické detaily

### DayMenuCard.tsx (riadok ~130, sekcia side_dish/extras badges)
- Pridať nový Badge pre `item.dish.subtype` ak nie je prázdny
- Štýl: `text-[10px]` s ikonou, podobne ako existujúce badge-y pre side_dish

### MenuPreview.tsx (riadok ~115, pri dish name)
- Za `item.dish.grammage` pridať zobrazenie `item.dish?.subtype` ak existuje
- Formát: malý text v hranatých zátvorkách alebo oddelený bodkou

### Žiadne databázové zmeny
- Pole `subtype` už existuje v tabuľke `dishes` a je súčasťou query cez `dishes(*)` join
