const crypto = require('crypto');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 روز
const DEFAULT_SESSION_SECRET = 'mgh-session-secret-przihknu-2026-change-later';

function getSecret() {
  return (process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET).trim();
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSession(user) {
  return signToken({
    sub: user.id || user.username,
    username: user.username,
    role: user.role || 'user',
    name: user.display_name || user.username,
    exp: Date.now() + SESSION_TTL_MS
  });
}

function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

function requireAuth(req, res) {
  const token = getBearer(req);
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ ok: false, error: 'نشست نامعتبر یا منقضی — دوباره وارد شوید' });
    return null;
  }
  return session;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { sha256, createSession, verifyToken, requireAuth, setCors, getBearer };
