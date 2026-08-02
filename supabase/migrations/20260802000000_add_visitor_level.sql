-- Add the visitor tier for non-ARIES people who still get a profile page.
-- Run this via Supabase SQL Editor (or MCP execute_sql) if the members.level
-- column has a check constraint.

-- If you created the constraint with a name like members_level_check, drop and recreate:
-- (Skip these lines if members.level is a plain text column with no check constraint.)
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_level_check;

ALTER TABLE public.members
ADD CONSTRAINT members_level_check
CHECK (level IN (
  'oc',
  'co_overall_coordinator',
  'research_lead',
  'coordinator',
  'executive',
  'member',
  'blogger',
  'alumni',
  'visitor'
));

-- Existing members stay unchanged; only new non-ARIES attribution will use 'visitor'.
