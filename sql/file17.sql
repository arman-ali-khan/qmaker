/*
  # Create Question Papers Database Schema

  1. New Tables
    - `question_papers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `page_size` (text, default 'A4')
      - `margins` (jsonb, page margins)
      - `header_info` (jsonb, header information)
      - `language_direction` (text, default 'ltr')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `questions`
      - `id` (uuid, primary key)
      - `paper_id` (uuid, references question_papers)
      - `type` (text, 'mcq' or 'written')
      - `question_text` (text)
      - `options` (text array, for MCQ options)
      - `correct_answer` (text, for MCQ correct answer)
      - `marks` (integer, default 1)
      - `order_index` (integer, for question ordering)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  page_size text DEFAULT 'A4',
  margins jsonb DEFAULT '{"top": 25, "right": 25, "bottom": 25, "left": 25}',
  header_info jsonb DEFAULT '{"school_name": "", "school_address": "", "exam_name": "", "subject": "", "date": "", "time": "", "marks": ""}',
  language_direction text DEFAULT 'ltr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid REFERENCES question_papers(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('mcq', 'written')),
  question_text text NOT NULL,
  options text[],
  correct_answer text,
  marks integer DEFAULT 1,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Question Papers Policies
CREATE POLICY "Users can read own question papers"
  ON question_papers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question papers"
  ON question_papers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question papers"
  ON question_papers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own question papers"
  ON question_papers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Questions Policies
CREATE POLICY "Users can read questions from their papers"
  ON questions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM question_papers 
    WHERE question_papers.id = questions.paper_id 
    AND question_papers.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert questions to their papers"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM question_papers 
    WHERE question_papers.id = questions.paper_id 
    AND question_papers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update questions in their papers"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM question_papers 
    WHERE question_papers.id = questions.paper_id 
    AND question_papers.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM question_papers 
    WHERE question_papers.id = questions.paper_id 
    AND question_papers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete questions from their papers"
  ON questions
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM question_papers 
    WHERE question_papers.id = questions.paper_id 
    AND question_papers.user_id = auth.uid()
  ));

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_papers_user_id ON question_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_updated_at ON question_papers(updated_at);
CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(paper_id, order_index);