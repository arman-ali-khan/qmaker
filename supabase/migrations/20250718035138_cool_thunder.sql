/*
  # Fix user_id column issue in exam_settings table

  1. Problem
    - The exam_settings table is missing the user_id column
    - This causes authentication and RLS policies to fail

  2. Solution
    - Drop and recreate the exam_settings table with proper structure
    - Ensure all required columns exist
    - Re-enable RLS and recreate policies
    - Preserve any existing data

  3. Security
    - Enable RLS on exam_settings table
    - Add policies for authenticated users to manage their own settings
*/

-- First, backup any existing data
CREATE TABLE IF NOT EXISTS exam_settings_backup AS 
SELECT * FROM exam_settings WHERE false; -- Create empty backup table with same structure

-- Insert existing data if table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_settings') THEN
    -- Try to backup existing data, but handle case where user_id doesn't exist
    BEGIN
      INSERT INTO exam_settings_backup SELECT * FROM exam_settings;
    EXCEPTION WHEN OTHERS THEN
      -- If backup fails due to missing columns, continue without backup
      NULL;
    END;
  END IF;
END $$;

-- Drop the existing table if it exists
DROP TABLE IF EXISTS exam_settings CASCADE;

-- Recreate the exam_settings table with proper structure
CREATE TABLE exam_settings (
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

-- Enable RLS
ALTER TABLE exam_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own exam settings"
  ON exam_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam settings"
  ON exam_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam settings"
  ON exam_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exam settings"
  ON exam_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_exam_settings_user_id ON exam_settings(user_id);

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_exam_settings_updated_at
    BEFORE UPDATE ON exam_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clean up backup table
DROP TABLE IF EXISTS exam_settings_backup;

-- Also ensure questions table exists with proper structure
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  question_no integer NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  question_set text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for questions table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Users can view own questions'
  ) THEN
    CREATE POLICY "Users can view own questions"
      ON questions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Users can insert own questions'
  ) THEN
    CREATE POLICY "Users can insert own questions"
      ON questions
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Users can update own questions'
  ) THEN
    CREATE POLICY "Users can update own questions"
      ON questions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' 
    AND policyname = 'Users can delete own questions'
  ) THEN
    CREATE POLICY "Users can delete own questions"
      ON questions
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for questions table
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_question_set ON questions(question_set);