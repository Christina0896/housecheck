-- Add exact Eircode, the complete approved source description, and a photo gallery.
-- The existing description column stores the listing text. These fields let the
-- review screen verify that content before it is made public.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS eircode text,
  ADD COLUMN IF NOT EXISTS image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_rights_confirmed boolean NOT NULL DEFAULT false;

-- Existing public listings return to the private queue once so their exact
-- description, Eircode and photographs can be checked under the new rules.
UPDATE public.properties
SET review_status = 'pending',
    is_active = false,
    reviewed_at = NULL
WHERE review_status = 'approved'
  AND content_rights_confirmed = false;

-- Existing records keep their current primary image as the first gallery image.
UPDATE public.properties
SET image_urls = jsonb_build_array(image_url)
WHERE jsonb_typeof(image_urls) = 'array'
  AND jsonb_array_length(image_urls) = 0
  AND image_url IS NOT NULL
  AND btrim(image_url) <> '';

-- Backfill Eircodes already embedded in an address, for example
-- "Toonlane, Ballymakeera, Co. Cork, P12 YN40".
WITH candidates AS (
  SELECT
    id,
    regexp_replace(
      upper(substring(address FROM '((?:[AC-FHKNPRTV-Y][0-9]{2}|D6W)[[:space:]]?[0-9AC-FHKNPRTV-Y]{4})')),
      '[[:space:]]',
      '',
      'g'
    ) AS compact_eircode
  FROM public.properties
  WHERE eircode IS NULL
)
UPDATE public.properties AS properties
SET eircode = substring(candidates.compact_eircode FROM 1 FOR 3)
  || ' '
  || substring(candidates.compact_eircode FROM 4 FOR 4)
FROM candidates
WHERE properties.id = candidates.id
  AND candidates.compact_eircode IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_eircode_idx
  ON public.properties (eircode)
  WHERE eircode IS NOT NULL;

COMMENT ON COLUMN public.properties.eircode IS
  'Exact Eircode when stated in an authorised source or confirmed during review.';

COMMENT ON COLUMN public.properties.image_urls IS
  'Ordered image URLs approved for display. The first item is the primary image.';

COMMENT ON COLUMN public.properties.content_rights_confirmed IS
  'Reviewer confirmation that HouseCheck may display the saved listing description and photographs.';

-- Listing photographs approved for publication are stored in a public bucket.
-- Uploads remain restricted to the server-side review API, which uses the
-- Supabase secret key; public visitors only receive read-only object URLs.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
