/*
  # Add columns field to questions table

  1. Changes
    - Add `columns` field to `questions` table for MCQ layout support
    - Default value of 1 for single column layout
    - Update existing records to have default value

  2. Notes
    - This field controls how many columns MCQ options should be displayed in
    - Maintains backward compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'columns'
  ) THEN
    ALTER TABLE questions ADD COLUMN columns integer DEFAULT 1;
  END IF;
END $$;