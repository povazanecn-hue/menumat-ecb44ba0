

## Upload screenshotov obrazoviek na Cloudinary

### Ciel
Zachytiť screenshoty vsetkych hlavnych obrazoviek aplikacie a nahrat ich do Cloudinary do priecinka `design-menumat-app/`.

### Postup

#### 1. Rozsirenie edge funkcie `cloudinary-transform`
Pridam novu akciu `"upload"` do existujucej edge funkcie, ktora umozni priamy upload obrazku (URL alebo base64) do zadaneho Cloudinary priecinka.

Zmeny v `supabase/functions/cloudinary-transform/index.ts`:
- Pridat `"upload"` do `TransformRequest.action` typu
- Pridat `case "upload"` do `handleAction` - vola existujuci `uploadFromUrl` s custom `folder` parametrom
- Podporovat `options.folder` pre urcenie cieloveho priecinka (default: `design-menumat-app`)

#### 2. Zachytenie screenshotov
Pouzitim browser toolu navigujem na kazdu hlavnu obrazovku a zachytim screenshot:
- Landing (`/`)
- Auth (`/auth`)
- Onboarding (`/onboarding`)
- Dashboard (`/dashboard`)
- Daily Menu (`/daily-menu`)
- Dishes (`/dishes`)
- Ingredients (`/ingredients`)
- Recipes (`/recipes`)
- Permanent Menu (`/permanent-menu`)
- Exports (`/exports`)
- Templates (`/templates`)
- Shopping List (`/shopping-list`)
- Settings (`/settings`)
- Nastenka (`/nastenka`)

#### 3. Upload na Cloudinary
Po zachyteni kazdeho screenshotu zavolam edge funkciu s akciou `"upload"` a parametrom `folder: "design-menumat-app"`. Kazdy obrazok dostane popisny nazov (napr. `landing`, `dashboard`, `dishes`).

### Technicke detaily

**Zmena v edge funkcii** - pridanie upload akcie:
```typescript
// V interface TransformRequest - pridat "upload" do action union
action: "enhance" | "upscale" | ... | "upload";

// V handleAction switch
case "upload":
  const uploaded = await uploadFromUrl(
    cloudName, apiKey, apiSecret,
    imageUrl!,
    options.folder || "design-menumat-app",
    options.public_id_prefix
  );
  return { url: uploaded.secure_url, public_id: uploaded.public_id };
```

**Uprava `uploadFromUrl`** - pridanie volitelneho `folder` parametra (uz existuje, len sa zmeni default).

### Vystup
Po dokonceni budete mat v Cloudinary ucte priecinok `design-menumat-app/` so screenshotmi vsetkych obrazoviek, pristupne cez Cloudinary URL pre import do Figma.

