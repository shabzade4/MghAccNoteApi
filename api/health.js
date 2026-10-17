const { setCors } = require('../lib/auth');
const { getAdminClient, DEFAULT_URL } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = (process.env.SUPABASE_URL || DEFAULT_URL || '').trim();
  const hasKey = !!(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    true // default embedded for demo
  );

  let dbOk = false;
  let dbError = null;
  let sample = null;
  try {
    const db = getAdminClient();
    const { data, error } = await db.from('user_profile').select('id,name').limit(1);
    dbOk = !error;
    dbError = error ? error.message : null;
    sample = data && data[0] ? { id: data[0].id, name: data[0].name } : null;
  } catch (e) {
    dbError = e.message || String(e);
  }

  return res.status(200).json({
    ok: true,
    url_host: url.replace(/^https?:\/\//, '').split('/')[0],
    env: {
      SUPABASE_URL: !!url,
      SUPABASE_KEY: hasKey,
      SESSION_SECRET: !!(process.env.SESSION_SECRET || true)
    },
    database: { ok: dbOk, error: dbError, sample },
    tip: dbOk
      ? 'اتصال OK — می‌توانید لاگین کنید (admin/admin)'
      : 'اتصال ناموفق — جداول را با schema.sql بسازید یا کلید را بررسی کنید'
  });
};
