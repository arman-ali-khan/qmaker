-- Add page_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'page_size'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN page_size text DEFAULT 'A4';
  END IF;
END $$;

-- Add margin_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_size'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_size text DEFAULT 'medium';
  END IF;
END $$;

-- Add font_family column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'font_family'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN font_family text DEFAULT 'noto-serif';
  END IF;
END $$;

-- Add font_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'font_size'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN font_size text DEFAULT 'medium';
  END IF;
END $$;
