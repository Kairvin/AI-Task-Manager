-- Insert the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
-- 1. Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'avatars' );

-- 2. Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload an avatar." 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 3. Authenticated users can update their own avatars
CREATE POLICY "Users can update their own avatar." 
  ON storage.objects FOR UPDATE 
  USING ( bucket_id = 'avatars' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Authenticated users can delete their own avatars
CREATE POLICY "Users can delete their own avatar." 
  ON storage.objects FOR DELETE 
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );
