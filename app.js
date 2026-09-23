(() => {
  'use strict';

  const API = 'https://bible.helloao.org';
  const SUPABASE_URL =
    'https://ylspdrjrvhixrregmqtg.supabase.co';
  const SUPABASE_KEY =
    'sb_publishable_Ar8T3NCh77i6YZfjN88wBQ_f8j7oool';

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
    popBookmark: $('popBookmark'),
    popBookmarkLabel: $('popBookmarkLabel'),
    toast: $('toast'),
    themeBtn: $('themeBtn'),
    themeLabel: $('themeLabel'),
    settingsBtn: $('settingsBtn'),
    settings: $('settingsPanel'),
    searchBtn: $('searchBtn'),
    bookmarksBtn: $('bookmarksBtn'),
    bmBadge: $('bmBadge'),
    searchDlg: $('searchDlg'),
    searchForm: $('searchForm'),
    searchInput: $('searchInput'),
    searchBody: $('searchBody'),
    bookmarksDlg: $('bookmarksDlg'),
    bmBody: $('bmBody'),
    fontUp: $('fontUp'),
    fontDown: $('fontDown'),
    followToggle: $('followToggle'),
    autoNextToggle: $('autoNextToggle'),
    numsToggle: $('numsToggle')
  };

  const state = {
    tr: 'BSB',
    books: [],
    bookId: 'JHN',
    chapter: 3,
    translation: null,
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
    selectedVerse: null,
    bookmarks: [],
    searchScope: 'all',
    loadToken: 0
  };

  const cache = new Map();
  const synth =
    'speechSynthesis' in window
      ? window.speechSynthesis
      : null;

  let db = null;
  let deviceId = null;

 const TRANSLATIONS = [
  {
    group: 'English',
    items: [
      ['BSB', 'Berean Standard Bible · Audio'],
      ['eng_kjv', 'King James Version'],
      ['ENGWEBP', 'World English Bible'],
      ['eng_asv', 'American Standard Version'],
      ['eng_net', 'NET Bible'],
      ['eng_bbe', 'Bible in Basic English'],
      ['eng_ylt', "Young's Literal Translation"],
      ['eng_dby', 'Darby Translation'],
      ['eng_rv', 'Revised Version'],
      ['eng_drc', 'Douay-Rheims'],
      ['eng_wey', 'Weymouth New Testament']
    ]
  },
  {
    group: 'Ghana and Africa',
    items: [
      ['twi_asa', 'Asante Twi'],
      ['twi_aka', 'Akuapem Twi'],
      ['ewe_bib', 'Eʋegbe (Ewe)'],
      ['hau_bib', 'Hausa'],
      ['yor_bib', 'Yorùbá'],
      ['swh_onmm', 'Kiswahili'],
      ['afr_1933', 'Afrikaans'],
      ['zul_1963', 'isiZulu'],
      ['xho_nta', 'isiXhosa'],
      ['sna_bza', 'Shona'],
      ['amh_bsi', 'Amharic'],
      ['kin_bwa', 'Kinyarwanda']
    ]
  },
  {
    group: 'European languages',
    items: [
      ['fra_lsg', 'Français — Louis Segond'],
      ['fra_apee', 'Français — APEE'],
      ['spa_r09', 'Español — Reina-Valera 1909'],
      ['por_blj', 'Português — Bíblia Livre'],
      ['deu_l12', 'Deutsch — Luther 1912'],
      ['ita_gio', 'Italiano — Giovanni Diodati'],
      ['nld_svva', 'Nederlands — Statenvertaling'],
      ['pol_ubg', 'Polski — Biblia Gdańska'],
      ['ron_corn', 'Română — Cornilescu'],
      ['rus_syn', 'Русский — Синодальный']
    ]
  ],
  {
    group: 'Other languages',
    items: [
      ['arb_vd', 'العربية — Van Dyke'],
      ['heb_wlc', 'עברית — Westminster Leningrad Codex'],
      ['zho_cuv', '中文 — Chinese Union Version'],
      ['jpn_1887', '日本語 — Japanese Bible'],
      ['kor_ko', '한국어 — Korean Bible'],
      ['ind_ayt', 'Bahasa Indonesia'],
      ['vie_ov', 'Tiếng Việt'],
      ['tam_irv', 'தமிழ்'],
      ['tel_irv', 'తెలుగు']
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
    ecc: 'ECC',
    eccl: 'ECC',
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

  function initializeDatabase() {
    if (!window.supabase?.createClient) {
      console.warn(
        'Supabase CDN did not load. Bookmarks are disabled.'
      );
      return;
    }

    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const storageKey = 'selah_device_id';

    deviceId =
      localStorage.getItem(storageKey) ||
      (
        crypto.randomUUID
          ? crypto.randomUUID()
          : `device-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`
      );

    localStorage.setItem(storageKey, deviceId);
  }

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

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2400);
  }

  function bookName(book) {
    return book?.commonName || book?.name || book?.id || '';
  }

  function currentBook() {
    return state.books.find(
      (book) => book.id === state.bookId
    );
  }

  function reference() {
    return `${bookName(currentBook())} ${state.chapter}`;
  }

  async function getJSON(path) {
    const url = path.startsWith('http')
      ? path
      : API + path;

    if (cache.has(url)) return cache.get(url);

    const request = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Bible API returned HTTP ${response.status}`);
      }

      return response.json();
    });

    cache.set(url, request);
    request.catch(() => cache.delete(url));

    return request;
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
    const data = await getJSON(
      `/api/${state.tr}/books.json`
    );

    const rawBooks = Array.isArray(data)
      ? data
      : Array.isArray(data.books)
        ? data.books
        : Array.isArray(data.translation?.books)
          ? data.translation.books
          : [];

    if (!rawBooks.length) {
      throw new Error(
        `No books returned for translation ${state.tr}`
      );
    }

    state.books = rawBooks
      .map((book, index) => ({
        ...book,
        id:
          book.id ||
          book.bookId ||
          book.usfm ||
          book.abbreviation,
        order: Number(
          book.order ??
          book.number ??
          index + 1
        ),
        numberOfChapters: Number(
          book.numberOfChapters ??
          book.chapters ??
          book.numberOfChaptersAvailable ??
          1
        )
      }))
      .filter(
        (book) =>
          book.id &&
          Number.isFinite(book.numberOfChapters) &&
          book.numberOfChapters > 0
      )
      .sort((a, b) => a.order - b.order);

    state.translation =
      data.translation ||
      data.translationInfo ||
      null;

    if (!state.books.length) {
      throw new Error('The API returned no usable books.');
    }
  }

  function updateHeader() {
    const book = currentBook();
    const name = bookName(book);

    el.refLabel.textContent = `${name} ${state.chapter}`;
    el.chapterBook.textContent = name;
    el.chapterNum.textContent = state.chapter;
    el.trNote.textContent =
      state.translation?.name || '';

    el.bookTitle.textContent =
      book?.title && book.title !== name
        ? book.title
        : book?.order >= 40
          ? 'New Testament'
          : 'Old Testament';

    document.title = `${name} ${state.chapter} — Selah`;

    const previous = previousReference();
    const next = nextReference();

    el.prevChap.disabled = !previous;
    el.nextChap.disabled = !next;

    el.prevLabel.textContent = previous
      ? `${bookName(
          state.books.find(
            (item) => item.id === previous[0]
          )
        )} ${previous[1]}`
      : 'Previous';

    el.nextLabel.textContent = next
      ? `${bookName(
          state.books.find(
            (item) => item.id === next[0]
          )
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
      const previous = state.books[index - 1];
      return [previous.id, previous.numberOfChapters];
    }

    return null;
  }

  function nextReference() {
    const book = currentBook();

    if (
      book &&
      state.chapter < book.numberOfChapters
    ) {
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

  function renderChapter(data) {
    const content =
      data?.chapter?.content ||
      data?.content ||
      [];

    if (!content.length) {
      el.scripture.innerHTML =
        '<p>No chapter content was returned.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    let paragraph = null;

    state.verses = [];

    function newParagraph() {
      paragraph = document.createElement('p');
      fragment.appendChild(paragraph);
    }

    content.forEach((item) => {
      if (item.type === 'heading') {
        paragraph = null;

        const heading = document.createElement('h3');
        heading.textContent = item.content
          ? cleanText(
              item.content
                .map((part) =>
                  typeof part === 'string'
                    ? part
                    : part?.text || ''
                )
                .join(' ')
            )
          : '';

        fragment.appendChild(heading);
        return;
      }

      if (item.type === 'hebrew_subtitle') {
        paragraph = null;

        const subtitle = document.createElement('p');
        subtitle.className = 'subtitle';
        subtitle.textContent = item.content
          ? cleanText(
              item.content
                .map((part) =>
                  typeof part === 'string'
                    ? part
                    : part?.text || ''
                )
                .join(' ')
            )
          : '';

        fragment.appendChild(subtitle);
        return;
      }

      if (item.type === 'line_break') {
        paragraph = null;
        return;
      }

      if (item.type !== 'verse') return;

      if (!paragraph) newParagraph();

      const verseElement = document.createElement('span');
      verseElement.className = 'verse';
      verseElement.dataset.v = item.number;
      verseElement.id = `v${item.number}`;

      const numberElement = document.createElement('sup');
      numberElement.className = 'vnum';
      numberElement.textContent = item.number;

      const partsText = [];
      let firstNode = true;

      (item.content || []).forEach((part) => {
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

        partsText.push(text);

        const node = document.createElement('span');

        if (poem) {
          node.className =
            `poem-line${poem > 1 ? ' p2' : ''}`;
        }

        if (wordsOfJesus) {
          node.classList.add('jesus');
        }

        if (firstNode) {
          node.appendChild(numberElement);
          firstNode = false;
        }

        node.appendChild(
          document.createTextNode(text)
        );

        verseElement.appendChild(node);
      });

      if (firstNode) {
        verseElement.appendChild(numberElement);
      }

      if (paragraph.childNodes.length) {
        paragraph.appendChild(
          document.createTextNode(' ')
        );
      }

      paragraph.appendChild(verseElement);

      state.verses.push({
        n: Number(item.number),
        text: cleanText(partsText.join(' ')),
        el: verseElement
      });
    });

    el.scripture.replaceChildren(fragment);
    applyBookmarkMarks();
  }

  async function loadChapter(
    bookId,
    chapter,
    options = {}
  ) {
    const token = ++state.loadToken;

    stopPlayback();

    state.bookId = bookId;
    state.chapter = Number(chapter);

    updateHeader();

    el.scripture.innerHTML =
      '<p>Loading Scripture…</p>';

    try {
      const data = await getJSON(
        `/api/${state.tr}/${bookId}/${chapter}.json`
      );

      if (token !== state.loadToken) return;

      state.data = data;
      renderChapter(data);
      setupAudioSources(data);
      renderProgress();

      restorePosition();

      if (options.verse) {
        const verse = state.verses.find(
          (item) =>
            item.n === Number(options.verse)
        );

        verse?.el.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      if (options.autoplay) {
        play(options.verse || null);
      }
    } catch (error) {
      console.error('Chapter loading failed:', error);

      el.scripture.innerHTML = `
        <div class="errorbox">
          <strong>Could not load ${reference()}.</strong>
          <p>${escapeHTML(error.message)}</p>
          <button id="retryBtn" type="button">
            Try again
          </button>
        </div>
      `;

      $('retryBtn')?.addEventListener(
        'click',
        () => loadChapter(bookId, chapter, options)
      );
    }
  }

  function escapeHTML(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        })[character]
    );
  }

  function setupAudioSources(data) {
    const links =
      data?.thisChapterAudioLinks || {};

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

    let narrator = state.narrator;

    if (
      narrator !== 'device' &&
      !links[narrator]
    ) {
      narrator = Object.keys(links)[0] || '';
    }

    if (!narrator && synth) {
      narrator = 'device';
    }

    if (narrator === 'device' && !synth) {
      narrator = Object.keys(links)[0] || '';
    }

    state.narrator = narrator;
    el.narSel.value = narrator;
    applyNarrator(narrator);
  }

  async function applyNarrator(narrator) {
    const links =
      state.data?.thisChapterAudioLinks || {};

    state.timings = null;

    if (
      narrator !== 'device' &&
      links[narrator]
    ) {
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
    synth?.cancel();
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

      const request = el.audio.play();

      request?.catch((error) => {
        console.error(error);
        state.playing = false;
        state.loading = false;
        setPlayingUI();
        toast('Audio could not start.');
      });

      return;
    }

    if (!synth) {
      toast('Device voice is unavailable.');
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
    synth?.cancel();
    el.audio.pause();

    state.playing = false;
    state.loading = false;

    setPlayingUI();
  }

  function speakCurrent() {
    if (!state.playing || !synth) return;

    const verse = state.verses[state.ttsIndex];

    if (!verse) {
      state.playing = false;
      setPlayingUI();
      return;
    }

    markVerse(verse.n);

    const utterance = new SpeechSynthesisUtterance(
      verse.text
    );

    utterance.rate = state.speed;

    utterance.onend = () => {
      if (!state.playing) return;

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

  function markVerse(number) {
    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-playing',
        verse.n === Number(number)
      );
    });

    state.currentVerse = Number(number) || 0;

    el.tNow.textContent = number
      ? `${reference()}:${number}`
      : reference();

    if (number) {
      savePosition(number);
    }

    if (
      number &&
      state.follow &&
      state.playing
    ) {
      const verse = state.verses.find(
        (item) => item.n === Number(number)
      );

      verse?.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  function seekToVerse(number) {
    if (!state.timings) return;

    const time = state.timings[Number(number) - 1];

    if (typeof time !== 'number') return;

    el.audio.currentTime = Math.max(
      0,
      time - 0.05
    );

    markVerse(number);
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

  async function savePosition(verse) {
    if (!db || !deviceId) return;

    const { error } = await db
      .from('selah_positions')
      .upsert(
        {
          user_id: deviceId,
          tr: state.tr,
          book: state.bookId,
          chapter: state.chapter,
          verse: Number(verse) || 0,
          narrator: state.narrator || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      );

    if (error) {
      console.warn(
        'Position save failed:',
        error.message
      );
    }
}
  async function restorePosition() {
    if (!db || !deviceId) return;

    const { data, error } = await db
      .from('selah_positions')
      .select('*')
      .eq('user_id', deviceId)
      .maybeSingle();

    if (error || !data) return;

    if (
      data.tr !== state.tr ||
      data.book !== state.bookId ||
      Number(data.chapter) !== Number(state.chapter)
    ) {
      return;
    }

    const verse = state.verses.find(
      (item) => item.n === Number(data.verse)
    );

    verse?.el.scrollIntoView({
      behavior: 'auto',
      block: 'center'
    });
  }

  async function loadBookmarks() {
    if (!db || !deviceId) return;

    const { data, error } = await db
      .from('selah_bookmarks')
      .select('*')
      .eq('user_id', deviceId)
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.warn(
        'Bookmark load failed:',
        error.message
      );
      return;
    }

    state.bookmarks = data || [];
    updateBookmarkBadge();
    applyBookmarkMarks();
  }

  function isBookmarked(book, chapter, verse, tr) {
    return state.bookmarks.some(
      (item) =>
        item.tr === (tr || state.tr) &&
        item.book === book &&
        Number(item.chapter) === Number(chapter) &&
        Number(item.verse) === Number(verse)
    );
  }

  async function toggleBookmark(verse) {
    if (!db || !deviceId) {
      toast('Bookmarks are unavailable.');
      return;
    }

    const existing = state.bookmarks.find(
      (item) =>
        item.tr === state.tr &&
        item.book === state.bookId &&
        Number(item.chapter) === Number(state.chapter) &&
        Number(item.verse) === Number(verse)
    );

    if (existing) {
      const { error } = await db
        .from('selah_bookmarks')
        .delete()
        .eq('id', existing.id);

      if (error) {
        toast('Could not remove bookmark.');
        return;
      }

      toast('Bookmark removed.');
    } else {
      const verseData = state.verses.find(
        (item) => item.n === Number(verse)
      );

      const { error } = await db
        .from('selah_bookmarks')
        .insert({
          user_id: deviceId,
          tr: state.tr,
          book: state.bookId,
          chapter: state.chapter,
          verse: Number(verse),
          book_name: bookName(currentBook()),
          text: verseData?.text || ''
        });

      if (error) {
        console.error(error);
        toast('Could not save bookmark.');
        return;
      }

      toast('Bookmark saved.');
    }

    await loadBookmarks();
    updatePopoverBookmark();
  }

  function applyBookmarkMarks() {
    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-bookmarked',
        isBookmarked(
          state.bookId,
          state.chapter,
          verse.n,
          state.tr
        )
      );
    });
  }

  function updateBookmarkBadge() {
    const count = state.bookmarks.length;

    el.bmBadge.hidden = count === 0;
    el.bmBadge.textContent = String(count);
  }

  function updatePopoverBookmark() {
    if (!state.selectedVerse) return;

    el.popBookmarkLabel.textContent =
      isBookmarked(
        state.bookId,
        state.chapter,
        state.selectedVerse,
        state.tr
      )
        ? 'Remove bookmark'
        : 'Bookmark';
  }

  function openPicker() {
    el.picker.hidden = false;
    el.pickerTitle.textContent = 'Choose a book';
    el.pickerBack.hidden = true;
    renderBookPicker('');
  }

  function renderBookPicker(filter) {
    const query = String(filter || '')
      .trim()
      .toLowerCase();

    el.pickerBody.innerHTML = '';

    state.books
      .filter((book) =>
        bookName(book)
          .toLowerCase()
          .includes(query)
      )
      .forEach((book) => {
        const button = document.createElement('button');
        button.className = 'picker-item';
        button.type = 'button';
        button.textContent = bookName(book);

        button.addEventListener('click', () => {
          state.bookId = book.id;
          state.chapter = 1;
          renderChapterPicker();
        });

        el.pickerBody.appendChild(button);
      });
  }

  function renderChapterPicker() {
    const book = currentBook();

    el.pickerTitle.textContent = bookName(book);
    el.pickerBack.hidden = false;
    el.pickerBody.innerHTML = '';

    for (
      let chapter = 1;
      chapter <= book.numberOfChapters;
      chapter += 1
    ) {
      const button = document.createElement('button');
      button.className = 'picker-item picker-item--chapter';
      button.type = 'button';
      button.textContent = String(chapter);

      button.addEventListener('click', () => {
        closeDialogs();
        loadChapter(state.bookId, chapter);
      });

      el.pickerBody.appendChild(button);
    }
          }
  function showPopover(verse, event) {
    state.selectedVerse = Number(verse);
    el.pop.hidden = false;

    updatePopoverBookmark();

    const rect =
      event.currentTarget.getBoundingClientRect();

    el.pop.style.left =
      `${Math.max(12, rect.left)}px`;

    el.pop.style.top =
      `${rect.bottom + window.scrollY + 8}px`;
  }

  function hidePopover() {
    el.pop.hidden = true;
    state.selectedVerse = null;
  }

  function closeDialogs() {
    [
      el.picker,
      el.searchDlg,
      el.bookmarksDlg
    ].forEach((dialog) => {
      if (dialog) dialog.hidden = true;
    });

    hidePopover();
  }

  function setupVerseEvents() {
    el.scripture.addEventListener('click', (event) => {
      const verse = event.target.closest('.verse');

      if (!verse) return;

      showPopover(
        Number(verse.dataset.v),
        event
      );
    });

    el.popPlay.addEventListener('click', () => {
      const verse = state.selectedVerse;
      hidePopover();
      play(verse);
    });

    el.popBookmark.addEventListener('click', () => {
      const verse = state.selectedVerse;
      hidePopover();
      toggleBookmark(verse);
    });

    el.popCopy.addEventListener('click', async () => {
      const verse = state.verses.find(
        (item) => item.n === state.selectedVerse
      );

      if (!verse) return;

      try {
        await navigator.clipboard.writeText(
          `${reference()}:${verse.n} — ${verse.text}`
        );

        toast('Verse copied.');
      } catch {
        toast('Copy failed.');
      }

      hidePopover();
    });
  }

  function openBookmarks() {
    el.bookmarksDlg.hidden = false;
    renderBookmarks();
  }

  function renderBookmarks() {
    el.bmBody.innerHTML = '';

    if (!state.bookmarks.length) {
      el.bmBody.innerHTML =
        '<p>No bookmarks yet.</p>';
      return;
    }

    state.bookmarks.forEach((bookmark) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'bookmark-item';

      const button = document.createElement('button');
      button.className = 'bookmark-item__main';
      button.type = 'button';

      const title = document.createElement('strong');
      title.textContent =
        `${bookmark.book_name || bookmark.book} ` +
        `${bookmark.chapter}:${bookmark.verse}`;

      const text = document.createElement('span');
      text.textContent = bookmark.text || '';

      button.append(title, text);

      button.addEventListener('click', () => {
        closeDialogs();

        state.tr = bookmark.tr;
        el.trSel.value = bookmark.tr;

        loadChapter(
          bookmark.book,
          bookmark.chapter,
          {
            verse: Number(bookmark.verse)
          }
        );
      });

      const remove = document.createElement('button');
      remove.className = 'bookmark-item__remove';
      remove.type = 'button';
      remove.textContent = 'Remove';

      remove.addEventListener('click', async () => {
        if (!db) return;

        const { error } = await db
          .from('selah_bookmarks')
          .delete()
          .eq('id', bookmark.id);

        if (error) {
          toast('Could not remove bookmark.');
          return;
        }

        await loadBookmarks();
        renderBookmarks();
      });

      wrapper.append(button, remove);
      el.bmBody.appendChild(wrapper);
    });
  }

  async function searchBible(query) {
    const term = query.trim().toLowerCase();

    if (!term) {
      el.searchBody.innerHTML =
        '<p>Type a word or phrase to search.</p>';
      return;
    }

    el.searchBody.innerHTML =
      '<p>Searching the Bible…</p>';

    const results = [];

    const books = state.books.filter((book) => {
      if (state.searchScope === 'ot') {
        return book.order < 40;
      }

      if (state.searchScope === 'nt') {
        return book.order >= 40;
      }

      return true;
    });

    for (const book of books) {
      for (
        let chapter = 1;
        chapter <= book.numberOfChapters;
        chapter += 1
      ) {
        try {
          const data = await getJSON(
            `/api/${state.tr}/${book.id}/${chapter}.json`
          );
          const content =
            data?.chapter?.content ||
            data?.content ||
            [];

          content.forEach((item) => {
            if (item.type !== 'verse') return;

            const text = cleanText(
              (item.content || [])
                .map((part) =>
                  typeof part === 'string'
                    ? part
                    : part?.text || ''
                )
                .join(' ')
            );

            if (text.toLowerCase().includes(term)) {
              results.push({
                book,
                chapter,
                verse: Number(item.number),
                text
              });
            }
          });
        } catch {
          // Continue searching other chapters.
        }

        if (results.length >= 100) break;
      }

      if (results.length >= 100) break;
    }

    renderSearchResults(results);
  }

  function renderSearchResults(results) {
    el.searchBody.innerHTML = '';

    if (!results.length) {
      el.searchBody.innerHTML =
        '<p>No matches found.</p>';
      return;
    }

    results.forEach((result) => {
      const button = document.createElement('button');
      button.className = 'search-result';
      button.type = 'button';

      const title = document.createElement('strong');
      title.textContent =
        `${bookName(result.book)} ` +
        `${result.chapter}:${result.verse}`;

      const text = document.createElement('span');
      text.textContent = result.text;

      button.append(title, text);

      button.addEventListener('click', () => {
        closeDialogs();

        loadChapter(
          result.book.id,
          result.chapter,
          {
            verse: result.verse
          }
        );
      });

      el.searchBody.appendChild(button);
    });
  }

  function setupTheme() {
    el.themeBtn.addEventListener('click', () => {
      document.documentElement.dataset.theme =
        document.documentElement.dataset.theme === 'dark'
          ? 'light'
          : 'dark';

      el.themeLabel.textContent =
        document.documentElement.dataset.theme === 'dark'
          ? 'Light'
          : 'Dark';
    });
  }

  function setupSettings() {
    el.settingsBtn.addEventListener('click', (event) => {
      event.stopPropagation();

      const open = el.settings.hidden;
      el.settings.hidden = !open;

      el.settingsBtn.setAttribute(
        'aria-expanded',
        String(open)
      );
    });

    el.fontUp.addEventListener('click', () => {
      const current =
        parseFloat(
          getComputedStyle(
            document.documentElement
          ).getPropertyValue('--read-size')
        ) || 1.1875;

      document.documentElement.style.setProperty(
        '--read-size',
        `${Math.min(current + 0.125, 1.8125)}rem`
      );
    });

    el.fontDown.addEventListener('click', () => {
      const current =
        parseFloat(
          getComputedStyle(
            document.documentElement
          ).getPropertyValue('--read-size')
        ) || 1.1875;

      document.documentElement.style.setProperty(
        '--read-size',
        `${Math.max(current - 0.125, 0.9375)}rem`
      );
    });

    el.followToggle.addEventListener('change', () => {
      state.follow = el.followToggle.checked;
    });

    el.autoNextToggle.addEventListener('change', () => {
      state.autoNext = el.autoNextToggle.checked;
    });

    el.numsToggle.addEventListener('change', () => {
      el.scripture.classList.toggle(
        'hide-nums',
        !el.numsToggle.checked
      );
    });
  }

  function setupAudio() {
    el.playBtn.addEventListener('click', () => {
      state.playing ? pause() : play();
    });

    el.prevVerse.addEventListener('click', () => {
      const index = state.verses.findIndex(
        (verse) => verse.n === state.currentVerse
      );

      if (index > 0) {
        play(state.verses[index - 1].n);
      }
    });

    el.nextVerse.addEventListener('click', () => {
      const index = state.verses.findIndex(
        (verse) => verse.n === state.currentVerse
      );

      if (
        index >= 0 &&
        index < state.verses.length - 1
      ) {
        play(state.verses[index + 1].n);
      }
    });

    el.seek.addEventListener('input', () => {
      if (state.mode === 'audio') {
        el.audio.currentTime = Number(el.seek.value);
      }
    });

    el.speedBtn.addEventListener('click', () => {
      const speeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
      const index = speeds.indexOf(state.speed);

      state.speed =
        speeds[(index + 1) % speeds.length];

      el.speedBtn.textContent = `${state.speed}×`;
      el.audio.playbackRate = state.speed;
    });

    el.narSel.addEventListener('change', async () => {
      const wasPlaying = state.playing;
      const verse = state.currentVerse || null;
      stopPlayback();

      state.narrator = el.narSel.value;
      await applyNarrator(state.narrator);

      if (wasPlaying) play(verse);
    });

    el.audio.addEventListener('playing', () => {
      state.playing = true;
      state.loading = false;
      setPlayingUI();
    });

    el.audio.addEventListener('pause', () => {
      state.playing = false;
      state.loading = false;
      setPlayingUI();
    });

    el.audio.addEventListener('loadedmetadata', renderProgress);

    el.audio.addEventListener('timeupdate', () => {
      renderProgress();

      if (!state.timings) return;

      let verseNumber = 0;

      state.timings.forEach((start, index) => {
        if (start <= el.audio.currentTime) {
          verseNumber = index + 1;
        }
      });

      if (
        verseNumber &&
        verseNumber !== state.currentVerse
      ) {
        markVerse(verseNumber);
      }
    });

    el.audio.addEventListener('ended', () => {
      state.playing = false;
      setPlayingUI();

      if (!state.autoNext) return;

      const next = nextReference();

      if (next) {
        loadChapter(next[0], next[1], {
          autoplay: true
        });
      }
    });

    el.audio.addEventListener('error', () => {
      state.playing = false;
      state.loading = false;
      setPlayingUI();
      toast('Audio unavailable. Try another narrator.');
    });
  }

  function setupNavigation() {
    el.refBtn.addEventListener('click', openPicker);

    el.pickerBack.addEventListener('click', () => {
      el.pickerTitle.textContent = 'Choose a book';
      el.pickerBack.hidden = true;
      renderBookPicker('');
    });

    el.jumpForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const value = el.jumpInput.value.trim();
      const match = value.match(
        /^(.+?)s+(d+)(?::(d+))?$/
      );

      if (!match) {
        renderBookPicker(value);
        return;
      }

      const alias = match[1]
        .toLowerCase()
        .replace(/s+/g, '');

      const bookId = BOOK_ALIASES[alias];

      if (!bookId) {
        toast('Book not found.');
        return;
      }

      closeDialogs();

      loadChapter(
        bookId,
        Number(match[2]),
        {
          verse: match[3]
            ? Number(match[3])
            : null
        }
      );
    });

    el.prevChap.addEventListener('click', () => {
      const previous = previousReference();

      if (previous) {
        loadChapter(previous[0], previous[1]);
      }
    });

    el.nextChap.addEventListener('click', () => {
      const next = nextReference();

      if (next) {
        loadChapter(next[0], next[1]);
      }
    });

    el.trSel.addEventListener('change', async () => {
      stopPlayback();
      state.tr = el.trSel.value;

      try {
        await loadBooks();

        if (!currentBook()) {
          state.bookId = state.books[0].id;
          state.chapter = 1;
        }

        await loadChapter(state.bookId, state.chapter);
      } catch (error) {
        console.error(error);
        toast('Could not load that translation.');
      }
    });

    document.querySelectorAll('[data-close]')
      .forEach((button) => {
        button.addEventListener('click', closeDialogs);
      });
  }

  function setupSearch() {
    el.searchBtn.addEventListener('click', () => {
      el.searchDlg.hidden = false;
      el.searchInput.focus();
    });

    el.searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      searchBible(el.searchInput.value);
    });

    document.querySelectorAll('[data-scope]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          state.searchScope = button.dataset.scope;

          document.querySelectorAll('[data-scope]')
            .forEach((item) => {
              item.setAttribute(
                'aria-checked',
                String(item === button)
              );
            });

          if (el.searchInput.value.trim()) {
            searchBible(el.searchInput.value);
          }
        });
      });
  }

  function setupDialogs() {
    el.bookmarksBtn.addEventListener(
      'click',
      openBookmarks
    );

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDialogs();
      }
    });
  }

  async function start() {
    initializeDatabase();
    setupTheme();
    setupSettings();
    setupAudio();
    setupNavigation();
    setupSearch();
    setupDialogs();
    setupVerseEvents();
    buildTranslationSelect();

    try {
      await loadBooks();

      if (!currentBook()) {
        state.bookId = state.books[0].id;
        state.chapter = 1;
      }

      await loadChapter(
        state.bookId,
        state.chapter
      );

      loadBookmarks().catch((error) => {
        console.warn(
          'Bookmarks unavailable:',
          error
        );
      });
    } catch (error) {
      console.error(
        'Selah startup failed:',
        error
      );

      el.scripture.innerHTML = `
        <div class="errorbox">
          <strong>Selah could not load the Bible.</strong>
          <p>${escapeHTML(error.message)}</p>
          <button id="reloadApp" type="button">
            Try again
          </button>
        </div>
      `;

      $('reloadApp')?.addEventListener(
        'click',
        () => window.location.reload()
      );
    }
  }

  start();
})();
    
