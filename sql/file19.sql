/*
  # Create Question Papers Management System

  1. New Tables
    - `question_papers` - Store question paper metadata
    - `questions` - Store individual MCQ questions
    - `question_options` - Store options for each question

  2. Security
    - Enable RLS on all tables
    - School owners and teachers can manage question papers
    - Maintain data isolation between schools

  3. Structure
    - Question papers with exam details
    - MCQ questions with Bengali text support
    - Multiple choice options with correct answer marking
*/

-- Create question_papers table
CREATE TABLE IF NOT EXISTS question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Paper Details
  school_name text NOT NULL,
  exam_type text NOT NULL,
  class text NOT NULL,
  subject_name text NOT NULL,
  exam_date date,
  exam_time time,
  
  -- Settings
  time_limit integer DEFAULT 60, -- in minutes
  total_marks integer DEFAULT 0,
  page_size text DEFAULT 'A4' CHECK (page_size IN ('A4', 'A5', 'Letter')),
  font_size integer DEFAULT 14,
  line_height numeric(3,1) DEFAULT 1.5,
  show_answer_key boolean DEFAULT false,
  
  -- Print Settings
  watermark text,
  page_margin integer DEFAULT 20,
  header_text text,
  footer_text text,
  
  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_paper_id uuid REFERENCES question_papers(id) ON DELETE CASCADE NOT NULL,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  marks integer DEFAULT 1,
  correct_option integer NOT NULL CHECK (correct_option BETWEEN 1 AND 4),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(question_paper_id, question_number)
);

-- Create question_options table
CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  option_number integer NOT NULL CHECK (option_number BETWEEN 1 AND 4),
  option_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id, option_number)
);

-- Enable RLS
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

-- Question Papers policies
CREATE POLICY "School users can manage their school question papers"
  ON question_papers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = question_papers.school_id
      AND s.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.school_id = question_papers.school_id
      AND u.role IN ('school_owner', 'teacher')
    )
  );

-- Questions policies
CREATE POLICY "School users can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_papers qp
      JOIN schools s ON s.id = qp.school_id
      WHERE qp.id = questions.question_paper_id
      AND s.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM question_papers qp
      JOIN users u ON u.school_id = qp.school_id
      WHERE qp.id = questions.question_paper_id
      AND u.id = auth.uid()
      AND u.role IN ('school_owner', 'teacher')
    )
  );

-- Question Options policies
CREATE POLICY "School users can manage question options"
  ON question_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN question_papers qp ON qp.id = q.question_paper_id
      JOIN schools s ON s.id = qp.school_id
      WHERE q.id = question_options.question_id
      AND s.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM questions q
      JOIN question_papers qp ON qp.id = q.question_paper_id
      JOIN users u ON u.school_id = qp.school_id
      WHERE q.id = question_options.question_id
      AND u.id = auth.uid()
      AND u.role IN ('school_owner', 'teacher')
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_question_papers_school_id ON question_papers(school_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_created_by ON question_papers(created_by);
CREATE INDEX IF NOT EXISTS idx_question_papers_status ON question_papers(status);
CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON questions(question_paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_number ON questions(question_number);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

-- Add triggers for updated_at
CREATE TRIGGER update_question_papers_updated_at BEFORE UPDATE ON question_papers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();