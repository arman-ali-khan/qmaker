/*
  # Add column layout field to questions table

  1. Changes
    - Add `column_layout` field to `questions` table for layout control
    - Default value of 'two-column' for two-column layout
    - Update existing records to have default value

  2. Notes
    - This field controls whether questions should be displayed in single or two-column layout
    - Maintains backward compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'column_layout'
  ) THEN
    ALTER TABLE questions ADD COLUMN column_layout text DEFAULT 'two-column';
  END IF;
END $$;