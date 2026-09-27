-- Storage bucket and policies for topic images

-- 1. Create topic-images public bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'topic-images',
    'topic-images',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public to read/view images from topic-images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access topic images'
    ) THEN
        CREATE POLICY "Public Access topic images"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'topic-images');
    END IF;
END $$;

-- 3. Allow authenticated admins to upload to topic-images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload topic images'
    ) THEN
        CREATE POLICY "Admins can upload topic images"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'topic-images' AND public.is_admin());
    END IF;
END $$;

-- 4. Allow authenticated admins to update objects in topic-images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update topic images'
    ) THEN
        CREATE POLICY "Admins can update topic images"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'topic-images' AND public.is_admin());
    END IF;
END $$;

-- 5. Allow authenticated admins to delete objects in topic-images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete topic images'
    ) THEN
        CREATE POLICY "Admins can delete topic images"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (bucket_id = 'topic-images' AND public.is_admin());
    END IF;
END $$;

-- 6. Purge any legacy base64 data URLs from topics table
UPDATE public.topics
SET image_url = NULL
WHERE image_url LIKE 'data:%';

