
-- Create a function that handles restaurant creation + membership atomically
CREATE OR REPLACE FUNCTION public.create_restaurant_with_owner(
  _name text,
  _address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _restaurant_id uuid;
BEGIN
  -- Create restaurant
  INSERT INTO public.restaurants (name, address)
  VALUES (_name, _address)
  RETURNING id INTO _restaurant_id;

  -- Add the calling user as owner
  INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
  VALUES (_restaurant_id, auth.uid(), 'owner');

  RETURN _restaurant_id;
END;
$$;
