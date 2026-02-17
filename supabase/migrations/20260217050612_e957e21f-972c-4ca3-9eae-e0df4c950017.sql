INSERT INTO storage.buckets (id, name, public) VALUES ('test-assets', 'test-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read test-assets" ON storage.objects FOR SELECT USING (bucket_id = 'test-assets');
CREATE POLICY "Auth insert test-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'test-assets' AND auth.role() = 'authenticated');