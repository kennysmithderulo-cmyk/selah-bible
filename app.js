(() => {
  'use strict';

  const API_BASE =
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
    playing: false,
    mode: 'audio',
    narrator: 'souer',
    currentVerse: 0,
    speed: 1,
    follow: true,
    autoNext: true,
    bookmarks: []
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
    settingsBtn: $('settingsBtn'),
    settings: $('settingsPanel'),
    themeBtn: $('themeBtn'),
    themeLabel: $('themeLabel'),
    fontUp: $('fontUp'),
    fontDown: $('fontDown'),
    followToggle: $('followToggle'),
    autoNextToggle: $('autoNextToggle'),
    numsToggle: $('numsToggle')
  };
  const translations = [
    {
      name: 'English',
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
      name: 'Ghana and Africa',
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
      name: 'Other languages',
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
    matthew: 'MAT',
    mt: 'MAT',
    mark: 'MRK',
    mk: 'MRK',
    luke: 'LUK',
    lk: 'LUK',
    john: 'JHN',
    jn: 'JHN',
    acts: 'ACT',
    romans: 'ROM',
    rom: 'ROM',
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
    jam: 'JAS',
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
  function buildTranslationSelect() {
    if (!el.trSel) {
      return;
    }

    el.trSel.innerHTML = '';

    translations.forEach((group) => {
      const optgroup =
        document.createElement('optgroup');

      optgroup.label = group.name;

      group.items.forEach(([id, label]) => {
        const option =
          document.createElement('option');

        option.value = id;
        option.textContent = label;
        option.selected = id === state.tr;

        optgroup.appendChild(option);
      });

      el.trSel.appendChild(optgroup);
    });

    el.trSel.value = state.tr;
  }

  async function loadBooks() {
    const url =
      `${API_BASE}/` +
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

  function getPreviousReference() {
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

    const previous =
      state.books[index - 1];

    return [
      previous.id,
      previous.numberOfChapters
    ];
  }

  function getNextReference() {
    const current = currentBook();

    if (
      current &&
      state.chapter < current.numberOfChapters
    ) {
      return [
        state.bookId,
        state.chapter + 1
      ];
    }

    const index = state.books.findIndex(
      (book) => book.id === state.bookId
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
    const current = currentBook();
    const name = bookName(current);

    if (el.refLabel) {
      el.refLabel.textContent =
        `${name} ${state.chapter}`;
    }

    if (el.chapterBook) {
      el.chapterBook.textContent = name;
    }

    if (el.chapterNum) {
      el.chapterNum.textContent = state.chapter;
    }

    if (el.bookTitle) {
      el.bookTitle.textContent =
        current?.title || name;
    }

    if (el.trNote) {
      el.trNote.textContent =
        state.translation?.englishName ||
        state.translation?.name ||
        state.tr;
    }

    const previous =
      getPreviousReference();

    const next =
      getNextReference();

    if (el.prevChap) {
      el.prevChap.disabled = !previous;
    }

    if (el.nextChap) {
      el.nextChap.disabled = !next;
    }

    if (el.prevLabel) {
      el.prevLabel.textContent = previous
        ? `${bookName(
            state.books.find(
              (book) =>
                book.id === previous[0]
            )
          )} ${previous[1]}`
        : 'Previous';
    }

    if (el.nextLabel) {
      el.nextLabel.textContent = next
        ? `${bookName(
            state.books.find(
              (book) =>
                book.id === next[0]
            )
          )} ${next[1]}`
        : 'Next';
    }
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

        if (part?.poem) {
          span.className =
            `poem-line${
              part.poem > 1 ? ' p2' : ''
            }`;
        }

        if (part?.wordsOfJesus) {
          span.classList.add('jesus');
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
        `${API_BASE}/` +
        `${encodeURIComponent(state.tr)}/` +
        `${encodeURIComponent(state.bookId)}/` +
        `${encodeURIComponent(state.chapter)}.json`;

      const data = await getJSON(url);

      state.data = data;

      renderChapter(data);
      setupAudio(data);

      if (options.verse) {
        const verse = state.verses.find(
          (item) =>
            item.n === Number(options.verse)
        );

        if (verse) {
          state.currentVerse = verse.n;

          verse.el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
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
    if (!el.audio) {
      return;
    }

    const links =
      data?.thisChapterAudioLinks || {};

    const audioUrl =
      links[state.narrator] ||
      links.souer ||
      links.hays ||
      links.david ||
      links.gilbert ||
      '';

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
      !el.audio?.src
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
    el.audio?.pause();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function stopPlayback() {
    el.audio?.pause();

    if (el.audio) {
      el.audio.currentTime = 0;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function speakChapter() {
    if (!('speechSynthesis' in window)) {
      showToast(
        'Audio is unavailable in this browser.'
      );

      return;
    }

    window.speechSynthesis.cancel();

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

    state.playing = true;
    updatePlayButton();

    window.speechSynthesis.speak(speech);
  }

  function updatePlayButton() {
    if (!el.playBtn) {
      return;
    }

    el.playBtn.textContent =
      state.playing ? 'Pause' : 'Play';
  }

  function updateProgress() {
    if (!el.audio) {
      return;
    }

    const current =
      Number.isFinite(el.audio.currentTime)
        ? el.audio.currentTime
        : 0;

    const duration =
      Number.isFinite(el.audio.duration)
        ? el.audio.duration
        : 0;

    if (el.seek) {
      el.seek.max = duration || 100;
      el.seek.value = duration
        ? current
        : 0;
    }

    if (el.tCur) {
      el.tCur.textContent =
        timeText(current);
    }

    if (el.tDur) {
      el.tDur.textContent =
        timeText(duration);
    }
  }

  function updateCurrentVerse() {
    if (
      !el.audio ||
      !state.verses.length ||
      !Number.isFinite(el.audio.duration) ||
      el.audio.duration <= 0
    ) {
      return;
    }

    const percentage =
      el.audio.currentTime / el.audio.duration;

    const index = Math.min(
      state.verses.length - 1,
      Math.floor(
        percentage * state.verses.length
      )
    );

    const current =
      state.verses[index];

    state.currentVerse = current.n;

    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-playing',
        verse.n === current.n
      );
    });

    if (el.tNow) {
      el.tNow.textContent =
        `${reference()}:${current.n}`;
    }

    if (state.follow) {
      current.el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  function bookmarkKey(verseNumber) {
    return [
      state.tr,
      state.bookId,
      state.chapter,
      verseNumber
    ].join(':');
  }

  function isBookmarked(verseNumber) {
    return state.bookmarks.includes(
      bookmarkKey(verseNumber)
    );
  }

  function loadBookmarks() {
    try {
      state.bookmarks = JSON.parse(
        localStorage.getItem(
          'selah_bookmarks'
        ) || '[]'
      );
    } catch {
      state.bookmarks = [];
    }
  }

  function saveBookmarks() {
    localStorage.setItem(
      'selah_bookmarks',
      JSON.stringify(state.bookmarks)
    );
  }

  function applyBookmarkMarks() {
    state.verses.forEach((verse) => {
      verse.el.classList.toggle(
        'is-bookmarked',
        isBookmarked(verse.n)
      );
    });
  }

  function toggleBookmark(verseNumber) {
    const key =
      bookmarkKey(verseNumber);

    if (isBookmarked(verseNumber)) {
      state.bookmarks =
        state.bookmarks.filter(
          (item) => item !== key
        );

      showToast('Bookmark removed.');
    } else {
      state.bookmarks.push(key);
      showToast('Bookmark saved.');
    }

    saveBookmarks();
    applyBookmarkMarks();
    updateBookmarkPopover();
  }

  function updateBookmarkPopover() {
    if (
      !el.popBookmarkLabel ||
      !state.currentVerse
    ) {
      return;
    }

    el.popBookmarkLabel.textContent =
      isBookmarked(state.currentVerse)
        ? 'Remove bookmark'
        : 'Bookmark';
  }
  function openPicker() {
    if (!el.picker) {
      return;
    }

    el.picker.hidden = false;

    if (el.pickerBack) {
      el.pickerBack.hidden = true;
    }

    if (el.pickerTitle) {
      el.pickerTitle.textContent =
        'Choose a book';
    }

    renderBooks();
  }

  function renderBooks(filter = '') {
    if (!el.pickerBody) {
      return;
    }

    const query =
      String(filter).toLowerCase();

    el.pickerBody.innerHTML = '';

    ['Old Testament', 'New Testament']
      .forEach((section, sectionIndex) => {
        const books = state.books.filter(
          (book) =>
            (
              sectionIndex === 0
                ? book.order < 40
                : book.order >= 40
            ) &&
            bookName(book)
              .toLowerCase()
              .includes(query)
        );

        if (!books.length) {
          return;
        }

        const heading =
          document.createElement('h3');

        heading.textContent = section;
        el.pickerBody.appendChild(heading);

        books.forEach((book) => {
          const button =
            document.createElement('button');

          button.type = 'button';
          button.textContent =
            `${bookName(book)} ` +
            `(${book.numberOfChapters})`;

          button.addEventListener(
            'click',
            () => {
              state.bookId = book.id;
              renderChapters();
            }
          );

          el.pickerBody.appendChild(button);
        });
      });
  }

  function renderChapters() {
    const book = currentBook();

    if (!book || !el.pickerBody) {
      return;
    }

    if (el.pickerBack) {
      el.pickerBack.hidden = false;
    }

    if (el.pickerTitle) {
      el.pickerTitle.textContent =
        bookName(book);
    }

    el.pickerBody.innerHTML = '';

    for (
      let number = 1;
      number <= book.numberOfChapters;
      number += 1
    ) {
      const button =
        document.createElement('button');

      button.type = 'button';
      button.textContent = number;

      button.addEventListener(
        'click',
        () => {
          closeDialogs();

          loadChapter(
            state.bookId,
            number
          );
        }
      );

      el.pickerBody.appendChild(button);
    }
  }

  function closeDialogs() {
    if (el.picker) {
      el.picker.hidden = true;
    }

    if (el.pop) {
      el.pop.hidden = true;
    }
  }
  function setupEvents() {
    el.refBtn?.addEventListener(
      'click',
      openPicker
    );

    el.pickerBack?.addEventListener(
      'click',
      () => {
        el.pickerBack.hidden = true;

        if (el.pickerTitle) {
          el.pickerTitle.textContent =
            'Choose a book';
        }

        renderBooks();
      }
    );

    el.jumpForm?.addEventListener(
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

        const name =
          match[1]
            .toLowerCase()
            .replace(/s+/g, '');

        const bookId = aliases[name];

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

    el.playBtn?.addEventListener(
      'click',
      () => {
        state.playing ? pause() : play();
      }
    );

    el.prevChap?.addEventListener(
      'click',
      () => {
        const previous =
          getPreviousReference();

        if (previous) {
          loadChapter(
            previous[0],
            previous[1]
          );
        }
      }
    );

    el.nextChap?.addEventListener(
      'click',
      () => {
        const next =
          getNextReference();

        if (next) {
          loadChapter(
            next[0],
            next[1]
          );
        }
      }
    );

    el.prevVerse?.addEventListener(
      'click',
      () => {
        const index =
          state.verses.findIndex(
            (verse) =>
              verse.n === state.currentVerse
          );

        if (index > 0) {
          const verse =
            state.verses[index - 1];

          state.currentVerse = verse.n;

          verse.el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    );

    el.nextVerse?.addEventListener(
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
          const verse =
            state.verses[index + 1];

          state.currentVerse = verse.n;

          verse.el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    );

    el.seek?.addEventListener(
      'input',
      () => {
        if (
          el.audio &&
          state.mode === 'audio'
        ) {
          el.audio.currentTime =
            Number(el.seek.value);
        }
      }
    );

    el.speedBtn?.addEventListener(
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

        if (el.audio) {
          el.audio.playbackRate =
            state.speed;
        }
      }
    );

    el.trSel?.addEventListener(
      'change',
      async () => {
        state.tr = el.trSel.value;

        try {
          await loadBooks();

          if (!currentBook()) {
            state.bookId =
              state.books[0].id;

            state.chapter = 1;
          }

          const book =
            currentBook();

          state.chapter = Math.min(
            state.chapter,
            book.numberOfChapters
          );

          await loadChapter();
        } catch (error) {
          console.error(error);

          showToast(
            'Could not change translation.'
          );
        }
      }
    );

    el.narSel?.addEventListener(
      'change',
      () => {
        state.narrator =
          el.narSel.value;

        setupAudio(state.data);
      }
    );

    el.audio?.addEventListener(
      'playing',
      () => {
        state.playing = true;
        updatePlayButton();
      }
    );

    el.audio?.addEventListener(
      'pause',
      () => {
        state.playing = false;
        updatePlayButton();
      }
    );

    el.audio?.addEventListener(
      'timeupdate',
      () => {
        updateProgress();
        updateCurrentVerse();
      }
    );

    el.audio?.addEventListener(
      'loadedmetadata',
      updateProgress
    );

    el.audio?.addEventListener(
      'ended',
      () => {
        state.playing = false;
        updatePlayButton();

        if (!state.autoNext) {
          return;
        }

        const next =
          getNextReference();

        if (next) {
          loadChapter(
            next[0],
            next[1]
          ).then(play);
        }
      }
    );

    el.scripture?.addEventListener(
      'click',
      (event) => {
        const verse =
          event.target.closest('.verse');

        if (!verse) {
          return;
        }

        state.currentVerse =
          Number(verse.dataset.v);

        toggleBookmark(
          state.currentVerse
        );

        if (el.pop) {
          el.pop.hidden = false;
        }
      }
    );

    el.popBookmark?.addEventListener(
      'click',
      () => {
        if (state.currentVerse) {
          toggleBookmark(
            state.currentVerse
          );
        }
      }
    );

    el.popPlay?.addEventListener(
      'click',
      play
    );

    el.popCopy?.addEventListener(
      'click',
      async () => {
        const verse =
          state.verses.find(
            (item) =>
              item.n === state.currentVerse
          );

        if (!verse) {
          return;
        }

        try {
          await navigator.clipboard.writeText(
            `${reference()}:${verse.n} — ${verse.text}`
          );

          showToast('Verse copied.');
        } catch {
          showToast(
            'Could not copy the verse.'
          );
        }

        closeDialogs();
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

    el.settingsBtn?.addEventListener(
      'click',
      () => {
        if (el.settings) {
          el.settings.hidden =
            !el.settings.hidden;
        }
      }
    );

    el.themeBtn?.addEventListener(
      'click',
      () => {
        const current =
          document.documentElement.dataset.theme;

        const next =
          current === 'dark'
            ? 'light'
            : 'dark';

        document.documentElement.dataset.theme =
          next;

        if (el.themeLabel) {
          el.themeLabel.textContent =
            next === 'dark'
              ? 'Light'
              : 'Dark';
        }
      }
    );

    el.fontUp?.addEventListener(
      'click',
      () => {
        document.documentElement.style.setProperty(
          '--read-size',
          '1.35rem'
        );
      }
    );

    el.fontDown?.addEventListener(
      'click',
      () => {
        document.documentElement.style.setProperty(
          '--read-size',
          '1.1rem'
        );
      }
    );

    el.followToggle?.addEventListener(
      'change',
      () => {
        state.follow =
          el.followToggle.checked;
      }
    );

    el.autoNextToggle?.addEventListener(
      'change',
      () => {
        state.autoNext =
          el.autoNextToggle.checked;
      }
    );

    el.numsToggle?.addEventListener(
      'change',
      () => {
        el.scripture.classList.toggle(
          'hide-nums',
          !el.numsToggle.checked
        );
      }
    );
  }
    el.toast.textContent = message;
    el.toast.classList.add('show');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2500);
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
  async function start() {
    buildTranslationSelect();
    loadBookmarks();
    setupEvents();

    try {
      await loadBooks();

      if (!currentBook()) {
        state.bookId =
          state.books[0].id;

        state.chapter = 1;
      }

      await loadChapter();
    } catch (error) {
      console.error(error);

      if (el.scripture) {
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
  }

  start();
})();