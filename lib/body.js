function readBody(req) {
  let body = req.body;
  if (body == null) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body || '{}'); } catch { return {}; }
  }
  if (Buffer.isBuffer(body)) {
    try { return JSON.parse(body.toString('utf8') || '{}'); } catch { return {}; }
  }
  return body;
}

module.exports = { readBody };
