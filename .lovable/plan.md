

# Integrácia Cloudinary OCR do import flow

## Prehľad

Pridanie Cloudinary spracovania obrázkov do existujúceho OCR import tabu v `ImportMenuDialog`. Keď používateľ odfotí papierové menu, obrázok sa najprv vylepší cez Cloudinary (auto-enhance, upscale) pre lepšiu kvalitu rozpoznávania, a potom sa pošle do AI OCR pipeline (Gemini 2.5 Flash).

## Prečo nie čistý Cloudinary OCR?

Cloudinary `adv_ocr` add-on extrahuje len surový text bez štruktúry. Súčasný AI pipeline (Gemini) vie extrahovať štruktúrované dáta (dni, kategórie, ceny, alergény). Najlepší výsledok sa dosiahne kombináciou:
1. **Cloudinary** - vylepšenie kvality fotky (ostrenie, kontrast, upscale)
2. **Gemini AI** - inteligentné štruktúrované rozpoznávanie jedál

## Zmeny

### 1. ImportMenuDialog.tsx - Nový OCR režim "Fotka menu"

V OCR tabe pridať prepínač medzi:
- **Štandard OCR** (súčasný priamy upload do AI) 
- **Fotka papierového menu** (Cloudinary enhance -> AI OCR)

Pri výbere "Fotka menu":
- Obrázok sa najprv odošle na Cloudinary cez `cloudinary-transform` edge function s akciou `enhance`
- Vylepšený obrázok URL sa potom pošle do `ocr-menu-import` edge function
- Zobrazí sa progress: "Vylepšujem kvalitu fotky..." -> "AI rozpoznáva jedlá..."

### 2. ocr-menu-import edge function - podpora URL vstupu

Pridať alternatívny vstup `imageUrl` (URL vylepšeného obrázka z Cloudinary) popri existujúcom `fileBase64`. Ak je poskytnutý `imageUrl`, použije sa priamo ako image_url v AI požiadavke namiesto base64.

### 3. UI zmeny v OCR tabe

- Pridať ikonu kamery a text "Odfotené papierové menu" ako sub-voľbu
- Toggle/checkbox "Vylepšiť kvalitu (Cloudinary)" - defaultne zapnutý pre obrázky
- Indikátor dvojkrokového spracovania s progress stavmi

## Technické detaily

### ImportMenuDialog.tsx
- Import `useCloudinary` hooku
- Nový stav: `useEnhance: boolean` (default true pre obrázky)
- V `handleOcrFile`: ak `useEnhance` a súbor je obrázok (jpg/png/webp):
  1. Upload base64 ako data URL
  2. Zavolať `cloudinary.enhance(dataUrl)`
  3. Ak úspešné, poslať výslednú URL do `ocr-menu-import` s `imageUrl` parametrom
  4. Ak zlyhá, fallback na priamy base64 upload (štandardný flow)

### ocr-menu-import/index.ts
- Pridať `imageUrl` do vstupných parametrov
- Ak je `imageUrl` prítomný, použiť ho ako `image_url` v OpenAI/Gemini vision požiadavke
- Base64 flow ostáva ako fallback

### Žiadne databázové zmeny
- Využíva existujúce Cloudinary secrets (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
- Využíva existujúcu `cloudinary-transform` edge function

