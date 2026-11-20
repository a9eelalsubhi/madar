/* ============ التخزين: كل شي في جهازك ============
   البيانات (مواعيد، مهام، محاضرات) → localStorage
   ملفات المحاضرات (PDF، فيديو…) → IndexedDB                  */
(function (root) {
  'use strict';
  const KEY = 'madar.aseel.v1';

  // ألوان المواد باهتة وقريبة من ألوان جدولك
  const DEFAULT_SUBJECTS = [
    { id: 'anatomy', name: 'Anatomy', ar: 'تشريح', c: '#d4ab7e' },
    { id: 'embryo', name: 'Embryology', ar: 'أجنة', c: '#d29d9d' },
    { id: 'histo', name: 'Histology', ar: 'أنسجة', c: '#cf8f8f' },
    { id: 'biochem', name: 'Biochemistry', ar: 'كيمياء حيوية', c: '#d39c74' },
    { id: 'physio', name: 'Physiology', ar: 'فسيولوجي', c: '#8fbfa3' },
    { id: 'patho', name: 'Pathology', ar: 'باثولوجي', c: '#8299b8' },
    { id: 'pharma', name: 'Pharmacology', ar: 'أدوية', c: '#93b3d6' },
    { id: 'radio', name: 'Radiology', ar: 'أشعة', c: '#86b39e' },
    { id: 'micro', name: 'Microbiology', ar: 'مايكرو', c: '#a7b98a' },
    { id: 'immuno', name: 'Immunology', ar: 'مناعة', c: '#ab9dc9' }
  ];

  // موديول المخ والأعصاب — من جدولك، والمحاضرات اللي عليها أحمر = خلصت مذاكرتها
  const NBS = 'Neurological and Behavioural Sciences';
  const NBS_LIST = [
    ['anatomy', 'W1', 'Functional areas of cerebral cortex', 1],
    ['anatomy', 'W2', 'Brain stem: Anatomy, structural and functional', 1],
    ['anatomy', 'W2', 'Cranial nerves', 1],
    ['anatomy', 'W3', 'Cerebellum', 1],
    ['anatomy', 'W3', 'Basal ganglia', 1],
    ['anatomy', 'W3', 'The Visual Pathway', 1],
    ['anatomy', 'W3', 'Eye anatomy', 0],
    ['anatomy', 'W3', 'Ear and central auditory system', 1],
    ['anatomy', 'W5', 'Ascending tracts', 0],
    ['anatomy', 'W6', 'Descending tracts', 0],
    ['anatomy', 'W6', 'Clinical Anatomy of the CNS', 0],
    ['anatomy', 'W6', 'Vasculature of the CNS', 0],
    ['embryo', 'W1', 'Brain and spinal cord embryology', 1],
    ['embryo', 'W2', 'Head and neck embryology', 1],
    ['histo', 'W1', 'Histology of the nervous system', 1],
    ['biochem', 'W1', 'Metabolic integration of CNS', 1],
    ['biochem', 'W4', 'Biochemical aspects of CSF', 0],
    ['physio', 'W1', 'Neurons and their action', 1],
    ['physio', 'W1', 'Neuronal communications', 1],
    ['physio', 'W2', 'Physiology of Vision', 1],
    ['physio', 'W2', 'Physiology of Hearing', 1],
    ['physio', 'W2', 'Glia and their functions', 1],
    ['physio', 'W3', 'Regulation of body functions', 1],
    ['physio', 'W3', 'The Cerebellum and Motor Coordination', 0],
    ['physio', 'W3', 'Movement Control: The Basal Ganglia', 0],
    ['physio', 'W4', 'CSF and Blood brain barrier', 0],
    ['physio', 'W4', 'States of consciousness, sleep and coma', 0],
    ['physio', 'W5', 'Physiology of pain', 0],
    ['physio', 'W5', 'Emotion, reward, learning, memory', 0],
    ['physio', 'W6', 'Autonomic nervous', 0],
    ['physio', 'W6', 'Physiology of reflex', 0],
    ['patho', 'W1', 'Patterns of injury in nervous system', 1],
    ['patho', 'W2', 'Epilepsy (CBL)', 1],
    ['patho', 'W3', 'Diseases of myelin', 1],
    ['patho', 'W3', 'Demyelination Disorder (CBL)', 1],
    ['patho', 'W4', 'Infections of the nervous system', 0],
    ['patho', 'W4', 'Meningitis', 0],
    ['patho', 'W5', 'Neurodegenerative diseases', 0],
    ['patho', 'W6', 'Cerebrovascular diseases', 0],
    ['patho', 'W6', 'Stroke (vascular and trauma pathology) (CBL)', 0],
    ['pharma', 'W2', 'Drugs used in epilepsy', 1],
    ['pharma', 'W4', 'Antidepressants', 1],
    ['pharma', 'W4', 'Sedative-hypnotic Drugs', 1],
    ['pharma', 'W5', 'Drugs used in movement disorders', 1],
    ['pharma', 'W5', 'Opioids analgesics', 0],
    ['pharma', 'W6', 'Antipsychotic Drugs', 0],
    ['radio', 'W3', 'Radiological Anatomy of Head and Neck Disease', 1],
    ['radio', 'W6', 'Imaging of the Nervous System', 0]
  ];

  // العادات اليومية
  const DEFAULT_HABITS = [
    { id: 'azkar-am', name: 'أذكار الصباح', icon: 'h-sun', type: 'check' },
    { id: 'azkar-pm', name: 'أذكار المساء', icon: 'c-deen', type: 'check' },
    { id: 'quran', name: 'قراءة القرآن', icon: 'h-quran', type: 'check' },
    { id: 'sport', name: 'الرياضة', icon: 'c-sport', type: 'check' },
    { id: 'water', name: 'شرب الماء', icon: 'h-drop', type: 'count', target: 8 }
  ];

  // المحاضرات اللي انحذفت (أصيل طلب شيلها) ما ترجع حتى لو جهاز قديم دمج بياناته
  const lecKey = l => (l.module || '') + '|' + String(l.title || '').toLowerCase().trim();
  const REMOVED_SEED = ['functional areas of cerebral cortex', 'brain stem: anatomy, structural and functional', 'cerebellum', 'basal ganglia', 'head and neck embryology', 'neurons and their action', 'neuronal communications', 'physiology of hearing', 'regulation of body functions', 'patterns of injury in nervous system', 'epilepsy (cbl)'].map(t => NBS + '|' + t);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const empty = () => ({ v: 2, name: 'أصيل', events: [], tasks: [], lectures: [], subjects: DEFAULT_SUBJECTS.slice(), notified: {} });

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || empty(); } catch (e) { data = empty(); }
  ['events', 'tasks', 'lectures'].forEach(k => { if (!Array.isArray(data[k])) data[k] = []; });
  data.notified = data.notified || {};

  function migrate() {
    // v1 → v2: مواد جديدة، وحالة المحاضرة صارت ٣ خانات مثل جدولك
    if ((data.v || 1) < 2) {
      data.subjects = DEFAULT_SUBJECTS.slice();
      data.lectures.forEach(l => {
        if (l.study == null) { l.study = l.status === 'done'; l.rev = false; l.mcq = false; }
        delete l.status; delete l.star;
      });
      data.v = 2;
    }
    if (!data.subjects || !data.subjects.length) data.subjects = DEFAULT_SUBJECTS.slice();
    if (!Array.isArray(data.habits) || !data.habits.length) data.habits = DEFAULT_HABITS.map(h => Object.assign({}, h));
    if (!data.habitLog || typeof data.habitLog !== 'object') data.habitLog = {};
    if (!Array.isArray(data.notes)) data.notes = [];
    if (!Array.isArray(data.removedLectures)) data.removedLectures = [];
    if (!data.removedSeed1) { REMOVED_SEED.forEach(k => { if (!data.removedLectures.includes(k)) data.removedLectures.push(k); }); data.removedSeed1 = true; }
    if (!data.seedNBS) {
      NBS_LIST.forEach(([s, w, t, done]) => data.lectures.push({ id: uid(), module: NBS, subject: s, week: w, title: t, study: !!done, rev: false, mcq: false, notes: '' }));
      data.seedNBS = true;
      data.module = NBS;
    }
    const gone = new Set(data.removedLectures);
    data.lectures = data.lectures.filter(l => !gone.has(lecKey(l)));
  }
  migrate();

  const listeners = [];
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn('save failed', e); }
    listeners.forEach(fn => fn());
  }

  // ---------- ملفات المحاضرات ----------
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('madar-files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function putFile(id, blob) {
    const d = await db();
    return new Promise((res, rej) => { const t = d.transaction('files', 'readwrite'); t.objectStore('files').put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); });
  }
  async function getFile(id) {
    const d = await db();
    return new Promise((res, rej) => { const q = d.transaction('files').objectStore('files').get(id); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
  }
  async function delFile(id) {
    const d = await db();
    return new Promise(res => { const t = d.transaction('files', 'readwrite'); t.objectStore('files').delete(id); t.oncomplete = res; t.onerror = res; });
  }

  root.Store = {
    get data() { return data; },
    uid, save,
    onChange(fn) { listeners.push(fn); },
    replace(newData) { data = Object.assign(empty(), newData); migrate(); save(); },
    putFile, getFile, delFile, lecKey,
    forgetLecture(l) { const k = lecKey(l); if (!data.removedLectures.includes(k)) data.removedLectures.push(k); },
    DEFAULT_SUBJECTS, NBS
  };
})(window);
