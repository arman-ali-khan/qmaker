/*
  # Update margin settings to individual controls

  1. Changes
    - Replace margin_size column with individual margin columns
    - Add margin_top, margin_bottom, margin_left, margin_right columns
    - Update font_size to accept custom values instead of enum
    - Migrate existing data if any

  2. Security
    - Maintains existing RLS policies
*/

-- Add new margin columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_top'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_top text DEFAULT '1in';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_bottom'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_bottom text DEFAULT '1in';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_left'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_left text DEFAULT '1in';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_right'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_right text DEFAULT '1in';
  END IF;
END $$;

-- Migrate existing margin_size data to individual margins
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_size'
  ) THEN
    -- Update existing records based on margin_size
    UPDATE exam_settings 
    SET 
      margin_top = CASE 
        WHEN margin_size = 'small' THEN '0.5in'
        WHEN margin_size = 'large' THEN '1.5in'
        ELSE '1in'
      END,
      margin_bottom = CASE 
        WHEN margin_size = 'small' THEN '0.5in'
        WHEN margin_size = 'large' THEN '1.5in'
        ELSE '1in'
      END,
      margin_left = CASE 
        WHEN margin_size = 'small' THEN '0.5in'
        WHEN margin_size = 'large' THEN '1.5in'
        ELSE '1in'
      END,
      margin_right = CASE 
        WHEN margin_size = 'small' THEN '0.5in'
        WHEN margin_size = 'large' THEN '1.5in'
        ELSE '1in'
      END
    WHERE margin_top IS NULL OR margin_bottom IS NULL OR margin_left IS NULL OR margin_right IS NULL;
    
    -- Drop the old margin_size column
    ALTER TABLE exam_settings DROP COLUMN IF EXISTS margin_size;
  END IF;
END $$;

-- Update font_size column to accept custom values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'font_size'
  ) THEN
    -- Update existing font_size enum values to pixel values
    UPDATE exam_settings 
    SET font_size = CASE 
      WHEN font_size = 'small' THEN '12px'
      WHEN font_size = 'large' THEN '16px'
      WHEN font_size = 'medium' THEN '14px'
      ELSE COALESCE(font_size, '14px')
    END
    WHERE font_size IN ('small', 'medium', 'large') OR font_size IS NULL;
  END IF;
END $$;