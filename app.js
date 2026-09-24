(() => {
  'use strict';

  const API =
    'https://bible.helloao.org/api';

  const state = {
    translation: 'BSB',
    book: 'JHN',
    chapter: 3,
    verses: []
  };

  const scripture =
    document.getElementById('scripture');

  const refLabel =
    document.getElementById('refLabel');

  const chapterBook =
    document.getElementById('chapterBook');

  const chapterNum =
    document.getElementById('chapterNum');

  const translationSel =
    document.getElementById('translationSel');

  const prevChap =
    document.getElementById('prevChap');

  const nextChap =
    document.getElementById('nextChap');

  function clean(value) {
    return String(value || '')
      .replace(/s+/g, ' ')
      .trim();
  }

  function textFromPart(part) {
    if (typeof part === 'string') {
      return part;
    }

    if (part && typeof part === 'object') {
      return part.text || '';
    }

    return '';
  }

  function setLoading() {
    scripture.innerHTML =
      '<p>Loading Scripture…</p>';
  }

  function showError(error) {
    console.error(error);

    scripture.innerHTML = `
      <div class="errorbox">
        <strong>Scripture could not load.</strong>
        <p>${error.message}</p>
      </div>
    `;
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

  function renderChapter(data) {
    const content =
      data?.chapter?.content || [];

    if (!content.length) {
      throw new Error(
        'The chapter has no content.'
      );
    }

    const fragment =
      document.createDocumentFragment();

    let paragraph = null;

    state.verses = [];

    function startParagraph() {
      paragraph =
        document.createElement('p');

      fragment.appendChild(paragraph);
    }

    content.forEach((item) => {
      if (item.type === 'heading') {
        paragraph = null;

        const heading =
          document.createElement('h3');

        heading.textContent =
          clean(item.content);

        fragment.appendChild(heading);

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
        startParagraph();
      }

      const verse =
        document.createElement('span');

      verse.className = 'verse';
      verse.dataset.v = item.number;

      const number =
        document.createElement('sup');

      number.className = 'vnum';
      number.textContent = item.number;

      verse.appendChild(number);

      const text =
        clean(
          (item.content || [])
            .map(textFromPart)
            .join(' ')
        );

      verse.appendChild(
        document.createTextNode(` ${text}`)
      );

      paragraph.appendChild(verse);
      paragraph.appendChild(
        document.createTextNode(' ')
      );

      state.verses.push({
        number: Number(item.number),
        text,
        element: verse
      });
    });

    scripture.replaceChildren(fragment);
  }

  function updateHeader() {
    const label =
      `${state.book} ${state.chapter}`;

    refLabel.textContent = label;
    chapterBook.textContent = state.book;
    chapterNum.textContent = state.chapter;
  }

  async function loadChapter(
    book = state.book,
    chapter = state.chapter
  ) {
    state.book = book;
    state.chapter = Number(chapter);

    updateHeader();
    setLoading();

    const url =
      `${API}/${encodeURIComponent(
        state.translation
      )}/` +
      `${encodeURIComponent(state.book)}/` +
      `${encodeURIComponent(state.chapter)}.json`;

    try {
      const data =
        await getJSON(url);

      renderChapter(data);
    } catch (error) {
      showError(error);
    }
  }

  translationSel.addEventListener(
    'change',
    () => {
      state.translation =
        translationSel.value;

      loadChapter();
    }
  );

  prevChap.addEventListener(
    'click',
    () => {
      if (state.chapter > 1) {
        loadChapter(
          state.book,
          state.chapter - 1
        );
      }
    }
  );

  nextChap.addEventListener(
    'click',
    () => {
      loadChapter(
        state.book,
        state.chapter + 1
      );
    }
  );

  loadChapter();
})();