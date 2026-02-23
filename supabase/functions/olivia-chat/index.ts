const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGE_CONTEXT_MAP: Record<string, string> = {
  "/dashboard": `Používateľ je na DASHBOARDE — prehľad reštaurácie, štatistiky, týždenný prehľad menu.
Môžeš poradiť: pozrieť si dnešné menu, skontrolovať štatistiky jedál, prejsť na export.`,

  "/daily-menu": `Používateľ je na stránke DENNÉ MENU — tu sa generuje a spravuje menu na Po-Pia.
Môžeš poradiť: ako použiť AI generátor, nastaviť počty polievok/hlavných jedál/dezertov, importovať z Excel, uložiť menu.`,

  "/dishes": `Používateľ je na stránke JEDLÁ — databáza všetkých jedál s alergénmi, gramážou, DPH a cenami.
Môžeš poradiť: pridať nové jedlo, upraviť ceny, filtrovať podľa kategórie, importovať jedlá.`,

  "/ingredients": `Používateľ je na stránke INGREDIENCIE — databáza surovín s cenami dodávateľov.
Môžeš poradiť: pridať surovinu, porovnať ceny dodávateľov (Lidl, Kaufland, Metro), použiť najlepšiu cenu.`,

  "/recipes": `Používateľ je na stránke RECEPTY — recepty priradené k jedlám.
Môžeš poradiť: ako vytvoriť recept, zamknúť recept proti AI prepísaniu, nastaviť ingrediencie a postup.`,

  "/permanent-menu": `Používateľ je na stránke JEDÁLNY LÍSTOK — trvalá ponuka organizovaná v kategóriách.
Môžeš poradiť: pridať kategóriu, priradiť jedlá do stálej ponuky, zmeniť poradie.`,

  "/shopping-list": `Používateľ je na stránke NÁKUPNÝ ZOZNAM — automatický zoznam surovín z menu.
Môžeš poradiť: generovať zoznam z aktuálneho menu, exportovať do Excel.`,

  "/exports": `Používateľ je na stránke EXPORT CENTRUM — export menu na TV, PDF, Excel, Web.
Môžeš poradiť: ako exportovať pre TV (1920x1080), vytlačiť PDF, Excel pre kuchyňu, publikovať na web.`,

  "/templates": `Používateľ je na stránke ŠABLÓNY — štýly exportov (vidiecky, minimalistický, moderný).
Môžeš poradiť: zmeniť šablónu, nastaviť primárnu šablónu, upraviť fonty a farby.`,

  "/settings": `Používateľ je na stránke NASTAVENIA — profil reštaurácie, marža, DPH, tím.
Môžeš poradiť: zmeniť názov reštaurácie, nastaviť maržu (50-300%), DPH sadzby, pravidlo neopakovania jedál.`,

  "/nastenka": `Používateľ je na NÁSTENKE — návrhy jedál od tímu na budúce menu.
Môžeš poradiť: pridať návrh, schváliť/zamietnuť návrhy, priradiť do menu.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, currentPage, pageContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const pageInfo = currentPage ? (PAGE_CONTEXT_MAP[currentPage] || `Používateľ je na stránke: ${currentPage}`) : "";
    const extraContext = pageContext
      ? `\nKontextové dáta: ${JSON.stringify(pageContext)}`
      : "";

    const systemPrompt = `Si Olivia — priateľská AI asistentka v aplikácii MENUMAT pre správu reštaurácií. Komunikuješ po slovensky.

TVOJA ROLA:
- Pomáhaš s navigáciou v aplikácii
- Vysvetľuješ funkcie a moduly
- Radíš pri tvorbe denného menu, jedálneho lístka, receptov
- Pomáhaš s onboardingom nových používateľov
- NIKDY nemeníš dáta, ceny ani recepty — len poradíš a naviguj

MODULY APLIKÁCIE:
- Dashboard: prehľad reštaurácie, štatistiky, týždenný prehľad menu
- Denné menu (/daily-menu): Po-Pia generovanie menu (AI, manuálne, import z Excel/CSV)
- Jedlá (/dishes): databáza jedál s alergénmi, gramážou, DPH, cenami (náklad → odporúčaná → finálna)
- Ingrediencie (/ingredients): databáza surovín s cenami dodávateľov (Lidl, Kaufland, Billa, Metro)
- Recepty (/recipes): recepty ku jedlám s inštrukciami, časmi prípravy, zamknutím
- Jedálny lístok (/permanent-menu): trvalá ponuka organizovaná v kategóriách
- Nákupný zoznam (/shopping-list): automatický zoznam surovín z menu na týždeň
- Export centrum (/exports): TV FullHD, PDF/tlač, Excel pre kuchyňu, Web embed
- Šablóny (/templates): vidiecky, minimalistický, moderný štýl exportov
- Nastavenia (/settings): profil reštaurácie, marža 50-300%, DPH, pravidlo neopakovania
- Nástenka (/nastenka): návrhy jedál od tímu

${pageInfo ? `\nAKTUÁLNA STRÁNKA POUŽÍVATEĽA:\n${pageInfo}${extraContext}` : ""}

PRAVIDLÁ:
- Buď stručná a priateľská
- Používaj emoji prirodzene ale umiernene
- Keď nevieš, povedz to
- Navrhuj konkrétne kroky v aplikácii
- Odpovedaj v markdown formáte (tučné, zoznamy, nadpisy) pre lepšiu čitateľnosť
- Na konci odpovede navrhni 1-2 ďalšie otázky ktoré by mohol používateľ mať`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Príliš veľa požiadaviek. Skúste neskôr." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Nedostatok kreditov." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Chyba AI služby" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("olivia-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
