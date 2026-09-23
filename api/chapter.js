const API_BASE = 'https://bible.helloao.org';

function first(value, fallback) {
  if (Array.isArray(value)) {
    return String(value[0] ?? fallback);
  }

  if (value === undefined || value === null) {
    return String(fallback);
  }

  return String(value);
}

function extractText(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractText).join(' ');
  }

  if (value && typeof value === 'object') {
    if (typeof value.text === 'string') {
      return value.text;
    }

    if (value.content !== undefined) {
      return extractText(value.content);
    }
  }

  return '';
}

function cleanText(value) {
  return String(value || '')
    .replace(/s+/g, ' ')
    .trim();
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');

    return response.status(405).json({
      error: 'Method not allowed'
    });
  }

  const query = request.query || {};

  const translation = first(
    query.translation,
    'BSB'
  );

  const book = first(
    query.book,
    'JHN'
  );

  const chapterText = first(
    query.chapter,
    '3'
  );

  const chapter = Number(chapterText);

  if (!/^[A-Za-z0-9_-]+$/.test(translation)) {
    return response.status(400).json({
      error: 'Invalid translation',
      received: translation
    });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(book)) {
    return response.status(400).json({
      error: 'Invalid book',
      received: book
    });
  }

  if (
    !Number.isInteger(chapter) ||
    chapter < 1
  ) {
    return response.status(400).json({
      error: 'Invalid chapter',
      received: chapterText
    });
  }

  const upstreamUrl =
    `${API_BASE}/api/${encodeURIComponent(translation)}` +
    `/${encodeURIComponent(book)}` +
    `/${chapter}.json`;

  try {
    const upstream = await fetch(upstreamUrl);

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: 'Bible API request failed',
        status: upstream.status
      });
    }

    const data = await upstream.json();

    const verses = (
      data.chapter?.content || []
    )
      .filter((item) => item.type === 'verse')
      .map((item) => ({
        number: Number(item.number),
        text: cleanText(
          extractText(item.content)
        )
      }));

    response.setHeader(
      'Cache-Control',
      's-maxage=86400, stale-while-revalidate=604800'
    );

    return response.status(200).json({
      translation: data.translation || null,
      book: data.book || null,
      chapter: data.chapter || null,
      verses
    });
  } catch (error) {
    console.error(error);

    return response.status(502).json({
      error: 'Could not reach the Bible API',
      message: error.message
    });
  }
}