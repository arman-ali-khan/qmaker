/*
  # Create exam settings table for editable preview information

  1. New Tables
    - `exam_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `school_name` (text, default value)
      - `exam_time` (text, default value)
      - `total_marks` (text, default value)
      - `instructions` (text, default value)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `exam_settings` table
    - Add policies for authenticated users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS exam_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_name text DEFAULT 'বাংলাদেশ শিক্ষা বোর্ড',
  exam_time text DEFAULT '২ ঘণ্টা ৩০ মিনিট',
  total_marks text DEFAULT '১০০',
  instructions text DEFAULT 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exam_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own exam settings"
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
CREATE INDEX IF NOT EXISTS idx_exam_settings_user_id ON exam_settings(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exam_settings_updated_at
    BEFORE UPDATE ON exam_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
