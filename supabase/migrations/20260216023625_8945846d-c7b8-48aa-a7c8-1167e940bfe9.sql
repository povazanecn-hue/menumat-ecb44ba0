
-- Create a public storage bucket for menu embeds
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-embeds', 'menu-embeds', true);

-- Allow anyone to read embed files (they're public)
CREATE POLICY "Public can read menu embeds"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-embeds');

-- Authenticated users can upload/update embeds
CREATE POLICY "Auth users can upload menu embeds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-embeds');

CREATE POLICY "Auth users can update menu embeds"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-embeds');
