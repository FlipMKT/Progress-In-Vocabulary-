-- Create table for module onboarding slides
CREATE TABLE public.module_onboarding_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL CHECK (slide_number >= 1 AND slide_number <= 3),
  icon_name TEXT,
  image_url TEXT,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_id, slide_number)
);

-- Enable RLS
ALTER TABLE public.module_onboarding_slides ENABLE ROW LEVEL SECURITY;

-- Admins can manage onboarding slides
CREATE POLICY "Admins can manage onboarding slides" 
ON public.module_onboarding_slides 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view onboarding slides for active modules
CREATE POLICY "Users can view onboarding slides for active modules" 
ON public.module_onboarding_slides 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM modules 
  WHERE modules.id = module_onboarding_slides.module_id 
  AND (modules.is_active = true OR has_role(auth.uid(), 'admin'::app_role))
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_module_onboarding_slides_updated_at
BEFORE UPDATE ON public.module_onboarding_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();