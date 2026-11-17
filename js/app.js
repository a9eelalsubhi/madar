/* ==================== مدار — كل شي في صفحة وحدة ==================== */
(function () {
  'use strict';
  const P = window.AseelParser, S = window.Store;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = () => S.data;
  const icon = id => '<svg><use href="#' + id + '"/></svg>';

  // ---------- التصنيفات ----------
  const CATS = {
    study: 'دراسة', exam: 'امتحان', health: 'صحة', meeting: 'اجتماع', deen: 'عبادة',
    sport: 'رياضة', social: 'اجتماعي', match: 'ماتشات', project: 'محتوى ومشاريع', personal: 'شخصي'
  };
  const catOk = c => CATS[c] ? c : 'personal';
  const cvar = c => 'var(--c-' + catOk(c) + ')';
  const catIcon = c => icon('c-' + catOk(c));
  const SUBJ_ICONS = ['anatomy', 'embryo', 'histo', 'biochem', 'physio', 'patho', 'pharma', 'radio', 'micro', 'immuno'];
  const subjIcon = id => icon('s-' + (SUBJ_ICONS.includes(id) ? id : 'other'));

  // ---------- التاريخ ----------
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fromYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const sameDay = (a, b) => ymd(a) === ymd(b);
  const fmtT = d => P.fmtTime(d);
  const fmtG = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtGY = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
  let fmtH, fmtHM, fmtHD;
  try {
    fmtH = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
    fmtHM = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { month: 'long', year: 'numeric' });
    fmtHD = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric' });
  } catch (e) { fmtH = fmtHM = fmtHD = { format: () => '' }; }
  const hijri = d => fmtH.format(d).replace(/\s*هـ$/, '') + ' هـ';
  function dayLabel(d) {
    const x = P.describe(d);
    return Math.abs(x.diff) <= 2 ? x.day + ' (' + x.dayName + ' ' + x.date + ')' : x.dayName + ' ' + x.date;
  }

  // ---------- استعلامات ----------
  const evStart = e => new Date(e.start);
  const evEnd = e => e.end ? new Date(e.end) : new Date(new Date(e.start).getTime() + 3600000);
  function eventsOn(day) {
    const k = ymd(day);
    return D().events.filter(e => ymd(evStart(e)) === k).sort((a, b) => (b.allDay - a.allDay) || (evStart(a) - evStart(b)));
  }
  const upcoming = now => D().events.filter(e => !e.allDay && evEnd(e) > now).sort((a, b) => evStart(a) - evStart(b));

  // ---------- تنبيه مع تراجع ----------
  let toastTimer;
  function toast(msg, undo) {
    const t = $('#toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button>تراجع</button>' : '');
    if (undo) t.querySelector('button').onclick = () => { undo(); t.classList.remove('show'); };
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), undo ? 6000 : 2400);
  }
  const snapshot = () => JSON.stringify(D());
  const restore = snap => S.replace(JSON.parse(snap));

  // ==================== الهيدر ====================
  function renderHeader() {
    const now = new Date(), h = now.getHours(), nm = D().name || 'أصيل';
    $('#clock').textContent = pad(h % 12 || 12) + ':' + pad(now.getMinutes());
    $('#greeting').textContent = (h < 4 ? 'سهران يا ' : h < 12 ? 'صباح الخير يا ' : h < 17 ? 'يسعد ظهرك يا ' : 'مساء الخير يا ') + nm;
    $('#gdate').textContent = fmtG.format(now);
    $('#hdate').textContent = hijri(now);
  }

  // ==================== حديث اليوم ====================
  const HADITH = [
    ['إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى', 'متفق عليه'],
    ['من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة', 'رواه مسلم'],
    ['أحب الأعمال إلى الله أدومها وإن قلّ', 'متفق عليه'],
    ['احرص على ما ينفعك، واستعن بالله ولا تعجز', 'رواه مسلم'],
    ['المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف، وفي كلٍّ خير', 'رواه مسلم'],
    ['يسّروا ولا تعسّروا، وبشّروا ولا تنفّروا', 'متفق عليه'],
    ['الكلمة الطيبة صدقة', 'متفق عليه'],
    ['من كانت الآخرة همّه جعل الله غناه في قلبه، وجمع له شمله، وأتته الدنيا وهي راغمة', 'رواه الترمذي'],
    ['لا يشكر الله من لا يشكر الناس', 'رواه أبو داود والترمذي'],
    ['إن الله يحب إذا عمل أحدكم عملًا أن يتقنه', 'رواه الطبراني والبيهقي، وحسّنه الألباني']
  ];
  function renderHadith() {
    const now = new Date(), doy = Math.floor((sod(now) - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const [t, src] = HADITH[doy % HADITH.length];
    $('#hadithCard').innerHTML = '<span class="label">قال رسول الله ﷺ</span><q>«' + esc(t) + '»</q><small>' + esc(src) + '</small>';
  }

  // ==================== الجاي ====================
  function renderNext() {
    const now = new Date(), list = upcoming(now);
    const cur = list.find(e => evStart(e) <= now);
    const next = cur ? list.find(e => e !== cur && evStart(e) > now) : list[0];
    const main = cur || next, card = $('#nextCard');
    if (!main) {
      const left = D().lectures.filter(l => !l.study).length;
      card.style.setProperty('--c', 'var(--accent)');
      card.innerHTML = '<div class="label"><i></i>الجاي</div><div class="title">ما عندك مواعيد جاية</div>' +
        '<div class="when">' + (left ? 'باقي ' + left + ' محاضرة ما ذاكرتها. خذ وحدة الحين.' : 'وقتك لك.') + '</div>';
      card.onclick = null;
      return;
    }
    const s = evStart(main), en = evEnd(main);
    card.style.setProperty('--c', cvar(main.cat));
    let cd;
    if (cur) {
      const m = Math.ceil(Math.max(0, en - now) / 60000);
      cd = '<div class="countdown"><div><b>' + Math.floor(m / 60) + '</b><small>ساعة باقية</small></div><div><b>' + (m % 60) + '</b><small>دقيقة</small></div></div>';
    } else {
      const diff = s - now;
      cd = '<div class="countdown"><div><b>' + Math.floor(diff / 86400000) + '</b><small>يوم</small></div><div><b>' + Math.floor(diff % 86400000 / 3600000) + '</b><small>ساعة</small></div><div><b>' + Math.floor(diff % 3600000 / 60000) + '</b><small>دقيقة</small></div></div>';
    }
    const after = cur ? next : list[1];
    card.innerHTML = '<div class="label"><i></i>' + (cur ? 'الحين' : 'الجاي') + '</div>' +
      '<div class="title">' + catIcon(main.cat) + '<span>' + esc(main.title) + '</span></div>' +
      '<div class="when">' + dayLabel(s) + ' · ' + fmtT(s) + ' – ' + fmtT(en) + '</div>' + cd +
      (after ? '<div class="then">بعدها: <b>' + esc(after.title) + '</b> · ' + dayLabel(evStart(after)) + ' ' + fmtT(evStart(after)) + '</div>' : '');
    card.onclick = () => openEvent(main);
  }

  // ==================== التقويم + اليوم ====================
  let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selDay = sod(new Date());
  function renderCalendar() {
    const first = calMonth, start = addDays(first, -first.getDay());
    $('#calTitle').textContent = fmtGY.format(first);
    $('#calHijri').textContent = fmtHM.format(first) + ' – ' + fmtHM.format(addDays(first, 27));
    const today = ymd(new Date()), sel = ymd(selDay);
    let html = '';
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i), k = ymd(d);
      if (i === 35 && d.getMonth() !== first.getMonth()) break;
      const evs = eventsOn(d);
      html += '<button class="cd' + (d.getMonth() !== first.getMonth() ? ' out' : '') + (k === today ? ' today' : '') + (k === sel ? ' sel' : '') + '" data-day="' + k + '">' +
        '<div class="n"><span>' + d.getDate() + '</span><small>' + fmtHD.format(d) + '</small></div>' +
        '<div class="dots">' + evs.slice(0, 5).map(e => '<i style="--c:' + cvar(e.cat) + '"></i>').join('') + '</div></button>';
    }
    $('#calGrid').innerHTML = html;
  }
  function remindTxt(m) {
    if (m >= 1440) return m === 1440 ? 'يوم' : (m / 1440) + ' أيام';
    if (m >= 60) return m === 60 ? 'ساعة' : m === 120 ? 'ساعتين' : (m / 60) + ' ساعات';
    return m + ' د';
  }
  function evRow(e, now) {
    const s = evStart(e), en = evEnd(e);
    const cls = e.allDay ? '' : (en < now ? ' past' : (s <= now ? ' now' : ''));
    return '<div class="ev-row' + cls + '" style="--c:' + cvar(e.cat) + '" data-ev="' + e.id + '">' +
      '<div class="t">' + (e.allDay ? 'طول اليوم' : fmtT(s) + '<small>' + fmtT(en) + '</small>') + '</div>' +
      '<div class="x"><b>' + esc(e.title) + '</b><span>' + CATS[catOk(e.cat)] + (e.remind ? ' · تنبيه قبل ' + remindTxt(e.remind) : '') + '</span></div>' +
      catIcon(e.cat) + '</div>';
  }
  function renderDay() {
    const x = P.describe(selDay), now = new Date(), isToday = sameDay(selDay, now);
    $('#dayTitle').textContent = (Math.abs(x.diff) <= 2 ? x.day + ' · ' : '') + fmtG.format(selDay);
    $('#daySub').textContent = hijri(selDay);
    const evs = eventsOn(selDay);
    if (!evs.length) { $('#agenda').innerHTML = '<div class="empty">' + icon('i-cal') + 'ما فيه مواعيد هذا اليوم</div>'; return; }
    let html = '', placed = !isToday;
    for (const e of evs) {
      if (!placed && !e.allDay && evStart(e) > now) { html += '<div class="nowline">الحين ' + fmtT(now) + '</div>'; placed = true; }
      html += evRow(e, now);
    }
    if (!placed) html += '<div class="nowline">الحين ' + fmtT(now) + '</div>';
    $('#agenda').innerHTML = html;
  }
  $('#calGrid').addEventListener('click', e => {
    const c = e.target.closest('[data-day]'); if (!c) return;
    selDay = fromYmd(c.dataset.day);
    if (selDay.getMonth() !== calMonth.getMonth()) calMonth = new Date(selDay.getFullYear(), selDay.getMonth(), 1);
    renderCalendar(); renderDay();
  });
  $('#calGrid').addEventListener('dblclick', e => { const c = e.target.closest('[data-day]'); if (c) openEvent(null, fromYmd(c.dataset.day)); });
  $('#calPrev').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); };
  $('#calNext').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); };
  $('#calToday').onclick = () => { selDay = sod(new Date()); calMonth = new Date(selDay.getFullYear(), selDay.getMonth(), 1); renderCalendar(); renderDay(); };
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-ev]'); if (r) { const ev = D().events.find(x => x.id === r.dataset.ev); if (ev) openEvent(ev); }
    if (e.target.closest('[data-add-event]')) openEvent(null, selDay);
  });

  // ==================== نافذة الموعد ====================
  const evDlg = $('#eventDlg'), evForm = $('#eventForm');
  let editing = null, pickedCat = 'personal';
  function renderCatPick() {
    $('#catPick').innerHTML = Object.keys(CATS).map(k => '<button type="button" data-cat="' + k + '" class="' + (k === pickedCat ? 'on' : '') + '" style="--c:' + cvar(k) + '">' + catIcon(k) + CATS[k] + '</button>').join('');
  }
  $('#catPick').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { pickedCat = b.dataset.cat; renderCatPick(); } });
  function toggleTimes() { $$('.times input', evForm).forEach(i => i.disabled = evForm.allDay.checked); $('.times').style.opacity = evForm.allDay.checked ? .4 : 1; }
  evForm.allDay.addEventListener('change', toggleTimes);
  function openEvent(ev, day) {
    editing = ev || null;
    $('#eventDlgTitle').textContent = ev ? 'تعديل الموعد' : 'موعد جديد';
    $('#eventDelete').style.display = ev ? '' : 'none';
    $('#eventIcs').style.display = ev ? '' : 'none';
    const s = ev ? evStart(ev) : (() => { const d = new Date(day || new Date()); d.setHours(new Date().getHours() + 1, 0, 0, 0); return d; })();
    const en = ev ? evEnd(ev) : new Date(s.getTime() + 3600000);
    evForm.title.value = ev ? ev.title : '';
    evForm.date.value = ymd(s);
    evForm.start.value = pad(s.getHours()) + ':' + pad(s.getMinutes());
    evForm.end.value = pad(en.getHours()) + ':' + pad(en.getMinutes());
    evForm.allDay.checked = ev ? !!ev.allDay : false;
    evForm.remind.value = String(ev ? (ev.remind || 0) : 30);
    if (!evForm.remind.value) evForm.remind.value = '30';
    evForm.notes.value = ev ? (ev.notes || '') : '';
    pickedCat = ev ? catOk(ev.cat) : 'personal';
    renderCatPick(); toggleTimes();
    evDlg.showModal();
    if (!ev) setTimeout(() => evForm.title.focus(), 50);
  }
  evForm.addEventListener('submit', e => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    const f = evForm, day = fromYmd(f.date.value);
    let s = new Date(day), en = null;
    if (!f.allDay.checked) {
      const [sh, sm] = (f.start.value || '09:00').split(':').map(Number);
      s.setHours(sh, sm, 0, 0);
      const [eh, em] = (f.end.value || '').split(':').map(Number);
      en = new Date(day); en.setHours(isNaN(eh) ? sh + 1 : eh, isNaN(em) ? sm : em, 0, 0);
      if (en <= s) en = new Date(s.getTime() + 3600000);
    }
    const obj = { title: f.title.value.trim() || 'موعد', cat: pickedCat, start: s.toISOString(), end: en ? en.toISOString() : null, allDay: f.allDay.checked, remind: +f.remind.value, notes: f.notes.value.trim() };
    if (editing) Object.assign(editing, obj); else D().events.push(Object.assign({ id: S.uid() }, obj));
    selDay = sod(s); calMonth = new Date(s.getFullYear(), s.getMonth(), 1);
    S.save(); toast(editing ? 'تم التعديل' : 'انضاف الموعد');
  });
  $('#eventDelete').onclick = () => {
    if (!editing) return;
    const snap = snapshot(); D().events = D().events.filter(x => x !== editing); S.save(); evDlg.close(); toast('انحذف الموعد', () => restore(snap));
  };
  $('#eventIcs').onclick = () => { if (editing) downloadIcs([editing], 'موعد'); };

  // ==================== ملف للآيفون (.ics) ====================
  const icsDate = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const icsEsc = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  function downloadIcs(evs, name) {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Madar//AR', 'CALSCALE:GREGORIAN'];
    for (const e of evs) {
      const s = evStart(e);
      L.push('BEGIN:VEVENT', 'UID:' + e.id + '@madar', 'DTSTAMP:' + icsDate(new Date()), 'SUMMARY:' + icsEsc(e.title));
      if (e.allDay) L.push('DTSTART;VALUE=DATE:' + ymd(s).replace(/-/g, ''), 'DTEND;VALUE=DATE:' + ymd(addDays(s, 1)).replace(/-/g, ''));
      else L.push('DTSTART:' + icsDate(s), 'DTEND:' + icsDate(evEnd(e)));
      if (e.notes) L.push('DESCRIPTION:' + icsEsc(e.notes));
      if (e.remind) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:-PT' + e.remind + 'M', 'END:VALARM');
      L.push('END:VEVENT');
    }
    L.push('END:VCALENDAR');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
    a.download = name + '.ics'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('افتح الملف ويضيفه تقويم الآيفون مع التنبيه');
  }

  // ==================== المحاضرات ====================
  let subjFilter = '*';
  const subjOf = id => D().subjects.find(s => s.id === id) || { id: '', name: 'Other', ar: 'أخرى', c: '#a3a8b1' };
  const modules = () => [...new Set(D().lectures.map(l => l.module || 'بدون موديول'))];
  const curModule = () => D().module && modules().includes(D().module) ? D().module : (modules()[0] || '');
  const modLectures = () => D().lectures.filter(l => (l.module || 'بدون موديول') === curModule());
  const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;

  function renderLectures() {
    const mods = modules(), cm = curModule();
    $('#modSelect').innerHTML = mods.map(m => '<option' + (m === cm ? ' selected' : '') + '>' + esc(m) + '</option>').join('');
    $('#modSelect').style.display = mods.length > 1 ? '' : 'none';
    $('#modTitle').textContent = cm || 'المحاضرات';
    const all = modLectures(), n = all.length;
    const st = all.filter(l => l.study).length, rv = all.filter(l => l.rev).length, mq = all.filter(l => l.mcq).length;
    $('#modSub').textContent = n ? n + ' محاضرة · باقي ' + (n - st) + ' ما ذاكرتها' : 'أضف محاضراتك';
    $('#prog3').innerHTML = [['مذاكرة', st, 'var(--ok)'], ['مراجعة', rv, 'var(--warn)'], ['أسئلة MCQ', mq, 'var(--accent)']].map(([t, v, c]) =>
      '<div><div class="t"><span>' + t + '</span><b>' + v + '/' + n + '</b></div><div class="bar"><i style="width:' + pct(v, n) + '%;--c:' + c + '"></i></div></div>').join('');

    const used = D().subjects.filter(s => all.some(l => l.subject === s.id));
    if (subjFilter !== '*' && !used.some(s => s.id === subjFilter)) subjFilter = '*';
    $('#subjChips').innerHTML = '<button data-sf="*" class="' + (subjFilter === '*' ? 'on' : '') + '">الكل <small>' + st + '/' + n + '</small></button>' +
      used.map(s => { const ls = all.filter(l => l.subject === s.id); return '<button data-sf="' + s.id + '" class="' + (subjFilter === s.id ? 'on' : '') + '" style="--c:' + s.c + '">' + subjIcon(s.id) + esc(s.name) + ' <small>' + ls.filter(l => l.study).length + '/' + ls.length + '</small></button>'; }).join('');

    const onlyLeft = $('#onlyLeft').checked;
    const wk = l => parseInt((l.week || 'W99').replace(/\D/g, '')) || 99;
    let html = '';
    const groups = (subjFilter === '*' ? D().subjects : D().subjects.filter(s => s.id === subjFilter)).concat([{ id: '', name: 'Other', c: '#a3a8b1' }]);
    for (const s of groups) {
      let ls = all.filter(l => (l.subject || '') === s.id || (s.id === '' && !D().subjects.some(x => x.id === l.subject) && l.subject));
      if (s.id === '') ls = all.filter(l => !D().subjects.some(x => x.id === l.subject));
      if (!ls.length) continue;
      const total = ls.length, done = ls.filter(l => l.study).length;
      if (onlyLeft) ls = ls.filter(l => !(l.study && l.rev && l.mcq));
      if (!ls.length) continue;
      ls.sort((a, b) => wk(a) - wk(b));
      html += '<div class="lgroup" style="--c:' + s.c + '"><div class="lghead">' + subjIcon(s.id) + '<b>' + esc(s.name) + '</b><span class="bar"><i style="width:' + pct(done, total) + '%"></i></span><small>' + done + '/' + total + '</small></div>' +
        '<div class="lcols"><span>أسبوع</span><span>المحاضرة</span><span>مذاكرة</span><span>مراجعة</span><span>MCQ</span><span></span></div>' +
        ls.map(l => '<div class="lrow' + (l.study && l.rev && l.mcq ? ' full' : '') + '" data-lec="' + l.id + '">' +
          '<span class="wk">' + esc(l.week || '—') + '</span>' +
          '<button class="tt" data-edit title="' + esc(l.title) + '">' + esc(l.title) + '</button>' +
          ['study', 'rev', 'mcq'].map(k => '<button class="ck' + (l[k] ? ' on' : '') + '" data-k="' + k + '" aria-label="' + k + '">' + icon('i-tick') + '</button>').join('') +
          '<button class="nt' + (l.notes || l.link || l.fileId ? ' has' : '') + '" data-edit aria-label="ملاحظات">' + icon(l.fileId ? 'i-file' : l.link ? 'i-link' : 'i-note') + '</button>' +
          '</div>').join('') + '</div>';
    }
    $('#lecTable').innerHTML = html || '<div class="empty">' + icon('i-book') + (onlyLeft ? 'خلصت كل شي هنا، عاش!' : 'ما فيه محاضرات. اضغط «محاضرة» أو قول للمساعد: «اضف محاضرة Physiology of pain لمادة الفسيو»') + '</div>';
  }
  $('#modSelect').addEventListener('change', e => { D().module = e.target.value; subjFilter = '*'; S.save(); });
  $('#subjChips').addEventListener('click', e => { const b = e.target.closest('[data-sf]'); if (b) { subjFilter = b.dataset.sf; renderLectures(); } });
  $('#onlyLeft').addEventListener('change', renderLectures);
  $('#lecTable').addEventListener('click', e => {
    const row = e.target.closest('[data-lec]'); if (!row) return;
    const l = D().lectures.find(x => x.id === row.dataset.lec); if (!l) return;
    const ck = e.target.closest('[data-k]');
    if (ck) {
      const k = ck.dataset.k; l[k] = !l[k]; S.save();
      if (l[k]) toast({ study: 'ذاكرت ', rev: 'راجعت ', mcq: 'حليت أسئلة ' }[k] + l.title);
      return;
    }
    if (e.target.closest('[data-edit]')) openLecture(l);
  });

  // ---------- نافذة المحاضرة ----------
  const lecDlg = $('#lecDlg'), lecForm = $('#lecForm');
  let editingLec = null;
  function openLecture(l) {
    editingLec = l || null;
    $('#lecDlgTitle').textContent = l ? 'تعديل المحاضرة' : 'محاضرة جديدة';
    $('#lecDelete').style.display = l ? '' : 'none';
    $('#lecSubject').innerHTML = D().subjects.map(s => '<option value="' + s.id + '">' + esc(s.name) + ' — ' + esc(s.ar) + '</option>').join('');
    $('#modList').innerHTML = modules().map(m => '<option value="' + esc(m) + '">').join('');
    lecForm.reset();
    const f = lecForm;
    f.title.value = l ? l.title : '';
    f.subject.value = l ? l.subject : (subjFilter !== '*' ? subjFilter : D().subjects[0].id);
    f.week.value = l ? (l.week || '') : '';
    f.module.value = l ? (l.module || '') : curModule();
    f.study.checked = !!(l && l.study); f.rev.checked = !!(l && l.rev); f.mcq.checked = !!(l && l.mcq);
    f.notes.value = l ? (l.notes || '') : '';
    f.link.value = l ? (l.link || '') : '';
    $('#lecFileName').innerHTML = l && l.fileId ? '<a href="#" id="openFile">فتح الملف الحالي: ' + esc(l.fileName || '') + '</a>' : '';
    const of = $('#openFile'); if (of) of.onclick = ev => { ev.preventDefault(); openFile(l); };
    lecDlg.showModal();
  }
  async function openFile(l) {
    const w = window.open('', '_blank');
    try {
      const blob = await S.getFile(l.fileId);
      if (!blob) { if (w) w.close(); toast('الملف مو موجود في هذا الجهاز'); return; }
      const url = URL.createObjectURL(blob);
      if (w) w.location.href = url; else location.href = url;
    } catch (err) { if (w) w.close(); toast('ما قدرت أفتح الملف'); }
  }
  $('#btnAddLecture').onclick = () => openLecture(null);
  lecForm.addEventListener('submit', async e => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    const f = lecForm;
    const obj = { title: f.title.value.trim(), subject: f.subject.value, week: f.week.value, module: f.module.value.trim() || curModule() || 'بدون موديول',
      study: f.study.checked, rev: f.rev.checked, mcq: f.mcq.checked, notes: f.notes.value.trim(), link: f.link.value.trim() };
    let l = editingLec;
    if (l) Object.assign(l, obj); else { l = Object.assign({ id: S.uid() }, obj); D().lectures.push(l); }
    const file = f.file.files[0];
    if (file) {
      try { if (l.fileId) await S.delFile(l.fileId); l.fileId = S.uid(); l.fileName = file.name; l.fileType = file.type || ''; await S.putFile(l.fileId, file); }
      catch (err) { toast('ما قدرت أحفظ الملف'); }
    }
    D().module = l.module;
    S.save(); toast(editingLec ? 'تم التعديل' : 'انضافت المحاضرة');
  });
  $('#lecDelete').onclick = () => {
    if (!editingLec) return;
    const snap = snapshot(), l = editingLec;
    D().lectures = D().lectures.filter(x => x !== l); S.save(); lecDlg.close();
    toast('انحذفت المحاضرة', () => restore(snap));
  };

  // ==================== المهام ====================
  function taskLi(t) {
    return '<li data-task="' + t.id + '"><button class="tick' + (t.done ? ' on' : '') + '" aria-label="تم">' + icon('i-tick') + '</button>' +
      '<span>' + esc(t.title) + (t.date ? ' <small>· ' + dayLabel(fromYmd(t.date)) + '</small>' : '') + '</span>' +
      '<button class="del" aria-label="حذف">' + icon('i-trash') + '</button></li>';
  }
  function renderTasks() {
    const open = D().tasks.filter(t => !t.done), done = D().tasks.filter(t => t.done).slice(-30).reverse();
    $('#taskCount').textContent = open.length ? open.length + ' مفتوحة' : 'كل شي خالص';
    $('#tasksOpen').innerHTML = open.map(taskLi).join('') || '<li class="empty" style="background:none">ولا مهمة، مرتاح</li>';
    $('#tasksDone').innerHTML = done.map(taskLi).join('');
    $('#doneWrap').style.display = done.length ? '' : 'none';
    $('#doneSum').textContent = 'خلصت (' + done.length + ')';
  }
  document.addEventListener('click', e => {
    const li = e.target.closest('[data-task]'); if (!li) return;
    const t = D().tasks.find(x => x.id === li.dataset.task); if (!t) return;
    if (e.target.closest('.tick')) { t.done = !t.done; t.doneAt = t.done ? new Date().toISOString() : null; S.save(); }
    else if (e.target.closest('.del')) { const snap = snapshot(); D().tasks = D().tasks.filter(x => x !== t); S.save(); toast('انحذفت المهمة', () => restore(snap)); }
  });
  $('#taskForm').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, v = f.t.value.trim(); if (!v) return;
    D().tasks.push({ id: S.uid(), title: v, done: false, date: null, created: new Date().toISOString() }); S.save(); f.reset();
  });

  // ==================== المساعد ====================
  const chat = $('#chat');
  function say(html, who) {
    const m = document.createElement('div');
    m.className = 'msg ' + (who || 'bot'); m.innerHTML = html;
    chat.appendChild(m); chat.scrollTop = chat.scrollHeight;
    while (chat.children.length > 40) chat.firstChild.remove();
    return m;
  }
  function evBlock(e) {
    const s = evStart(e);
    return '<div class="ev" style="--c:' + cvar(e.cat) + '"><span class="ci">' + catIcon(e.cat) + '</span><div><b>' + esc(e.title) + '</b><small>' + dayLabel(s) + (e.allDay ? ' · طول اليوم' : ' · ' + fmtT(s) + ' – ' + fmtT(evEnd(e))) + (e.remind ? ' · تنبيه قبل ' + remindTxt(e.remind) : '') + '</small></div></div>';
  }
  const undoBtn = '<button data-undo>' + icon('i-undo') + 'تراجع</button>';
  const norm = s => P.clean(s).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const STOP = new Set(['محاضره', 'موعد', 'مع', 'في', 'من', 'على', 'عن', 'الى', 'اللي', 'حق', 'ماده', 'لماده', 'الساعه', 'مذاكره', 'مراجعه', 'اسئله', 'mcq', 'of', 'the', 'and', 'in']);
  const tokens = s => norm(s).split(/[\s,()\-:]+/).filter(t => t.length > 1 && !STOP.has(t));
  function bestMatch(list, text, getTitle) {
    const q = tokens(text); if (!q.length) return null;
    let best = null, bs = 0;
    for (const x of list) {
      const tt = tokens(getTitle(x)); let sc = 0;
      for (const a of q) for (const b of tt) if (a === b || (a.length > 3 && (b.startsWith(a) || a.startsWith(b)))) { sc++; break; }
      if (sc > bs) { bs = sc; best = x; }
    }
    return best;
  }

  function handle(text) {
    text = text.trim(); if (!text) return;
    say(esc(text), 'me');
    const ct = P.clean(text);
    if (/^(?:هلا|مرحبا|السلام عليكم|سلام|هاي|اهلين)/.test(ct)) { say('هلا والله. قول لي وش عندك وأنا أرتبه.'); return; }
    if (/^(?:شكرا|يعطيك العافيه|مشكور|تسلم)/.test(ct)) { say('العفو، بالتوفيق.'); return; }
    const r = P.parse(text), snap = snapshot();
    const withUndo = (html, extra) => { const m = say(html + '<div class="acts">' + (extra || '') + undoBtn + '</div>'); m.querySelector('[data-undo]').onclick = () => { restore(snap); say('رجعتها زي ما كانت.'); }; return m; };

    if (r.intent === 'query') {
      const day = r.hasDate ? r.start : new Date(), evs = eventsOn(day), x = P.describe(day);
      const when = Math.abs(x.diff) <= 2 ? x.day : 'يوم ' + x.dayName + ' ' + x.date;
      say(evs.length ? 'عندك ' + evs.length + ' ' + when + ':' + evs.map(evBlock).join('') : 'ما عندك شي ' + when + '.');
      selDay = sod(day); calMonth = new Date(day.getFullYear(), day.getMonth(), 1); renderCalendar(); renderDay();
      return;
    }
    if (r.intent === 'delete') {
      let pool = D().events; if (r.hasDate) pool = pool.filter(e => sameDay(evStart(e), r.start));
      const ev = bestMatch(pool, text.replace(/(?:احذف|امسح|الغ|الغي|ألغ|كنسل|شيل)/g, ''), e => e.title) || (r.hasDate && pool.length === 1 ? pool[0] : null);
      if (!ev) { say('ما لقيت موعد بهذا الاسم. جرب تقول اسمه زي ما هو مكتوب.'); return; }
      D().events = D().events.filter(e => e !== ev); S.save();
      withUndo('حذفته' + evBlock(ev));
      return;
    }
    if (r.intent === 'done') {
      const k = /راجعت|مراجع/.test(ct) ? 'rev' : /حليت|اسئل|mcq|كويز/i.test(ct) ? 'mcq' : 'study';
      const q = text.replace(/(?:خلصت|انهيت|أنهيت|ذاكرت|راجعت|حليت|مذاكرة|مراجعة|اسئلة|أسئلة)/g, '');
      const lec = bestMatch(D().lectures, q, l => l.title + ' ' + subjOf(l.subject).name + ' ' + subjOf(l.subject).ar);
      if (lec) {
        lec[k] = true; S.save();
        withUndo({ study: 'حطيت ✓ مذاكرة على', rev: 'حطيت ✓ مراجعة على', mcq: 'حطيت ✓ أسئلة على' }[k] + ' «' + esc(lec.title) + '»');
        return;
      }
      const t = bestMatch(D().tasks.filter(x => !x.done), q, x => x.title);
      if (t) { t.done = true; t.doneAt = new Date().toISOString(); S.save(); withUndo('خلصت «' + esc(t.title) + '»'); return; }
      say('ما لقيت محاضرة أو مهمة بهذا الاسم. اكتب جزء من اسمها بالإنجليزي، مثلاً «خلصت مذاكرة Coordination».');
      return;
    }
    if (r.intent === 'lecture') {
      let title = ct.replace(/^(?:اضف|أضف|ضيف|سجل|حط)\s+(?:محاضر[هة]|درس|lecture)\s*/i, '')
        .replace(/\s*(?:ل|في|حق|ب)?\s*ماد[هة]\s+\S+/g, '')
        .replace(/\s*(?:ل|حق|في)\s*(?:ال)?(?:فسيو|اناتومي|باثو|بايو|هستو|هيستو|امبريو|امينو|مايكرو|فارما|راديو)\S*/g, '').trim() || 'محاضرة جديدة';
      const l = { id: S.uid(), title, subject: r.subject || D().subjects[0].id, week: '', module: curModule() || 'بدون موديول', study: false, rev: false, mcq: false, notes: '' };
      D().lectures.push(l); S.save();
      const m = withUndo('سجلت المحاضرة «' + esc(l.title) + '» في ' + esc(subjOf(l.subject).name), '<button data-edit>' + icon('i-edit') + 'تعديل</button>');
      m.querySelector('[data-edit]').onclick = () => openLecture(l);
      return;
    }
    if (r.intent === 'task' || (!r.hasDate && !r.hasTime)) {
      const title = r.intent === 'task' ? ct.replace(/^(?:مهم[هة]|تاسك|task)\s*:?\s*/i, '') : r.title;
      D().tasks.push({ id: S.uid(), title: title || text, done: false, date: null, created: new Date().toISOString() }); S.save();
      withUndo('حطيتها في المهام: <b>' + esc(title || text) + '</b><br><small class="muted">لو تبيها في وقت معين قول مثلاً «… بكرة الساعة ٥»</small>');
      return;
    }
    const ev = { id: S.uid(), title: r.title, cat: r.category, start: r.start.toISOString(), end: r.end ? r.end.toISOString() : null, allDay: r.allDay, remind: r.remindMin, notes: '' };
    const clash = !ev.allDay && D().events.find(e => !e.allDay && evStart(e) < new Date(ev.end) && evEnd(e) > new Date(ev.start));
    D().events.push(ev);
    selDay = sod(r.start); calMonth = new Date(r.start.getFullYear(), r.start.getMonth(), 1);
    S.save();
    const past = !ev.allDay && new Date(ev.start) < new Date();
    const m = withUndo('حطيته في التقويم' + evBlock(ev) +
      (r.vague ? '<small class="muted">الوقت تقريبي، عدّله لو تبي.</small><br>' : '') +
      (clash ? '<small style="color:var(--warn)">يتعارض مع «' + esc(clash.title) + '»</small><br>' : '') +
      (past ? '<small style="color:var(--bad)">الوقت هذا فات، متأكد؟</small><br>' : ''),
      '<button data-edit>' + icon('i-edit') + 'تعديل</button><button data-ics>' + icon('i-bell') + 'للآيفون</button>');
    m.querySelector('[data-edit]').onclick = () => { const x = D().events.find(e => e.id === ev.id); if (x) openEvent(x); };
    m.querySelector('[data-ics]').onclick = () => { const x = D().events.find(e => e.id === ev.id); if (x) downloadIcs([x], x.title); };
  }
  $('#composer').addEventListener('submit', e => { e.preventDefault(); const v = $('#cmd').value; $('#cmd').value = ''; handle(v); });
  $('#chips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) handle(b.textContent); });

  // ---------- الصوت ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, heard = '';
  function stopListen() { listening = false; $('#mic').classList.remove('listening'); $('#fab').classList.remove('listening'); }
  function listen() {
    if (listening && rec) { rec.stop(); return; }
    if (!SR) { say('المتصفح هذا ما يدعم المايك المباشر. اضغط مايك كيبورد الجوال وتكلم، يكتب كلامك هنا وأنا أفهمه.'); $('#cmd').focus(); return; }
    rec = new SR(); rec.lang = 'ar-SA'; rec.interimResults = true; rec.continuous = false; heard = '';
    rec.onstart = () => { listening = true; $('#mic').classList.add('listening'); $('#fab').classList.add('listening'); $('#cmd').placeholder = 'أسمعك…'; };
    rec.onresult = ev => { let t = ''; for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript; heard = t; $('#cmd').value = t; };
    rec.onerror = ev => {
      stopListen();
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') say('محتاج إذن المايك. اسمح له من إعدادات المتصفح، أو استخدم مايك الكيبورد.');
      else if (ev.error === 'network') say('التعرف على الصوت يحتاج نت. اكتب أو استخدم مايك الكيبورد.');
      else if (ev.error !== 'no-speech' && ev.error !== 'aborted') say('ما سمعت زين، جرب مرة ثانية.');
    };
    rec.onend = () => { stopListen(); $('#cmd').placeholder = 'مثلاً: اجتماع الأحد الساعة ٩ الليل'; if (heard.trim()) { $('#cmd').value = ''; handle(heard); } };
    try { rec.start(); } catch (e) { stopListen(); }
  }
  $('#mic').onclick = listen;
  $('#fab').onclick = () => { $('#agentCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); listen(); };

  // ==================== التذكيرات ====================
  function checkReminders() {
    const now = Date.now(), n = D().notified;
    for (const e of D().events) {
      if (!e.remind || e.allDay) continue;
      const s = new Date(e.start).getTime(), key = e.id + '@' + e.start;
      if (now >= s - e.remind * 60000 && now < s + 5 * 60000 && !n[key]) {
        n[key] = 1;
        const body = fmtT(new Date(s)) + ' · ' + CATS[catOk(e.cat)];
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r => r.showNotification(e.title, { body, icon: 'assets/img/icon-192.png', tag: key }));
            else new Notification(e.title, { body, icon: 'assets/img/icon-192.png' });
          } catch (err) { }
        }
        toast('تذكير: ' + e.title + ' — ' + body);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        S.save();
      }
    }
  }

  // ==================== الإعدادات ====================
  $('#btnSettings').onclick = () => { $('#nameInput').value = D().name || ''; $('#settingsDlg').showModal(); };
  $('#nameInput').addEventListener('change', e => { D().name = e.target.value.trim() || 'أصيل'; S.save(); });
  $('#btnNotif').onclick = async () => {
    if (!('Notification' in window)) { toast('التنبيهات تحتاج تثبيت التطبيق على الشاشة الرئيسية'); return; }
    const p = await Notification.requestPermission();
    toast(p === 'granted' ? 'تفعلت التنبيهات' : 'ما تفعلت، تقدر تفعلها من إعدادات المتصفح');
  };
  $('#btnExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(D(), null, 1)], { type: 'application/json' }));
    a.download = 'madar-backup-' + ymd(new Date()) + '.json'; a.click();
    toast('نزلت النسخة الاحتياطية (الملفات المرفوعة ما تدخل فيها)');
  };
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()); if (!j.events) throw 0;
      if (!confirm('أكيد؟ بيستبدل كل بياناتك الحالية بالنسخة هذي.')) return;
      S.replace(j); toast('رجعت بياناتك');
    } catch (err) { toast('الملف هذا مو نسخة صحيحة'); }
    e.target.value = '';
  });
  $('#btnIcsAll').onclick = () => {
    const evs = D().events.filter(e => evEnd(e) > new Date());
    if (!evs.length) { toast('ما عندك مواعيد جاية'); return; }
    downloadIcs(evs, 'مواعيدي');
  };

  // ==================== الرسم ====================
  function render() { renderHeader(); renderNext(); renderHadith(); renderCalendar(); renderDay(); renderLectures(); renderTasks(); }
  S.onChange(render);
  say('هلا ' + esc(D().name || 'أصيل') + '. قول لي مواعيدك أو أي شي في بالك وأنا أرتبه.<br><small class="muted">أفهم: «الخميس الجاي الساعة ٤ العصر»، «بعد ساعتين»، «وش عندي بكرة؟»، «خلصت مذاكرة Coordination»، «راجعت Cerebellum»</small>');
  render();
  setInterval(renderHeader, 10000);
  setInterval(() => { checkReminders(); renderNext(); renderDay(); }, 30000);
  checkReminders();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
