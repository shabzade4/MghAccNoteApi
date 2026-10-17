const { getAdminClient } = require('../lib/supabase');
const { requireAuth, setCors } = require('../lib/auth');
const { readBody } = require('../lib/body');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const db = getAdminClient();
    const body = readBody(req);

    if (req.method === 'GET') {
      const { data, error } = await db.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) {
        const r2 = await db.from('contacts').select('*');
        if (r2.error) return res.status(500).json({ ok: false, error: r2.error.message });
        return res.status(200).json({ ok: true, data: r2.data || [] });
      }
      return res.status(200).json({ ok: true, data: data || [] });
    }

    if (req.method === 'POST') {
      const name = String(body.name || '').trim();
      if (!name) return res.status(400).json({ ok: false, error: 'نام الزامی است' });

      const row = {
        name,
        mobile: body.mobile || body.phones || '',
        phones: body.mobile || body.phones || '',
        phone2: body.phone2 || '',
        work_phone: body.work_phone || '',
        home_phone: body.home_phone || '',
        email: body.email || '',
        address: body.address || '',
        category: body.category || 'دوستان',
        notes: body.notes || '',
        birthday: body.birthday || ''
      };

      let { data, error } = await db.from('contacts').insert([row]).select().single();
      if (error && error.message && error.message.includes('column')) {
        const minimal = { name: row.name, phones: row.phones, category: row.category };
        ({ data, error } = await db.from('contacts').insert([minimal]).select().single());
      }
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(201).json({ ok: true, data });
    }

    if (req.method === 'PUT') {
      const id = body.id;
      if (!id) return res.status(400).json({ ok: false, error: 'id الزامی است' });
      const patch = { ...body };
      delete patch.id;
      const { data, error } = await db.from('contacts').update(patch).eq('id', id).select().single();
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === 'DELETE') {
      const id = (req.query && req.query.id) || body.id;
      if (!id) return res.status(400).json({ ok: false, error: 'id الزامی است' });
      const { error } = await db.from('contacts').delete().eq('id', id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || 'خطای سرور' });
  }
};
