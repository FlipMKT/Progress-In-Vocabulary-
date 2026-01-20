-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view groups" ON public.groups;

-- Create a new policy that only allows users to see groups they belong to
CREATE POLICY "Users can view their own group" 
ON public.groups 
FOR SELECT 
USING (
  -- User is an admin
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- User belongs to this group (via their profile)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.group_id = groups.id
  )
);