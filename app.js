(() => {
  'use strict';

  const SUPABASE_URL =
    'https://ylspdrjrvhixrregmqtg.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_Ar8T3NCh77i6YZfjN88wBQ_f8j7oool';

  const supabaseClient =
    window.supabase?.createClient
      ? window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        )
      : null;

  const BOOKS_API =
    'https://bible.helloao.org/api';

  const $ = (id) =>
    document.getElementById(id);

  const state = {
    tr: 'BSB',
    books: [],
    bookId: 'JHN',
    chapter: 3,
    data: null,
    verses: [],
    narrator: 'souer',
    mode: 'audio',
    playing: false,
    currentVerse: 0,
    selectedVerse: 0,
    speed: 1,
    follow: true,
    autoNext: true,
    bookmarks: [],
    user: null
  };

  const el = {
    audio: $('audio'),
    scripture: $('scripture'),
    refBtn: $('refBtn'),
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
    popBookmark: $('popBookmark'),
    popBookmarkLabel: $('popBookmarkLabel'),
    toast: $('toast'),
    searchBtn: $('searchBtn'),
    searchDlg: $('searchDlg'),
    searchForm: $('searchForm'),
    searchInput: $('searchInput'),
    searchBody: $('searchBody'),
    bookmarksBtn: $('bookmarksBtn'),
    bookmarksDlg: $('bookmarksDlg'),
    bmBadge: $('bmBadge'),
    bmBody: $('bmBody'),
    settingsBtn: $('settingsBtn'),
    settings: $('settingsPanel'),
    themeBtn: $('themeBtn'),
    themeLabel: $('themeLabel'),
    fontUp: $('fontUp'),
    fontDown: $('fontDown'),
    followToggle: $('followToggle'),
    autoNextToggle: $('autoNextToggle'),
    numsToggle: $('numsToggle'),
    continueBtn: $('continueBtn'),
    browseBtn: $('browseBtn'),
    readerBookmarkBtn: $('readerBookmarkBtn'),
    heroReference: $('heroReference'),
    heroTranslation: $('heroTranslation')
  };
  const translations = [
    {
      group: 'English',
      items: [
        ['BSB', 'Berean Standard Bible'],
        ['eng_kjv', 'King James Version'],
        ['ENGWEBP', 'World English Bible'],
        ['eng_asv', 'American Standard Version'],
        ['eng_net', 'NET Bible'],
        ['eng_bbe', 'Bible in Basic English'],
        ['eng_ylt', "Young's Literal Translation"],
        ['eng_dby', 'Darby Translation']
      ]
    },
    {
      group: 'Ghana and Africa',
      items: [
        ['twi_asa', 'Asante Twi'],
        ['twi_aka', 'Akuapem Twi'],
        ['ewe_bib', 'Eʋegbe'],
        ['hau_bib', 'Hausa'],
        ['yor_bib', 'Yorùbá'],
        ['swh_onmm', 'Kiswahili']
      ]
    },
    {
      group: 'Other languages',
      items: [
        ['fra_lsg', 'Français — Louis Segond'],
        ['spa_r09', 'Español — Reina-Valera 1909'],
        ['por_blj', 'Português — Bíblia Livre'],
        ['deu_l12', 'Deutsch — Luther 1912']
      ]
    }
  ];

  const aliases = {
    gen: 'GEN',
    ex: 'EXO',
    exod: 'EXO',
    lev: 'LEV',
    num: 'NUM',
    deut: 'DEU',
    josh: 'JOS',
    judg: 'JDG',
    ruth: 'RUT',
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
    matthew: 'MAT',
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
    james: 'JAS',
    '1pet': '1PE',
    '2pet': '2PE',
    '1jn': '1JN',
    '2jn': '2JN',
    '3jn': '3JN',
    jude: 'JUD',
    rev: 'REV',
    revelation: 'REV'
  };
  function cleanText(value) {
    return String(value || '')
      .replace(/s+/g, ' ')
      .replace(/ ([”’.,;:!?])/g, '$1')
      .trim();
  }

  function textFromContent(value) {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((part) => textFromContent(part))
        .join('');
    }

    if (value && typeof value === 'object') {
      if (typeof value.text === 'string') {
        return value.text;
      }

      if (value.content !== undefined) {
        return textFromContent(value.content);
      }
    }

    return '';
  }

  function escapeHTML(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[character]
    );
  }

  function bookName(book) {
    return book?.commonName ||
      book?.name ||
      book?.id ||
      '';
  }

  function currentBook() {
    return state.books.find(
      (book) => book.id === state.bookId
    );
  }

  function reference() {
    return `${bookName(currentBook())} ${state.chapter}`;
  }

  function timeText(seconds) {
    if (!Number.isFinite(seconds)) {
      seconds = 0;
    }

    return `${Math.floor(seconds / 60)}:` +
      `${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }

  function showToast(message) {
    if (!el.toast) {
      return;
    }

    el.toast.textContent = message;
    el.toast.classList.add('show');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2600);
  }

  async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`
      );
    }

    return response.json();
  }
  async function initializeSupabase() {
    if (!supabaseClient) {
      console.warn(
        'Supabase library was not loaded.'
      );

      return null;
    }

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth.getSession();

    if (sessionError) {
      console.warn(
        'Could not load Supabase session:',
        sessionError.message
      );
    }

    if (sessionData?.session?.user) {
      state.user =
        sessionData.session.user;

      return state.user;
    }

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInAnonymously();

    if (error) {
      console.warn(
        'Anonymous sign-in failed:',
        error.message
      );

      return null;
    }

    state.user = data?.user || null;

    return state.user;
  }

  function buildTranslationSelect() {
    el.trSel.innerHTML = '';

    translations.forEach((group) => {
      const optgroup =
        document.createElement('optgroup');

      optgroup.label = group.group;

      group.items.forEach(([id, name]) => {
        const option =
          document.createElement('option');

        option.value = id;
        option.textContent = name;
        option.selected = id === state.tr;

        optgroup.appendChild(option);
      });

      el.trSel.appendChild(optgroup);
    });
  }

  async function loadBooks() {
    const url =
      `${BOOKS_API}/` +
      `${encodeURIComponent(state.tr)}/books.json`;

    const data = await getJSON(url);

    if (!Array.isArray(data.books)) {
      throw new Error(
        'The books response was invalid.'
      );
    }

    state.books = data.books
      .map((book) => ({
        ...book,
        order: Number(book.order),
        numberOfChapters: Number(
          book.numberOfChapters
        )
      }))
      .filter((book) =>
        book.id &&
        book.numberOfChapters > 0
      )
      .sort((a, b) => a.order - b.order);

    state.translation =
      data.translation || null;

    if (!state.books.length) {
      throw new Error(
        'No books were found.'
      );
    }
  }

  function previousReference() {
    if (state.chapter > 1) {
      return [
        state.bookId,
        state.chapter - 1
      ];
    }

    const index = state.books.findIndex(
      (book) => book.id === state.bookId
    );

    if (index <= 0) {
      return null;
    }

    const book =
      state.books[index - 1];

    return [
      book.id,
      book.numberOfChapters
    ];
  }

  function nextReference() {
    const book = currentBook();

    if (
      book &&
      state.chapter < book.numberOfChapters
    ) {
      return [
        state.bookId,
        state.chapter + 1
      ];
    }

    const index = state.books.findIndex(
      (item) => item.id === state.bookId
    );

    if (
      index < 0 ||
      index >= state.books.length - 1
    ) {
      return null;
    }

    return [
      state.books[index + 1].id,
      1
    ];
  }

  function updateHeader() {
    const book = currentBook();
    const name = bookName(book);

    el.refLabel.textContent =
      `${name} ${state.chapter}`;

    el.heroReference.textContent =
      `${name} ${state.chapter}`;

    el.chapterBook.textContent = name;
    el.chapterNum.textContent = state.chapter;

    el.bookTitle.textContent =
      book?.title || name;

    const translationName =
      state.translation?.englishName ||
      state.translation?.name ||
      state.tr;

    el.trNote.textContent =
      translationName;

    el.heroTranslation.textContent =
      translationName;

    const previous =
      previousReference();

    const next =
      nextReference();

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
  function renderChapter(data) {
    const content =
      data?.chapter?.content || [];

    if (!content.length) {
      throw new Error(
        'The chapter contained no content.'
      );
    }

    const fragment =
      document.createDocumentFragment();

    let paragraph = null;

    state.verses = [];

    function newParagraph() {
      paragraph =
        document.createElement('p');

      fragment.appendChild(paragraph);
    }

    content.forEach((item) => {
      if (item.type === 'heading') {
        paragraph = null;

        const heading =
          document.createElement('h3');

        heading.textContent = cleanText(
          textFromContent(item.content)
        );

        if (heading.textContent) {
          fragment.appendChild(heading);
        }

        return;
      }

      if (item.type === 'line_break') {
        paragraph = null;
        return;
      }

      if (item.type !== 'verse') {
        return;
      }

      if (!paragraph) {
        newParagraph();
      }

      const verse =
        document.createElement('span');

      verse.className = 'verse';
      verse.dataset.v = item.number;
      verse.id = `v${item.number}`;

      const number =
        document.createElement('sup');

      number.className = 'vnum';
      number.textContent = item.number;

      const plainText = [];
      let first = true;

      (item.content || []).forEach((part) => {
        if (
          part &&
          typeof part === 'object' &&
          part.lineBreak
        ) {
          verse.appendChild(
            document.createElement('br')
          );

          return;
        }

        const text =
          typeof part === 'string'
            ? part
            : part?.text || '';

        if (!text) {
          return;
        }

        plainText.push(text);

        const span =
          document.createElement('span');

        if (part?.wordsOfJesus) {
          span.classList.add('jesus');
        }

        if (part?.poem) {
          span.classList.add('poem-line');

          if (part.poem > 1) {
            span.classList.add('p2');
          }
        }

        if (first) {
          span.appendChild(number);
          first = false;
        }

        span.appendChild(
          document.createTextNode(text)
        );

        verse.appendChild(span);
      });

      if (first) {
        verse.appendChild(number);
      }

      if (paragraph.childNodes.length) {
        paragraph.appendChild(
          document.createTextNode(' ')
        );
      }

      paragraph.appendChild(verse);

      state.verses.push({
        n: Number(item.number),
        text: cleanText(
          plainText.join(' ')
        ),
        el: verse
      });
    });

    el.scripture.replaceChildren(fragment);

    applyBookmarkMarks();
  }
  async function loadChapter(
    bookId = state.bookId,
    chapter = state.chapter,
    options = {}
  ) {
    stopPlayback();

    state.bookId = bookId;
    state.chapter = Number(chapter);

    updateHeader();

    el.scripture.innerHTML =
      '<p>Loading Scripture…</p>';

    try {
      const url =
        `/api/chapters?translation=${encodeURIComponent(
          state.tr
        )}` +
        `&book=${encodeURIComponent(
          state.bookId
        )}` +
        `&chapter=${encodeURIComponent(
          state.chapter
        )}`;

      const data =
        await getJSON(url);

      state.data = data;

      renderChapter(data);
      setupAudio(data);
      await loadPosition();

      if (options.verse) {
        selectVerse(options.verse);
      }
    } catch (error) {
      console.error(error);

      el.scripture.innerHTML = `
        <div class="errorbox">
          <strong>
            Could not load ${escapeHTML(reference())}.
          </strong>

          <p>${escapeHTML(error.message)}</p>

          <button id="retryBtn" type="button">
            Try again
          </button>
        </div>
      `;

      $('retryBtn')?.addEventListener(
        'click',
        () => loadChapter(
          state.bookId,
          state.chapter,
          options
        )
      );
    }
  }
  function setupAudio(data) {
    const links =
      data?.thisChapterAudioLinks || {};

    el.narSel.innerHTML = '';

    const narrators = [
      ['souer', 'Souer'],
      ['hays', 'Hays'],
      ['david', 'David'],
      ['gilbert', 'Gilbert']
    ];

    narrators.forEach(([id, label]) => {
      const option =
        document.createElement('option');

      option.value = id;
      option.textContent = links[id]
        ? label
        : `${label} · unavailable`;

      option.disabled = !links[id];
      option.selected =
        id === state.narrator &&
        Boolean(links[id]);

      el.narSel.appendChild(option);
    });

    const device =
      document.createElement('option');

    device.value = 'device';
    device.textContent = 'Device voice';

    el.narSel.appendChild(device);

    const audioUrl =
      links[state.narrator];

    if (audioUrl) {
      state.mode = 'audio';
      el.audio.src = audioUrl;
      el.audio.playbackRate = state.speed;
      el.audio.load();
    } else {
      state.mode = 'speech';
      el.audio.removeAttribute('src');
      el.audio.load();
    }

    updatePlayButton();
  }

  function play() {
    if (
      state.mode === 'speech' ||
      !el.audio.src
    ) {
      speakChapter();
      return;
    }

    el.audio.play()
      .then(() => {
        state.playing = true;
        updatePlayButton();
      })
      .catch(() => {
        speakChapter();
      });
  }

  function pause() {
    el.audio.pause();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function stopPlayback() {
    el.audio.pause();
    el.audio.currentTime = 0;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function speakChapter() {
    if (!('speechSynthesis' in window)) {
      showToast('Device voice is unavailable.');
      return;
    }

    const text = state.verses
      .map((verse) => verse.text)
      .join(' ');

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.rate = state.speed;

    speech.onend = () => {
      state.playing = false;
      updatePlayButton();
    };

    speech.onerror = () => {
      state.playing = false;
      updatePlayButton();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);

    state.playing = true;
    updatePlayButton();
  }

  function updatePlayButton() {
    el.playBtn.textContent =
      state.playing ? 'Ⅱ' : '▶';

    el.playBtn.classList.toggle(
      'is-playing',
      state.playing
    );
  }

  function updateProgress() {
    const current =
      Number.isFinite(el.audio.currentTime)
        ? el.audio.currentTime
        : 0;

    const duration =
      Number.isFinite(el.audio.duration)
        ? el.audio.duration
        : 0;

    el.seek.max = duration || 100;
    el.seek.value = duration ? current : 0;

    el.tCur.textContent =
      timeText(current);

    el.tDur.textContent =
      timeText(duration);
  }

  function updateCurrentVerse() {
    if (
      !state.verses.length ||
      !Number.isFinite(el.audio.duration) ||
      el.audio.duration <= 0
    ) {
      return;
    }

    const index = Math.min(
      state.verses.length - 1,
      Math.floor(
        (
          el.audio.currentTime /
          el.audio.duration
        ) *
        state.verses.length
      )
    );

    const verse =
      state.verses[index];

    state.currentVerse = verse.n;

    state.verses.forEach((item) => {
      item.el.classList.toggle(
        'is-playing',
        item.n === verse.n
      );
    });

    el.tNow.textContent =
      `${reference()}:${verse.n}`;

    savePosition(verse.n);

    if (state.follow && state.playing) {
      verse.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  function selectVerse(number) {
    const verse =
      state.verses.find(
        (item) =>
          item.n === Number(number)
      );

    if (!verse) {
      return;
    }

    state.selectedVerse = verse.n;
    state.currentVerse = verse.n;

    state.verses.forEach((item) => {
      item.el.classList.remove(
        'is-selected'
      );
    });

    verse.el.classList.add('is-selected');

    verse.el.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
  function bookmarkKey(verse) {
    return [
      state.tr,
      state.bookId,
      state.chapter,
      verse
    ].join(':');
  }

  function isBookmarked(verse) {
    return state.bookmarks.some(
      (item) =>
        item.key === bookmarkKey(verse)
    );
  }

  async function loadBookmarks() {
    if (
      !supabaseClient ||
      !state.user
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabaseClient
        .from('selah_bookmarks')
        .select('*')
        .eq('user_id', state.user.id)
        .order('created_at', {
          ascending: false
        });

    if (error) {
      console.warn(error.message);
      return;
    }

    state.bookmarks =
      (data || []).map((row) => ({
        id: row.id,
        key: [
          row.translation,
          row.book_id,
          row.chapter,
          row.verse
        ].join(':'),
        row
      }));

    updateBookmarkBadge();
    applyBookmarkMarks();
  }

  async function toggleBookmark(verseNumber) {
    if (
      !supabaseClient ||
      !state.user
    ) {
      showToast(
        'Sign in to save bookmarks.'
      );

      return;
    }

    const existing =
      state.bookmarks.find(
        (item) =>
          item.key ===
          bookmarkKey(verseNumber)
      );

    if (existing) {
      const { error } =
        await supabaseClient
          .from('selah_bookmarks')
          .delete()
          .eq('id', existing.id);

      if (error) {
        showToast(
          'Could not remove bookmark.'
        );

        return;
      }

      showToast('Bookmark removed.');
    } else {
      const verse =
        state.verses.find(
          (item) =>
            item.n === Number(verseNumber)
        );

      const { error } =
        await supabaseClient
          .from('selah_bookmarks')
          .insert({
            user_id: state.user.id,
            translation: state.tr,
            book_id: state.bookId,
            book_name: bookName(currentBook()),
            chapter: state.chapter,
            verse: Number(verseNumber),
            verse_text: verse?.text || ''
          });

      if (error) {
        showToast('Could not save bookmark.');
        return;
      }

      showToast('Bookmark saved.');
    }

    await loadBookmarks();
  }

  function updateBookmarkBadge() {
    el.bmBadge.hidden =
      state.bookmarks.length === 0;

    el.bmBadge.textContent =
      state.bookmarks.length;
  }

  function applyBookmarkMarks() {
    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-bookmarked',
        isBookmarked(verse.n)
      );
    });
  }

  async function savePosition(verse) {
    if (
      !supabaseClient ||
      !state.user
    ) {
      return;
    }

    const { error } =
      await supabaseClient
        .from('selah_positions')
        .upsert({
          user_id: state.user.id,
          translation: state.tr,
          book_id: state.bookId,
          chapter: state.chapter,
          verse: Number(verse),
          narrator: state.narrator,
          updated_at: new Date().toISOString()
        });

    if (error) {
      console.warn(
        'Position save failed:',
        error.message
      );
    }
  }

  async function loadPosition() {
    if (
      !supabaseClient ||
      !state.user
    ) {
      return;
    }

    const { data, error } =
      await supabaseClient
        .from('selah_positions')
        .select('*')
        .eq('user_id', state.user.id)
        .maybeSingle();

    if (error || !data) {
      return;
    }

    if (
      data.translation !== state.tr ||
      data.book_id !== state.bookId ||
      Number(data.chapter) !== state.chapter
    ) {
      return;
    }

    if (data.verse) {
      selectVerse(data.verse);
    }
  }

  function renderBookmarks() {
    el.bmBody.innerHTML = '';

    if (!state.bookmarks.length) {
      el.bmBody.innerHTML =
        '<p class="muted">No bookmarks yet.</p>';

      return;
    }

    state.bookmarks.forEach((bookmark) => {
      const row =
        document.createElement('button');

      row.type = 'button';
      row.className = 'bookmark-row';

      row.innerHTML =
        `<strong>${escapeHTML(
          bookmark.row.book_name
        )} ${bookmark.row.chapter}:` +
        `${bookmark.row.verse}</strong>` +
        `<span>${escapeHTML(
          bookmark.row.verse_text
        )}</span>`;

      row.addEventListener(
        'click',
        () => {
          el.bookmarksDlg.hidden = true;

          loadChapter(
            bookmark.row.book_id,
            bookmark.row.chapter,
            {
              verse: bookmark.row.verse
            }
          );
        }
      );

      el.bmBody.appendChild(row);
    });
  }
  function openPicker() {
    el.picker.hidden = false;
    el.pickerBack.hidden = true;
    el.pickerTitle.textContent =
      'Choose a book';

    renderBooks();
  }

  function renderBooks(filter = '') {
    const query =
      filter.toLowerCase();

    el.pickerBody.innerHTML = '';

    state.books
      .filter((book) =>
        bookName(book)
          .toLowerCase()
          .includes(query)
      )
      .forEach((book) => {
        const button =
          document.createElement('button');

        button.type = 'button';
        button.className = 'book-row';

        button.innerHTML =
          `<strong>${escapeHTML(
            bookName(book)
          )}</strong>` +
          `<span>${book.numberOfChapters} chapters</span>`;

        button.addEventListener(
          'click',
          () => {
            state.bookId = book.id;
            renderChapters();
          }
        );

        el.pickerBody.appendChild(button);
      });
  }

  function renderChapters() {
    const book = currentBook();

    el.pickerBack.hidden = false;
    el.pickerTitle.textContent =
      bookName(book);

    el.pickerBody.innerHTML = '';

    for (
      let chapter = 1;
      chapter <= book.numberOfChapters;
      chapter += 1
    ) {
      const button =
        document.createElement('button');

      button.type = 'button';
      button.className = 'chapter-number';
      button.textContent = chapter;

      button.addEventListener(
        'click',
        () => {
          el.picker.hidden = true;

          loadChapter(
            state.bookId,
            chapter
          );
        }
      );

      el.pickerBody.appendChild(button);
    }
  }

  function closeDialogs() {
    el.picker.hidden = true;
    el.searchDlg.hidden = true;
    el.bookmarksDlg.hidden = true;
    el.pop.hidden = true;
  }
  function setupEvents() {
    el.refBtn.addEventListener(
      'click',
      openPicker
    );

    el.browseBtn.addEventListener(
      'click',
      openPicker
    );

    el.continueBtn.addEventListener(
      'click',
      () => {
        document
          .getElementById('reader')
          .scrollIntoView({
            behavior: 'smooth'
          });
      }
    );

    el.readerBookmarkBtn.addEventListener(
      'click',
      () => {
        if (state.currentVerse) {
          toggleBookmark(
            state.currentVerse
          );
        } else {
          showToast(
            'Select a verse first.'
          );
        }
      }
    );

    el.pickerBack.addEventListener(
      'click',
      () => {
        el.pickerBack.hidden = true;
        el.pickerTitle.textContent =
          'Choose a book';

        renderBooks();
      }
    );

    el.jumpForm.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();

        const value =
          el.jumpInput.value.trim();

        const match = value.match(
          /^(.+?)s+(d+)(?::(d+))?$/
        );

        if (!match) {
          renderBooks(value);
          return;
        }

        const alias =
          match[1]
            .toLowerCase()
            .replace(/s+/g, '');

        const bookId = aliases[alias];

        if (!bookId) {
          showToast('Book not found.');
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
      }
    );

    el.playBtn.addEventListener(
      'click',
      () => {
        state.playing ? pause() : play();
      }
    );

    el.prevChap.addEventListener(
      'click',
      () => {
        const previous =
          previousReference();

        if (previous) {
          loadChapter(
            previous[0],
            previous[1]
          );
        }
      }
    );

    el.nextChap.addEventListener(
      'click',
      () => {
        const next =
          nextReference();

        if (next) {
          loadChapter(
            next[0],
            next[1]
          );
        }
      }
    );

    el.prevVerse.addEventListener(
      'click',
      () => {
        const index =
          state.verses.findIndex(
            (verse) =>
              verse.n === state.currentVerse
          );

        if (index > 0) {
          selectVerse(
            state.verses[index - 1].n
          );
        }
      }
    );

    el.nextVerse.addEventListener(
      'click',
      () => {
        const index =
          state.verses.findIndex(
            (verse) =>
              verse.n === state.currentVerse
          );

        if (
          index >= 0 &&
          index < state.verses.length - 1
        ) {
          selectVerse(
            state.verses[index + 1].n
          );
        }
      }
    );

    el.narSel.addEventListener(
      'change',
      () => {
        state.narrator =
          el.narSel.value;

        if (state.narrator === 'device') {
          state.mode = 'speech';
          el.audio.pause();
        } else {
          setupAudio(state.data);
        }
      }
    );

    el.speedBtn.addEventListener(
      'click',
      () => {
        const speeds =
          [0.75, 1, 1.25, 1.5, 1.75, 2];

        const index =
          speeds.indexOf(state.speed);

        state.speed =
          speeds[
            (index + 1) % speeds.length
          ];

        el.speedBtn.textContent =
          `${state.speed}×`;

        el.audio.playbackRate =
          state.speed;
      }
    );

    el.seek.addEventListener(
      'input',
      () => {
        if (state.mode === 'audio') {
          el.audio.currentTime =
            Number(el.seek.value);
        }
      }
    );

    el.trSel.addEventListener(
      'change',
      async () => {
        state.tr =
          el.trSel.value;

        await loadBooks();

        if (!currentBook()) {
          state.bookId =
            state.books[0].id;

          state.chapter = 1;
        }

        await loadChapter();
      }
    );

    el.audio.addEventListener(
      'playing',
      () => {
        state.playing = true;
        updatePlayButton();
      }
    );

    el.audio.addEventListener(
      'pause',
      () => {
        state.playing = false;
        updatePlayButton();
      }
    );

    el.audio.addEventListener(
      'timeupdate',
      () => {
        updateProgress();
        updateCurrentVerse();
      }
    );

    el.audio.addEventListener(
      'loadedmetadata',
      updateProgress
    );

    el.audio.addEventListener(
      'ended',
      () => {
        state.playing = false;
        updatePlayButton();

        if (!state.autoNext) {
          return;
        }

        const next =
          nextReference();

        if (next) {
          loadChapter(
            next[0],
            next[1]
          ).then(play);
        }
      }
    );

    el.scripture.addEventListener(
      'click',
      (event) => {
        const verse =
          event.target.closest('.verse');

        if (!verse) {
          return;
        }

        selectVerse(
          Number(verse.dataset.v)
        );

        el.pop.hidden = false;
      }
    );

    el.popBookmark.addEventListener(
      'click',
      () => {
        toggleBookmark(
          state.selectedVerse
        );

        el.pop.hidden = true;
      }
    );

    el.popPlay.addEventListener(
      'click',
      () => {
        el.pop.hidden = true;
        play();
      }
    );

    el.popCopy.addEventListener(
      'click',
      async () => {
        const verse =
          state.verses.find(
            (item) =>
              item.n === state.selectedVerse
          );

        if (!verse) {
          return;
        }

        await navigator.clipboard.writeText(
          `${reference()}:${verse.n} — ${verse.text}`
        );

        showToast('Verse copied.');
        el.pop.hidden = true;
      }
    );

    el.searchBtn.addEventListener(
      'click',
      () => {
        el.searchDlg.hidden = false;
        el.searchInput.focus();
      }
    );

    el.searchForm.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();

        searchBible(
          el.searchInput.value
        );
      }
    );

    el.bookmarksBtn.addEventListener(
      'click',
      () => {
        renderBookmarks();
        el.bookmarksDlg.hidden = false;
      }
    );

    el.settingsBtn.addEventListener(
      'click',
      () => {
        el.settings.hidden =
          !el.settings.hidden;
      }
    );

    el.themeBtn.addEventListener(
      'click',
      () => {
        const dark =
          document.documentElement.dataset.theme ===
          'dark';

        document.documentElement.dataset.theme =
          dark ? 'light' : 'dark';

        el.themeLabel.textContent =
          dark ? 'Dark' : 'Light';
      }
    );

    el.fontUp.addEventListener(
      'click',
      () => {
        document.documentElement.style.setProperty(
          '--read-size',
          '1.28rem'
        );
      }
    );

    el.fontDown.addEventListener(
      'click',
      () => {
        document.documentElement.style.setProperty(
          '--read-size',
          '1.08rem'
        );
      }
    );

    el.followToggle.addEventListener(
      'change',
      () => {
        state.follow =
          el.followToggle.checked;
      }
    );

    el.autoNextToggle.addEventListener(
      'change',
      () => {
        state.autoNext =
          el.autoNextToggle.checked;
      }
    );

    el.numsToggle.addEventListener(
      'change',
      () => {
        el.scripture.classList.toggle(
          'hide-nums',
          !el.numsToggle.checked
        );
      }
    );

    document
      .querySelectorAll('[data-close]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          closeDialogs
        );
      });
  }

  async function start() {
    try {
      buildTranslationSelect();
      setupEvents();

      await initializeSupabase();
      await loadBooks();

      if (!currentBook()) {
        state.bookId =
          state.books[0].id;

        state.chapter = 1;
      }

      await loadChapter();
      await loadBookmarks();
    } catch (error) {
      console.error(error);

      el.scripture.innerHTML = `
        <div class="errorbox">
          <strong>
            Selah could not load Scripture.
          </strong>

          <p>${escapeHTML(error.message)}</p>
        </div>
      `;
    }
  }

  start();
})();