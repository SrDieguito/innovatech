export function pickQuery(req, names, { required = false } = {}) {
    const q = req.query || {};
    for (const n of names) {
      if (q[n] !== undefined && q[n] !== null && q[n] !== '') return q[n];
    }
    if (required) {
      const all = names.join('|');
      const got = JSON.stringify(q);
      const err = new Error(`Falta parámetro: uno de [${all}]`);
      err.status = 400;
      err.meta = { got };
      throw err;
    }
    return undefined;
  }
  
  export function toInt(value, name) {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) {
      const err = new Error(`Parámetro inválido ${name}`);
      err.status = 400;
      throw err;
    }
    return n;
  }
  
  export function ok(res, data) {
    res.status(200).json(data);
  }
  export function fail(res, e) {
    const code = e.status || 500;
    console.error('[API ERROR]', code, e.message, e.meta || '');
    res.status(code).json({ error: e.message });
  }
  