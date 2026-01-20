-- Drop the existing policy that allows unauthenticated access
DROP POLICY IF EXISTS "Active modules visible to authenticated users" ON public.modules;

-- Create a new policy that requires authentication
CREATE POLICY "Active modules visible to authenticated users" 
ON public.modules 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (is_active = true OR has_role(auth.uid(), 'admin'::app_role))
);