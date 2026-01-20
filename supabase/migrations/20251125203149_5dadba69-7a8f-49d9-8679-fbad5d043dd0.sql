-- Add game_type column to modules table
ALTER TABLE public.modules
ADD COLUMN game_type TEXT NOT NULL DEFAULT 'matching';

-- Add comment to document game types
COMMENT ON COLUMN public.modules.game_type IS 'Type of game: matching or multiple_choice';

-- Add multiple choice fields to vocab_items table
ALTER TABLE public.vocab_items
ADD COLUMN option_a TEXT,
ADD COLUMN option_b TEXT,
ADD COLUMN option_c TEXT,
ADD COLUMN option_d TEXT,
ADD COLUMN correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D'));

-- Add comments for clarity
COMMENT ON COLUMN public.vocab_items.option_a IS 'Multiple choice option A';
COMMENT ON COLUMN public.vocab_items.option_b IS 'Multiple choice option B';
COMMENT ON COLUMN public.vocab_items.option_c IS 'Multiple choice option C';
COMMENT ON COLUMN public.vocab_items.option_d IS 'Multiple choice option D';
COMMENT ON COLUMN public.vocab_items.correct_option IS 'Correct answer: A, B, C, or D';