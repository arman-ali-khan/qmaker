/*
  # Fix exam_settings table schema

  1. Changes
    - Ensure margin_top, margin_bottom, margin_left, margin_right columns exist
    - Update font_size column to accept text values instead of enum
    - Set proper default values for all columns

  2. Security
    - Maintains existing RLS policies
*/

-- Create exam_settings table if it doesn't exist
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

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add margin_top column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_top'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_top text DEFAULT '1in';
  END IF;

  -- Add margin_bottom column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_bottom'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_bottom text DEFAULT '1in';
  END IF;

  -- Add margin_left column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_left'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_left text DEFAULT '1in';
  END IF;

  -- Add margin_right column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_right'
  ) THEN
    ALTER TABLE exam_settings ADD COLUMN margin_right text DEFAULT '1in';
  END IF;

  -- Update font_size column type if it's still an enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' 
    AND column_name = 'font_size'
    AND data_type = 'USER-DEFINED'
  ) THEN
    -- First update existing enum values to text values
    UPDATE exam_settings 
    SET font_size = CASE 
      WHEN font_size = 'small' THEN '12px'
      WHEN font_size = 'medium' THEN '14px'
      WHEN font_size = 'large' THEN '16px'
      ELSE COALESCE(font_size, '14px')
    END;
    
    -- Change column type to text
    ALTER TABLE exam_settings ALTER COLUMN font_size TYPE text;
  END IF;

  -- Migrate old margin_size data if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_settings' AND column_name = 'margin_size'
  ) THEN
    -- Update records that don't have individual margin values set
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
    WHERE (margin_top IS NULL OR margin_bottom IS NULL OR margin_left IS NULL OR margin_right IS NULL)
    AND margin_size IS NOT NULL;
    
    -- Drop the old margin_size column
    ALTER TABLE exam_settings DROP COLUMN margin_size;
  END IF;
END $$;

-- Enable RLS if not already enabled
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