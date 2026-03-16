-- Add waste_percent to recipes (default 0 = no waste adjustment)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS waste_percent numeric NOT NULL DEFAULT 0;

-- Update cost recomputation trigger to account for waste
CREATE OR REPLACE FUNCTION public.recompute_dish_cost()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _dish_id uuid;
  _total_cost numeric;
  _waste_pct numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _dish_id := OLD.dish_id;
  ELSE
    _dish_id := NEW.dish_id;
  END IF;

  -- Get waste percent from recipe if exists
  SELECT COALESCE(r.waste_percent, 0) INTO _waste_pct
  FROM recipes r WHERE r.dish_id = _dish_id;
  IF _waste_pct IS NULL THEN _waste_pct := 0; END IF;

  SELECT COALESCE(SUM(
    CASE
      WHEN di.unit IN ('g','kg','dag','mg') AND i.unit IN ('g','kg','dag','mg') THEN
        di.quantity
        * (CASE di.unit WHEN 'kg' THEN 1000 WHEN 'dag' THEN 10 WHEN 'mg' THEN 0.001 ELSE 1 END)
        / (CASE i.unit WHEN 'kg' THEN 1000 WHEN 'dag' THEN 10 WHEN 'mg' THEN 0.001 ELSE 1 END)
        * i.base_price
      WHEN di.unit IN ('ml','l','cl','dl') AND i.unit IN ('ml','l','cl','dl') THEN
        di.quantity
        * (CASE di.unit WHEN 'l' THEN 1000 WHEN 'cl' THEN 10 WHEN 'dl' THEN 100 ELSE 1 END)
        / (CASE i.unit WHEN 'l' THEN 1000 WHEN 'cl' THEN 10 WHEN 'dl' THEN 100 ELSE 1 END)
        * i.base_price
      ELSE di.quantity * i.base_price
    END
  ), 0) INTO _total_cost
  FROM dish_ingredients di
  JOIN ingredients i ON i.id = di.ingredient_id
  WHERE di.dish_id = _dish_id;

  -- Apply waste percentage: real cost = base cost * (1 + waste/100)
  _total_cost := _total_cost * (1 + _waste_pct / 100);

  UPDATE dishes SET cost = ROUND(_total_cost, 2) WHERE id = _dish_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;