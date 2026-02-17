-- Function to recompute dish cost from dish_ingredients
-- Uses unit normalization: converts recipe qty to ingredient's unit before multiplying by base_price
CREATE OR REPLACE FUNCTION public.recompute_dish_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _dish_id uuid;
  _total_cost numeric;
BEGIN
  -- Determine affected dish_id
  IF TG_OP = 'DELETE' THEN
    _dish_id := OLD.dish_id;
  ELSE
    _dish_id := NEW.dish_id;
  END IF;

  -- Sum cost of all ingredient lines for this dish
  -- Simple approach: if units match family, convert; otherwise use raw qty * price
  SELECT COALESCE(SUM(
    CASE
      -- Mass conversions (recipe unit → ingredient unit)
      WHEN di.unit IN ('g','kg','dag','mg') AND i.unit IN ('g','kg','dag','mg') THEN
        di.quantity
        * (CASE di.unit WHEN 'kg' THEN 1000 WHEN 'dag' THEN 10 WHEN 'mg' THEN 0.001 ELSE 1 END)
        / (CASE i.unit WHEN 'kg' THEN 1000 WHEN 'dag' THEN 10 WHEN 'mg' THEN 0.001 ELSE 1 END)
        * i.base_price
      -- Volume conversions
      WHEN di.unit IN ('ml','l','cl','dl') AND i.unit IN ('ml','l','cl','dl') THEN
        di.quantity
        * (CASE di.unit WHEN 'l' THEN 1000 WHEN 'cl' THEN 10 WHEN 'dl' THEN 100 ELSE 1 END)
        / (CASE i.unit WHEN 'l' THEN 1000 WHEN 'cl' THEN 10 WHEN 'dl' THEN 100 ELSE 1 END)
        * i.base_price
      -- Same unit or piece
      ELSE di.quantity * i.base_price
    END
  ), 0) INTO _total_cost
  FROM dish_ingredients di
  JOIN ingredients i ON i.id = di.ingredient_id
  WHERE di.dish_id = _dish_id;

  -- Update the dish cost (do NOT touch final_price - R28)
  UPDATE dishes SET cost = ROUND(_total_cost, 2) WHERE id = _dish_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger on dish_ingredients changes
CREATE TRIGGER trg_recompute_dish_cost
AFTER INSERT OR UPDATE OR DELETE ON public.dish_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.recompute_dish_cost();

-- Also recompute when ingredient base_price changes
CREATE OR REPLACE FUNCTION public.recompute_costs_on_ingredient_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only act if base_price actually changed
  IF OLD.base_price IS DISTINCT FROM NEW.base_price OR OLD.unit IS DISTINCT FROM NEW.unit THEN
    -- Update cost for all dishes using this ingredient
    UPDATE dishes d SET cost = (
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
      ), 0)
      FROM dish_ingredients di
      JOIN ingredients i ON i.id = di.ingredient_id
      WHERE di.dish_id = d.id
    )
    WHERE d.id IN (SELECT dish_id FROM dish_ingredients WHERE ingredient_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_recompute_on_ingredient_price
AFTER UPDATE ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION public.recompute_costs_on_ingredient_change();
