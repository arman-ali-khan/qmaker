/*
  # Add question spacing and column configuration settings

  1. New Columns
    - `question_spacing` (integer, default 0) - Space between questions in pixels
    - `left_column_questions` (integer, default 10) - Number of questions in left column
    - `right_column_questions` (integer, default 10) - Number of questions in right column

  2. Notes
    - These settings control question layout and spacing in the preview
    - Maintains backward compatibility with existing data
*/

-- Add question_spacing column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_papers' AND column_name = 'question_spacing'
  ) THEN
    ALTER TABLE question_papers ADD COLUMN question_spacing integer DEFAULT 0;
  END IF;
END $$;

-- Add left_column_questions column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_papers' AND column_name = 'left_column_questions'
  ) THEN
    ALTER TABLE question_papers ADD COLUMN left_column_questions integer DEFAULT 10;
  END IF;
END $$;

-- Add right_column_questions column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_papers' AND column_name = 'right_column_questions'
  ) THEN
    ALTER TABLE question_papers ADD COLUMN right_column_questions integer DEFAULT 10;
  END IF;
END $$;