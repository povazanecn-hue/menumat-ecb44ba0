
-- Trigger: notify when a new menu is created
CREATE OR REPLACE FUNCTION public.notify_menu_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _day_label text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  _day_label := to_char(NEW.menu_date::date, 'DD.MM.YYYY');

  INSERT INTO public.notifications (user_id, restaurant_id, title, message, type, link)
  VALUES (
    _user_id,
    NEW.restaurant_id,
    'Nové menu vytvorené',
    'Menu na ' || _day_label || ' bolo vytvorené.',
    'info',
    '/daily-menu?date=' || NEW.menu_date
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_menu_created
  AFTER INSERT ON public.menus
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_menu_created();

-- Trigger: notify when menu is published
CREATE OR REPLACE FUNCTION public.notify_menu_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _day_label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' THEN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
      RETURN NEW;
    END IF;

    _day_label := to_char(NEW.menu_date::date, 'DD.MM.YYYY');

    INSERT INTO public.notifications (user_id, restaurant_id, title, message, type, link)
    VALUES (
      _user_id,
      NEW.restaurant_id,
      'Menu publikované',
      'Menu na ' || _day_label || ' bolo publikované a je pripravené na export.',
      'info',
      '/exports'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_menu_published
  AFTER UPDATE ON public.menus
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_menu_published();

-- Trigger: notify on export
CREATE OR REPLACE FUNCTION public.notify_export_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _menu_date date;
  _restaurant_id uuid;
  _format_label text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT m.menu_date, m.restaurant_id
  INTO _menu_date, _restaurant_id
  FROM public.menus m WHERE m.id = NEW.menu_id;

  IF _restaurant_id IS NULL THEN
    RETURN NEW;
  END IF;

  _format_label := CASE NEW.format
    WHEN 'tv' THEN 'TV FullHD'
    WHEN 'pdf' THEN 'PDF'
    WHEN 'excel' THEN 'Excel'
    WHEN 'webflow' THEN 'Web embed'
    ELSE NEW.format::text
  END;

  INSERT INTO public.notifications (user_id, restaurant_id, title, message, type, link)
  VALUES (
    _user_id,
    _restaurant_id,
    'Export dokončený',
    _format_label || ' export pre ' || to_char(_menu_date, 'DD.MM.YYYY') || ' bol úspešne vytvorený.',
    'info',
    '/exports'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_export_created
  AFTER INSERT ON public.menu_exports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_export_created();
