(() => {
  'use strict';

  const API = 'https://bible.helloao.org';
  const BACKEND = 'port/8000'.startsWith('__') ? 'http://127.0.0.1:8000' : 'port/8000';
  async function api(path, opts = {}) {
    const r = await fetch(BACKEND + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  const TRANSLATIONS = [
    { group: 'English', items: [
      ['BSB', 'Berean Standard (BSB) · Audio'],
      ['eng_kjv', 'King James Version'],
      ['ENGWEBP', 'World English Bible'],
      ['eng_asv', 'American Standard (1901)'],
      ['eng_net', 'NET Bible'],
      ['eng_bbe', 'Bible in Basic English'],
      ['eng_ylt', "Young's Literal"],
      ['eng_dby', 'Darby Translation'],
    ]},
    { group: 'Ghana & Africa', items: [
      ['twi_asa', 'Asante Twi'],
      ['twi_aka', 'Akuapem Twi'],
      ['ewe_bib', 'Eʋegbe (Ewe)'],
      ['hau_bib', 'Hausa'],
      ['yor_bib', 'Yorùbá'],
      ['swh_onmm', 'Kiswahili'],
    ]},
    { group: 'Other languages', items: [
      ['fra_lsg', 'Français — Louis Segond'],
      ['spa_r09', 'Español — Reina Valera 1909'],
      ['por_blj', 'Português — Bíblia Livre'],
      ['deu_l12', 'Deutsch — Luther 1912'],
    ]},
  ];

  const LANG_BCP = { eng: 'en-US', twi: 'ak', ewe: 'ee', hau: 'ha', yor: 'yo', swh: 'sw', fra: 'fr-FR', spa: 'es-ES', por: 'pt-BR', deu: 'de-DE' };
  const NARRATORS = { souer: 'Souer', hays: 'Hays', david: 'David', gilbert: 'Gilbert' };
  const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const NT_START = 40; // Matthew

  // ---------- State ----------
  const S = {
    tr: 'BSB',
    lang: 'eng',
    books: [],
    englishNames: {},     // USFM id -> English name
    bookId: 'JHN',
    chapter: 3,
    data: null,
    verses: [],           // [{ n, text, el }]
    narrator: 'souer',
    timings: null,        // array of verse start times
    mode: 'audio',        // 'audio' | 'tts'
    playing: false,
    loading: false,
    currentVerse: 0,
    ttsIndex: 0,
    speedIdx: 1,
    follow: true,
    autoNext: true,
    fontStep: 0,
    selectedVerse: null,
    loadToken: 0,
    pendingSeekVerse: null,
  };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    audio: $('audio'), scripture: $('scripture'), refLabel: $('refLabel'), refBtn: $('refBtn'),
    trSel: $('translationSel'), narSel: $('narratorSel'), playBtn: $('playBtn'),
    prevVerse: $('prevVerse'), nextVerse: $('nextVerse'), seek: $('seek'), tCur: $('tCur'), tDur: $('tDur'), tNow: $('tNow'),
    speedBtn: $('speedBtn'), prevChap: $('prevChap'), nextChap: $('nextChap'), prevLabel: $('prevLabel'), nextLabel: $('nextLabel'),
    chapterBook: $('chapterBook'), chapterNum: $('chapterNum'), bookTitle: $('bookTitle'), trNote: $('translationNote'),
    picker: $('picker'), pickerBody: $('pickerBody'), pickerTitle: $('pickerTitle'), pickerBack: $('pickerBack'),
    jumpForm: $('jumpForm'), jumpInput: $('jumpInput'), pop: $('versePop'), popPlay: $('popPlay'), popCopy: $('popCopy'),
    toast: $('toast'), themeBtn: $('themeBtn'), settingsBtn: $('settingsBtn'), settings: $('settingsPanel'),
    searchBtn: $('searchBtn'), bookmarksBtn: $('bookmarksBtn'), bmBadge: $('bmBadge'), themeLabel: $('themeLabel'),
    searchDlg: $('searchDlg'), searchForm: $('searchForm'), searchInput: $('searchInput'), searchBody: $('searchBody'),
    searchBooks: $('searchBooks'), searchTr: $('searchTr'), bookmarksDlg: $('bookmarksDlg'), bmBody: $('bmBody'),
    popBookmark: $('popBookmark'), popBookmarkLabel: $('popBookmarkLabel'),
    fontUp: $('fontUp'), fontDown: $('fontDown'), followToggle: $('followToggle'), autoNextToggle: $('autoNextToggle'), numsToggle: $('numsToggle'),
  };
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

  // ---------- Utils ----------
  const cache = new Map();
  async function getJSON(path) {
    const url = path.startsWith('http') ? path : API + path;
    if (cache.has(url)) return cache.get(url);
    const p = fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    cache.set(url, p);
    p.catch(() => cache.delete(url));
    return p;
  }
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
  }
  const bookById = (id) => S.books.find((b) => b.id === id);
  const bookName = (b) => (b && (b.commonName || b.name)) || '';
  const ref = () => `${bookName(bookById(S.bookId))} ${S.chapter}`;

  // ---------- Theme ----------
  const root = document.documentElement;
  root.dataset.theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const syncThemeLabel = () => { el.themeLabel.textContent = root.dataset.theme === 'dark' ? 'Light' : 'Dark'; };
  syncThemeLabel();
  el.themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    syncThemeLabel();
  });

  // ---------- Settings ----------
  el.settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = el.settings.hidden;
    el.settings.hidden = !open;
    el.settingsBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!el.settings.hidden && !el.settings.contains(e.target) && e.target !== el.settingsBtn) {
      el.settings.hidden = true; el.settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });
  function applyFont() {
    const size = 1.1875 + S.fontStep * 0.125;
    root.style.setProperty('--read-size', size + 'rem');
  }
  el.fontUp.addEventListener('click', () => { S.fontStep = Math.min(5, S.fontStep + 1); applyFont(); });
  el.fontDown.addEventListener('click', () => { S.fontStep = Math.max(-2, S.fontStep - 1); applyFont(); });
  el.followToggle.addEventListener('change', () => { S.follow = el.followToggle.checked; });
  el.autoNextToggle.addEventListener('change', () => { S.autoNext = el.autoNextToggle.checked; });
  el.numsToggle.addEventListener('change', () => { el.scripture.classList.toggle('hide-nums', !el.numsToggle.checked); });

  // ---------- Translations ----------
  function buildTranslationSelect() {
    el.trSel.innerHTML = '';
    for (const g of TRANSLATIONS) {
      const og = document.createElement('optgroup');
      og.label = g.group;
      for (const [id, label] of g.items) {
        const o = document.createElement('option');
        o.value = id; o.textContent = label;
        og.appendChild(o);
      }
      el.trSel.appendChild(og);
    }
    el.trSel.value = S.tr;
  }
  el.trSel.addEventListener('change', async () => {
    const wasPlaying = S.playing;
    stopAll();
    S.tr = el.trSel.value;
    try {
      await loadBooks();
    } catch {
      toast('Could not load that translation. Please try again.');
      return;
    }
    if (!bookById(S.bookId)) { S.bookId = S.books[0].id; S.chapter = 1; }
    const b = bookById(S.bookId);
    if (S.chapter > b.numberOfChapters) S.chapter = 1;
    loadChapter(S.bookId, S.chapter, { autoplay: wasPlaying });
  });

  async function loadBooks() {
    const d = await getJSON(`/api/${S.tr}/books.json`);
    S.books = d.books.slice().sort((a, b) => a.order - b.order);
    S.lang = d.translation.language;
    S.trInfo = d.translation;
    root.lang = (LANG_BCP[S.lang] || 'en').split('-')[0];
  }

  // ---------- Rendering ----------
  function skeleton() {
    const widths = [100, 96, 88, 100, 70, 0, 100, 92, 97, 60, 0, 100, 85, 94, 100, 40];
    el.scripture.innerHTML = widths.map((w) => (w ? `<div class="sk" style="width:${w}%"></div>` : '<div style="height:1.2em"></div>')).join('');
  }

  function contentText(parts) {
    return parts.map((c) => (typeof c === 'string' ? c : c.text || '')).join(' ').replace(/\s+/g, ' ').replace(/ ([”’.,;:!?)])/g, '$1').trim();
  }

  function renderChapter(d) {
    const frag = document.createDocumentFragment();
    let p = null;
    const newP = () => { p = document.createElement('p'); frag.appendChild(p); return p; };
    S.verses = [];

    for (const item of d.chapter.content) {
      if (item.type === 'heading') {
        p = null;
        const h = document.createElement('h3');
        h.textContent = contentText(item.content);
        frag.appendChild(h);
      } else if (item.type === 'hebrew_subtitle') {
        p = null;
        const s = document.createElement('p');
        s.className = 'subtitle';
        s.textContent = contentText(item.content);
        frag.appendChild(s);
      } else if (item.type === 'line_break') {
        p = null;
      } else if (item.type === 'verse') {
        if (!p) newP();
        const span = document.createElement('span');
        span.className = 'verse';
        span.dataset.v = item.number;
        span.id = `v${item.number}`;
        const num = document.createElement('sup');
        num.className = 'vnum';
        num.textContent = item.number;
        const hasPoem = item.content.some((c) => c && typeof c === 'object' && c.poem);
        if (hasPoem) { p.classList.add('poem-block'); span.classList.add('verse--poem'); }
        let first = true;
        const texts = [];
        for (const c of item.content) {
          let text = '', poem = 0, jesus = false;
          if (typeof c === 'string') text = c;
          else if (c && c.text) { text = c.text; poem = c.poem || 0; jesus = !!c.wordsOfJesus; }
          else if (c && c.lineBreak) { if (!hasPoem) span.appendChild(document.createElement('br')); continue; }
          else continue; // footnotes etc.
          texts.push(text);
          const node = document.createElement('span');
          if (poem) node.className = 'poem-line' + (poem > 1 ? ' p2' : '');
          if (jesus) node.classList.add('jesus');
          if (first) { node.appendChild(num); first = false; }
          const lead = !poem && texts.length > 1 && !/^[”’.,;:!?)\]]/.test(text) ? ' ' : '';
          node.appendChild(document.createTextNode(lead + text));
          span.appendChild(node);
        }
        if (first) span.appendChild(num);
        if (p.childNodes.length && !hasPoem) p.appendChild(document.createTextNode(' '));
        p.appendChild(span);
        S.verses.push({ n: item.number, text: texts.join(' ').replace(/\s+/g, ' ').replace(/ ([”’.,;:!?)])/g, '$1').trim(), el: span });
      }
    }
    el.scripture.innerHTML = '';
    el.scripture.appendChild(frag);
  }

  function updateHeader() {
    const b = bookById(S.bookId);
    const name = bookName(b);
    el.refLabel.textContent = `${name} ${S.chapter}`;
    el.chapterBook.textContent = name;
    el.chapterNum.textContent = S.chapter;
    el.bookTitle.textContent = b && b.title && b.title !== name ? b.title : (b && b.order >= NT_START ? 'New Testament' : 'Old Testament');
    el.trNote.textContent = S.trInfo ? S.trInfo.name : '';
    document.title = `${name} ${S.chapter} — Selah`;
    const prev = prevRef(), next = nextRef();
    el.prevChap.disabled = !prev; el.nextChap.disabled = !next;
    if (prev) el.prevLabel.textContent = `${bookName(bookById(prev[0]))} ${prev[1]}`;
    if (next) el.nextLabel.textContent = `${bookName(bookById(next[0]))} ${next[1]}`;
  }

  function prevRef() {
    if (S.chapter > 1) return [S.bookId, S.chapter - 1];
    const i = S.books.findIndex((b) => b.id === S.bookId);
    if (i > 0) { const b = S.books[i - 1]; return [b.id, b.numberOfChapters]; }
    return null;
  }
  function nextRef() {
    const b = bookById(S.bookId);
    if (b && S.chapter < b.numberOfChapters) return [S.bookId, S.chapter + 1];
    const i = S.books.findIndex((x) => x.id === S.bookId);
    if (i >= 0 && i < S.books.length - 1) return [S.books[i + 1].id, 1];
    return null;
  }

  // ---------- Loading a chapter ----------
  async function loadChapter(bookId, chapter, opts = {}) {
    const token = ++S.loadToken;
    stopAll(true);
    hidePop();
    S.bookId = bookId; S.chapter = chapter;
    updateHeader();
    skeleton();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    let d;
    try {
      d = await getJSON(`/api/${S.tr}/${bookId}/${chapter}.json`);
    } catch {
      if (token !== S.loadToken) return;
      el.scripture.innerHTML = `<div class="errorbox">We couldn't load ${ref()}. Check your connection and try again.<br><button type="button" id="retryBtn">Try again</button></div>`;
      $('retryBtn').addEventListener('click', () => loadChapter(bookId, chapter, opts));
      return;
    }
    if (token !== S.loadToken) return;
    S.data = d;
    renderChapter(d);
    applyBookmarkMarks();
    setupAudioSources(d);
    savePosition(opts.verse || 0);
    resetProgress();
    if (opts.verse) {
      S.holdScrollSave = Date.now() + 2500;
      const v = S.verses.find((x) => x.n === opts.verse);
      if (v) {
        requestAnimationFrame(() => {
          v.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          v.el.classList.add('is-flash');
          setTimeout(() => v.el.classList.remove('is-flash'), 1900);
        });
      }
    }
    if (opts.autoplay) play(opts.verse || null);
    prefetchNext();
  }

  function prefetchNext() {
    const n = nextRef();
    if (n) setTimeout(() => getJSON(`/api/${S.tr}/${n[0]}/${n[1]}.json`).catch(() => {}), 1200);
  }

  // ---------- Audio sources ----------
  function setupAudioSources(d) {
    const links = d.thisChapterAudioLinks || {};
    const keys = Object.keys(links);
    el.narSel.innerHTML = '';
    for (const k of keys) {
      const o = document.createElement('option');
      o.value = k; o.textContent = NARRATORS[k] || (k[0].toUpperCase() + k.slice(1));
      el.narSel.appendChild(o);
    }
    if (synth) {
      const o = document.createElement('option');
      o.value = 'device'; o.textContent = 'Device voice';
      el.narSel.appendChild(o);
    }
    if (!keys.includes(S.narrator) && S.narrator !== 'device') S.narrator = keys[0] || 'device';
    if (S.narrator === 'device' && !synth) S.narrator = keys[0];
    // If translation has no recordings, use device voice for this chapter
    const choice = keys.includes(S.narrator) ? S.narrator : (synth ? 'device' : keys[0]);
    el.narSel.value = choice || '';
    applyNarrator(choice, false);
  }

  function applyNarrator(choice, userInitiated) {
    const links = (S.data && S.data.thisChapterAudioLinks) || {};
    S.timings = null;
    if (choice && choice !== 'device' && links[choice]) {
      S.mode = 'audio';
      el.audio.src = links[choice];
      el.audio.playbackRate = SPEEDS[S.speedIdx];
      el.audio.preload = 'metadata';
      const tpath = S.data.thisChapterAudioTimings && S.data.thisChapterAudioTimings[choice];
      if (tpath) {
        const token = S.loadToken;
        getJSON(tpath).then((t) => {
          if (token === S.loadToken && el.narSel.value === choice) {
            S.timings = t.verses;
            if (S.pendingSeekVerse) { seekToVerse(S.pendingSeekVerse); S.pendingSeekVerse = null; }
          }
        }).catch(() => {});
      }
    } else {
      S.mode = 'tts';
      el.audio.removeAttribute('src');
      el.audio.load();
      S.ttsIndex = 0;
    }
    if (userInitiated) { S.narrator = choice; savePosition(S.currentVerse || 0); }
    updateMediaSession();
    renderProgress();
  }

  el.narSel.addEventListener('change', () => {
    const wasPlaying = S.playing;
    const fromVerse = S.currentVerse || null;
    stopAll(true);
    applyNarrator(el.narSel.value, true);
    if (wasPlaying) play(fromVerse);
  });

  // ---------- Playback ----------
  function setPlayingUI() {
    el.playBtn.classList.toggle('is-playing', S.playing);
    el.playBtn.classList.toggle('is-loading', S.loading);
    el.playBtn.setAttribute('aria-label', S.playing ? 'Pause' : 'Play');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = S.playing ? 'playing' : 'paused';
  }

  function stopAll(resetPosition) {
    if (synth) { ttsGen++; synth.cancel(); }
    el.audio.pause();
    S.playing = false; S.loading = false;
    if (resetPosition) { S.currentVerse = 0; S.ttsIndex = 0; markVerse(0); }
    setPlayingUI();
  }

  function play(fromVerse) {
    if (!S.data) return;
    if (S.mode === 'audio') {
      if (fromVerse) {
        if (S.timings) seekToVerse(fromVerse);
        else S.pendingSeekVerse = fromVerse;
      }
      S.loading = el.audio.readyState < 3;
      setPlayingUI();
      const pr = el.audio.play();
      if (pr && pr.catch) pr.catch((err) => {
        S.loading = false; S.playing = false; setPlayingUI();
        if (err && err.name !== 'AbortError') toast('Audio could not start. Tap play to try again.');
      });
    } else {
      if (!synth) { toast('Read-aloud is not supported in this browser.'); return; }
      if (fromVerse) {
        const i = S.verses.findIndex((v) => v.n === fromVerse);
        if (i >= 0) S.ttsIndex = i;
      }
      if (S.ttsIndex >= S.verses.length) S.ttsIndex = 0;
      S.playing = true; setPlayingUI();
      speakCurrent();
    }
  }

  function pause() {
    if (S.mode === 'audio') el.audio.pause();
    else if (synth) { ttsGen++; synth.cancel(); }
    S.playing = false; S.loading = false; setPlayingUI();
  }

  el.playBtn.addEventListener('click', () => (S.playing || S.loading ? pause() : play()));

  // Audio element events
  el.audio.addEventListener('playing', () => { S.playing = true; S.loading = false; setPlayingUI(); });
  el.audio.addEventListener('waiting', () => { if (S.playing) { S.loading = true; setPlayingUI(); } });
  el.audio.addEventListener('pause', () => { if (S.mode === 'audio') { S.playing = false; S.loading = false; setPlayingUI(); } });
  el.audio.addEventListener('loadedmetadata', renderProgress);
  el.audio.addEventListener('timeupdate', () => { if (S.mode === 'audio') { syncVerseFromTime(); renderProgress(); } });
  el.audio.addEventListener('ended', () => { S.playing = false; setPlayingUI(); onChapterEnd(); });
  el.audio.addEventListener('error', () => {
    if (S.mode !== 'audio' || !el.audio.getAttribute('src')) return;
    S.playing = false; S.loading = false; setPlayingUI();
    toast('This recording is unavailable. Try another narrator.');
  });

  function onChapterEnd() {
    markVerse(0);
    if (!S.autoNext) return;
    const n = nextRef();
    if (n) loadChapter(n[0], n[1], { autoplay: true });
  }

  function verseStart(n) {
    if (!S.timings) return null;
    const t = S.timings[n - 1];
    return typeof t === 'number' ? t : null;
  }
  function seekToVerse(n) {
    const t = verseStart(n);
    if (t == null) return;
    el.audio.currentTime = Math.max(0, t - 0.05);
    markVerse(n);
  }
  function syncVerseFromTime() {
    if (!S.timings) return;
    const t = el.audio.currentTime + 0.12;
    let v = 0;
    for (let i = 0; i < S.timings.length; i++) {
      if (S.timings[i] <= t) v = i + 1; else break;
    }
    if (v !== S.currentVerse) markVerse(v);
  }

  function markVerse(n) {
    if (S.currentVerse && S.verses.length) {
      const old = S.verses.find((x) => x.n === S.currentVerse);
      if (old) old.el.classList.remove('is-playing');
    }
    S.currentVerse = n;
    const v = n ? S.verses.find((x) => x.n === n) : null;
    if (v) {
      if (S.playing) savePosition(n);
      v.el.classList.add('is-playing');
      el.tNow.textContent = `${ref()}:${n}`;
      if (S.follow && S.playing) scrollVerseIntoView(v.el);
    } else {
      el.tNow.textContent = S.data ? ref() : '';
    }
  }

  function scrollVerseIntoView(node) {
    const r = node.getBoundingClientRect();
    const top = 90, bottom = window.innerHeight - 170;
    if (r.top < top || r.bottom > bottom) {
      const y = window.scrollY + r.top - window.innerHeight * 0.32;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  // ---------- Device voice (speech synthesis) ----------
  let ttsGen = 0;
  function pickVoice(lang) {
    if (!synth) return null;
    const voices = synth.getVoices();
    const base = lang.split('-')[0].toLowerCase();
    const matches = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
    const pref = matches.find((v) => /natural|premium|enhanced|google/i.test(v.name));
    return pref || matches[0] || null;
  }
  function speakCurrent() {
    const gen = ++ttsGen;
    synth.cancel();
    const v = S.verses[S.ttsIndex];
    if (!v) { S.playing = false; setPlayingUI(); onChapterEnd(); return; }
    markVerse(v.n);
    renderProgress();
    const u = new SpeechSynthesisUtterance(v.text);
    const lang = LANG_BCP[S.lang] || 'en-US';
    u.lang = lang;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = SPEEDS[S.speedIdx];
    u.onend = () => {
      if (gen !== ttsGen || !S.playing) return;
      S.ttsIndex++;
      if (S.ttsIndex >= S.verses.length) { S.playing = false; setPlayingUI(); onChapterEnd(); return; }
      speakCurrent();
    };
    u.onerror = (e) => {
      if (gen !== ttsGen) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      S.playing = false; setPlayingUI();
      toast('Read-aloud stopped unexpectedly.');
    };
    // Some browsers need a tick after cancel()
    setTimeout(() => { if (gen === ttsGen) synth.speak(u); }, 60);
  }
  if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', () => {});

  // ---------- Verse skip ----------
  function stepVerse(dir) {
    if (!S.verses.length) return;
    if (S.mode === 'tts') {
      S.ttsIndex = Math.min(Math.max(0, S.ttsIndex + dir), S.verses.length - 1);
      if (S.playing) speakCurrent(); else { markVerse(S.verses[S.ttsIndex].n); renderProgress(); }
      return;
    }
    if (!S.timings) {
      el.audio.currentTime = Math.max(0, el.audio.currentTime + dir * 10);
      return;
    }
    let target;
    if (dir < 0) {
      // If more than 2s into current verse, restart it; else go to previous
      const start = verseStart(S.currentVerse || 1) || 0;
      target = el.audio.currentTime - start > 2 ? (S.currentVerse || 1) : Math.max(1, (S.currentVerse || 1) - 1);
    } else {
      target = Math.min(S.timings.length, (S.currentVerse || 0) + 1);
    }
    seekToVerse(target);
    renderProgress();
  }
  el.prevVerse.addEventListener('click', () => stepVerse(-1));
  el.nextVerse.addEventListener('click', () => stepVerse(1));

  // ---------- Progress ----------
  function resetProgress() { el.seek.value = 0; el.seek.style.setProperty('--pct', '0%'); renderProgress(); }
  let seeking = false;
  function renderProgress() {
    let cur = 0, dur = 0, pct = 0;
    if (S.mode === 'audio') {
      cur = el.audio.currentTime || 0; dur = el.audio.duration || 0;
      pct = dur ? cur / dur : 0;
      el.tCur.textContent = fmt(cur);
      el.tDur.textContent = dur ? fmt(dur) : '--:--';
    } else {
      const total = S.verses.length || 1;
      pct = S.ttsIndex / total;
      el.tCur.textContent = `v${S.verses[S.ttsIndex] ? S.verses[S.ttsIndex].n : 1}`;
      el.tDur.textContent = `${total} verses`;
    }
    if (!seeking) el.seek.value = Math.round(pct * 1000);
    el.seek.style.setProperty('--pct', (pct * 100).toFixed(2) + '%');
    if (!S.currentVerse) el.tNow.textContent = S.data ? ref() : '';
  }
  el.seek.addEventListener('input', () => {
    seeking = true;
    const f = el.seek.value / 1000;
    el.seek.style.setProperty('--pct', (f * 100).toFixed(2) + '%');
    if (S.mode === 'audio' && el.audio.duration) el.tCur.textContent = fmt(f * el.audio.duration);
  });
  el.seek.addEventListener('change', () => {
    seeking = false;
    const f = el.seek.value / 1000;
    if (S.mode === 'audio') {
      if (el.audio.duration) el.audio.currentTime = f * el.audio.duration;
      else { el.audio.preload = 'auto'; }
    } else {
      S.ttsIndex = Math.min(S.verses.length - 1, Math.floor(f * S.verses.length));
      if (S.playing) speakCurrent(); else { markVerse(S.verses[S.ttsIndex].n); renderProgress(); }
    }
  });

  // ---------- Speed ----------
  el.speedBtn.addEventListener('click', () => {
    S.speedIdx = (S.speedIdx + 1) % SPEEDS.length;
    const s = SPEEDS[S.speedIdx];
    el.speedBtn.textContent = `${s}×`;
    el.audio.playbackRate = s;
    if (S.mode === 'tts' && S.playing) speakCurrent();
  });

  // ---------- Chapter nav ----------
  el.prevChap.addEventListener('click', () => { const p = prevRef(); if (p) loadChapter(p[0], p[1], { autoplay: S.playing }); });
  el.nextChap.addEventListener('click', () => { const n = nextRef(); if (n) loadChapter(n[0], n[1], { autoplay: S.playing }); });

  // ---------- Verse popover ----------
  el.scripture.addEventListener('click', (e) => {
    const v = e.target.closest('.verse');
    if (!v) return;
    e.stopPropagation();
    const n = Number(v.dataset.v);
    if (S.selectedVerse === n && !el.pop.hidden) { hidePop(); return; }
    showPop(v, n);
  });
  function showPop(node, n) {
    hidePop();
    S.selectedVerse = n;
    node.classList.add('is-selected');
    el.popBookmarkLabel.textContent = bmFor(S.bookId, S.chapter, n) ? 'Remove bookmark' : 'Bookmark';
    el.pop.hidden = false;
    const rects = node.getClientRects();
    const r = rects[0] || node.getBoundingClientRect();
    const pw = el.pop.offsetWidth, ph = el.pop.offsetHeight;
    let left = r.left + window.scrollX;
    left = Math.min(Math.max(12, left), document.documentElement.clientWidth - pw - 12);
    let top = r.top + window.scrollY - ph - 8;
    if (r.top - ph - 8 < 70) top = r.bottom + window.scrollY + 8;
    el.pop.style.left = left + 'px';
    el.pop.style.top = top + 'px';
  }
  function hidePop() {
    el.pop.hidden = true;
    if (S.selectedVerse) {
      const v = S.verses.find((x) => x.n === S.selectedVerse);
      if (v) v.el.classList.remove('is-selected');
    }
    S.selectedVerse = null;
  }
  document.addEventListener('click', (e) => { if (!el.pop.hidden && !el.pop.contains(e.target)) hidePop(); });
  el.popPlay.addEventListener('click', () => {
    const n = S.selectedVerse; hidePop();
    if (S.mode === 'audio' && !S.timings && !(S.data.thisChapterAudioTimings || {})[el.narSel.value]) {
      toast('Verse timing isn’t available for this narrator — playing from the start.');
      play(); return;
    }
    if (S.mode === 'tts') { if (synth) { ttsGen++; synth.cancel(); } }
    play(n);
  });
  el.popCopy.addEventListener('click', async () => {
    const n = S.selectedVerse; hidePop();
    const v = S.verses.find((x) => x.n === n);
    if (!v) return;
    const text = `“${v.text}” — ${ref()}:${n} (${S.trInfo ? S.trInfo.shortName || S.tr : S.tr})`;
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${ref()}:${n}`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(`Copied ${ref()}:${n}`); } catch { toast('Copy not available here'); }
      ta.remove();
    }
  });

  // ---------- Picker ----------
  let pickerBook = null;
  function openPicker() {
    el.picker.hidden = false;
    document.body.style.overflow = 'hidden';
    pickerBook = null;
    el.jumpInput.value = '';
    renderBooks('');
    setTimeout(() => el.jumpInput.focus(), 50);
  }
  function closePicker() {
    el.picker.hidden = true;
    document.body.style.overflow = '';
    el.refBtn.focus();
  }
  el.refBtn.addEventListener('click', openPicker);
  $('brandLink').addEventListener('click', (e) => { e.preventDefault(); openPicker(); });
  el.picker.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closePicker(); });
  el.pickerBack.addEventListener('click', () => { pickerBook = null; renderBooks(el.jumpInput.value); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (openDlg) closeDialog(openDlg);
      else if (!el.picker.hidden) closePicker();
      else if (!el.pop.hidden) hidePop();
    }
    if (el.picker.hidden && !openDlg && e.target === document.body) {
      if (e.code === 'Space') { e.preventDefault(); S.playing ? pause() : play(); }
      if (e.key === 'ArrowRight' && e.altKey) stepVerse(1);
      if (e.key === 'ArrowLeft' && e.altKey) stepVerse(-1);
    }
  });

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ɛɔŋʋƒɖ]/g, '');
  function matchesBook(b, q) {
    if (!q) return true;
    const nq = norm(q);
    const names = [b.commonName, b.name, S.englishNames[b.id], b.id].filter(Boolean).map(norm);
    return names.some((n) => n.startsWith(nq) || (nq.length > 2 && n.includes(nq)));
  }

  function parseRef(q) {
    const m = q.trim().match(/^(.+?)\s*(\d+)(?:\s*[:.]\s*(\d+))?\s*$/);
    if (!m) return null;
    let name = m[1].trim();
    // "1 john" style: leading digit belongs to name, handled by regex since name is lazy but needs chars
    const nq = norm(name);
    if (!nq) return null;
    const cands = S.books.filter((b) => {
      const names = [b.commonName, b.name, S.englishNames[b.id], b.id].filter(Boolean).map(norm);
      return names.some((n) => n.startsWith(nq));
    });
    if (!cands.length) return null;
    const exact = cands.find((b) => [b.commonName, b.name, S.englishNames[b.id]].filter(Boolean).map(norm).includes(nq));
    const book = exact || cands[0];
    const ch = Math.min(Number(m[2]), book.numberOfChapters);
    return { book, ch: Math.max(1, ch), v: m[3] ? Number(m[3]) : null };
  }

  function renderBooks(q) {
    el.pickerTitle.textContent = 'Choose a book';
    el.pickerBack.hidden = true;
    const r = q ? parseRef(q) : null;
    let html = '';
    if (r) {
      html += `<p class="jumphint">Press Enter to go to <button type="button" data-jump>${bookName(r.book)} ${r.ch}${r.v ? ':' + r.v : ''}</button></p>`;
    }
    const ot = S.books.filter((b) => b.order < NT_START && matchesBook(b, q));
    const nt = S.books.filter((b) => b.order >= NT_START && matchesBook(b, q));
    const grid = (list) => list.map((b) => `<button type="button" class="bookbtn${b.id === S.bookId ? ' is-current' : ''}" data-book="${b.id}"><span>${bookName(b)}</span><small>${b.numberOfChapters}</small></button>`).join('');
    if (ot.length) html += `<section class="testament"><h4>Old Testament</h4><div class="bookgrid">${grid(ot)}</div></section>`;
    if (nt.length) html += `<section class="testament"><h4>New Testament</h4><div class="bookgrid">${grid(nt)}</div></section>`;
    if (!ot.length && !nt.length && !r) html += `<p class="empty">No books match “${q.replace(/[<>&]/g, '')}”.</p>`;
    el.pickerBody.innerHTML = html;
    el.pickerBody.scrollTop = 0;
  }

  function renderChapters(b) {
    pickerBook = b;
    el.pickerTitle.textContent = bookName(b);
    el.pickerBack.hidden = false;
    let html = '<div class="chapgrid">';
    for (let i = 1; i <= b.numberOfChapters; i++) {
      html += `<button type="button" class="chapbtn${b.id === S.bookId && i === S.chapter ? ' is-current' : ''}" data-chap="${i}">${i}</button>`;
    }
    el.pickerBody.innerHTML = html + '</div>';
    el.pickerBody.scrollTop = 0;
  }

  el.pickerBody.addEventListener('click', (e) => {
    const bb = e.target.closest('[data-book]');
    if (bb) {
      const b = bookById(bb.dataset.book);
      if (b.numberOfChapters === 1) { closePicker(); loadChapter(b.id, 1, { autoplay: S.playing }); }
      else renderChapters(b);
      return;
    }
    const cb = e.target.closest('[data-chap]');
    if (cb && pickerBook) {
      const b = pickerBook;
      closePicker();
      loadChapter(b.id, Number(cb.dataset.chap), { autoplay: S.playing });
      return;
    }
    if (e.target.closest('[data-jump]')) doJump();
  });
  el.jumpInput.addEventListener('input', () => { pickerBook = null; renderBooks(el.jumpInput.value); });
  el.jumpForm.addEventListener('submit', (e) => { e.preventDefault(); doJump(); });
  function doJump() {
    const q = el.jumpInput.value;
    const r = parseRef(q);
    if (r) { closePicker(); loadChapter(r.book.id, r.ch, { verse: r.v, autoplay: S.playing }); return; }
    const list = S.books.filter((b) => matchesBook(b, q));
    if (list.length === 1 || (list.length && q)) renderChapters(list[0]);
  }

  // ---------- Media Session ----------
  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !S.data) return;
    const who = el.narSel.value === 'device' ? 'Device voice' : `Narrated by ${NARRATORS[el.narSel.value] || el.narSel.value}`;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ref(), artist: who, album: S.trInfo ? S.trInfo.name : 'Bible',
        artwork: [{ src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml' }],
      });
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => { const n = nextRef(); if (n) loadChapter(n[0], n[1], { autoplay: true }); });
      navigator.mediaSession.setActionHandler('previoustrack', () => { const p = prevRef(); if (p) loadChapter(p[0], p[1], { autoplay: true }); });
      navigator.mediaSession.setActionHandler('seekforward', () => stepVerse(1));
      navigator.mediaSession.setActionHandler('seekbackward', () => stepVerse(-1));
    } catch { /* unsupported action */ }
  }

  // ---------- Generic dialogs ----------
  let openDlg = null, dlgReturn = null;
  function openDialog(d, focusEl) {
    if (openDlg) closeDialog(openDlg, true);
    dlgReturn = document.activeElement;
    d.hidden = false; openDlg = d;
    document.body.style.overflow = 'hidden';
    if (focusEl) setTimeout(() => focusEl.focus(), 50);
  }
  function closeDialog(d, silent) {
    d.hidden = true;
    if (openDlg === d) openDlg = null;
    document.body.style.overflow = '';
    if (!silent && dlgReturn && dlgReturn.focus) dlgReturn.focus();
  }
  for (const d of [el.searchDlg, el.bookmarksDlg]) {
    d.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDialog(d); });
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trShort = (id) => { for (const g of TRANSLATIONS) for (const [k, l] of g.items) if (k === id) return l.replace(/ · Audio$/, ''); return id; };

  function goTo(book, chapter, verse) {
    const same = book === S.bookId && chapter === S.chapter;
    if (same && verse) {
      const v = S.verses.find((x) => x.n === verse);
      if (v) {
        S.holdScrollSave = Date.now() + 2500;
        savePosition(verse);
        v.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        v.el.classList.add('is-flash'); setTimeout(() => v.el.classList.remove('is-flash'), 1900);
        return;
      }
    }
    loadChapter(book, chapter, { verse, autoplay: S.playing });
  }

  // ---------- Last-read position ----------
  let posTimer = null, restoring = false;
  function savePosition(verse) {
    if (restoring) return;
    clearTimeout(posTimer);
    const body = { tr: S.tr, book: S.bookId, chapter: S.chapter, verse: verse || 0, narrator: S.narrator };
    posTimer = setTimeout(() => {
      api('/api/position', { method: 'PUT', body: JSON.stringify(body) }).catch(() => {});
    }, 1200);
  }
  // Track the verse near the top of the viewport while reading (not playing)
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (S.playing || !S.verses.length || Date.now() < (S.holdScrollSave || 0)) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const y = 110;
      let found = 0;
      for (const v of S.verses) {
        const r = v.el.getBoundingClientRect();
        if (r.bottom > y) { found = v.n; break; }
      }
      if (window.scrollY < 80) found = 0;
      savePosition(found);
    }, 600);
  }, { passive: true });

  // ---------- Bookmarks ----------
  S.bookmarks = [];
  const bmKey = (b, c, v) => `${b}|${c}|${v}`;
  const bmFor = (b, c, v) => S.bookmarks.find((x) => bmKey(x.book, x.chapter, x.verse) === bmKey(b, c, v));
  function applyBookmarkMarks() {
    for (const v of S.verses) v.el.classList.toggle('is-bookmarked', !!bmFor(S.bookId, S.chapter, v.n));
  }
  function updateBadge() {
    const n = S.bookmarks.length;
    el.bmBadge.hidden = !n;
    el.bmBadge.textContent = n > 99 ? '99+' : n;
    el.bookmarksBtn.setAttribute('aria-label', n ? `Your bookmarks (${n})` : 'Your bookmarks');
  }
  async function loadBookmarks() {
    try { S.bookmarks = await api('/api/bookmarks'); } catch { S.bookmarks = []; }
    updateBadge(); applyBookmarkMarks();
  }
  async function toggleBookmark(n) {
    const existing = bmFor(S.bookId, S.chapter, n);
    const label = `${ref()}:${n}`;
    if (existing) {
      S.bookmarks = S.bookmarks.filter((x) => x !== existing);
      updateBadge(); applyBookmarkMarks();
      try { await api('/api/bookmarks/' + existing.id, { method: 'DELETE' }); toast(`Removed bookmark ${label}`); }
      catch { S.bookmarks.unshift(existing); updateBadge(); applyBookmarkMarks(); toast('Could not remove bookmark. Try again.'); }
      return;
    }
    const v = S.verses.find((x) => x.n === n);
    const temp = { id: -Date.now(), tr: S.tr, book: S.bookId, book_name: bookName(bookById(S.bookId)), chapter: S.chapter, verse: n, text: v ? v.text : '', created_at: Date.now() / 1000 };
    S.bookmarks.unshift(temp); updateBadge(); applyBookmarkMarks();
    try {
      const saved = await api('/api/bookmarks', { method: 'POST', body: JSON.stringify(temp) });
      const i = S.bookmarks.indexOf(temp); if (i >= 0) S.bookmarks[i] = saved;
      toast(`Bookmarked ${label}`);
    } catch {
      S.bookmarks = S.bookmarks.filter((x) => x !== temp); updateBadge(); applyBookmarkMarks();
      toast('Could not save bookmark. Try again.');
    }
  }
  el.popBookmark.addEventListener('click', () => { const n = S.selectedVerse; hidePop(); if (n) toggleBookmark(n); });

  function timeAgo(t) {
    const s = Date.now() / 1000 - t;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
    const d = Math.floor(s / 86400);
    if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
    return new Date(t * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function renderBookmarks() {
    if (!S.bookmarks.length) {
      el.bmBody.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M6.5 4h11v16.5L12 16.5 6.5 20.5V4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>No bookmarks yet.<br>Tap any verse and choose <b>Bookmark</b> to save it here.</div>`;
      return;
    }
    el.bmBody.innerHTML = '<ul class="results">' + S.bookmarks.map((b) => {
      const name = (bookById(b.book) && bookName(bookById(b.book))) || b.book_name || b.book;
      return `<li class="bmitem">
        <button type="button" class="result" data-go="${esc(b.book)}|${b.chapter}|${b.verse}">
          <span class="result__ref">${esc(name)} ${b.chapter}:${b.verse} <span class="result__meta">· ${esc(trShort(b.tr))} · ${timeAgo(b.created_at)}</span></span>
          <span class="result__text">${esc(b.text || '')}</span>
        </button>
        <button type="button" class="iconbtn" data-del="${b.id}" aria-label="Remove bookmark ${esc(name)} ${b.chapter}:${b.verse}">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 10h6.6L14 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </li>`;
    }).join('') + '</ul>';
  }
  el.bookmarksBtn.addEventListener('click', () => { renderBookmarks(); openDialog(el.bookmarksDlg); loadBookmarks().then(() => { if (openDlg === el.bookmarksDlg) renderBookmarks(); }); });
  el.bmBody.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const id = Number(del.dataset.del);
      const b = S.bookmarks.find((x) => x.id === id);
      S.bookmarks = S.bookmarks.filter((x) => x.id !== id);
      updateBadge(); applyBookmarkMarks(); renderBookmarks();
      try { await api('/api/bookmarks/' + id, { method: 'DELETE' }); }
      catch { if (b) { S.bookmarks.push(b); S.bookmarks.sort((a, c) => c.created_at - a.created_at); updateBadge(); applyBookmarkMarks(); renderBookmarks(); } toast('Could not remove bookmark.'); }
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go) {
      const [b, c, v] = go.dataset.go.split('|');
      closeDialog(el.bookmarksDlg, true);
      goTo(b, Number(c), Number(v));
    }
  });

  // ---------- Search ----------
  const SQ = { q: '', scope: 'all', book: null, offset: 0, results: [], total: 0, overall: 0, books: [], terms: [], token: 0 };
  const TRIES = ['love one another', '"the Lord is my shepherd"', 'faith hope', 'peace', '"born again"', 'grace'];
  function searchHelp() {
    el.searchBooks.innerHTML = '';
    el.searchBody.innerHTML = `<div class="searchhelp">
      <h5>Tips</h5>
      Type words to find verses that contain all of them. Wrap words in quotes to find an exact phrase.
      <div class="tries">${TRIES.map((t) => `<button type="button" class="chip" data-try="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </div>`;
  }
  el.searchBtn.addEventListener('click', () => {
    el.searchTr.textContent = `Searching ${trShort(S.tr)}`;
    if (!SQ.q) searchHelp();
    openDialog(el.searchDlg, el.searchInput);
    if (SQ.q && SQ.trUsed !== S.tr) runSearch(true);
  });
  let searchDeb = null;
  el.searchInput.addEventListener('input', () => {
    clearTimeout(searchDeb);
    searchDeb = setTimeout(() => { SQ.q = el.searchInput.value.trim(); SQ.book = null; runSearch(true); }, 320);
  });
  el.searchForm.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(searchDeb); SQ.q = el.searchInput.value.trim(); SQ.book = null; runSearch(true); });
  el.searchDlg.querySelector('.seg--scope').addEventListener('click', (e) => {
    const b = e.target.closest('[data-scope]'); if (!b) return;
    SQ.scope = b.dataset.scope; SQ.book = null;
    for (const x of el.searchDlg.querySelectorAll('[data-scope]')) x.setAttribute('aria-checked', String(x === b));
    if (SQ.q) runSearch(true);
  });
  el.searchBooks.addEventListener('click', (e) => {
    const c = e.target.closest('[data-sbook]'); if (!c) return;
    SQ.book = c.dataset.sbook === SQ.book || c.dataset.sbook === '' ? null : c.dataset.sbook;
    runSearch(true);
  });
  el.searchBody.addEventListener('click', (e) => {
    const t = e.target.closest('[data-try]');
    if (t) { el.searchInput.value = t.dataset.try; SQ.q = t.dataset.try; SQ.book = null; runSearch(true); return; }
    if (e.target.closest('#moreBtn')) { runSearch(false); return; }
    const go = e.target.closest('[data-go]');
    if (go) {
      const [b, c, v] = go.dataset.go.split('|');
      closeDialog(el.searchDlg, true);
      goTo(b, Number(c), Number(v));
    }
  });

  function highlight(text, terms) {
    let out = esc(text);
    const pats = terms.filter(Boolean).map((t) => {
      const base = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const body = base.split('').map((ch) => (/[a-z]/i.test(ch) ? ch + '[\\u0300-\\u036f]?' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('').replace(/'/g, "['\u2019\u02bc]");
      return body + (!t.includes(' ') && t.length >= 3 ? '\\w{0,3}' : '');
    });
    if (!pats.length) return out;
    try {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${pats.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
      out = out.normalize('NFD').replace(re, '$1<mark>$2</mark>').normalize('NFC');
    } catch { /* ignore */ }
    return out;
  }

  async function runSearch(reset) {
    if (!SQ.q || SQ.q.replace(/"/g, '').trim().length < 2) { SQ.results = []; searchHelp(); return; }
    const token = ++SQ.token;
    if (reset) {
      SQ.offset = 0; SQ.results = [];
      el.searchBody.innerHTML = '<div style="padding-top:8px">' + '<div class="result-sk"></div>'.repeat(5) + '</div>';
      if (!cache.has('idx:' + S.tr)) el.searchTr.textContent = `Preparing ${trShort(S.tr)}…`;
    }
    const params = new URLSearchParams({ tr: S.tr, q: SQ.q, scope: SQ.scope, offset: SQ.offset, limit: 40 });
    if (SQ.book) params.set('book', SQ.book);
    let d;
    try {
      d = await api('/api/search?' + params.toString());
    } catch {
      if (token !== SQ.token) return;
      el.searchBody.innerHTML = `<div class="empty">Search is unavailable right now. Please try again in a moment.</div>`;
      return;
    }
    if (token !== SQ.token) return;
    cache.set('idx:' + S.tr, true);
    SQ.trUsed = S.tr;
    el.searchTr.textContent = `Searching ${trShort(S.tr)}`;
    SQ.results = SQ.results.concat(d.results);
    SQ.offset = SQ.results.length;
    SQ.total = d.total; SQ.terms = d.terms || [];
    // Book chips
    if (d.books.length > 1 || SQ.book) {
      el.searchBooks.innerHTML = `<button type="button" class="chip${!SQ.book ? ' is-on' : ''}" data-sbook="">All books<b>${d.overall}</b></button>` +
        d.books.map((b) => {
          const name = (bookById(b.book) && bookName(bookById(b.book))) || b.book_name;
          return `<button type="button" class="chip${SQ.book === b.book ? ' is-on' : ''}" data-sbook="${esc(b.book)}">${esc(name)}<b>${b.count}</b></button>`;
        }).join('');
    } else el.searchBooks.innerHTML = '';
    if (!SQ.total) {
      el.searchBody.innerHTML = `<div class="empty">No verses found for “${esc(SQ.q)}”.<br>Try fewer words, or check the spelling.</div>`;
      return;
    }
    const where = SQ.book ? ` in ${esc((bookById(SQ.book) && bookName(bookById(SQ.book))) || SQ.book)}` : '';
    el.searchBody.innerHTML = `<p class="resultcount">${SQ.total.toLocaleString()} verse${SQ.total === 1 ? '' : 's'}${where}</p><ul class="results">` +
      SQ.results.map((r) => {
        const name = (bookById(r.book) && bookName(bookById(r.book))) || r.book_name;
        return `<li><button type="button" class="result" data-go="${esc(r.book)}|${r.chapter}|${r.verse}"><span class="result__ref">${esc(name)} ${r.chapter}:${r.verse}</span><span class="result__text">${highlight(r.text, SQ.terms)}</span></button></li>`;
      }).join('') + '</ul>' +
      (SQ.results.length < SQ.total ? `<button type="button" class="morebtn" id="moreBtn">Show more (${(SQ.total - SQ.results.length).toLocaleString()} left)</button>` : '');
  }

  // ---------- Init ----------
  async function init() {
    buildTranslationSelect();
    skeleton();
    try {
      await loadBooks();
      // English names for cross-language reference jumps
      getJSON('/api/BSB/books.json').then((d) => {
        for (const b of d.books) S.englishNames[b.id] = b.commonName || b.name;
      }).catch(() => {});
    } catch {
      el.scripture.innerHTML = `<div class="errorbox">We couldn't reach the Bible library. Check your connection and try again.<br><button type="button" onclick="location.reload()">Reload</button></div>`;
      return;
    }
    loadBookmarks();
    const hash = decodeURIComponent(location.hash.slice(1));
    const r = hash ? parseRef(hash.replace(/[-_+]/g, ' ')) : null;
    if (r) { loadChapter(r.book.id, r.ch, { verse: r.v }); return; }
    let pos = null;
    try { pos = await api('/api/position'); } catch { /* backend unavailable */ }
    if (pos && pos.book) {
      restoring = true;
      try {
        if (pos.tr && pos.tr !== S.tr && [...el.trSel.options].some((o) => o.value === pos.tr)) {
          S.tr = pos.tr; el.trSel.value = pos.tr; await loadBooks();
        }
        if (pos.narrator) S.narrator = pos.narrator;
        const b = bookById(pos.book);
        if (b) {
          const ch = Math.min(Math.max(1, pos.chapter), b.numberOfChapters);
          await loadChapter(b.id, ch, { verse: pos.verse || null });
          toast(`Welcome back — ${bookName(b)} ${ch}${pos.verse ? ':' + pos.verse : ''}`);
          return;
        }
      } finally { restoring = false; }
    }
    loadChapter('JHN', 3);
  }
  init();
})();
