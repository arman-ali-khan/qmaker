/*
  # Add options_font_size column to question_papers table

  1. Changes
    - Add `options_font_size` column to `question_papers` table for separate option font sizing
    - Set default value to '12px' for existing records

  2. Notes
    - This enables separate font size control for question options (ক, খ, গ, ঘ)
    - Maintains backward compatibility with existing data
*/

-- Add options_font_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_papers' AND column_name = 'options_font_size'
  ) THEN
    ALTER TABLE question_papers ADD COLUMN options_font_size text DEFAULT '12px';
  END IF;
END $$;