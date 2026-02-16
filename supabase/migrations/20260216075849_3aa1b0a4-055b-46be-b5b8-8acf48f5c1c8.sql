-- Add side_dish and side_dish_extra columns to menu_items for independent side dish management
ALTER TABLE public.menu_items ADD COLUMN side_dish text;
ALTER TABLE public.menu_items ADD COLUMN extras text;