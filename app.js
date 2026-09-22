(() => {
  'use strict';

  const API = 'https://bible.helloao.org';
  const SUPABASE_URL = 'https://ylspdrjrvhixrregmqtg.supabase.co';
  const SUPABASE_KEY =
    'sb_publishable_Ar8T3NCh77i6YZfjN88wBQ_f8j7oool';

  if (!window.supabase) {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<p style="padding:1rem;color:#900">Supabase failed to load.</p>'
    );
    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const DEVICE_KEY = 'selah_device_id';
  const DEVICE_ID =
    localStorage.getItem(DEVICE_KEY) ||
    (crypto.randomUUID
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  localStorage.setItem(DEVICE_KEY, DEVICE_ID);

  const $ = (id) => document.getElementById(id);

  const el = {
    audio: $('audio'),
    scripture: $('scripture'),
    refLabel: $('refLabel'),
    refBtn: $('refBtn'),
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

  const synth =
    'speechSynthesis' in window ? window.speechSynthesis : null;

  const state = {
    tr: 'BSB',
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
    bookmarks: [],
    searchScope: 'all',
    loadToken: 0
  };

  const cache = new Map();

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
    ex: 'EXO',
    exod: 'EXO',
    lev: 'LEV',
    num: 'NUM',
    deut: 'DEU',
    dt: 'DEU',
    josh: 'JOS',
    judg: 'JDG',
    ruth: 'RUT',
    '1sam': '1SA',
    '2sam': '2SA',
    '1kgs': '1KI',
    '2kgs': '2KI',
    '1ki': '1KI',
    '2ki': '2KI',
    '1chr': '1CH',
    '2chr': '2CH',
    ps: 'PSA',
    psa: 'PSA',
    prov: 'PRO',
    eccl: 'ECC',
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
    '1cor': '1CO',
    '2cor': '2CO',
    gal: 'GAL',
    eph: 'EPH',
    phil: 'PHP',
    php: 'PHP',
    col: 'COL',
    '1thess': '1TH',
    '2thess': '2TH',
    '1tim': '1TI',
    '2tim': '2TI',
    tit: 'TIT',
    phlm: 'PHM',
    heb: 'HEB',
    jas: 'JAS',
    jam: 'JAS',
    '1pet': '1PE',
    '2pet': '2PE',
    '1jn': '1JN',
    '2jn': '2JN',
    '3jn': '3JN',
    jude: 'JUD',
    rev: 'REV'
  };

  function cleanText(value) {
    return String(value || '')
      .replace(/s+/g, ' ')
      .replace(/ ([”’.,;:!?])/g, '$1')
      .trim();
  }

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) value = 0;
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function showToast(message) {
    if (!el.toast) return;

    el.toast.textContent = message;
    el.toast.classList.add('show');

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2400);
  }

  function bookName(book) {
    return book
      ? book.commonName || book.name || book.id
      : '';
  }

  function currentBook() {
    return state.books.find((book) => book.id === state.bookId);
  }

  function currentReference() {
    return `${bookName(currentBook())} ${state.chapter}`;
  }

  function verseReference(verse) {
    return `${currentReference()}:${verse}`;
  }

  async function getJSON(path) {
    const url = path.startsWith('http') ? path : API + path;

    if (cache.has(url)) {
      return cache.get(url);
    }

    const request = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    });

    cache.set(url, request);
    request.catch(() => cache.delete(url));

    return request;
  }

  function showLoading() {
    el.scripture.innerHTML = `
      <div class="sk" style="width:100%"></div>
      <div class="sk" style="width:94%"></div>
      <div class="sk" style="width:86%"></div>
      <div class="sk" style="width:72%"></div>
    `;
  }

  function setupTheme() {
    const root = document.documentElement;

    if (
      !root.dataset.theme &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ) {
      root.dataset.theme = 'dark';
    }

    if (!root.dataset.theme) {
      root.dataset.theme = 'light';
    }

    updateThemeLabel();

    el.themeBtn?.addEventListener('click', () => {
      root.dataset.theme =
        root.dataset.theme === 'dark' ? 'light' : 'dark';

      updateThemeLabel();
    });
  }

  function updateThemeLabel() {
    el.themeLabel.textContent =
      document.documentElement.dataset.theme === 'dark'
        ? 'Light'
        : 'Dark';
  }

  function setupSettings() {
    el.settingsBtn?.addEventListener('click', (event) => {
      event.stopPropagation();

      const opening = el.settings.hidden;
      el.settings.hidden = !opening;
      el.settingsBtn.setAttribute(
        'aria-expanded',
        String(opening)
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
        el.settingsBtn.setAttribute('aria-expanded', 'false');
      }
    });

    el.fontUp?.addEventListener('click', () => {
      state.fontStep = Math.min(5, state.fontStep + 1);
      applyFontSize();
    });

    el.fontDown?.addEventListener('click', () => {
      state.fontStep = Math.max(-2, state.fontStep - 1);
      applyFontSize();
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

  function applyFontSize() {
    const size = 1.1875 + state.fontStep * 0.125;
    document.documentElement.style.setProperty(
      '--read-size',
      `${size}rem`
    );
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

    state.books = data.books
      .slice()
      .sort((a, b) => a.order - b.order);

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

    el.prevLabel.textContent = previous
      ? `${bookName(
          state.books.find((item) => item.id === previous[0])
        )} ${previous[1]}`
      : 'Previous';

    el.nextLabel.textContent = next
      ? `${bookName(
          state.books.find((item) => item.id === next[0])
        )} ${next[1]}`
      : 'Next';
  }

  function previousReference() {
    if (state.chapter > 1) {
      return [state.bookId, state.chapter - 1];
    }

    const index = state.books.findIndex(
      (book) => book.id === state.bookId
    );

    if (index > 0) {
      const book = state.books[index - 1];
      return [book.id, book.numberOfChapters];
    }

    return null;
  }

  function nextReference() {
    const book = currentBook();

    if (book && state.chapter < book.numberOfChapters) {
      return [state.bookId, state.chapter + 1];
    }

    const index = state.books.findIndex(
      (item) => item.id === state.bookId
    );

    if (index >= 0 && index < state.books.length - 1) {
      return [state.books[index + 1].id, 1];
    }

    return null;
  }

  function contentText(parts) {
    return cleanText(
      parts
        .map((part) =>
          typeof part === 'string' ? part : part?.text || ''
        )
        .join(' ')
    );
  }

  function renderChapter(data) {
    const fragment = document.createDocumentFragment();
    let paragraph = null;

    state.verses = [];

    const createParagraph = () => {
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

      if (!paragraph) createParagraph();

      const verseElement = document.createElement('span');
      verseElement.className = 'verse';
      verseElement.dataset.v = item.number;
      verseElement.id = `v${item.number}`;

      const numberElement = document.createElement('sup');
      numberElement.className = 'vnum';
      numberElement.textContent = item.number;

      const textParts = [];
      let firstTextNode = true;

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
          verseElement.appendChild(
            document.createElement('br')
          );
          return;
        } else {
          return;
        }

        textParts.push(text);

        const node = document.createElement('span');

        if (poem) {
          node.className =
            `poem-line${poem > 1 ? ' p2' : ''}`;
        }

        if (wordsOfJesus) {
          node.classList.add('jesus');
        }

        if (firstTextNode) {
          node.appendChild(numberElement);
          firstTextNode = false;
        }

        node.appendChild(document.createTextNode(text));
        verseElement.appendChild(node);
      });

      if (firstTextNode) {
        verseElement.appendChild(numberElement);
      }

      if (paragraph.childNodes.length) {
        paragraph.appendChild(document.createTextNode(' '));
      }

      paragraph.appendChild(verseElement);

      state.verses.push({
        n: Number(item.number),
        text: cleanText(textParts.join(' ')),
        el: verseElement
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

    let selected = state.narrator;

    if (selected !== 'device' && !links[selected]) {
      selected = Object.keys(links)[0] || '';
    }

    if (!selected && synth) {
      selected = 'device';
    }

    if (selected === 'device' && !synth) {
      selected = Object.keys(links)[0] || '';
    }

    state.narrator = selected;
    el.narSel.value = selected;
    applyNarrator(selected);
  }

  async function applyNarrator(narrator) {
    const links = state.data?.thisChapterAudioLinks || {};
    state.timings = null;

    if (narrator !== 'device' && links[narrator]) {
      state.mode = 'audio';
      el.audio.src = links[narrator];
      el.audio.playbackRate = state.speed;
      el.audio.preload = 'metadata';

      const timingPath =
        state.data?.thisChapterAudioTimings?.[narrator];

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
    el.playBtn.classList.toggle(
      'is-playing',
      state.playing
    );

    el.playBtn.classList.toggle(
      'is-loading',
      state.loading
    );

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
      if (fromVerse && state.timings) {
        seekToVerse(fromVerse);
      }

      state.loading = true;
      setPlayingUI();

      const promise = el.audio.play();

      promise?.catch(() => {
        state.loading = false;
        state.playing = false;
        setPlayingUI();
        showToast('Audio could not start. Tap play again.');
      });

      return;
    }

    if (!synth) {
      showToast('Read-aloud is not supported here.');
      return;
    }

    if (fromVerse) {
      const index = state.verses.findIndex(
        (verse) => verse.n === fromVerse
      );

      if (index >= 0) {
        state.ttsIndex = index;
      }
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

    const utterance = new SpeechSynthesisUtterance(
      verse.text
    );

    utterance.rate = state.speed;

    utterance.onend = () => {
      if (token !== speechToken || !state.playing) {
        return;
      }

      state.ttsIndex += 1;

      if (state.ttsIndex >= state.verses.length) {
        state.playing = false;
        setPlayingUI();

        if (state.autoNext) {
          const next = nextReference();

          if (next) {
            loadChapter(next[0], next[1], {
              autoplay: true
            });
          }
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

  function seekToVerse(verseNumber) {
    if (!state.timings) return;

    const time = state.timings[verseNumber - 1];

    if (typeof time !== 'number') return;

    el.audio.currentTime = Math.max(0, time - 0.05);
    markVerse(verseNumber);
  }

  function markVerse(number) {
    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-playing',
        verse.n === number
      );
    });

    state.currentVerse = Number(number) || 0;

    el.tNow.textContent = number
      ? verseReference(number)
      : currentReference();

    if (number) {
      savePosition(number);
    }

    if (number && state.follow && state.playing) {
      const verse = state.verses.find(
        (item) => item.n === number
      );

      verse?.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  function renderProgress() {
    const duration = Number.isF
