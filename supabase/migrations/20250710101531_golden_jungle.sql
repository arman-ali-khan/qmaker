/*
  # Ensure exam_settings table has all required columns

  1. New Tables
    - Ensures `exam_settings` table exists with all required columns
    - Adds missing columns if they don't exist

  2. Security
    - Maintains existing RLS policies
    - Ensures proper user access controls

  3. Changes
    - Adds `school_address` column if missing
    - Ensures all other required columns exist
    - Sets proper default values
*/

-- Ensure the exam_settings table exists
CREATE TABLE IF NOT EXISTS exam_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_name text DEFAULT 'বাংলাদেশ শিক্ষা বোর্ড',
  school_address text DEFAULT '',
  exam_type text DEFAULT 'বার্ষিক পরীক্ষা',
  exam_time text DEFAULT '২ ঘণ্টা ৩০ মিনিট',
  total_marks text DEFAULT '১০০',
  instructions text DEFAULT 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
  page_size text DEFAULT 'A4',
  font_family text DEFAULT 'noto-serif',
  font_size text DEFAULT '14px',
  margin_top text DEFAULT '1in',
  margin_bottom text DEFAULT '1in',
  margin_left text DEFAULT '1in',
  margin_right text DEFAULT '1in',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Add missing columns one by one
DO $$
BEGIN
  -- Add school_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'school_address'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN school_address text DEFAULT '';
  END IF;

  -- Add school_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'school_name'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN school_name text DEFAULT 'বাংলাদেশ শিক্ষা বোর্ড';
  END IF;

  -- Add exam_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'exam_type'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN exam_type text DEFAULT 'বার্ষিক পরীক্ষা';
  END IF;

  -- Add exam_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'exam_time'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN exam_time text DEFAULT '২ ঘণ্টা ৩০ মিনিট';
  END IF;

  -- Add total_marks column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'total_marks'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN total_marks text DEFAULT '১০০';
  END IF;

  -- Add instructions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'instructions'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN instructions text DEFAULT 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।';
  END IF;

  -- Add page_size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'page_size'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN page_size text DEFAULT 'A4';
  END IF;

  -- Add font_family column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'font_family'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN font_family text DEFAULT 'noto-serif';
  END IF;

  -- Add font_size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'font_size'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN font_size text DEFAULT '14px';
  END IF;

  -- Add margin columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_top'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_top text DEFAULT '1in';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_bottom'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_bottom text DEFAULT '1in';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_left'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_left text DEFAULT '1in';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_right'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_right text DEFAULT '1in';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE exam_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Policy for users to read their own exam settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exam_settings' 
    AND policyname = 'Users can read own exam settings'
  ) THEN
    CREATE POLICY "Users can read own exam settings"
      ON exam_settings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for users to insert their own exam settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exam_settings' 
    AND policyname = 'Users can insert own exam settings'
  ) THEN
    CREATE POLICY "Users can insert own exam settings"
      ON exam_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for users to update their own exam settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exam_settings' 
    AND policyname = 'Users can update own exam settings'
  ) THEN
    CREATE POLICY "Users can update own exam settings"
      ON exam_settings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for users to delete their own exam settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exam_settings' 
    AND policyname = 'Users can delete own exam settings'
  ) THEN
    CREATE POLICY "Users can delete own exam settings"
      ON exam_settings
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;