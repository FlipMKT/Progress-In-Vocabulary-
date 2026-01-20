-- Add game_number and part_number tracking to game_sessions
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS game_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS part_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS time_taken_seconds integer;

-- Create a table for tracking individual pair attempts
CREATE TABLE IF NOT EXISTS public.pair_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  vocab_item_id uuid NOT NULL REFERENCES public.vocab_items(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 1,
  was_correct boolean NOT NULL DEFAULT false,
  time_taken_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pair_attempts
ALTER TABLE public.pair_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for pair_attempts
CREATE POLICY "Users can create their own pair attempts"
ON public.pair_attempts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_sessions 
    WHERE game_sessions.id = pair_attempts.game_session_id 
    AND game_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own pair attempts"
ON public.pair_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_sessions 
    WHERE game_sessions.id = pair_attempts.game_session_id 
    AND game_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all pair attempts"
ON public.pair_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));