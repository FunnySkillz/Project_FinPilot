import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.5';
const OPENAI_REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT ?? 'low';
const MAX_JSON_BYTES = Number(process.env.MAX_JSON_BYTES ?? 15 * 1024 * 1024);
const VERSION = '0.1.0';

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function notFound(res, requestId) {
  sendJson(res, 404, { ok: false, requestId, error: 'Not found' });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let text = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_JSON_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      text += chunk;
    });
    req.on('end', () => {
      try {
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function requireOpenAi(res, requestId) {
  if (OPENAI_API_KEY) {
    return true;
  }

  sendJson(res, 503, {
    ok: false,
    requestId,
    error: 'OpenAI is not configured on the proxy.',
  });
  return false;
}

function extractOutputText(response) {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const parts = [];
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('\n');
}

function parseJsonObject(text) {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('Model did not return JSON.');
  }
  return JSON.parse(unfenced.slice(start, end + 1));
}

async function createOpenAiResponse({ input }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: OPENAI_REASONING_EFFORT },
      store: false,
      input,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error?.message ?? 'OpenAI request failed.'), {
      status: response.status,
    });
  }

  return data;
}

function normalizeConfidence(value) {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'low';
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
}

function health(requestId) {
  const configured = Boolean(OPENAI_API_KEY);
  return {
    ok: true,
    requestId,
    version: VERSION,
    provider: configured ? 'openai' : 'none',
    configured,
    model: configured ? OPENAI_MODEL : undefined,
    message: configured ? 'AI proxy is configured.' : 'OpenAI API key is not configured.',
  };
}

function documentPrompt({ metadata = {}, language = 'en' }) {
  return [
    'You are FinPilot, a private finance document extraction assistant.',
    `Return ${language === 'de' ? 'German' : 'English'} JSON only.`,
    'Extract cautious, reviewable metadata from the file. Do not provide legal, tax, insurance, or financial advice.',
    'Return this exact JSON shape:',
    JSON.stringify({
      documentType: 'string',
      provider: 'string or null',
      amount: 'number or null',
      documentDate: 'YYYY-MM-DD or null',
      contractEndDate: 'YYYY-MM-DD or null',
      warrantyUntil: 'YYYY-MM-DD or null',
      summary: 'string',
      coveredRisks: ['string'],
      exclusions: ['string'],
      warnings: ['string'],
      excerpt: 'short quoted or paraphrased excerpt',
      confidence: 'low | medium | high',
      needsReview: true,
    }),
    `Known metadata: ${JSON.stringify(metadata)}`,
  ].join('\n');
}

function askPrompt({ question, documents = [], language = 'en' }) {
  return [
    'You are FinPilot, a grounded finance document assistant.',
    `Answer in ${language === 'de' ? 'German' : 'English'} and return JSON only.`,
    'Use only the provided document snippets. If evidence is weak, say so.',
    'Do not provide final legal, tax, insurance, or financial advice.',
    'Return this exact JSON shape:',
    JSON.stringify({
      answer: 'string',
      confidence: 'low | medium | high',
      documentId: 'string or null',
      documentTitle: 'string or null',
      excerpt: 'string',
      recommendation: 'string',
    }),
    `Question: ${question}`,
    `Documents: ${JSON.stringify(documents)}`,
  ].join('\n');
}

async function analyzeDocument(req, res, requestId) {
  if (!requireOpenAi(res, requestId)) {
    return;
  }

  const body = await readJson(req);
  const { fileData, mimeType, fileName, language, metadata } = body;
  if (!fileData || typeof fileData !== 'string' || !mimeType || typeof mimeType !== 'string') {
    sendJson(res, 400, { ok: false, requestId, error: 'fileData and mimeType are required.' });
    return;
  }

  const response = await createOpenAiResponse({
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename: fileName || 'document',
            file_data: `data:${mimeType};base64,${fileData}`,
          },
          {
            type: 'input_text',
            text: documentPrompt({ metadata, language }),
          },
        ],
      },
    ],
  });
  const parsed = parseJsonObject(extractOutputText(response));

  sendJson(res, 200, {
    ok: true,
    requestId,
    model: OPENAI_MODEL,
    extractedText: typeof parsed.excerpt === 'string' ? parsed.excerpt : undefined,
    analysis: {
      documentType: parsed.documentType || metadata?.category || 'Document',
      provider: parsed.provider || metadata?.provider || undefined,
      amount: typeof parsed.amount === 'number' ? parsed.amount : metadata?.amount,
      documentDate: parsed.documentDate || metadata?.documentDate || undefined,
      contractEndDate: parsed.contractEndDate || undefined,
      warrantyUntil: parsed.warrantyUntil || undefined,
      summary: parsed.summary || 'Cloud analysis completed.',
      coveredRisks: normalizeArray(parsed.coveredRisks),
      exclusions: normalizeArray(parsed.exclusions),
      warnings: normalizeArray(parsed.warnings),
      excerpt: parsed.excerpt || parsed.summary || '',
      confidence: normalizeConfidence(parsed.confidence),
      source: 'cloud-ai',
      requestId,
      model: OPENAI_MODEL,
      needsReview: parsed.needsReview !== false,
      generatedAt: new Date().toISOString(),
    },
  });
}

async function answerQuestion(req, res, requestId) {
  if (!requireOpenAi(res, requestId)) {
    return;
  }

  const body = await readJson(req);
  const { question, documents, language } = body;
  if (!question || typeof question !== 'string') {
    sendJson(res, 400, { ok: false, requestId, error: 'question is required.' });
    return;
  }

  const response = await createOpenAiResponse({
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: askPrompt({ question, documents, language }),
          },
        ],
      },
    ],
  });
  const parsed = parseJsonObject(extractOutputText(response));

  sendJson(res, 200, {
    ok: true,
    requestId,
    model: OPENAI_MODEL,
    answer: parsed.answer || 'No grounded answer was returned.',
    confidence: normalizeConfidence(parsed.confidence),
    documentId: parsed.documentId || undefined,
    documentTitle: parsed.documentTitle || undefined,
    excerpt: parsed.excerpt || '',
    recommendation: parsed.recommendation || '',
  });
}

const server = createServer(async (req, res) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  let status = 200;

  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, health(requestId));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/v1/documents/analyze') {
      await analyzeDocument(req, res, requestId);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/v1/ask') {
      await answerQuestion(req, res, requestId);
      return;
    }

    status = 404;
    notFound(res, requestId);
  } catch (error) {
    status = error.status || 500;
    sendJson(res, status, {
      ok: false,
      requestId,
      error: error.message || 'Unexpected server error.',
    });
  } finally {
    const durationMs = Date.now() - startedAt;
    const route = `${req.method} ${req.url}`;
    console.log(JSON.stringify({ requestId, route, status: res.statusCode || status, durationMs }));
  }
});

server.listen(PORT, () => {
  console.log(`FinPilot AI proxy listening on http://localhost:${PORT}`);
});
