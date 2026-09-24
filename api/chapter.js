const API_BASE =
  'https://bible.helloao.org';

function queryValue(value, fallback) {
  if (Array.isArray(value)) {
    return String(value[0] || fallback);
  }

  return String(value || fallback);
}

export default async function handler(
  request,
  response
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');

    return response.status(405).json({
      error: 'Method not allowed'
    });
  }

  const translation =
    queryValue(
      request.query?.translation,
      'BSB'
    );

  const book =
    queryValue(
      request.query?.book,
      'JHN'
    );

  const chapter =
    Number(
      queryValue(
        request.query?.chapter,
        '3'
      )
    );

  if (!/^[A-Za-z0-9_-]+$/.test(translation)) {
    return response.status(400).json({
      error: 'Invalid translation'
    });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(book)) {
    return response.status(400).json({
      error: 'Invalid book'
    });
  }

  if (
    !Number.isInteger(chapter) ||
    chapter < 1
  ) {
    return response.status(400).json({
      error: 'Invalid chapter'
    });
  }

  const url =
    `${API_BASE}/api/` +
    `${encodeURIComponent(translation)}/` +
    `${encodeURIComponent(book)}/` +
    `${chapter}.json`;

  try {
    const upstream =
      await fetch(url);

    const data =
      await upstream.json();

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: 'Bible API request failed',
        status: upstream.status,
        details: data
      });
    }

    response.setHeader(
      'Cache-Control',
      's-maxage=86400, stale-while-revalidate=604800'
    );

    return response.status(200).json(data);
  } catch (error) {
    console.error(error);

    return response.status(502).json({
      error: 'Could not reach Bible API',
      message: error.message
    });
  }
}