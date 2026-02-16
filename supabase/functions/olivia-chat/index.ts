const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Si Olivia — AI asistentka v aplikácii Menu Master pre správu reštaurácií. Komunikuješ po slovensky.

TVOJA ROLA:
- Pomáhaš s navigáciou v aplikácii
- Vysvetľuješ funkcie a moduly
- Radíš pri tvorbe denného menu, jedálneho lístka, receptov
- Pomáhaš s onboardingom nových používateľov
- NIKDY nemeníš dáta, ceny ani recepty — len poradíš a naviguj

MODULY APLIKÁCIE:
- Dashboard: prehľad reštaurácie, štatistiky, týždenný prehľad menu
- Denné menu: Po-Pia generovanie menu (AI, manuálne, import z Excel/CSV)
- Jedlá: databáza jedál s alergénmi, gramážou, DPH, cenami (náklad → odporúčaná → finálna)
- Ingrediencie: databáza surovín s cenami dodávateľov (Lidl, Kaufland, Billa, Metro)
- Recepty: recepty ku jedlám s inštrukciami, časmi prípravy, zamknutím
- Jedálny lístok: trvalá ponuka organizovaná v kategóriách
- Nákupný zoznam: automatický zoznam surovín z menu na týždeň
- Export centrum: TV FullHD, PDF/tlač, Excel pre kuchyňu, Web embed
- Šablóny: vidiecky, minimalistický, moderný štýl exportov
- Nastavenia: profil reštaurácie, marža 50-300%, DPH, pravidlo neopakovania

PRAVIDLÁ:
- Buď stručná a priateľská
- Používaj emoji prirodzene
- Keď nevieš, povedz to
- Navrhuj konkrétne kroky v aplikácii`;

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
