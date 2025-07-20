/*
  # Add difficulty field to questions table

  1. Changes
    - Add `difficulty` field to `questions` table for difficulty level tracking
    - Default value of 'medium' for existing questions
    - Update existing records to have default value

  2. Notes
    - This field allows categorizing questions by difficulty level
    - Maintains backward compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE questions ADD COLUMN difficulty text DEFAULT 'medium';
  END IF;
END $$;