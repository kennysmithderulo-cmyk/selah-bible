const API_BASE = 'https://bible.helloao.org';

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

  const translation = String(
    request.query.translation || 'BSB'
  );

  const book = String(
    request.query.book || 'JHN'
  );

  const chapter = String(
    request.query.chapter || '3'
  );

  const validPart = /^[A-Za-z0-9_-]+$/;

  if (
    !validPart.test(translation) ||
    !validPart.test(book) ||
    !/^d+$/.test(chapter)
  ) {
    return response.status(400).json({
      error: 'Invalid translation, book, or chapter'
    });
  }

  const url =
    `${API_BASE}/api/${encodeURIComponent(translation)}` +
    `/${encodeURIComponent(book)}` +
    `/${encodeURIComponent(chapter)}.json`;

  try {
    const upstream = await fetch(url);

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
      error: 'Could not reach the Bible API'
    });
  }
}