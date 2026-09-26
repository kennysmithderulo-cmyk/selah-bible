document.body.insertAdjacentHTML(
  "afterbegin",
  '<div id="selah-startup-test" style="position:fixed;z-index:99999;top:0;left:0;right:0;padding:14px;background:#146c43;color:#fff;font:16px sans-serif">app.js is executing</div>'
);

(() => {
  "use strict";

  const BIBLE_API =
    "https://bible.helloao.org/api";

  const SUPABASE_URL =
    "https://ylspdrjrvhixrregmqtg.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_Ar8T3NCh77i6YZfjN88wBQ_f8j7oool";

  const supabaseClient =
    window.supabase?.createClient
      ? window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        )
      : null;

  const $ = (id) =>
    document.getElementById(id);

  const state = {
    translation: "BSB",
    translationInfo: null,
    books: [],
    bookId: "JHN",
    chapter: 3,
    data: null,
    verses: [],
    selectedVerse: 0,
    currentVerse: 0,
    narrator: "souer",
    audioMode: "speech",
    playing: false,
    speechIndex: 0,
    speechToken: 0,
    voices: [],
    speed: 1,
    follow: true,
    autoNext: true,
    bookmarks: [],
    user: null
  };

  const el = {
    audio: $("audio"),
    scripture: $("scripture"),
    refBtn: $("refBtn"),
    refLabel: $("refLabel"),
    translationSelect: $("translationSel"),
    narratorSelect: $("narratorSel"),
    playButton: $("playBtn"),
    previousVerse: $("prevVerse"),
    nextVerse: $("nextVerse"),
    seek: $("seek"),
    currentTime: $("tCur"),
    duration: $("tDur"),
    nowPlaying: $("tNow"),
    speedButton: $("speedBtn"),
    previousChapter: $("prevChap"),
    nextChapter: $("nextChap"),
    previousLabel: $("prevLabel"),
    nextLabel: $("nextLabel"),
    chapterBook: $("chapterBook"),
    chapterNumber: $("chapterNum"),
    bookTitle: $("bookTitle"),
    translationNote: $("translationNote"),
    picker: $("picker"),
    pickerBody: $("pickerBody"),
    pickerTitle: $("pickerTitle"),
    pickerBack: $("pickerBack"),
    jumpForm: $("jumpForm"),
    jumpInput: $("jumpInput"),
    versePopup: $("versePop"),
    popupPlay: $("popPlay"),
    popupCopy: $("popCopy"),
    popupBookmark: $("popBookmark"),
    toast: $("toast"),
    searchButton: $("searchBtn"),
    searchDialog: $("searchDlg"),
    searchForm: $("searchForm"),
    searchInput: $("searchInput"),
    searchBody: $("searchBody"),
    bookmarksButton: $("bookmarksBtn"),
    bookmarksDialog: $("bookmarksDlg"),
    bookmarksBadge: $("bmBadge"),
    bookmarksBody: $("bmBody"),
    settingsButton: $("settingsBtn"),
    settingsPanel: $("settingsPanel"),
    themeButton: $("themeBtn"),
    themeLabel: $("themeLabel"),
    fontUp: $("fontUp"),
    fontDown: $("fontDown"),
    followToggle: $("followToggle"),
    autoNextToggle: $("autoNextToggle"),
    numbersToggle: $("numsToggle"),
    continueButton: $("continueBtn"),
    browseButton: $("browseBtn"),
    readerBookmarkButton: $("readerBookmarkBtn"),
    heroReference: $("heroReference"),
    heroTranslation: $("heroTranslation")
  };

  const translations = [
    {
      group: "English",
      items: [
        ["BSB", "Berean Standard Bible"],
        ["eng_kjv", "King James Version"],
        ["ENGWEBP", "World English Bible"],
        ["eng_asv", "American Standard Version"],
        ["eng_net", "NET Bible"],
        ["eng_bbe", "Bible in Basic English"],
        ["eng_ylt", "Young's Literal Translation"],
        ["eng_dby", "Darby Translation"]
      ]
    },
    {
      group: "Ghana and Africa",
      items: [
        ["twi_asa", "Asante Twi"],
        ["twi_aka", "Akuapem Twi"],
        ["ewe_bib", "Eʋegbe"],
        ["hau_bib", "Hausa"],
        ["yor_bib", "Yorùbá"],
        ["swh_onmm", "Kiswahili"]
      ]
    },
    {
      group: "Other languages",
      items: [
        ["fra_lsg", "Français — Louis Segond"],
        ["spa_r09", "Español — Reina-Valera 1909"],
        ["por_blj", "Português — Bíblia Livre"],
        ["deu_l12", "Deutsch — Luther 1912"]
      ]
    }
  ];

  const aliases = {
    genesis: "GEN",
    gen: "GEN",
    exodus: "EXO",
    ex: "EXO",
    leviticus: "LEV",
    lev: "LEV",
    numbers: "NUM",
    num: "NUM",
    deuteronomy: "DEU",
    deut: "DEU",
    joshua: "JOS",
    josh: "JOS",
    judges: "JDG",
    judg: "JDG",
    ruth: "RUT",
    psalms: "PSA",
    psalm: "PSA",
    psa: "PSA",
    proverbs: "PRO",
    prov: "PRO",
    ecclesiastes: "ECC",
    ecc: "ECC",
    song: "SNG",
    isaiah: "ISA",
    isa: "ISA",
    jeremiah: "JER",
    jer: "JER",
    lamentations: "LAM",
    lam: "LAM",
    ezekiel: "EZK",
    ezek: "EZK",
    daniel: "DAN",
    dan: "DAN",
    hosea: "HOS",
    hos: "HOS",
    joel: "JOL",
    amos: "AMO",
    obadiah: "OBA",
    jonah: "JON",
    micah: "MIC",
    nahum: "NAM",
    habakkuk: "HAB",
    zephaniah: "ZEP",
    haggai: "HAG",
    zechariah: "ZEC",
    malachi: "MAL",
    matthew: "MAT",
    matt: "MAT",
    mark: "MRK",
    luke: "LUK",
    john: "JHN",
    acts: "ACT",
    romans: "ROM",
    rom: "ROM",
    galatians: "GAL",
    gal: "GAL",
    ephesians: "EPH",
    eph: "EPH",
    philippians: "PHP",
    phil: "PHP",
    colossians: "COL",
    col: "COL",
    hebrews: "HEB",
    heb: "HEB",
    james: "JAS",
    jas: "JAS",
    jude: "JUD",
    revelation: "REV",
    rev: "REV"
  };

  function cleanText(value) {
    return String(value || "")
      .replace(/s+/g, " ")
      .replace(/s([”’.,;:!?])/g, "$1")
      .trim();
  }

  function textFromContent(value) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => textFromContent(item))
        .join("");
    }

    if (value && typeof value === "object") {
      if (typeof value.text === "string") {
        return value.text;
      }

      if (value.content !== undefined) {
        return textFromContent(value.content);
      }
    }

    return "";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
  }

  function showToast(message) {
    if (!el.toast) {
      return;
    }

    el.toast.textContent = message;
    el.toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      el.toast.classList.remove("show");
    }, 2800);
  }

  function getBookName(book) {
    return (
      book?.commonName ||
      book?.name ||
      book?.id ||
      ""
    );
  }

  function getCurrentBook() {
    return state.books.find(
      (book) => book.id === state.bookId
    );
  }

  function getReference() {
    return `${getBookName(
      getCurrentBook()
    )} ${state.chapter}`;
  }

  function formatTime(seconds) {
    const safeSeconds =
      Number.isFinite(seconds)
        ? seconds
        : 0;

    return (
      `${Math.floor(safeSeconds / 60)}:` +
      `${String(
        Math.floor(safeSeconds % 60)
      ).padStart(2, "0")}`
    );
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
  function buildTranslationSelector() {
    if (!el.translationSelect) {
      return;
    }

    el.translationSelect.innerHTML = "";

    translations.forEach((group) => {
      const optgroup =
        document.createElement("optgroup");

      optgroup.label = group.group;

      group.items.forEach(([id, name]) => {
        const option =
          document.createElement("option");

        option.value = id;
        option.textContent = name;
        option.selected =
          id === state.translation;

        optgroup.appendChild(option);
      });

      el.translationSelect.appendChild(
        optgroup
      );
    });
  }

  async function loadBooks() {
    const url =
      `${BIBLE_API}/` +
      `${encodeURIComponent(
        state.translation
      )}/books.json`;

    const data = await getJSON(url);

    if (
      !data ||
      !Array.isArray(data.books)
    ) {
      throw new Error(
        "The books response was invalid."
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
      .filter((book) => {
        return (
          book.id &&
          book.numberOfChapters > 0
        );
      })
      .sort((a, b) => {
        return a.order - b.order;
      });

    if (!state.books.length) {
      throw new Error(
        "No books were found."
      );
    }

    state.translationInfo =
      data.translation || null;
  }

  function getPreviousReference() {
    if (state.chapter > 1) {
      return [
        state.bookId,
        state.chapter - 1
      ];
    }

    const index =
      state.books.findIndex(
        (book) => book.id === state.bookId
      );

    if (index <= 0) {
      return null;
    }

    const previousBook =
      state.books[index - 1];

    return [
      previousBook.id,
      previousBook.numberOfChapters
    ];
  }

  function getNextReference() {
    const book = getCurrentBook();

    if (
      book &&
      state.chapter < book.numberOfChapters
    ) {
      return [
        state.bookId,
        state.chapter + 1
      ];
    }

    const index =
      state.books.findIndex(
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
    const book =
      getCurrentBook();

    const name =
      getBookName(book);

    if (el.refLabel) {
      el.refLabel.textContent =
        `${name} ${state.chapter}`;
    }

    if (el.heroReference) {
      el.heroReference.textContent =
        `${name} ${state.chapter}`;
    }

    if (el.chapterBook) {
      el.chapterBook.textContent = name;
    }

    if (el.chapterNumber) {
      el.chapterNumber.textContent =
        state.chapter;
    }

    if (el.bookTitle) {
      el.bookTitle.textContent =
        book?.title || name;
    }

    const translationName =
      state.translationInfo?.englishName ||
      state.translationInfo?.name ||
      state.translation;

    if (el.translationNote) {
      el.translationNote.textContent =
        translationName;
    }

    if (el.heroTranslation) {
      el.heroTranslation.textContent =
        translationName;
    }

    const previous =
      getPreviousReference();

    const next =
      getNextReference();

    if (el.previousChapter) {
      el.previousChapter.disabled =
        !previous;
    }

    if (el.nextChapter) {
      el.nextChapter.disabled =
        !next;
    }

    if (el.previousLabel) {
      el.previousLabel.textContent =
        previous
          ? `${getBookName(
              state.books.find(
                (bookItem) =>
                  bookItem.id ===
                  previous[0]
              )
            )} ${previous[1]}`
          : "Previous";
    }

    if (el.nextLabel) {
      el.nextLabel.textContent =
        next
          ? `${getBookName(
              state.books.find(
                (bookItem) =>
                  bookItem.id ===
                  next[0]
              )
            )} ${next[1]}`
          : "Next";
    }
  }

  function renderChapter(data) {
    const content =
      data?.chapter?.content || [];

    if (
      !Array.isArray(content) ||
      !content.length
    ) {
      throw new Error(
        "The chapter contains no content."
      );
    }

    const fragment =
      document.createDocumentFragment();

    let paragraph = null;

    state.verses = [];

    function createParagraph() {
      paragraph =
        document.createElement("p");

      fragment.appendChild(paragraph);
    }

    content.forEach((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return;
      }

      if (
        item.type === "heading" ||
        item.type === "subtitle"
      ) {
        paragraph = null;

        const heading =
          document.createElement("h3");

        heading.textContent =
          cleanText(
            textFromContent(
              item.content
            )
          );

        if (heading.textContent) {
          fragment.appendChild(
            heading
          );
        }

        return;
      }

      if (item.type === "line_break") {
        paragraph = null;
        return;
      }

      if (item.type !== "verse") {
        return;
      }

      if (!paragraph) {
        createParagraph();
      }

      const verse =
        document.createElement("span");

      verse.className = "verse";
      verse.dataset.v =
        String(item.number);
      verse.id =
        `v${item.number}`;

      const number =
        document.createElement("sup");

      number.className = "vnum";
      number.textContent =
        String(item.number);

      const parts =
        Array.isArray(item.content)
          ? item.content
          : [item.content];

      const plainParts = [];
      let numberInserted = false;

      parts.forEach((part) => {
        if (
          part &&
          typeof part === "object" &&
          part.lineBreak
        ) {
          verse.appendChild(
            document.createElement("br")
          );

          return;
        }

        const text =
          typeof part === "string"
            ? part
            : textFromContent(part);

        if (!text) {
          return;
        }

        plainParts.push(text);

        const span =
          document.createElement("span");

        if (
          part &&
          typeof part === "object" &&
          part.poem
        ) {
          span.classList.add(
            "poem-line"
          );

          if (Number(part.poem) > 1) {
            span.classList.add("p2");
          }
        }

        if (
          part &&
          typeof part === "object" &&
          part.wordsOfJesus
        ) {
          span.classList.add("jesus");
        }

        if (!numberInserted) {
          span.appendChild(number);
          numberInserted = true;
        }

        span.appendChild(
          document.createTextNode(text)
        );

        verse.appendChild(span);
      });

      if (!numberInserted) {
        verse.appendChild(number);
      }

      if (paragraph.childNodes.length) {
        paragraph.appendChild(
          document.createTextNode(" ")
        );
      }

      paragraph.appendChild(verse);

      state.verses.push({
        number: Number(item.number),
        text: cleanText(
          plainParts.join(" ")
        ),
        element: verse
      });
    });

    if (!state.verses.length) {
      throw new Error(
        "The chapter contains no verses."
      );
    }

    if (el.scripture) {
      el.scripture.replaceChildren(
        fragment
      );
    }

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

    if (el.scripture) {
      el.scripture.innerHTML =
        "<p>Loading Scripture…</p>";
    }

    try {
      const url =
        `${BIBLE_API}/` +
        `${encodeURIComponent(
          state.translation
        )}/` +
        `${encodeURIComponent(
          state.bookId
        )}/` +
        `${encodeURIComponent(
          state.chapter
        )}.json`;

      const data =
        await getJSON(url);

      if (
        !data?.chapter ||
        !Array.isArray(
          data.chapter.content
        )
      ) {
        throw new Error(
          "The chapter response was invalid."
        );
      }

      state.data = data;

      renderChapter(data);
      setupAudio(data);
      await loadPosition();

      if (options.verse) {
        selectVerse(options.verse);
      }
    } catch (error) {
      console.error(error);

      if (el.scripture) {
        el.scripture.innerHTML = `
          <div class="errorbox">
            <strong>
              Could not load ${escapeHTML(
                getReference()
              )}.
            </strong>

            <p>${escapeHTML(
              error.message
            )}</p>

            <button
              id="retryBtn"
              type="button"
            >
              Try again
            </button>
          </div>
        `;

        $("retryBtn")?.addEventListener(
          "click",
          () =>
            loadChapter(
              state.bookId,
              state.chapter,
              options
            )
        );
      }
    }
  }
  function speechLanguage() {
    if (state.translation === "fra_lsg") {
      return "fr-FR";
    }

    if (state.translation === "spa_r09") {
      return "es-ES";
    }

    if (state.translation === "por_blj") {
      return "pt-PT";
    }

    if (state.translation === "deu_l12") {
      return "de-DE";
    }

    return "en-US";
  }

  function loadSpeechVoices() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const update =
      () => {
        state.voices =
          window.speechSynthesis
            .getVoices();
      };

    update();

    window.speechSynthesis
      .addEventListener(
        "voiceschanged",
        update
      );
  }

  function chooseSpeechVoice() {
    const voices =
      state.voices || [];

    const language =
      speechLanguage().toLowerCase();

    return (
      voices.find(
        (voice) =>
          voice.lang.toLowerCase() ===
          language
      ) ||
      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith(
              language.slice(0, 2)
            )
      ) ||
      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith("en")
      ) ||
      voices[0] ||
      null
    );
  }

  function prepareSpeechText(text) {
    let spoken =
      String(text || "")
        .replace(/­/g, "")
        .replace(/[-‍﻿]/g, "")
        .replace(/s+/g, " ")
        .trim();

    const pronunciations = [
      [/\bJesus's\b/gi, "Jee-zus-es"],
      [/\bJesus\b/gi, "Jee-zus"],
      [/\bMoses\b/gi, "Moe-ziz"],
      [/\bdisciples\b/gi, "duh-sigh-pulz"],
      [/\bsalvation\b/gi, "sal-vay-shun"],
      [/\bPharisees\b/gi, "Fair-uh-seez"],
      [/\bSadducees\b/gi, "Sad-you-seez"]
    ];

    pronunciations.forEach(
      ([pattern, replacement]) => {
        spoken =
          spoken.replace(
            pattern,
            replacement
          );
      }
    );

    return spoken;
  }

  function setupAudio(data) {
    if (
      !el.audio ||
      !el.narratorSelect
    ) {
      return;
    }

    const links =
      data?.thisChapterAudioLinks || {};

    el.narratorSelect.innerHTML =
      "";

    const narrators = [
      ["souer", "Souer"],
      ["hays", "Hays"],
      ["david", "David"],
      ["gilbert", "Gilbert"]
    ];

    narrators.forEach(
      ([id, label]) => {
        const option =
          document.createElement(
            "option"
          );

        option.value = id;
        option.textContent =
          links[id]
            ? label
            : `${label} · unavailable`;

        option.disabled =
          !links[id];

        option.selected =
          id === state.narrator &&
          Boolean(links[id]);

        el.narratorSelect.appendChild(
          option
        );
      }
    );

    const deviceOption =
      document.createElement(
        "option"
      );

    deviceOption.value = "device";
    deviceOption.textContent =
      "Device voice";

    el.narratorSelect.appendChild(
      deviceOption
    );

    const audioUrl =
      links[state.narrator];

    if (audioUrl) {
      state.audioMode = "audio";
      el.audio.src = audioUrl;
      el.audio.playbackRate =
        state.speed;
      el.audio.load();
    } else {
      state.audioMode = "speech";
      el.audio.removeAttribute("src");
      el.audio.load();
    }

    updatePlayButton();
  }

  function updatePlayButton() {
    if (!el.playButton) {
      return;
    }

    el.playButton.textContent =
      state.playing ? "Ⅱ" : "▶";

    el.playButton.classList.toggle(
      "is-playing",
      state.playing
    );
  }

  function play(startVerse = null) {
    if (
      state.audioMode === "speech" ||
      !el.audio?.src
    ) {
      speakChapter(startVerse);
      return;
    }

    el.audio.play()
      .then(() => {
        state.playing = true;
        updatePlayButton();
      })
      .catch(() => {
        state.audioMode = "speech";
        speakChapter(startVerse);
      });
  }

  function pause() {
    el.audio?.pause();

    state.speechToken += 1;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function stopPlayback() {
    if (el.audio) {
      el.audio.pause();
      el.audio.currentTime = 0;
    }

    state.speechToken += 1;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    state.speechIndex = 0;

    updatePlayButton();
  }

  function speakChapter(startVerse = null) {
    if (
      !("speechSynthesis" in window)
    ) {
      showToast(
        "Device voice is unavailable."
      );

      return;
    }

    window.speechSynthesis.cancel();

    let index = 0;

    if (startVerse !== null) {
      const found =
        state.verses.findIndex(
          (verse) =>
            verse.number ===
            Number(startVerse)
        );

      if (found >= 0) {
        index = found;
      }
    }

    state.speechIndex = index;
    state.speechToken += 1;
    state.playing = true;

    updatePlayButton();
    speakNextVerse(
      state.speechToken
    );
  }

  function speakNextVerse(token) {
    if (
      token !== state.speechToken ||
      !state.playing
    ) {
      return;
    }

    const verse =
      state.verses[
        state.speechIndex
      ];

    if (!verse) {
      state.playing = false;
      updatePlayButton();

      if (state.autoNext) {
        const next =
          getNextReference();

        if (next) {
          loadChapter(
            next[0],
            next[1]
          ).then(() => {
            speakChapter(1);
          });
        }
      }

      return;
    }

    selectVerse(verse.number);

    const utterance =
      new SpeechSynthesisUtterance(
        prepareSpeechText(
          verse.text
        )
      );

    const voice =
      chooseSpeechVoice();

    utterance.lang =
      speechLanguage();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = state.speed;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (
        token !== state.speechToken ||
        !state.playing
      ) {
        return;
      }

      state.speechIndex += 1;

      setTimeout(() => {
        speakNextVerse(token);
      }, 120);
    };

    utterance.onerror = () => {
      if (
        token !== state.speechToken
      ) {
        return;
      }

      state.playing = false;
      updatePlayButton();

      showToast(
        "Device voice could not read this verse."
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  }

  function selectVerse(number) {
    const verse =
      state.verses.find(
        (item) =>
          item.number ===
          Number(number)
      );

    if (!verse) {
      return;
    }

    state.selectedVerse =
      verse.number;

    state.currentVerse =
      verse.number;

    state.verses.forEach(
      (item) => {
        item.element.classList.remove(
          "is-selected"
        );
      }
    );

    verse.element.classList.add(
      "is-selected"
    );

    verse.element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function updateProgress() {
    if (
      !el.audio ||
      !el.seek ||
      !el.currentTime ||
      !el.duration
    ) {
      return;
    }

    const current =
      Number.isFinite(
        el.audio.currentTime
      )
        ? el.audio.currentTime
        : 0;

    const duration =
      Number.isFinite(
        el.audio.duration
      )
        ? el.audio.duration
        : 0;

    el.seek.max =
      duration || 100;

    el.seek.value =
      duration
        ? current
        : 0;

    el.currentTime.textContent =
      formatTime(current);

    el.duration.textContent =
      formatTime(duration);
  }

  function updateCurrentVerse() {
    if (
      !el.audio ||
      !state.verses.length ||
      !Number.isFinite(
        el.audio.duration
      ) ||
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

    state.currentVerse =
      verse.number;

    state.verses.forEach(
      (item) => {
        item.element.classList.toggle(
          "is-playing",
          item.number ===
            verse.number
        );
      }
    );

    if (el.nowPlaying) {
      el.nowPlaying.textContent =
        `${getReference()}:${verse.number}`;
    }

    savePosition(verse.number);

    if (
      state.follow &&
      state.playing
    ) {
      verse.element.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }
  function bookmarkKey(verse) {
    return [
      state.translation,
      state.bookId,
      state.chapter,
      verse
    ].join(":");
  }

  function isBookmarked(verse) {
    return state.bookmarks.some(
      (bookmark) =>
        bookmark.key ===
        bookmarkKey(verse)
    );
  }

  function saveLocalBookmarks() {
    localStorage.setItem(
      "selah_bookmarks",
      JSON.stringify(
        state.bookmarks
      )
    );
  }

  function loadLocalBookmarks() {
    try {
      state.bookmarks =
        JSON.parse(
          localStorage.getItem(
            "selah_bookmarks"
          ) || "[]"
        );
    } catch {
      state.bookmarks = [];
    }
  }

  function updateBookmarkBadge() {
    if (!el.bookmarksBadge) {
      return;
    }

    el.bookmarksBadge.hidden =
      state.bookmarks.length === 0;

    el.bookmarksBadge.textContent =
      state.bookmarks.length;
  }

  function applyBookmarkMarks() {
    state.verses.forEach(
      (verse) => {
        verse.element.classList.toggle(
          "is-bookmarked",
          isBookmarked(
            verse.number
          )
        );
      }
    );
  }

  async function loadBookmarks() {
    if (
      !supabaseClient ||
      !state.user
    ) {
      loadLocalBookmarks();
      updateBookmarkBadge();
      applyBookmarkMarks();
      return;
    }

    try {
      const {
        data,
        error
      } =
        await supabaseClient
          .from("selah_bookmarks")
          .select("*")
          .eq("user_id", state.user.id)
          .order("created_at", {
            ascending: false
          });

      if (error) {
        throw error;
      }

      state.bookmarks =
        (data || []).map((row) => ({
          id: row.id,
          key: [
            row.translation,
            row.book_id,
            row.chapter,
            row.verse
          ].join(":"),
          row
        }));

      updateBookmarkBadge();
      applyBookmarkMarks();
    } catch (error) {
      console.warn(
        "Bookmark loading failed:",
        error.message
      );

      loadLocalBookmarks();
      updateBookmarkBadge();
      applyBookmarkMarks();
    }
  }

  async function toggleBookmark(verseNumber) {
    const key =
      bookmarkKey(verseNumber);

    if (
      !supabaseClient ||
      !state.user
    ) {
      const exists =
        state.bookmarks.some(
          (bookmark) =>
            bookmark.key === key
        );

      state.bookmarks =
        exists
          ? state.bookmarks.filter(
              (bookmark) =>
                bookmark.key !== key
            )
          : [
              ...state.bookmarks,
              { key }
            ];

      saveLocalBookmarks();
      updateBookmarkBadge();
      applyBookmarkMarks();

      showToast(
        exists
          ? "Bookmark removed."
          : "Bookmark saved on this device."
      );

      return;
    }

    const existing =
      state.bookmarks.find(
        (bookmark) =>
          bookmark.key === key
      );

    try {
      if (existing) {
        const { error } =
          await supabaseClient
            .from("selah_bookmarks")
            .delete()
            .eq("id", existing.id)
            .eq(
              "user_id",
              state.user.id
            );

        if (error) {
          throw error;
        }

        showToast("Bookmark removed.");
      } else {
        const verse =
          state.verses.find(
            (item) =>
              item.number ===
              Number(verseNumber)
          );

        const { error } =
          await supabaseClient
            .from("selah_bookmarks")
            .insert({
              user_id: state.user.id,
              translation:
                state.translation,
              book_id: state.bookId,
              book_name:
                getBookName(
                  getCurrentBook()
                ),
              chapter: state.chapter,
              verse: Number(
                verseNumber
              ),
              verse_text:
                verse?.text || ""
            });

        if (error) {
          throw error;
        }

        showToast("Bookmark saved.");
      }

      await loadBookmarks();
    } catch (error) {
      showToast(
        `Bookmark error: ${error.message}`
      );
    }
  }

  async function savePosition(verse) {
    if (
      !supabaseClient ||
      !state.user ||
      !verse
    ) {
      return;
    }

    try {
      await supabaseClient
        .from("selah_positions")
        .upsert({
          user_id: state.user.id,
          translation:
            state.translation,
          book_id: state.bookId,
          chapter: state.chapter,
          verse: Number(verse),
          narrator: state.narrator,
          updated_at:
            new Date().toISOString()
        });
    } catch (error) {
      console.warn(
        "Position save failed:",
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

    try {
      const {
        data,
        error
      } =
        await supabaseClient
          .from("selah_positions")
          .select("*")
          .eq("user_id", state.user.id)
          .maybeSingle();

      if (error || !data) {
        return;
      }

      if (
        data.translation !==
          state.translation ||
        data.book_id !==
          state.bookId ||
        Number(data.chapter) !==
          state.chapter
      ) {
        return;
      }

      if (data.verse) {
        selectVerse(data.verse);
      }
    } catch {
      // Reading position is optional.
    }
  }

  function renderBookmarks() {
    if (!el.bookmarksBody) {
      return;
    }

    el.bookmarksBody.innerHTML = "";

    if (!state.bookmarks.length) {
      el.bookmarksBody.innerHTML =
        '<p class="muted">No bookmarks yet.</p>';

      return;
    }

    state.bookmarks.forEach(
      (bookmark) => {
        const row =
          document.createElement(
            "button"
          );

        row.type = "button";
        row.className =
          "bookmark-row";

        if (bookmark.row) {
          row.innerHTML =
            `<strong>${escapeHTML(
              bookmark.row.book_name
            )} ${bookmark.row.chapter}:` +
            `${bookmark.row.verse}</strong>` +
            `<span>${escapeHTML(
              bookmark.row.verse_text
            )}</span>`;

          row.addEventListener(
            "click",
            () => {
              if (el.bookmarksDialog) {
                el.bookmarksDialog.hidden =
                  true;
              }

              loadChapter(
                bookmark.row.book_id,
                bookmark.row.chapter,
                {
                  verse:
                    bookmark.row.verse
                }
              );
            }
          );
        } else {
          row.textContent =
            "Saved bookmark";
        }

        el.bookmarksBody.appendChild(
          row
        );
      }
    );
  }

  function openPicker() {
    if (!el.picker) {
      return;
    }

    el.picker.hidden = false;
    el.pickerBack.hidden = true;
    el.pickerTitle.textContent =
      "Choose a book";

    renderBooks();
  }

  function renderBooks(filter = "") {
    if (!el.pickerBody) {
      return;
    }

    const query =
      String(filter || "")
        .toLowerCase()
        .trim();

    el.pickerBody.innerHTML = "";

    state.books
      .filter((book) =>
        getBookName(book)
          .toLowerCase()
          .includes(query)
      )
      .forEach((book) => {
        const button =
          document.createElement(
            "button"
          );

        button.type = "button";
        button.className =
          "book-row";

        button.innerHTML =
          `<strong>${escapeHTML(
            getBookName(book)
          )}</strong>` +
          `<span>${book.numberOfChapters} chapters</span>`;

        button.addEventListener(
          "click",
          () => {
            state.bookId =
              book.id;

            renderChapters();
          }
        );

        el.pickerBody.appendChild(
          button
        );
      });
  }

  function renderChapters() {
    const book =
      getCurrentBook();

    if (
      !book ||
      !el.pickerBody
    ) {
      return;
    }

    el.pickerBack.hidden = false;
    el.pickerTitle.textContent =
      getBookName(book);

    el.pickerBody.innerHTML = "";

    for (
      let chapter = 1;
      chapter <= book.numberOfChapters;
      chapter += 1
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";
      button.className =
        "chapter-number";

      button.textContent =
        chapter;

      button.addEventListener(
        "click",
        () => {
          el.picker.hidden = true;

          loadChapter(
            state.bookId,
            chapter
          );
        }
      );

      el.pickerBody.appendChild(
        button
      );
    }
  }

  function closeDialogs() {
    if (el.picker) {
      el.picker.hidden = true;
    }

    if (el.searchDialog) {
      el.searchDialog.hidden = true;
    }

    if (el.bookmarksDialog) {
      el.bookmarksDialog.hidden = true;
    }

    if (el.versePopup) {
      el.versePopup.hidden = true;
    }
  }
  function setupEvents() {
    el.refBtn?.addEventListener(
      "click",
      openPicker
    );

    el.browseButton?.addEventListener(
      "click",
      openPicker
    );

    el.continueButton?.addEventListener(
      "click",
      () => {
        document
          .getElementById("reader")
          ?.scrollIntoView({
            behavior: "smooth"
          });
      }
    );

    el.readerBookmarkButton?.addEventListener(
      "click",
      () => {
        if (state.currentVerse) {
          toggleBookmark(
            state.currentVerse
          );
        } else {
          showToast(
            "Select a verse first."
          );
        }
      }
    );

    el.pickerBack?.addEventListener(
      "click",
      () => {
        el.pickerBack.hidden = true;
        el.pickerTitle.textContent =
          "Choose a book";

        renderBooks();
      }
    );

    el.jumpForm?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const value =
          el.jumpInput?.value.trim() ||
          "";

        const match = value.match(
          /^(.+?)s+(d+)(?::(d+))?$/
        );

        if (!match) {
          renderBooks(value);
          return;
        }

        const bookKey =
          match[1]
            .toLowerCase()
            .replace(/s+/g, "");

        const bookId =
          aliases[bookKey];

        if (!bookId) {
          showToast(
            "Book not found."
          );

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

    el.playButton?.addEventListener(
      "click",
      () => {
        state.playing
          ? pause()
          : play();
      }
    );

    el.previousChapter?.addEventListener(
      "click",
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

    el.nextChapter?.addEventListener(
      "click",
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

    el.previousVerse?.addEventListener(
      "click",
      () => {
        const index =
          state.verses.findIndex(
            (verse) =>
              verse.number ===
              state.currentVerse
          );

        if (index > 0) {
          selectVerse(
            state.verses[index - 1]
              .number
          );
        }
      }
    );

    el.nextVerse?.addEventListener(
      "click",
      () => {
        const index =
          state.verses.findIndex(
            (verse) =>
              verse.number ===
              state.currentVerse
          );

        if (
          index >= 0 &&
          index <
            state.verses.length - 1
        ) {
          selectVerse(
            state.verses[index + 1]
              .number
          );
        }
      }
    );

    el.narratorSelect?.addEventListener(
      "change",
      () => {
        state.narrator =
          el.narratorSelect.value;

        if (
          state.narrator ===
          "device"
        ) {
          state.audioMode = "speech";
          el.audio?.pause();
        } else {
          setupAudio(state.data);
        }
      }
    );

    el.speedButton?.addEventListener(
      "click",
      () => {
        const speeds = [
          0.75,
          1,
          1.25,
          1.5,
          1.75,
          2
        ];

        const index =
          speeds.indexOf(
            state.speed
          );

        state.speed =
          speeds[
            (index + 1) %
              speeds.length
          ];

        if (el.speedButton) {
          el.speedButton.textContent =
            `${state.speed}×`;
        }

        if (el.audio) {
          el.audio.playbackRate =
            state.speed;
        }
      }
    );

    el.seek?.addEventListener(
      "input",
      () => {
        if (
          state.audioMode === "audio" &&
          el.audio
        ) {
          el.audio.currentTime =
            Number(el.seek.value);
        }
      }
    );

    el.translationSelect?.addEventListener(
      "change",
      async () => {
        state.translation =
          el.translationSelect.value;

        try {
          await loadBooks();

          if (!getCurrentBook()) {
            state.bookId =
              state.books[0].id;

            state.chapter = 1;
          }

          await loadChapter();
        } catch (error) {
          showToast(
            `Translation could not load: ${error.message}`
          );
        }
      }
    );

    el.audio?.addEventListener(
      "playing",
      () => {
        state.playing = true;
        updatePlayButton();
      }
    );

    el.audio?.addEventListener(
      "pause",
      () => {
        state.playing = false;
        updatePlayButton();
      }
    );

    el.audio?.addEventListener(
      "timeupdate",
      () => {
        updateProgress();
        updateCurrentVerse();
      }
    );

    el.audio?.addEventListener(
      "loadedmetadata",
      updateProgress
    );

    el.audio?.addEventListener(
      "ended",
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
      "click",
      (event) => {
        const verse =
          event.target.closest(
            ".verse"
          );

        if (!verse) {
          return;
        }

        selectVerse(
          Number(verse.dataset.v)
        );

        if (el.versePopup) {
          el.versePopup.hidden =
            false;
        }
      }
    );

    el.popupBookmark?.addEventListener(
      "click",
      () => {
        toggleBookmark(
          state.selectedVerse
        );

        if (el.versePopup) {
          el.versePopup.hidden =
            true;
        }
      }
    );

    el.popupPlay?.addEventListener(
      "click",
      () => {
        const verse =
          state.selectedVerse;

        if (el.versePopup) {
          el.versePopup.hidden =
            true;
        }

        play(verse);
      }
    );

    el.popupCopy?.addEventListener(
      "click",
      async () => {
        const verse =
          state.verses.find(
            (item) =>
              item.number ===
              state.selectedVerse
          );

        if (!verse) {
          return;
        }

        try {
          await navigator.clipboard.writeText(
            `${getReference()}:${verse.number} — ${verse.text}`
          );

          showToast(
            "Verse copied."
          );
        } catch {
          showToast(
            "Copying is unavailable."
          );
        }

        if (el.versePopup) {
          el.versePopup.hidden =
            true;
        }
      }
    );

    el.searchButton?.addEventListener(
      "click",
      () => {
        if (el.searchDialog) {
          el.searchDialog.hidden =
            false;
        }

        el.searchInput?.focus();
      }
    );

    el.searchForm?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        searchBible(
          el.searchInput?.value
        );
      }
    );

    el.bookmarksButton?.addEventListener(
      "click",
      () => {
        renderBookmarks();

        if (el.bookmarksDialog) {
          el.bookmarksDialog.hidden =
            false;
        }
      }
    );

    el.settingsButton?.addEventListener(
      "click",
      () => {
        if (el.settingsPanel) {
          el.settingsPanel.hidden =
            !el.settingsPanel.hidden;
        }
      }
    );

    el.themeButton?.addEventListener(
      "click",
      () => {
        const dark =
          document.documentElement
            .dataset.theme === "dark";

        document.documentElement
          .dataset.theme =
          dark ? "light" : "dark";

        if (el.themeLabel) {
          el.themeLabel.textContent =
            dark ? "Dark" : "Light";
        }

        localStorage.setItem(
          "selah_theme",
          dark ? "light" : "dark"
        );
      }
    );

    el.fontUp?.addEventListener(
      "click",
      () => {
        document.documentElement.style.setProperty(
          "--read-size",
          "1.28rem"
        );
      }
    );

    el.fontDown?.addEventListener(
      "click",
      () => {
        document.documentElement.style.setProperty(
          "--read-size",
          "1.08rem"
        );
      }
    );

    el.followToggle?.addEventListener(
      "change",
      () => {
        state.follow =
          el.followToggle.checked;
      }
    );

    el.autoNextToggle?.addEventListener(
      "change",
      () => {
        state.autoNext =
          el.autoNextToggle.checked;
      }
    );

    el.numbersToggle?.addEventListener(
      "change",
      () => {
        el.scripture?.classList.toggle(
          "hide-nums",
          !el.numbersToggle.checked
        );
      }
    );

    document
      .querySelectorAll(
        "[data-close]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          closeDialogs
        );
      });
  }

  function loadSavedTheme() {
    const theme =
      localStorage.getItem(
        "selah_theme"
      );

    if (!theme) {
      return;
    }

    document.documentElement
      .dataset.theme = theme;

    if (el.themeLabel) {
      el.themeLabel.textContent =
        theme === "dark"
          ? "Dark"
          : "Light";
    }
  }

  async function start() {
    try {
      loadSavedTheme();
      loadLocalBookmarks();
      loadSpeechVoices();
      buildTranslationSelector();
      setupEvents();

      await loadBooks();

      if (!getCurrentBook()) {
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

            <p>${escapeHTML(
              error.message
            )}</p>
          </div>
        `;
      } else {
        document.body.insertAdjacentHTML(
          "afterbegin",
          `<pre style="
            padding:16px;
            background:#4b1515;
            color:#fff;
            white-space:pre-wrap;
          ">Selah could not start:
${escapeHTML(
            error.message
          )}</pre>`
        );
      }
    }
  }

  start();
})();