/*
  # MCQ Question Builder System

  1. New Tables
    - `mcq_question_sets` - Store question sets/papers
    - `mcq_questions` - Store individual questions
    - `mcq_settings` - Store school-specific MCQ settings

  2. Security
    - Enable RLS on all tables
    - School owners can manage their MCQ data
    - Maintain data isolation between schools

  3. Structure
    - Question sets with metadata (subject, set name, etc.)
    - Individual questions with options and correct answers
    - Configurable settings for paper formatting
*/

-- Create MCQ question sets table
CREATE TABLE IF NOT EXISTS mcq_question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  set_name text DEFAULT '',
  instructions text DEFAULT '',
  total_marks integer DEFAULT 100,
  time_duration text DEFAULT '3 ঘন্টা',
  board_name text DEFAULT 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড',
  subject_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create MCQ questions table
CREATE TABLE IF NOT EXISTS mcq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id uuid REFERENCES mcq_question_sets(id) ON DELETE CASCADE NOT NULL,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  group_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(question_set_id, question_number)
);

-- Create MCQ settings table
CREATE TABLE IF NOT EXISTS mcq_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  page_size text DEFAULT 'A4',
  margin_top integer DEFAULT 20,
  margin_bottom integer DEFAULT 20,
  margin_left integer DEFAULT 25,
  margin_right integer DEFAULT 25,
  font_size integer DEFAULT 14,
  header_font_size integer DEFAULT 16,
  school_name text DEFAULT '',
  school_address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id)
);

-- Enable RLS
ALTER TABLE mcq_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for question sets
CREATE POLICY "School owners can manage their MCQ question sets"
  ON mcq_question_sets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = mcq_question_sets.school_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add RLS policies for questions
CREATE POLICY "School owners can manage their MCQ questions"
  ON mcq_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mcq_question_sets qs
      JOIN schools s ON s.id = qs.school_id
      WHERE qs.id = mcq_questions.question_set_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add RLS policies for settings
CREATE POLICY "School owners can manage their MCQ settings"
  ON mcq_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = mcq_settings.school_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_mcq_question_sets_school_id ON mcq_question_sets(school_id);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_set_id ON mcq_questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_number ON mcq_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_mcq_settings_school_id ON mcq_settings(school_id);

-- Add triggers for updated_at
CREATE TRIGGER update_mcq_question_sets_updated_at BEFORE UPDATE ON mcq_question_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcq_questions_updated_at BEFORE UPDATE ON mcq_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcq_settings_updated_at BEFORE UPDATE ON mcq_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();