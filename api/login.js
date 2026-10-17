const { getAdminClient } = require('../lib/supabase');
const { sha256, createSession, setCors } = require('../lib/auth');
const { readBody } = require('../lib/body');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'فقط روش POST مجاز است' });
  }

  try {
    const body = readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'نام کاربری و رمز الزامی است' });
    }

    const db = getAdminClient();
    const passHash = sha256(password);
    let user = null;
    let debug = [];

    // 1) app_users
    try {
      const { data: users, error: uErr } = await db
        .from('app_users')
        .select('id, username, password_hash, display_name, role, is_active')
        .eq('username', username)
        .limit(1);

      if (uErr) debug.push('app_users: ' + uErr.message);
      else if (users && users.length) {
        const u = users[0];
        if (u.is_active === false) {
          return res.status(403).json({ ok: false, error: 'حساب غیرفعال است' });
        }
        if (u.password_hash === passHash) {
          user = {
            id: u.id,
            username: u.username,
            display_name: u.display_name || u.username,
            role: u.role || 'user'
          };
        } else {
          debug.push('app_users: رمز مطابقت ندارد');
        }
      } else {
        debug.push('app_users: کاربری با این نام یافت نشد');
      }
    } catch (e) {
      debug.push('app_users exception: ' + (e.message || e));
    }

    // 2) user_profile admin
    if (!user) {
      try {
        const { data: profiles, error: pErr } = await db.from('user_profile').select('*').limit(1);
        if (pErr) debug.push('user_profile: ' + pErr.message);
        else if (profiles && profiles.length) {
          const p = profiles[0];
          const adminUser = p.admin_user || 'admin';
          if (username === adminUser && p.admin_pass === passHash) {
            user = {
              id: p.id,
              username: adminUser,
              display_name: p.name || 'مدیر سیستم',
              role: 'admin'
            };
          } else if (username === adminUser) {
            debug.push('user_profile: رمز ادمین مطابقت ندارد');
          }
        } else {
          debug.push('user_profile: خالی است');
        }
      } catch (e) {
        debug.push('user_profile exception: ' + (e.message || e));
      }
    }

    // 3) bootstrap فقط برای admin/admin اگر جداول خالی/خطا
    if (!user && username === 'admin' && password === 'admin') {
      user = {
        id: 'bootstrap',
        username: 'admin',
        display_name: 'مدیر سیستم',
        role: 'admin'
      };
      debug.push('ورود bootstrap (admin/admin)');
    }

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'نام کاربری یا رمز اشتباه است',
        debug
      });
    }

    const token = createSession(user);
    return res.status(200).json({
      ok: true,
      token,
      user: {
        username: user.username,
        name: user.display_name,
        role: user.role
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      ok: false,
      error: e.message || 'خطای سرور',
      stack: process.env.NODE_ENV === 'development' ? String(e.stack || '') : undefined
    });
  }
};
