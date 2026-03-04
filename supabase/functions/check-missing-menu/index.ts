import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const dayLabel = tomorrow.toLocaleDateString("sk-SK", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
    });

    // Skip weekends (Saturday=6, Sunday=0)
    const dow = tomorrow.getDay();
    if (dow === 0 || dow === 6) {
      return new Response(JSON.stringify({ skipped: true, reason: "weekend" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all restaurants
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("id");

    if (!restaurants?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notified = 0;

    for (const restaurant of restaurants) {
      // Check if menu exists for tomorrow
      const { data: menu } = await supabase
        .from("menus")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .eq("menu_date", tomorrowStr)
        .maybeSingle();

      if (menu) continue; // Menu exists, skip

      // Get all members of this restaurant to notify
      const { data: members } = await supabase
        .from("restaurant_members")
        .select("user_id")
        .eq("restaurant_id", restaurant.id);

      if (!members?.length) continue;

      // Check if we already sent this notification today
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .eq("title", "Chýba menu na zajtra")
        .gte("created_at", todayStr + "T00:00:00")
        .limit(1);

      if (existing?.length) continue; // Already notified today

      // Create notifications for all members
      const notifications = members.map((m: any) => ({
        user_id: m.user_id,
        restaurant_id: restaurant.id,
        title: "Chýba menu na zajtra",
        message: `Na ${dayLabel} ešte nemáte pripravené denné menu.`,
        type: "warning",
        link: `/daily-menu?date=${tomorrowStr}`,
      }));

      await supabase.from("notifications").insert(notifications);
      notified += members.length;
    }

    return new Response(JSON.stringify({ processed: restaurants.length, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
