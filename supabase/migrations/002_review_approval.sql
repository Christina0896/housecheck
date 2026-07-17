-- New listings remain private until Christina or Jan reviews and approves them.

DO $$
BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.evidence_level
  ADD VALUE IF NOT EXISTS 'buyer-verified';

-- Add the review status once. Existing properties become pending only during
-- the first application of this migration, so rerunning it does not unpublish
-- properties that have already been approved.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'review_status'
  ) THEN
    ALTER TABLE public.properties
      ADD COLUMN review_status public.review_status NOT NULL DEFAULT 'pending';

    UPDATE public.properties
    SET review_status = 'pending';
  END IF;
END $$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS review_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS boundary_evidence_path text;

CREATE INDEX IF NOT EXISTS properties_review_status_idx
  ON public.properties (review_status, last_seen DESC);

DROP POLICY IF EXISTS "Public can read active properties" ON public.properties;
DROP POLICY IF EXISTS "Public can read approved active properties" ON public.properties;

CREATE POLICY "Public can read approved active properties"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (is_active = true AND review_status = 'approved');

-- Boundary screenshots and folio images are private. HouseCheck reads them
-- with its server secret and creates short-lived signed URLs for the review UI.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'property-evidence',
  'property-evidence',
  false,
  6291456,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
