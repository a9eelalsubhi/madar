/* ============ مزامنة الجوال والبي سي ============
   البيانات تنحفظ في قاعدة بيانات Supabase مجانية (مشروع madar).
   كل الأجهزة المربوطة تشترك في "رمز مزامنة" سري طويل؛ ما فيه حساب ولا كلمة مرور.
   أول جهاز يسوي الرمز، والجهاز الثاني ينربط بفتح رابط فيه الرمز مرة وحدة.
   الأحدث يكسب: آخر تعديل هو اللي يبقى.                                       */
(function (root) {
  'use strict';
  const URL_ = 'https://iorqgtgszskthfsmizxo.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_yZ_LEuSqMeaGrx6vIDwNDw_9G11enWg';
  const S = root.Store;
  const CODE_KEY = 'madar.sync.code', SEEN_KEY = 'madar.sync.seen';
  let code = null, applying = false, pushTimer = null, state = 'idle', listeners = [];

  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }
  };
  function newCode() {
    const b = new Uint8Array(24); crypto.getRandomValues(b);
    return btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function setState(s) { state = s; listeners.forEach(f => f(s)); }
  async function rpc(fn, body) {
    const r = await fetch(URL_ + fn, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('sync ' + r.status);
    return r.json();
  }

  async function pull() {
    if (!code || !navigator.onLine) { setState(navigator.onLine ? 'idle' : 'offline'); return; }
    try {
      setState('syncing');
      const rows = await rpc('madar_get', { p_code: code });
      const remote = rows && rows[0];
      const local = S.data._updated || '1970-01-01T00:00:00Z';
      if (!remote) { await push(true); return; }
      if (new Date(remote.updated_at) > new Date(local)) {
        applying = true;
        const keepNotified = S.data.notified;
        S.replace(Object.assign({}, remote.data, { _updated: remote.updated_at, notified: Object.assign({}, remote.data.notified, keepNotified) }));
        applying = false;
      } else if (new Date(local) > new Date(remote.updated_at)) {
        await push(true); return;
      }
      ls.set(SEEN_KEY, new Date().toISOString());
      setState('ok');
    } catch (e) { applying = false; setState('error'); }
  }
  async function push(now) {
    clearTimeout(pushTimer);
    const go = async () => {
      if (!code || !navigator.onLine) { setState('offline'); return; }
      try {
        setState('syncing');
        const data = JSON.parse(JSON.stringify(S.data));
        await rpc('madar_put', { p_code: code, p_data: data, p_updated: data._updated || new Date().toISOString() });
        setState('ok');
      } catch (e) { setState('error'); }
    };
    if (now) return go();
    pushTimer = setTimeout(go, 1200);
  }

  function start() {
    // ربط جهاز جديد: الرابط فيه #sync=الرمز
    const m = location.hash.match(/sync=([A-Za-z0-9_-]{24,})/);
    if (m) {
      code = m[1]; ls.set(CODE_KEY, code);
      history.replaceState(null, '', location.pathname + location.search);
      S.data._updated = '1970-01-01T00:00:00Z'; // الجهاز الجديد ياخذ بيانات السحابة
    } else {
      code = ls.get(CODE_KEY);
      if (!code) { code = newCode(); ls.set(CODE_KEY, code); }
    }
    S.onChange(() => {
      if (applying) return;
      S.data._updated = new Date().toISOString();
      try { localStorage.setItem('madar.aseel.v1', JSON.stringify(S.data)); } catch (e) { }
      push();
    });
    pull();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
    window.addEventListener('focus', pull);
    window.addEventListener('online', pull);
    window.addEventListener('offline', () => setState('offline'));
    setInterval(() => { if (!document.hidden) pull(); }, 15000);
  }

  root.Sync = {
    start, pull, push,
    get state() { return state; },
    onState(f) { listeners.push(f); },
    link() { return location.origin + location.pathname + '#sync=' + code; }
  };
})(window);
