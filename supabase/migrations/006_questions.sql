-- Questions table for quizzes and mock exams
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL CHECK (subject IN ('turkce','matematik','fen','inkilap','din','yabanciDil')),
  text text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are readable by everyone"
  ON public.questions FOR SELECT
  USING (true);

CREATE INDEX idx_questions_subject ON public.questions(subject);
