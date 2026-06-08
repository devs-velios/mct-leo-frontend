// Hard-coded runtime config. Temporary: values live here instead of env vars so
// the app runs without a populated .env. Swap these out (or move back to
// process.env) once real secrets management is in place.
//
// SERVER-ONLY: this module holds the Supabase service-role key and must never be
// imported from a Client Component — only from Route Handlers / server modules.

export const SUPABASE_URL = "https://nscmtkulokipqsgzpuzt.supabase.co";

export const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zY210a3Vsb2tpcHFzZ3pwdXp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDEyNTg5MCwiZXhwIjoyMDk1NzAxODkwfQ.HgFTwf4sXccgY3OOGp9J-s3ml4RidDc1PfVcMsh462U";

export const LEO_API_URL = "http://localhost:8000";

export const DEMO_EMAIL = "test@gmail.com";

export const DEMO_PASSWORD = "123123123";

// Secret used to HMAC-sign the session cookie. Falls back to the service-role key.
export const SESSION_SECRET = SUPABASE_SERVICE_ROLE_KEY;
