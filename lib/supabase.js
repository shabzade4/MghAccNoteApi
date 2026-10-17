const { createClient } = require('@supabase/supabase-js');

// مقادیر پیش‌فرض (فقط سرور). ترجیح با Environment Variables ورکسل است.
const DEFAULT_URL = 'https://przihknusaqtpbeyrwwo.supabase.co';
const DEFAULT_SECRET =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'sb_secret_jjFiJkk3jJE6rLRZLeONDw_cDPi5cwJ';

function getAdminClient() {
  const url = (process.env.SUPABASE_URL || DEFAULT_URL).trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    DEFAULT_SECRET
  ).trim();

  if (!url || !key) {
    throw new Error('SUPABASE_URL یا کلید سرور تنظیم نشده است');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

module.exports = { getAdminClient, DEFAULT_URL };
