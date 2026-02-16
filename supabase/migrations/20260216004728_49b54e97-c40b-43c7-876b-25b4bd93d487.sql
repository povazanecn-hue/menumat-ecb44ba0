
-- =============================================
-- MenuGen Database Schema — Phase 1
-- =============================================

-- Role enum for restaurant membership
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'staff');

-- Dish category enum
CREATE TYPE public.dish_category AS ENUM (
  'polievka', 'hlavne_jedlo', 'dezert', 'predjedlo', 
  'salat', 'pizza', 'burger', 'pasta', 'napoj', 'ine'
);

-- Export format enum
CREATE TYPE public.export_format AS ENUM ('tv', 'pdf', 'excel', 'webflow');

-- =============================================
-- 1. Profiles
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. Restaurants
-- =============================================
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{"non_repeat_days": 14, "default_margin": 100, "vat_rate": 20}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. Restaurant Members (role-based access)
-- =============================================
CREATE TABLE public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check restaurant membership
CREATE OR REPLACE FUNCTION public.is_restaurant_member(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE user_id = _user_id AND restaurant_id = _restaurant_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_restaurant_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT restaurant_id FROM public.restaurant_members WHERE user_id = _user_id
$$;

-- RLS for restaurants: members can see their restaurants
CREATE POLICY "Members can view their restaurants" ON public.restaurants
  FOR SELECT USING (id IN (SELECT public.get_user_restaurant_ids(auth.uid())));
CREATE POLICY "Members can update their restaurants" ON public.restaurants
  FOR UPDATE USING (id IN (SELECT public.get_user_restaurant_ids(auth.uid())));
CREATE POLICY "Authenticated users can create restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS for restaurant_members
CREATE POLICY "Members can view restaurant members" ON public.restaurant_members
  FOR SELECT USING (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Users can insert own membership" ON public.restaurant_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 4. Ingredients
-- =============================================
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g',
  base_price NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ingredients" ON public.ingredients
  FOR SELECT USING (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Members can insert ingredients" ON public.ingredients
  FOR INSERT WITH CHECK (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Members can update ingredients" ON public.ingredients
  FOR UPDATE USING (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Members can delete ingredients" ON public.ingredients
  FOR DELETE USING (public.is_restaurant_member(auth.uid(), restaurant_id));

-- =============================================
-- 5. Dishes
-- =============================================
CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category dish_category NOT NULL DEFAULT 'hlavne_jedlo',
  subtype TEXT,
  allergens INTEGER[] NOT NULL DEFAULT '{}',
  grammage TEXT,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  recommended_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_price NUMERIC(10,2),
  is_daily_menu BOOLEAN NOT NULL DEFAULT false,
  is_permanent_offer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view dishes" ON public.dishes
  FOR SELECT USING (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Members can insert dishes" ON public.dishes
  FOR INSERT WITH CHECK (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Members can update dishes" ON public.dishes
  FOR UPDATE USING (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "Members can delete dishes" ON public.dishes
  FOR DELETE USING (public.is_restaurant_member(auth.uid(), restaurant_id));

-- =============================================
-- 6. Dish Ingredients (junction)
-- =============================================
CREATE TABLE public.dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'g'
);

ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage dish_ingredients" ON public.dish_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.dishes d
      WHERE d.id = dish_id AND public.is_restaurant_member(auth.uid(), d.restaurant_id)
    )
  );

-- =============================================
-- 7. Recipes
-- =============================================
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL UNIQUE REFERENCES public.dishes(id) ON DELETE CASCADE,
  instructions TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  source_metadata TEXT,
  ai_confidence NUMERIC(3,2),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage recipes" ON public.recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.dishes d
      WHERE d.id = dish_id AND public.is_restaurant_member(auth.uid(), d.restaurant_id)
    )
  );

-- =============================================
-- 8. Menus
-- =============================================
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, menu_date)
);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage menus" ON public.menus
  FOR ALL USING (public.is_restaurant_member(auth.uid(), restaurant_id));

-- =============================================
-- 9. Menu Items
-- =============================================
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  override_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage menu_items" ON public.menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.menus m
      WHERE m.id = menu_id AND public.is_restaurant_member(auth.uid(), m.restaurant_id)
    )
  );

-- =============================================
-- 10. Menu Exports
-- =============================================
CREATE TABLE public.menu_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  format export_format NOT NULL,
  template_name TEXT,
  file_url TEXT,
  exported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage menu_exports" ON public.menu_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.menus m
      WHERE m.id = menu_id AND public.is_restaurant_member(auth.uid(), m.restaurant_id)
    )
  );

-- =============================================
-- 11. Supplier Prices
-- =============================================
CREATE TABLE public.supplier_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  price NUMERIC(10,4) NOT NULL,
  is_promo BOOLEAN NOT NULL DEFAULT false,
  valid_from DATE,
  valid_to DATE,
  confidence TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage supplier_prices" ON public.supplier_prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ingredients i
      WHERE i.id = ingredient_id AND public.is_restaurant_member(auth.uid(), i.restaurant_id)
    )
  );

-- =============================================
-- 12. Permanent Menu Categories
-- =============================================
CREATE TABLE public.permanent_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permanent_menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage permanent_menu_categories" ON public.permanent_menu_categories
  FOR ALL USING (public.is_restaurant_member(auth.uid(), restaurant_id));

-- =============================================
-- 13. Permanent Menu Items
-- =============================================
CREATE TABLE public.permanent_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.permanent_menu_categories(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permanent_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage permanent_menu_items" ON public.permanent_menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.permanent_menu_categories c
      WHERE c.id = category_id AND public.is_restaurant_member(auth.uid(), c.restaurant_id)
    )
  );

-- =============================================
-- Auto-create profile on signup trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON public.menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_prices_updated_at BEFORE UPDATE ON public.supplier_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
