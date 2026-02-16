
-- Fix all RLS policies to be PERMISSIVE (default) instead of RESTRICTIVE
-- Without at least one PERMISSIVE policy, no rows are ever returned

-- restaurant_members
DROP POLICY IF EXISTS "Members can view restaurant members" ON public.restaurant_members;
CREATE POLICY "Members can view restaurant members" ON public.restaurant_members
  FOR SELECT USING (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Users can insert own membership" ON public.restaurant_members;
CREATE POLICY "Users can insert own membership" ON public.restaurant_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- restaurants
DROP POLICY IF EXISTS "Members can view their restaurants" ON public.restaurants;
CREATE POLICY "Members can view their restaurants" ON public.restaurants
  FOR SELECT USING (id IN (SELECT get_user_restaurant_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can update their restaurants" ON public.restaurants;
CREATE POLICY "Members can update their restaurants" ON public.restaurants
  FOR UPDATE USING (id IN (SELECT get_user_restaurant_ids(auth.uid())));

DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON public.restaurants;
CREATE POLICY "Authenticated users can create restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- dishes
DROP POLICY IF EXISTS "Members can view dishes" ON public.dishes;
CREATE POLICY "Members can view dishes" ON public.dishes
  FOR SELECT USING (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Members can insert dishes" ON public.dishes;
CREATE POLICY "Members can insert dishes" ON public.dishes
  FOR INSERT WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Members can update dishes" ON public.dishes;
CREATE POLICY "Members can update dishes" ON public.dishes
  FOR UPDATE USING (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Members can delete dishes" ON public.dishes;
CREATE POLICY "Members can delete dishes" ON public.dishes
  FOR DELETE USING (is_restaurant_member(auth.uid(), restaurant_id));

-- ingredients
DROP POLICY IF EXISTS "Members can view ingredients" ON public.ingredients;
CREATE POLICY "Members can view ingredients" ON public.ingredients
  FOR SELECT USING (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Members can insert ingredients" ON public.ingredients;
CREATE POLICY "Members can insert ingredients" ON public.ingredients
  FOR INSERT WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Members can update ingredients" ON public.ingredients;
CREATE POLICY "Members can update ingredients" ON public.ingredients
  FOR UPDATE USING (is_restaurant_member(auth.uid(), restaurant_id));

DROP POLICY IF EXISTS "Members can delete ingredients" ON public.ingredients;
CREATE POLICY "Members can delete ingredients" ON public.ingredients
  FOR DELETE USING (is_restaurant_member(auth.uid(), restaurant_id));

-- dish_ingredients
DROP POLICY IF EXISTS "Members can manage dish_ingredients" ON public.dish_ingredients;
CREATE POLICY "Members can manage dish_ingredients" ON public.dish_ingredients
  FOR ALL USING (EXISTS (
    SELECT 1 FROM dishes d WHERE d.id = dish_ingredients.dish_id
    AND is_restaurant_member(auth.uid(), d.restaurant_id)
  ));

-- menus
DROP POLICY IF EXISTS "Members can manage menus" ON public.menus;
CREATE POLICY "Members can manage menus" ON public.menus
  FOR ALL USING (is_restaurant_member(auth.uid(), restaurant_id));

-- menu_items
DROP POLICY IF EXISTS "Members can manage menu_items" ON public.menu_items;
CREATE POLICY "Members can manage menu_items" ON public.menu_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM menus m WHERE m.id = menu_items.menu_id
    AND is_restaurant_member(auth.uid(), m.restaurant_id)
  ));

-- menu_exports
DROP POLICY IF EXISTS "Members can manage menu_exports" ON public.menu_exports;
CREATE POLICY "Members can manage menu_exports" ON public.menu_exports
  FOR ALL USING (EXISTS (
    SELECT 1 FROM menus m WHERE m.id = menu_exports.menu_id
    AND is_restaurant_member(auth.uid(), m.restaurant_id)
  ));

-- recipes
DROP POLICY IF EXISTS "Members can manage recipes" ON public.recipes;
CREATE POLICY "Members can manage recipes" ON public.recipes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM dishes d WHERE d.id = recipes.dish_id
    AND is_restaurant_member(auth.uid(), d.restaurant_id)
  ));

-- permanent_menu_categories
DROP POLICY IF EXISTS "Members can manage permanent_menu_categories" ON public.permanent_menu_categories;
CREATE POLICY "Members can manage permanent_menu_categories" ON public.permanent_menu_categories
  FOR ALL USING (is_restaurant_member(auth.uid(), restaurant_id));

-- permanent_menu_items
DROP POLICY IF EXISTS "Members can manage permanent_menu_items" ON public.permanent_menu_items;
CREATE POLICY "Members can manage permanent_menu_items" ON public.permanent_menu_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM permanent_menu_categories c WHERE c.id = permanent_menu_items.category_id
    AND is_restaurant_member(auth.uid(), c.restaurant_id)
  ));

-- supplier_prices
DROP POLICY IF EXISTS "Members can manage supplier_prices" ON public.supplier_prices;
CREATE POLICY "Members can manage supplier_prices" ON public.supplier_prices
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ingredients i WHERE i.id = supplier_prices.ingredient_id
    AND is_restaurant_member(auth.uid(), i.restaurant_id)
  ));
