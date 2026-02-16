
-- 1. Extend app_role enum with head_chef
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_chef';

-- 2. Create menu_proposals table
CREATE TABLE public.menu_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL,
  dish_id uuid REFERENCES public.dishes(id) ON DELETE SET NULL,
  dish_name text NOT NULL,
  category public.dish_category NOT NULL DEFAULT 'hlavne_jedlo',
  target_week_start date NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view proposals"
  ON public.menu_proposals FOR SELECT
  USING (is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Members can insert proposals"
  ON public.menu_proposals FOR INSERT
  WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id) AND auth.uid() = proposed_by);

CREATE POLICY "Members can update proposals"
  ON public.menu_proposals FOR UPDATE
  USING (is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Members can delete proposals"
  ON public.menu_proposals FOR DELETE
  USING (is_restaurant_member(auth.uid(), restaurant_id));

-- 3. Create menu_proposal_assignments table
CREATE TABLE public.menu_proposal_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.menu_proposals(id) ON DELETE CASCADE,
  menu_date date NOT NULL,
  assigned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_proposal_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage assignments"
  ON public.menu_proposal_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_proposals p
      WHERE p.id = menu_proposal_assignments.proposal_id
        AND is_restaurant_member(auth.uid(), p.restaurant_id)
    )
  );

-- 4. Update RPC create_restaurant_with_owner to accept _role parameter
CREATE OR REPLACE FUNCTION public.create_restaurant_with_owner(
  _name text,
  _address text DEFAULT NULL,
  _role public.app_role DEFAULT 'owner'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _restaurant_id uuid;
BEGIN
  INSERT INTO public.restaurants (name, address)
  VALUES (_name, _address)
  RETURNING id INTO _restaurant_id;

  INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
  VALUES (_restaurant_id, auth.uid(), _role);

  INSERT INTO public.profiles (user_id)
  VALUES (auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN _restaurant_id;
END;
$$;

-- 5. Add UPDATE and DELETE policies on restaurant_members for owners
CREATE POLICY "Owners can update members"
  ON public.restaurant_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members rm
      WHERE rm.restaurant_id = restaurant_members.restaurant_id
        AND rm.user_id = auth.uid()
        AND rm.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete members"
  ON public.restaurant_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members rm
      WHERE rm.restaurant_id = restaurant_members.restaurant_id
        AND rm.user_id = auth.uid()
        AND rm.role = 'owner'
    )
  );
