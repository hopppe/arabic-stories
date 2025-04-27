-- Current restrictive policy:
-- alter policy "Users can insert their own stories"
-- on "public"."user_stories"
-- to authenticated
-- with check (
--   ((auth.uid())::text = user_id)
-- );

-- Updated more lenient policy:
alter policy "Users can insert their own stories"
on "public"."user_stories"
to authenticated
with check (
  -- Allow users to insert stories as long as user_id is provided
  -- This removes the strict check that user_id must match auth.uid()
  (user_id IS NOT NULL)
);

-- Alternatively, if you still want some validation but more flexibility:
-- alter policy "Users can insert their own stories"
-- on "public"."user_stories"
-- to authenticated
-- with check (
--   -- Allow if user_id matches auth.uid OR if the auth.uid exists (is authenticated)
--   ((auth.uid())::text = user_id) OR (auth.uid() IS NOT NULL)
-- ); 