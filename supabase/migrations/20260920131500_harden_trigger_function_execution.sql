-- Trigger functions run through their owning triggers and must not be callable
-- directly through the exposed API roles.

revoke execute on function public.handle_new_auth_user_profile()
  from public, anon, authenticated;

revoke execute on function public.record_consultation_submission()
  from public, anon, authenticated;
