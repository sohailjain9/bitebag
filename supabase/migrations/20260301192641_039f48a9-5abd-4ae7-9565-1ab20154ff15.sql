
-- Replace permissive policy with one that denies anon access
-- otp_codes should only be accessed via service_role from edge functions
DROP POLICY "Service role full access on otp_codes" ON public.otp_codes;

CREATE POLICY "No public access on otp_codes"
  ON public.otp_codes FOR ALL
  USING (false) WITH CHECK (false);
