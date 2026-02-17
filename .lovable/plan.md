
# Hromadne tlacidlo "Vytvorit vsetky nepriradene"

## Zmeny v `src/components/daily-menu/ImportMenuDialog.tsx`

### 1. Nova funkcia `handleCreateAllUnmatched`

Pridanie async funkcie, ktora:
- Prejde vsetky `weeklyData` dni a ich polozky (alebo `rows` pre flat mode)
- Vyberie vsetky kde `matchedDish === null`
- Sekvencne (alebo paralelne s `Promise.all`) zavola `createDishMutation.mutateAsync` pre kazdu
- Po uspesnom vytvoreni aktualizuje lokalny stav (`weeklyData` / `rows`) s novym jedlom a similarity 100%
- Zobrazi toast s poctom vytvorenych jedal

### 2. Nova funkcia `handleCreateAllUnmatchedRows`

Rovnaka logika pre flat list (`rows` state) - prejde vsetky riadky bez `matchedDish` a vytovri ich.

### 3. UI - tlacidlo v weekly preview

Medzi summary badges (priradene/nepriradene) a ScrollArea sa prida tlacidlo:
- Zobrazi sa len ak `weeklyUnmatched > 0`
- Text: `Vytvorit vsetky nepriradene (N)`
- Ikona: `PlusCircle`
- `disabled` pocas `createDishMutation.isPending`
- Umiestnenie: na riadku vedla badge "N nepriradených" alebo pod nim

### 4. UI - tlacidlo v flat list preview

Rovnake tlacidlo pre jednoduchy zoznam, zobrazene ak existuju nepriradene riadky.

### Technicke detaily

- Pouzije sa existujuci `createDishMutation` (hook `useCreateDish`)
- Kategoria defaultne `hlavne_jedlo`, rovnako ako pri jednotlivom vytvoreni
- Pre weekly data sa prenesie `allergens`, `grammage`, `price` z OCR dat
- Pre flat rows sa pouziju prazdne defaults (rovnako ako `handleCreateDishFromRow`)
- State sa aktualizuje progresivne - kazde jedlo sa updatne ihned po vytvoreni
- Tracking stavu "vytvaram vsetky" cez novy `boolean` state `isCreatingAll` pre disablovanie UI
