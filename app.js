(() => {
  "use strict";

  const API =
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
    books: [],
    bookId: "JHN",
    chapter: 3,
    verses: [],
    selectedVerse: 0,
    playing: false,
    narrator: "souer",
    audioMode: "device",
    voices: [],
    speechIndex: 0,
    speechToken: 0,
    speed: 1,
    bookmarks: [],
    user: null
  };

  const el = {
    scripture: $("scripture"),
    translation: $("translationSel"),
    narrator: $("narratorSel"),
    play: $("playBtn"),
    audio: $("audio"),
    ref: $("refLabel"),
    refButton: $("refBtn"),
    previousChapter: $("prevChap"),
    nextChapter: $("nextChap"),
    previousVerse: $("prevVerse"),
    nextVerse: $("nextVerse"),
    previousLabel: $("prevLabel"),
    nextLabel: $("nextLabel"),
    chapterBook: $("chapterBook"),
    chapterNumber: $("chapterNum"),
    bookTitle: $("bookTitle"),
    translationNote: $("translationNote"),
    heroReference: $("heroReference"),
    heroTranslation: $("heroTranslation"),
    seek: $("seek"),
    currentTime: $("tCur"),
    duration: $("tDur"),
    nowPlaying: $("tNow"),
    speed: $("speedBtn"),
    narratorSelect: $("narratorSel"),
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
    bookmarksBody: $("bmBody"),
    bookmarksBadge: $("bmBadge"),
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
    readerBookmarkButton: $("readerBookmarkBtn")
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
    gen: "GEN",
    genesis: "GEN",
    ex: "EXO",
    exodus: "EXO",
    lev: "LEV",
    leviticus: "LEV",
    num: "NUM",
    numbers: "NUM",
    deut: "DEU",
    deuteronomy: "DEU",
    josh: "JOS",
    joshua: "JOS",
    judg: "JDG",
    judges: "JDG",
    ruth: "RUT",
    psa: "PSA",
    psalm: "PSA",
    psalms: "PSA",
    prov: "PRO",
    proverbs: "PRO",
    ecc: "ECC",
    ecclesiastes: "ECC",
    song: "SNG",
    isa: "ISA",
    isaiah: "ISA",
    jer: "JER",
    jeremiah: "JER",
    lam: "LAM",
    lamentations: "LAM",
    ezek: "EZK",
    ezekiel: "EZK",
    dan: "DAN",
    daniel: "DAN",
    hos: "HOS",
    hosea: "HOS",
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
    matt: "MAT",
    matthew: "MAT",
    mark: "MRK",
    luke: "LUK",
    john: "JHN",
    acts: "ACT",
    rom: "ROM",
    romans: "ROM",
    gal: "GAL",
    galatians: "GAL",
    eph: "EPH",
    ephesians: "EPH",
    phil: "PHP",
    philippians: "PHP",
    col: "COL",
    colossians: "COL",
    heb: "HEB",
    hebrews: "HEB",
    jas: "JAS",
    james: "JAS",
    jude: "JUD",
    rev: "REV",
    revelation: "REV"
  };

  function clean(value) {
    return String(value || "")
      .replace(/s+/g, " ")
      .replace(/s([”’.,;:!?])/g, "$1")
      .trim();
  }

  function extractText(value) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(extractText).join("");
    }

    if (value && typeof value === "object") {
      if (typeof value.text === "string") {
        return value.text;
      }

      if (value.content !== undefined) {
        return extractText(value.content);
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

  function toast(message) {
    if (!el.toast) {
      return;
    }

    el.toast.textContent = message;
    el.toast.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      el.toast.classList.remove("show");
    }, 2800);
  }

  async function json(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`
      );
    }

    return response.json();
  }

  function bookName(book) {
    return (
      book?.commonName ||
      book?.name ||
      book?.id ||
      ""
    );
  }

  function currentBook() {
    return state.books.find(
      (book) => book.id === state.bookId
    );
  }

  function reference() {
    return `${bookName(
      currentBook()
    )} ${state.chapter}`;
  }
  async function loadBooks() {
    const url =
      `${API}/` +
      `${encodeURIComponent(
        state.translation
      )}/books.json`;

    const data = await json(url);

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
        "No books are available."
      );
    }

    state.translationInfo =
      data.translation || null;
  }

  function previousReference() {
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
    const book = currentBook();
    const name = bookName(book);

    if (el.ref) {
      el.ref.textContent =
        `${name} ${state.chapter}`;
    }

    if (el.heroReference) {
      el.heroReference.textContent =
        `${name} ${state.chapter}`;
    }

    if (el.chapterBook) {
      el.chapterBook.textContent =
        name;
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
      previousReference();

    const next =
      nextReference();

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
          ? `${bookName(
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
          ? `${bookName(
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
        "The chapter response is empty."
      );
    }

    const fragment =
      document.createDocumentFragment();

    let paragraph = null;

    state.verses = [];

    function newParagraph() {
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
          clean(
            extractText(
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
        newParagraph();
      }

      const verse =
        document.createElement("span");

      verse.className = "verse";
      verse.dataset.v =
        String(item.number);

      const number =
        document.createElement("sup");

      number.className = "vnum";
      number.textContent =
        String(item.number);

      const parts =
        Array.isArray(item.content)
          ? item.content
          : [item.content];

      const textParts = [];
      let insertedNumber = false;

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
            : extractText(part);

        if (!text) {
          return;
        }

        textParts.push(text);

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
        }

        if (
          part &&
          typeof part === "object" &&
          part.wordsOfJesus
        ) {
          span.classList.add(
            "jesus"
          );
        }

        if (!insertedNumber) {
          span.appendChild(number);
          insertedNumber = true;
        }

        span.appendChild(
          document.createTextNode(text)
        );

        verse.appendChild(span);
      });

      if (!insertedNumber) {
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
        text: clean(
          textParts.join(" ")
        ),
        element: verse
      });
    });

    if (!state.verses.length) {
      throw new Error(
        "No verses were found."
      );
    }

    if (el.scripture) {
      el.scripture.replaceChildren(
        fragment
      );
    }
  }

  async function loadChapter(
    bookId = state.bookId,
    chapter = state.chapter,
    verseNumber = null
  ) {
    state.bookId = bookId;
    state.chapter = Number(chapter);

    updateHeader();

    if (el.scripture) {
      el.scripture.innerHTML =
        "<p>Loading Scripture…</p>";
    }

    const url =
      `${API}/` +
      `${encodeURIComponent(
        state.translation
      )}/` +
      `${encodeURIComponent(
        state.bookId
      )}/` +
      `${encodeURIComponent(
        state.chapter
      )}.json`;

    try {
      const data = await json(url);

      state.data = data;

      renderChapter(data);
      setupAudio(data);
      updateHeader();

      if (verseNumber) {
        selectVerse(verseNumber);
      }
    } catch (error) {
      console.error(error);

      if (el.scripture) {
        el.scripture.innerHTML = `
          <div class="errorbox">
            <strong>
              Could not load ${escapeHTML(
                reference()
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
              verseNumber
            )
        );
      }
    }
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
  function loadVoices() {
    if (
      !("speechSynthesis" in window)
    ) {
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

  function language() {
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

  function voiceForLanguage() {
    const target =
      language().toLowerCase();

    return (
      state.voices.find(
        (voice) =>
          voice.lang.toLowerCase() ===
          target
      ) ||
      state.voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith(
              target.slice(0, 2)
            )
      ) ||
      state.voices[0] ||
      null
    );
  }

  function speechText(text) {
    return String(text || "")
      .replace(/s+/g, " ")
      .replace(
        /\bJesus\b/gi,
        "Jee-zus"
      )
      .replace(
        /\bMoses\b/gi,
        "Moe-ziz"
      )
      .trim();
  }

  function setupAudio(data) {
    if (
      !el.audio ||
      !el.narrator
    ) {
      return;
    }

    const links =
      data?.thisChapterAudioLinks || {};

    el.narrator.innerHTML = "";

    const narrators = [
      ["souer", "Souer"],
      ["hays", "Hays"],
      ["david", "David"],
      ["gilbert", "Gilbert"]
    ];

    narrators.forEach(
      ([id, name]) => {
        const option =
          document.createElement(
            "option"
          );

        option.value = id;
        option.textContent =
          links[id]
            ? name
            : `${name} · unavailable`;
        option.disabled =
          !links[id];

        el.narrator.appendChild(
          option
        );
      }
    );

    const device =
      document.createElement(
        "option"
      );

    device.value = "device";
    device.textContent =
      "Device voice";

    el.narrator.appendChild(device);

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
    if (!el.play) {
      return;
    }

    el.play.textContent =
      state.playing
        ? "Ⅱ"
        : "▶";

    el.play.classList.toggle(
      "is-playing",
      state.playing
    );
  }

  function speakFrom(index) {
    if (
      !("speechSynthesis" in window)
    ) {
      toast(
        "Device voice is unavailable."
      );

      return;
    }

    const verse =
      state.verses[index];

    if (!verse) {
      state.playing = false;
      updatePlayButton();
      return;
    }

    state.speechIndex = index;

    const utterance =
      new SpeechSynthesisUtterance(
        speechText(verse.text)
      );

    const voice =
      voiceForLanguage();

    utterance.lang = language();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = state.speed;

    const token =
      state.speechToken;

    utterance.onend = () => {
      if (
        token !== state.speechToken ||
        !state.playing
      ) {
        return;
      }

      const nextIndex =
        state.speechIndex + 1;

      if (
        nextIndex >=
        state.verses.length
      ) {
        state.playing = false;
        updatePlayButton();
        return;
      }

      state.speechIndex =
        nextIndex;

      speakFrom(nextIndex);
    };

    utterance.onerror = () => {
      state.playing = false;
      updatePlayButton();
    };

    selectVerse(verse.number);
    window.speechSynthesis.speak(
      utterance
    );
  }

  function playSpeech(startVerse = null) {
    if (
      !("speechSynthesis" in window)
    ) {
      toast(
        "Speech is unavailable."
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

    state.speechToken += 1;
    state.playing = true;

    updatePlayButton();
    speakFrom(index);
  }

  function pause() {
    el.audio?.pause();

    state.speechToken += 1;

    if (
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function play() {
    if (
      state.audioMode === "audio" &&
      el.audio?.src
    ) {
      el.audio.play()
        .catch(() => {
          state.audioMode = "speech";
          playSpeech();
        });

      return;
    }

    playSpeech();
  }

  function stopAudio() {
    el.audio?.pause();

    if (el.audio) {
      el.audio.currentTime = 0;
    }

    state.speechToken += 1;

    if (
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    state.playing = false;
    updatePlayButton();
  }

  function bookmarkKey(number) {
    return [
      state.translation,
      state.bookId,
      state.chapter,
      number
    ].join(":");
  }

  function marked(number) {
    return state.bookmarks.some(
      (item) =>
        item.key ===
        bookmarkKey(number)
    );
  }

  function applyBookmarks() {
    state.verses.forEach(
      (verse) => {
        verse.element.classList.toggle(
          "is-bookmarked",
          marked(verse.number)
        );
      }
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

  function saveLocalBookmarks() {
    localStorage.setItem(
      "selah_bookmarks",
      JSON.stringify(
        state.bookmarks
      )
    );
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

  function toggleBookmark(number) {
    const key =
      bookmarkKey(number);

    const index =
      state.bookmarks.findIndex(
        (item) =>
          item.key === key
      );

    if (index >= 0) {
      state.bookmarks.splice(
        index,
        1
      );

      toast(
        "Bookmark removed."
      );
    } else {
      const verse =
        state.verses.find(
          (item) =>
            item.number ===
            Number(number)
        );

      state.bookmarks.push({
        key,
        translation:
          state.translation,
        bookId: state.bookId,
        bookName:
          bookName(
            currentBook()
          ),
        chapter: state.chapter,
        verse: Number(number),
        text: verse?.text || ""
      });

      toast(
        "Bookmark saved on this device."
      );
    }

    saveLocalBookmarks();
    updateBookmarkBadge();
    applyBookmarks();
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
        const button =
          document.createElement(
            "button"
          );

        button.type = "button";
        button.className =
          "bookmark-row";

        button.innerHTML =
          `<strong>${escapeHTML(
            bookmark.bookName
          )} ${bookmark.chapter}:` +
          `${bookmark.verse}</strong>` +
          `<span>${escapeHTML(
            bookmark.text
          )}</span>`;

        button.addEventListener(
          "click",
          () => {
            if (el.bookmarksDialog) {
              el.bookmarksDialog.hidden =
                true;
            }

            loadChapter(
              bookmark.bookId,
              bookmark.chapter,
              bookmark.verse
            );
          }
        );

        el.bookmarksBody.appendChild(
          button
        );
      }
    );
  }

  function openPicker() {
    if (!el.picker) {
      return;
    }

    el.picker.hidden = false;

    if (el.pickerBack) {
      el.pickerBack.hidden =
        true;
    }

    if (el.pickerTitle) {
      el.pickerTitle.textContent =
        "Choose a book";
    }

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
        bookName(book)
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
            bookName(book)
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
      currentBook();

    if (
      !book ||
      !el.pickerBody
    ) {
      return;
    }

    if (el.pickerBack) {
      el.pickerBack.hidden =
        false;
    }

    if (el.pickerTitle) {
      el.pickerTitle.textContent =
        bookName(book);
    }

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
          if (el.picker) {
            el.picker.hidden =
              true;
          }

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
      el.searchDialog.hidden =
        true;
    }

    if (el.bookmarksDialog) {
      el.bookmarksDialog.hidden =
        true;
    }

    if (el.versePopup) {
      el.versePopup.hidden =
        true;
    }
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

  function setupEvents() {
    el.refButton?.addEventListener(
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

    el.play?.addEventListener(
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
          previousReference();

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
          nextReference();

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
          state.audioMode =
            "speech";
        } else {
          setupAudio(state.data);
        }
      }
    );

    el.translation?.addEventListener(
      "change",
      async () => {
        state.translation =
          el.translation.value;

        try {
          await loadBooks();

          if (!currentBook()) {
            state.bookId =
              state.books[0].id;

            state.chapter = 1;
          }

          await loadChapter();
        } catch (error) {
          toast(
            `Translation error: ${error.message}`
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
      updateProgress
    );

    el.audio?.addEventListener(
      "loadedmetadata",
      updateProgress
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

    el.popupPlay?.addEventListener(
      "click",
      () => {
        const verse =
          state.selectedVerse;

        closeDialogs();
        playSpeech(verse);
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
            `${reference()}:${verse.number} — ${verse.text}`
          );

          toast("Verse copied.");
        } catch {
          toast("Copy unavailable.");
        }

        closeDialogs();
      }
    );

    el.popupBookmark?.addEventListener(
      "click",
      () => {
        toggleBookmark(
          state.selectedVerse
        );

        closeDialogs();
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

    el.themeButton?.addEventListener(
      "click",
      () => {
        const dark =
          document.documentElement
            .dataset.theme === "dark";

        const next =
          dark ? "light" : "dark";

        document.documentElement
          .dataset.theme = next;

        localStorage.setItem(
          "selah_theme",
          next
        );

        if (el.themeLabel) {
          el.themeLabel.textContent =
            next === "dark"
              ? "Dark"
              : "Light";
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

    el.fontUp?.addEventListener(
      "click",
      () => {
        document.documentElement
          .style
          .setProperty(
            "--read-size",
            "1.28rem"
          );
      }
    );

    el.fontDown?.addEventListener(
      "click",
      () => {
        document.documentElement
          .style
          .setProperty(
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

    el.jumpForm?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const value =
          el.jumpInput?.value.trim() ||
          "";

        const match =
          value.match(
            /^(.+?)s+(d+)(?::(d+))?$/
          );

        if (!match) {
          renderBooks(value);
          return;
        }

        const key =
          match[1]
            .toLowerCase()
            .replace(/s+/g, "");

        const bookId =
          aliases[key];

        if (!bookId) {
          toast("Book not found.");
          return;
        }

        closeDialogs();

        loadChapter(
          bookId,
          Number(match[2]),
          match[3]
            ? Number(match[3])
            : null
        );
      }
    );

    el.pickerBack?.addEventListener(
      "click",
      () => {
        el.pickerBack.hidden =
          true;

        el.pickerTitle.textContent =
          "Choose a book";

        renderBooks();
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

  async function searchBible(query) {
    const term =
      String(query || "")
        .toLowerCase()
        .trim();

    if (
      !term ||
      !el.searchBody
    ) {
      return;
    }

    el.searchBody.innerHTML =
      '<p class="muted">Searching…</p>';

    const results = [];

    for (const book of state.books) {
      for (
        let chapter = 1;
        chapter <= book.numberOfChapters;
        chapter += 1
      ) {
        try {
          const data =
            await json(
              `${API}/${state.translation}/` +
              `${book.id}/${chapter}.json`
            );

          const verses =
            data?.chapter?.content ||
            [];

          verses
            .filter(
              (item) =>
                item.type === "verse"
            )
            .forEach((item) => {
              const text =
                clean(
                  extractText(
                    item.content
                  )
                );

              if (
                text
                  .toLowerCase()
                  .includes(term)
              ) {
                results.push({
                  book,
                  chapter,
                  verse: Number(
                    item.number
                  ),
                  text
                });
              }
            });
        } catch {
          // Continue searching.
        }

        if (results.length >= 100) {
          break;
        }
      }

      if (results.length >= 100) {
        break;
      }
    }

    el.searchBody.innerHTML = "";

    if (!results.length) {
      el.searchBody.innerHTML =
        '<p class="muted">No matches found.</p>';

      return;
    }

    results.forEach((result) => {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";
      button.className =
        "search-row";

      button.innerHTML =
        `<strong>${escapeHTML(
          bookName(result.book)
        )} ${result.chapter}:${result.verse}</strong>` +
        `<span>${escapeHTML(
          result.text
        )}</span>`;

      button.addEventListener(
        "click",
        () => {
          if (el.searchDialog) {
            el.searchDialog.hidden =
              true;
          }

          loadChapter(
            result.book.id,
            result.chapter,
            result.verse
          );
        }
      );

      el.searchBody.appendChild(
        button
      );
    });
  }

  async function start() {
    try {
      loadSavedTheme();
      loadLocalBookmarks();
      loadVoices();
      buildTranslationSelector();
      setupEvents();

      await loadBooks();

      if (!currentBook()) {
        state.bookId =
          state.books[0].id;

        state.chapter = 1;
      }

      await loadChapter();
      updateBookmarkBadge();
    } catch (error) {
      console.error(error);

      if (el.scripture) {
        el.scripture.innerHTML = `
          <div class="errorbox">
            <strong>
              Selah could not start.
            </strong>
            <p>${escapeHTML(
              error.message
            )}</p>
          </div>
        `;
      }
    }
  }

  start();
})();