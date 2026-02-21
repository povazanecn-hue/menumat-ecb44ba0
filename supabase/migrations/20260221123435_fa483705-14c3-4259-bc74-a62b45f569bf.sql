-- Create a public bucket for design screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-assets', 'design-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for design-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to design-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-assets' AND auth.role() = 'authenticated');