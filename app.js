(() => {
  'use strict';

  const API = 'https://bible.helloao.org';
  const SUPABASE_URL = 'https://ylspdrjrvhixrregmqtg.supabase.co';

  /*
    Replace the value below with your publishable key.
    Never use a service_role or secret key in this file.
  */
  const SUPABASE_KEY = 'PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE';

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const DEVICE_KEY = 'selah_device_id';
  const DEVICE_ID = localStorage.getItem(DEVICE_KEY) || crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, DEVICE_ID);

  const $ = (id) => document.getElementById(id);

  const el = {
    audio: $('audio'),
    scripture: $('scripture'),
    refLabel: $('refLabel'),
    trSel: $('translationSel'),
    narSel: $('narratorSel'),
    playBtn: $('playBtn'),
    prevVerse: $('prevVerse'),
    nextVerse: $('nextVerse'),
    seek: $('seek'),
    tCur: $('tCur'),
    tDur: $('tDur'),
    tNow: $('tNow'),
    speedBtn: $('speedBtn'),
    prevChap: $('prevChap'),
    nextChap: $('nextChap'),
    prevLabel: $('prevLabel'),
    nextLabel: $('nextLabel'),
    chapterBook: $('chapterBook'),
    chapterNum: $('chapterNum'),
    bookTitle: $('bookTitle'),
    trNote: $('translationNote'),
    picker: $('picker'),
    pickerBody: $('pickerBody'),
    pickerTitle: $('pickerTitle'),
    pickerBack: $('pickerBack'),
    jumpForm: $('jumpForm'),
    jumpInput: $('jumpInput'),
    pop: $('versePop'),
    popPlay: $('popPlay'),
    popCopy: $('popCopy'),
    toast: $('toast'),
    themeBtn: $('themeBtn'),
    settingsBtn: $('settingsBtn'),
    settings: $('settingsPanel'),
    searchBtn: $('searchBtn'),
    bookmarksBtn: $('bookmarksBtn'),
    bmBadge: $('bmBadge'),
    themeLabel: $('themeLabel'),
    searchDlg: $('searchDlg'),
    searchForm: $('searchForm'),
    searchInput: $('searchInput'),
    searchBody: $('searchBody'),
    searchBooks: $('searchBooks'),
    searchTr: $('searchTr'),
    bookmarksDlg: $('bookmarksDlg'),
    bmBody: $('bmBody'),
    popBookmark: $('popBookmark'),
    popBookmarkLabel: $('popBookmarkLabel'),
    fontUp: $('fontUp'),
    fontDown: $('fontDown'),
    followToggle: $('followToggle'),
    autoNextToggle: $('autoNextToggle'),
    numsToggle: $('numsToggle')
  };

  const state = {
    tr: 'BSB',
    lang: 'eng',
    books: [],
    bookId: 'JHN',
    chapter: 3,
    data: null,
    verses: [],
    narrator: 'souer',
    timings: null,
    mode: 'audio',
    playing: false,
    loading: false,
    currentVerse: 0,
    ttsIndex: 0,
    speed: 1,
    follow: true,
    autoNext: true,
    fontStep: 0,
    selectedVerse: null,
    loadToken: 0,
    bookmarks: [],
    searchScope: 'all'
  };

  const cache = new Map();
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

  const TRANSLATIONS = [
    {
      group: 'English',
      items: [
        ['BSB', 'Berean Standard (BSB) · Audio'],
        ['eng_kjv', 'King James Version'],
        ['ENGWEBP', 'World English Bible'],
        ['eng_asv', 'American Standard (1901)'],
        ['eng_net', 'NET Bible'],
        ['eng_bbe', 'Bible in Basic English'],
        ['eng_ylt', "Young's Literal"],
        ['eng_dby', 'Darby Translation']
      ]
    },
    {
      group: 'Ghana & Africa',
      items: [
        ['twi_asa', 'Asante Twi'],
        ['twi_aka', 'Akuapem Twi'],
        ['ewe_bib', 'Eʋegbe (Ewe)'],
        ['hau_bib', 'Hausa'],
        ['yor_bib', 'Yorùbá'],
        ['swh_onmm', 'Kiswahili']
      ]
    },
    {
      group: 'Other languages',
      items: [
        ['fra_lsg', 'Français — Louis Segond'],
        ['spa_r09', 'Español — Reina Valera 1909'],
        ['por_blj', 'Português — Bíblia Livre'],
        ['deu_l12', 'Deutsch — Luther 1912']
      ]
    }
  ];

  const NARRATORS = {
    souer: 'Souer',
    hays: 'Hays',
    david: 'David',
    gilbert: 'Gilbert',
    device: 'Device voice'
  };

  const BOOK_ALIASES = {
    gen: 'GEN',
    exod: 'EXO',
    ex: 'EXO',
    lev: 'LEV',
    num: 'NUM',
    deut: 'DEU',
    dt: 'DEU',
    josh: 'JOS',
    judg: 'JDG',
    ruth: 'RUT',
    sam1: '1SA',
    '1sam': '1SA',
    sam2: '2SA',
    '2sam': '2SA',
    kgs1: '1KI',
    '1kgs': '1KI',
    kgs2: '2KI',
    '2kgs': '2KI',
    chr1: '1CH',
    '1chr': '1CH',
    chr2: '2CH',
    '2chr': '2CH',
    ps: 'PSA',
    psa: 'PSA',
    prov: 'PRO',
    ecc: 'ECC',
    song: 'SNG',
    isa: 'ISA',
    jer: 'JER',
    lam: 'LAM',
    ezek: 'EZK',
    eze: 'EZK',
    dan: 'DAN',
    hos: 'HOS',
    joel: 'JOL',
    amos: 'AMO',
    obad: 'OBA',
    jonah: 'JON',
    mic: 'MIC',
    nah: 'NAM',
    hab: 'HAB',
    zeph: 'ZEP',
    hag: 'HAG',
    zech: 'ZEC',
    mal: 'MAL',
    matt: 'MAT',
    mt: 'MAT',
    mark: 'MRK',
    mk: 'MRK',
    luke: 'LUK',
    lk: 'LUK',
    john: 'JHN',
    jn: 'JHN',
    acts: 'ACT',
    rom: 'ROM',
    romans: 'ROM',
    cor1: '1CO',
    '1cor': '1CO',
    cor2: '2CO',
    '2cor': '2CO',
    gal: 'GAL',
    eph: 'EPH',
    phil: 'PHP',
    col: 'COL',
    thess1: '1TH',
    '1thess': '1TH',
    thess2: '2TH',
    '2thess': '2TH',
    tim1: '1TI',
    '1tim': '1TI',
    tim2: '2TI',
    '2tim': '2TI',
    tit: 'TIT',
    phlm: 'PHM',
    heb: 'HEB',
    jas: 'JAS',
    jam: 'JAS',
    pet1: '1PE',
    '1pet': '1PE',
    pet2: '2PE',
    '2pet': '2PE',
    john1: '1JN',
    '1jn': '1JN',
    john2: '2JN',
    '2jn': '2JN',
    john3: '3JN',
    '3jn': '3JN',
    jude: 'JUD',
    rev: 'REV'
  };

  function toast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('show');
    setTimeout(() => el.toast.classList.remove('show'), 2400);
  }

  function bookName(book) {
    return book ? book.commonName || book.name || book.id : '';
  }

  function currentBook() {
    return state.books.find((book) => book.id === state.bookId);
  }

  function reference() {
    return `${bookName(currentBook())} ${state.chapter}`;
  }

  function verseReference(verse) {
    return `${reference()}:${verse}`;
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/s+/g, ' ')
      .replace(/ ([”’.,;:!?])/g, '$1')
      .trim();
  }

  async function getJSON(path) {
    const url = path.startsWith('http') ? path : API + path;

    if (cache.has(url)) return cache.get(url);

    const promise = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });

    cache.set(url, promise);
    promise.catch(() => cache.delete(url));
    return promise;
  }

  function setTheme() {
    const root = document.documentElement;
    const dark = root.dataset.theme === 'dark';
    if (el.themeLabel) el.themeLabel.textContent = dark ? 'Light' : 'Dark';
  }

  function setupTheme() {
    const root = document.documentElement;

    el.themeBtn?.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme();
    });

    setTheme();
  }

  function setupSettings() {
    el.settingsBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      el.settings.hidden = !el.settings.hidden;
      el.settingsBtn.setAttribute(
        'aria-expanded',
        String(!el.settings.hidden)
      );
    });

    document.addEventListener('click', (event) => {
      if (
        el.settings &&
        !el.settings.hidden &&
        !el.settings.contains(event.target) &&
        event.target !== el.settingsBtn
      ) {
        el.settings.hidden = true;
      }
    });

    el.fontUp?.addEventListener('click', () => {
      state.fontStep = Math.min(5, state.fontStep + 1);
      document.documentElement.style.setProperty(
        '--read-size',
        `${1.1875 + state.fontStep * 0.125}rem`
      );
    });

    el.fontDown?.addEventListener('click', () => {
      state.fontStep = Math.max(-2, state.fontStep - 1);
      document.documentElement.style.setProperty(
        '--read-size',
        `${1.1875 + state.fontStep * 0.125}rem`
      );
    });

    el.followToggle?.addEventListener('change', () => {
      state.follow = el.followToggle.checked;
    });

    el.autoNextToggle?.addEventListener('change', () => {
      state.autoNext = el.autoNextToggle.checked;
    });

    el.numsToggle?.addEventListener('change', () => {
      el.scripture.classList.toggle(
        'hide-nums',
        !el.numsToggle.checked
      );
    });
  }

  function buildTranslationSelect() {
    el.trSel.innerHTML = '';

    TRANSLATIONS.forEach((group) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.group;

      group.items.forEach(([id, label]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        optgroup.appendChild(option);
      });

      el.trSel.appendChild(optgroup);
    });

    el.trSel.value = state.tr;
  }

  async function loadBooks() {
    const data = await getJSON(`/api/${state.tr}/books.json`);
    state.books = data.books.slice().sort((a, b) => a.order - b.order);
    state.lang = data.translation.language;
    state.translation = data.translation;
  }

  function updateHeader() {
    const book = currentBook();
    const name = bookName(book);

    el.refLabel.textContent = `${name} ${state.chapter}`;
    el.chapterBook.textContent = name;
    el.chapterNum.textContent = state.chapter;
    el.bookTitle.textContent =
      book?.title && book.title !== name
        ? book.title
        : book?.order >= 40
          ? 'New Testament'
          : 'Old Testament';
    el.trNote.textContent = state.translation?.name || '';
    document.title = `${name} ${state.chapter} — Selah`;

    const previous = previousReference();
    const next = nextReference();

    el.prevChap.disabled = !previous;
    el.nextChap.disabled = !next;

    if (previous) {
      el.prevLabel.textContent =
        `${bookName(state.books.find((b) => b.id === previous[0]))} ${previous[1]}`;
    }

    if (next) {
      el.nextLabel.textContent =
        `${bookName(state.books.find((b) => b.id === next[0]))} ${next[1]}`;
    }
  }

  function previousReference() {
    if (state.chapter > 1) {
      return [state.bookId, state.chapter - 1];
    }

    const index = state.books.findIndex((book) => book.id === state.bookId);

    if (index > 0) {
      const previous = state.books[index - 1];
      return [previous.id, previous.numberOfChapters];
    }

    return null;
  }

  function nextReference() {
    const book = currentBook();

    if (book && state.chapter < book.numberOfChapters) {
      return [state.bookId, state.chapter + 1];
    }

    const index = state.books.findIndex((item) => item.id === state.bookId);

    if (index >= 0 && index < state.books.length - 1) {
      return [state.books[index + 1].id, 1];
    }

    return null;
  }

  function contentText(parts) {
    return cleanText(
      parts
        .map((part) => (typeof part === 'string' ? part : part?.text || ''))
        .join(' ')
    );
  }

  function renderChapter(data) {
    const fragment = document.createDocumentFragment();
    let paragraph = null;

    state.verses = [];

    const newParagraph = () => {
      paragraph = document.createElement('p');
      fragment.appendChild(paragraph);
    };

    data.chapter.content.forEach((item) => {
      if (item.type === 'heading') {
        paragraph = null;
        const heading = document.createElement('h3');
        heading.textContent = contentText(item.content);
        fragment.appendChild(heading);
        return;
      }

      if (item.type === 'hebrew_subtitle') {
        paragraph = null;
        const subtitle = document.createElement('p');
        subtitle.className = 'subtitle';
        subtitle.textContent = contentText(item.content);
        fragment.appendChild(subtitle);
        return;
      }

      if (item.type === 'line_break') {
        paragraph = null;
        return;
      }

      if (item.type !== 'verse') return;

      if (!paragraph) newParagraph();

      const verse = document.createElement('span');
      verse.className = 'verse';
      verse.dataset.v = item.number;
      verse.id = `v${item.number}`;

      const number = document.createElement('sup');
      number.className = 'vnum';
      number.textContent = item.number;

      let first = true;
      const texts = [];

      item.content.forEach((part) => {
        let text = '';
        let poem = 0;
        let wordsOfJesus = false;

        if (typeof part === 'string') {
          text = part;
        } else if (part?.text) {
          text = part.text;
          poem = part.poem || 0;
          wordsOfJesus = Boolean(part.wordsOfJesus);
        } else if (part?.lineBreak) {
          verse.appendChild(document.createElement('br'));
          return;
        } else {
          return;
        }

        texts.push(text);

        const node = document.createElement('span');

        if (poem) {
          node.className = `poem-line${poem > 1 ? ' p2' : ''}`;
        }

        if (wordsOfJesus) node.classList.add('jesus');

        if (first) {
          node.appendChild(number);
          first = false;
        }

        node.appendChild(document.createTextNode(text));
        verse.appendChild(node);
      });

      if (first) verse.appendChild(number);

      if (paragraph.childNodes.length) {
        paragraph.appendChild(document.createTextNode(' '));
      }

      paragraph.appendChild(verse);

      state.verses.push({
        n: Number(item.number),
        text: cleanText(texts.join(' ')),
        el: verse
      });
    });

    el.scripture.replaceChildren(fragment);
    applyBookmarkMarks();
  }

  function setupAudioSources(data) {
    const links = data.thisChapterAudioLinks || {};

    el.narSel.innerHTML = '';

    Object.keys(links).forEach((key) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = NARRATORS[key] || key;
      el.narSel.appendChild(option);
    });

    if (synth) {
      const option = document.createElement('option');
      option.value = 'device';
      option.textContent = NARRATORS.device;
      el.narSel.appendChild(option);
    }

    let choice = state.narrator;

    if (choice !== 'device' && !links[choice]) {
      choice = Object.keys(links)[0] || (synth ? 'device' : '');
    }

    if (choice === 'device' && !synth) {
      choice = Object.keys(links)[0] || '';
    }

    state.narrator = choice;
    el.narSel.value = choice;
    applyNarrator(choice);
  }

  async function applyNarrator(choice) {
    const links = state.data?.thisChapterAudioLinks || {};
    state.timings = null;

    if (choice !== 'device' && links[choice]) {
      state.mode = 'audio';
      el.audio.src = links[choice];
      el.audio.playbackRate = state.speed;
      el.audio.preload = 'metadata';

      const timingPath =
        state.data.thisChapterAudioTimings?.[choice];

      if (timingPath) {
        try {
          const timingData = await getJSON(timingPath);
          state.timings = timingData.verses || null;
        } catch {
          state.timings = null;
        }
      }
    } else {
      state.mode = 'tts';
      el.audio.removeAttribute('src');
      el.audio.load();
    }

    renderProgress();
  }

  function setPlayingUI() {
    el.playBtn.classList.toggle('is-playing', state.playing);
    el.playBtn.classList.toggle('is-loading', state.loading);
    el.playBtn.setAttribute(
      'aria-label',
      state.playing ? 'Pause' : 'Play'
    );
  }

  function stopPlayback() {
    if (synth) synth.cancel();
    el.audio.pause();
    state.playing = false;
    state.loading = false;
    setPlayingUI();
  }

  function play(fromVerse = null) {
    if (!state.data) return;

    if (state.mode === 'audio') {
      if (fromVerse && state.timings) seekToVerse(fromVerse);

      state.loading = true;
      setPlayingUI();

      const promise = el.audio.play();

      promise?.catch(() => {
        state.loading = false;
        state.playing = false;
        setPlayingUI();
        toast('Audio could not start. Tap play again.');
      });

      return;
    }

    if (!synth) {
      toast('Read-aloud is not supported in this browser.');
      return;
    }

    if (fromVerse) {
      const index = state.verses.findIndex((v) => v.n === fromVerse);
      if (index >= 0) state.ttsIndex = index;
    }

    state.playing = true;
    setPlayingUI();
    speakCurrent();
  }

  function pause() {
    if (state.mode === 'audio') {
      el.audio.pause();
    } else {
      synth?.cancel();
    }

    state.playing = false;
    state.loading = false;
    setPlayingUI();
  }

  let speechToken = 0;

  function speakCurrent() {
    if (!state.playing || !synth) return;

    const verse = state.verses[state.ttsIndex];

    if (!verse) {
      state.playing = false;
      setPlayingUI();
      return;
    }

    speechToken += 1;
    const token = speechToken;

    markVerse(verse.n);

    const utterance = new SpeechSynthesisUtterance(verse.text);
    utterance.rate = state.speed;

    utterance.onend = () => {
      if (token !== speechToken || !state.playing) return;

      state.ttsIndex += 1;

      if (state.ttsIndex >= state.verses.length) {
        state.playing = false;
        setPlayingUI();

        if (state.autoNext) {
          const next = nextReference();
          if (next) loadChapter(next[0], next[1], { autoplay: true });
        }

        return;
      }

      speakCurrent();
    };

    utterance.onerror = () => {
      state.playing = false;
      setPlayingUI();
    };

    synth.speak(utterance);
  }

  function seekToVerse(number) {
    if (!state.timings) return;

    const time = state.timings[number - 1];

    if (typeof time !== 'number') return;

    el.audio.currentTime = Math.max(0, time - 0.05);
    markVerse(number);
  }

  function markVerse(number) {
    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-playing',
        verse.n === number
      );
    });

    state.currentVerse = number || 0;
    el.tNow.textContent = number
      ? verseReference(number)
      : reference();

    if (number && state.follow && state.playing) {
      const verse = state.verses.find((item) => item.n === number);

      verse?.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    if (number) savePosition(number);
  }

  function renderProgress() {
    const duration = Number.isFinite(el.audio.duration)
      ? el.audio.duration
      : 0;
    const current = Number.isFinite(el.audio.currentTime)
      ? el.audio.currentTime
      : 0;

    el.seek.max = duration || 1000;
    el.seek.value = duration ? current : 0;
    el.tCur.textContent = formatTime(current);
    el.tDur.textContent = formatTime(duration);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  async function loadChapter(bookId, chapter, options = {}) {
    const token = ++state.loadToken;

    stopPlayback();
    state.bookId = bookId;
    state.chapter = chapter;
    updateHeader();

    el.scripture.innerHTML = '<p>Loading chapter…</p>';

    try {
      const data = await getJSON(
        `/api/${state.tr}/${bookId}/${chapter}.json`
      );

      if (token !== state.loadToken) return;

      state.data = data;
      renderChapter(data);
      setupAudioSources(data);
      renderProgress();

      await restorePosition();

      if (options.verse) {
        const verse = state.verses.find((v) => v.n === options.verse);
        verse?.el.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      if (options.autoplay) {
        play(options.verse || null);
      }
    } catch (error) {
      console.erro
