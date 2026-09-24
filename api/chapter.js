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

  const upstreamUrl =
    `${API_BASE}/api/` +
    `${encodeURIComponent(translation)}/` +
    `${encodeURIComponent(book)}/` +
    `${chapter}.json`;

  try {
    const upstream =
      await fetch(upstreamUrl);

    const raw =
      await upstream.text();

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: 'Bible API request failed',
        status: upstream.status,
        upstream: raw.slice(0, 500)
      });
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return response.status(502).json({
        error: 'Bible API returned invalid JSON',
        upstream: raw.slice(0, 500)
      });
    }

    response.setHeader(
      'Content-Type',
      'application/json; charset=utf-8'
    );

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