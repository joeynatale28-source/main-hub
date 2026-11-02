# Daylight Supabase Auth — owner setup

Daylight uses email/password through Supabase Auth. Public signups are not supported.

1. In Supabase Dashboard, Authentication > Users > Add user, create each account with an email and password.
2. In Authentication settings disable public sign-ups, leaving dashboard-admin user creation available.
3. Configure the GitHub Pages URL as Site URL and allowed password-reset redirect URL.
4. Apply the coordinated 20261102_daylight_supabase_auth_clean_reset.sql migration: it deletes every legacy account, session and Daylight data record and switches ownership foreign keys and RLS to auth.users.
5. Deploy the matching daylight-release Edge Function and only then publish the matching GitHub Pages release.

Never expose the service-role key in a browser. Password recovery uses Supabase Auth resetPasswordForEmail.
