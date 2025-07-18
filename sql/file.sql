-- DROP existing tables safely
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS question_papers CASCADE;

-- ✅ Create question_papers table
CREATE TABLE question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  page_size text DEFAULT 'A4',
  margins jsonb DEFAULT '{"top": 25, "right": 25, "bottom": 25, "left": 25}',
  header_info jsonb DEFAULT '{"school_name": "", "school_address": "", "exam_name": "", "subject": "", "date": "", "time": "", "marks": ""}',
  language_direction text DEFAULT 'ltr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ✅ Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES question_papers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mcq', 'written')),
  question_text text NOT NULL,
  options text[],
  correct_answer text,
  marks integer DEFAULT 1,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ✅ Enable Row-Level Security
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- ✅ Policies for question_papers
CREATE POLICY "Users can read own question papers"
  ON question_papers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question papers"
  ON question_papers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question papers"
  ON question_papers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own question papers"
  ON question_papers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ✅ Policies for questions
CREATE POLICY "Users can read questions from their papers"
  ON questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_papers 
      WHERE question_papers.id = questions.paper_id 
        AND question_papers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions to their papers"
  ON questions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_papers 
      WHERE question_papers.id = questions.paper_id 
        AND question_papers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in their papers"
  ON questions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_papers 
      WHERE question_papers.id = questions.paper_id 
        AND question_papers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM question_papers 
      WHERE question_papers.id = questions.paper_id 
        AND question_papers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from their papers"
  ON questions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_papers 
      WHERE question_papers.id = questions.paper_id 
        AND question_papers.user_id = auth.uid()
    )
  );

-- ✅ Useful Indexes
CREATE INDEX idx_question_papers_user_id ON question_papers(user_id);
CREATE INDEX idx_question_papers_updated_at ON question_papers(updated_at);
CREATE INDEX idx_questions_paper_id ON questions(paper_id);
CREATE INDEX idx_questions_order_index ON questions(paper_id, order_index);

-- ✅ Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Triggers
CREATE TRIGGER trg_update_question_papers
  BEFORE UPDATE ON question_papers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_questions
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
