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
    speed: 1
  };

  const el = {
    audio: $('audio'),
    scripture: $('scripture'),
    refBtn: $('refBtn'),
    refLabel: $('refLabel'),
    trSel: $('translationSel'),
    playBtn: $('playBtn'),
    prevChap: $('prevChap'),
    nextChap: $('nextChap'),
    chapterBook: $('chapterBook'),
    chapterNum: $('chapterNum'),
    bookTitle: $('bookTitle'),
    trNote: $('translationNote'),
    speedBtn: $('speedBtn'),
    seek: $('seek'),
    tCur: $('tCur'),
    tDur: $('tDur'),
    tNow: $('tNow'),
    toast: $('toast')
  };

  const translations = [
    ['BSB', 'Berean Standard Bible'],
    ['eng_kjv', 'King James Version'],
    ['ENGWEBP', 'World English Bible'],
    ['eng_asv', 'American Standard Version'],
    ['eng_net', 'NET Bible'],
    ['fra_lsg', 'Français — Louis Segond'],
    ['spa_r09', 'Español — Reina-Valera 1909'],
    ['twi_asa', 'Asante Twi'],
    ['twi_aka', 'Akuapem Twi'],
    ['ewe_bib', 'Eʋegbe'],
    ['hau_bib', 'Hausa'],
    ['yor_bib', 'Yorùbá']
  ];

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
        .map((item) => textFromContent(item))
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
  function buildTranslationSelect() {
    if (!el.trSel) {
      return;
    }

    el.trSel.innerHTML = '';

    translations.forEach(([id, name]) => {
      const option =
        document.createElement('option');

      option.value = id;
      option.textContent = name;
      option.selected = id === state.tr;

      el.trSel.appendChild(option);
    });
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
      el.chapterNum.textContent =
        state.chapter;
    }

    if (el.bookTitle) {
      el.bookTitle.textContent = name;
    }

    if (el.trNote) {
      el.trNote.textContent =
        state.translation?.englishName ||
        state.translation?.name ||
        state.tr;
    }

    if (el.prevChap) {
      el.prevChap.disabled =
        state.chapter <= 1;
    }

    if (el.nextChap) {
      el.nextChap.disabled =
        !current ||
        state.chapter >= current.numberOfChapters;
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

    if (!el.scripture) {
      throw new Error(
        'The #scripture element is missing.'
      );
    }

    el.scripture.innerHTML =
      '<p>Loading Scripture…</p>';

    try {
      const url =
        `${API_BASE}/` +
        `${encodeURIComponent(state.tr)}/` +
        `${encodeURIComponent(state.bookId)}/` +
        `${encodeURIComponent(state.chapter)}.json`;

      console.log('Loading:', url);

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

      const retryButton =
        $('retryBtn');

      if (retryButton) {
        retryButton.addEventListener(
          'click',
          () => loadChapter(
            state.bookId,
            state.chapter,
            options
          )
        );
      }
    }
  }

  function setupAudio(data) {
    if (!el.audio) {
      return;
    }

    const links =
      data?.thisChapterAudioLinks || {};

    const audioUrl =
      links.souer ||
      links.hays ||
      links.david ||
      links.gilbert ||
      '';

    if (audioUrl) {
      state.mode = 'audio';
      el.audio.src = audioUrl;
      el.audio.playbackRate =
        state.speed;
      el.audio.load();
    } else {
      state.mode = 'speech';
      el.audio.removeAttribute('src');
      el.audio.load();
    }

    updatePlayButton();
  }

  function playAudio() {
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

  function pauseAudio() {
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
        'Audio is unavailable.'
      );

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

    state.playing = true;
    updatePlayButton();

    window.speechSynthesis.cancel();
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

    const ratio =
      el.audio.currentTime /
      el.audio.duration;

    const index = Math.min(
      state.verses.length - 1,
      Math.floor(
        ratio * state.verses.length
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
  }
  function setupEvents() {
    el.playBtn?.addEventListener(
      'click',
      () => {
        state.playing
          ? pauseAudio()
          : playAudio();
      }
    );

    el.prevChap?.addEventListener(
      'click',
      () => {
        if (state.chapter > 1) {
          loadChapter(
            state.bookId,
            state.chapter - 1
          );
        }
      }
    );

    el.nextChap?.addEventListener(
      'click',
      () => {
        const current =
          currentBook();

        if (
          current &&
          state.chapter <
            current.numberOfChapters
        ) {
          loadChapter(
            state.bookId,
            state.chapter + 1
          );
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

    el.seek?.addEventListener(
      'input',
      () => {
        if (
          state.mode === 'audio' &&
          el.audio
        ) {
          el.audio.currentTime =
            Number(el.seek.value);
        }
      }
    );

    el.trSel?.addEventListener(
      'change',
      async () => {
        state.tr =
          el.trSel.value;

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
                  Could not change translation.
                </strong>
                <p>
                  ${escapeHTML(error.message)}
                </p>
              </div>
            `;
          }
        }
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

        state.verses.forEach((item) => {
          item.el.classList.remove(
            'is-selected'
          );
        });

        verse.classList.add(
          'is-selected'
        );

        state.currentVerse =
          Number(verse.dataset.v);
      }
    );
  }

  async function start() {
    buildTranslationSelect();
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