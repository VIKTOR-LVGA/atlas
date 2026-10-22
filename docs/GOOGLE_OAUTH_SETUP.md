# INSURA — Google Sign-in

The UI and PKCE callback are implemented. Google authentication is **not active** until Google Cloud and Supabase OAuth settings are configured.

1. In Google Cloud Console, configure the OAuth consent screen for INSURA, appropriate branding, authorized domain and privacy/terms URLs. Complete Google verification if required for public use.
2. Create an OAuth 2.0 **Web application** client. Set the authorized redirect URI to `https://ycjltpxxetxvuptwlxlr.supabase.co/auth/v1/callback` (Google redirects to Supabase, not directly to Next.js).
3. In Supabase Dashboard → Authentication → Providers → Google, enable Google and securely enter the client ID and client secret. Do not commit secrets to GitHub.
4. In Supabase Dashboard → Authentication → URL Configuration, add `https://atlas-liard-three.vercel.app/auth/callback` to allowed redirect URLs; configure the canonical production Site URL. Add preview URLs only when intentionally supported.
5. Test registration with a new Google account, login with an existing Google account, session persistence after refresh, logout, denied consent, and a second device. Confirm the profile creation trigger works for OAuth identities.
6. Review how existing email/password users are linked to Google identities; do not automatically merge accounts by email in application code.
7. Keep email/password login available. Avoid claiming Google sign-in works until an end-to-end OAuth login succeeds.
