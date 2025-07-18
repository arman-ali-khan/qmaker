/*
  # Add line_height column to questions table

  1. Changes
    - Add `line_height` field to `questions` table for line height support
    - Default value of 'relaxed' for better readability
    - Update existing records to have default value

  2. Notes
    - This field controls the line height of question text
    - Maintains backward compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'line_height'
  ) THEN
    ALTER TABLE questions ADD COLUMN line_height text DEFAULT 'relaxed';
  END IF;
END $$;