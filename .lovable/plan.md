

# Inline editácia prílohy (side_dish) v menu karte

## Zmeny

### 1. DayMenuCard.tsx - Inline input pre side_dish
- Nahradiť statický Badge pre `side_dish` editovateľným inline inputom
- Kliknutím na Badge alebo na ikonu ceruzky sa zobrazí malý Input
- Po strate fokusu (onBlur) alebo Enter sa zavolá `onUpdateSideDish`
- Ak je side_dish prázdny, zobrazí sa malé tlačidlo/placeholder "Pridať prílohu" pri hover
- Lokálny stav `editingSideDish` na sledovanie ktorý item sa edituje

### 2. DailyMenu.tsx - Pripojenie handlera
- Pridať handler `handleUpdateSideDish` ktorý zavolá `updateMenuItem.mutateAsync({ id, side_dish })`
- Predať `onUpdateSideDish` prop do `DayMenuCard`

## Technické detaily

### DayMenuCard.tsx
- Nový lokálny stav: `editingSideDishId: string | null` a `sideDishValue: string`
- Pri kliknutí na Badge side_dish: nastaviť editing stav na item.id, naplniť value
- Zobraziť Input namiesto Badge keď `editingSideDishId === item.id`
- onBlur / onKeyDown Enter: zavolať `onUpdateSideDish(itemId, value)`, resetovať editing stav
- Ak item nemá side_dish: zobraziť malú ikonu Utensils s textom "príloha" pri hover

### DailyMenu.tsx
- Handler: `const handleUpdateSideDish = async (itemId: string, sideDish: string) => { await updateMenuItem.mutateAsync({ id: itemId, side_dish: sideDish || null }); }`
- Predať do DayMenuCard: `onUpdateSideDish={handleUpdateSideDish}`

