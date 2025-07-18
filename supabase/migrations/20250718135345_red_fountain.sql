/*
  # Add font settings to question_papers table

  1. Changes
    - Add `font_size` column to `question_papers` table
    - Add `font_family` column to `question_papers` table
    - Set default values for existing records

  2. Notes
    - This enables font customization for question papers
    - Maintains backward compatibility with existing data
*/

-- Add font_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_papers' AND column_name = 'font_size'
  ) THEN
    ALTER TABLE question_papers ADD COLUMN font_size text DEFAULT '14px';
  END IF;
END $$;

-- Add font_family column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_papers' AND column_name = 'font_family'
  ) THEN
    ALTER TABLE question_papers ADD COLUMN font_family text DEFAULT 'noto-serif';
  END IF;
END $$;