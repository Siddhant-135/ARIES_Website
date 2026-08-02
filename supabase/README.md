-- ARIES_Website schema snapshot (applied on remote via MCP execute_sql).
-- Source of truth is the live Supabase project lkhansubwrevcvsatcuc.
-- Re-seed content: npm run db:seed:supabase (needs SUPABASE_SERVICE_ROLE_KEY)
-- or scripts/generate-seed-sql.mjs + SQL editor.

-- See plan: members/projects/events/resources/team + change_requests/change_log
-- Levels: oc | co_overall_coordinator | research_lead | coordinator | executive | member | alumni
-- Login: username/entry_number → synthetic email {id}@ariesiitd.com via resolve_login_email
-- Bootstrap: admin / password (OC) — remove after member credentials imported
