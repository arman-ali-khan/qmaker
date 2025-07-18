/*
  # Create subjects table for dynamic subject management

  1. New Tables
    - `subjects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, unique per user)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `subjects` table
    - Add policies for authenticated users to manage their own subjects

  3. Initial Data
    - Insert default Bengali subjects for existing users
*/

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects for all existing users
INSERT INTO subjects (user_id, name)
SELECT DISTINCT u.id, s.subject_name
FROM users u
CROSS JOIN (
  VALUES 
    ('বাংলা'),
    ('ইংরেজি'),
    ('গণিত'),
    ('পদার্থবিজ্ঞান'),
    ('রসায়ন'),
    ('জীববিজ্ঞান'),
    ('ইতিহাস'),
    ('ভূগোল'),
    ('সমাজবিজ্ঞান'),
    ('অর্থনীতি')
) AS s(subject_name)
ON CONFLICT (user_id, name) DO NOTHING;