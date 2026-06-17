const { GoogleGenerativeAI } = require('@google/generative-ai');

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured in .env');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

/**
 * Call Gemini. When { json: true } we force responseMimeType so the model
 * returns raw JSON with no markdown fences or prose — the single biggest
 * source of parse failures.
 */
const callGemini = async (prompt, { json = false } = {}) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...(json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Resilient JSON extraction. Handles markdown fences, surrounding prose,
 * and trailing commas. Throws a clear, user-facing error instead of a
 * cryptic JSON.parse message when the response is unusable.
 */
const extractJSON = (text, isArray) => {
  const cleaned = (text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';
  const start = cleaned.indexOf(open);
  const end = cleaned.lastIndexOf(close);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI returned an unparseable response. Please try generating again.');
  }
  // Strip trailing commas before } or ] which LLMs frequently emit.
  const slice = cleaned.substring(start, end + 1).replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(slice);
  } catch {
    throw new Error('AI returned malformed JSON. Please try generating again.');
  }
};

const stripHtml = (s, limit) =>
  (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, limit);

/* ── Normalizers — defend against shape drift in model output ───────── */

const normalizeQuiz = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const options = (Array.isArray(q?.options) ? q.options : [])
        .map((o) => String(o ?? '').trim())
        .slice(0, 4);
      while (options.length < 4) options.push('');
      let idx = Number(q?.correctIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx > 3) idx = 0;
      return {
        question: String(q?.question ?? '').trim(),
        options,
        correctIndex: idx,
        explanation: String(q?.explanation ?? '').trim(),
      };
    })
    .filter((q) => q.question && q.options.some(Boolean));
};

const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];

const normalizeInterviewQuestions = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const level = String(q?.level ?? '').toLowerCase().trim();
      return {
        level: VALID_LEVELS.includes(level) ? level : 'beginner',
        question: String(q?.question ?? '').trim(),
        answer: String(q?.answer ?? '').trim(),
      };
    })
    .filter((q) => q.question);
};

const normalizeTags = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const t of raw) {
    const tag = String(t ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 +#.-]/g, '')
      .trim();
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out.slice(0, 8);
};

exports.generateQuiz = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Lesson content is required' });

    const plainText = stripHtml(content, 6000);

    const prompt = `You are an expert educator. Generate exactly 5 multiple-choice quiz questions for a lesson titled "${title || 'this lesson'}".

Lesson content:
${plainText}

CRITICAL — self-contained questions:
- The learner sees ONLY the question text and the 4 options. There is NO code block, image, table, diagram, or lesson text displayed alongside the question.
- NEVER refer to outside context. Do not write "the following code", "the code below/above", "the snippet", "as shown", "in the diagram", "in the passage", or "in this lesson".
- To test code, write the code INLINE inside the question sentence, keep it to one short expression, and use plain text only (NO markdown, NO backticks — they render as raw characters).
  GOOD: "In JavaScript, what does the expression typeof [] evaluate to?"
  BAD:  "What will the following code output?"

Other rules:
- Each question must have exactly 4 options
- correctIndex is 0-based (0=first option, 3=last option)
- Questions should test understanding, not just recall
- Keep explanations concise (1-2 sentences)

Return ONLY a valid JSON array, no markdown, no explanation:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]`;

    const text = await callGemini(prompt, { json: true });
    const quiz = normalizeQuiz(extractJSON(text, true)).slice(0, 5);
    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateInterviewQuestions = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Lesson content is required' });

    const plainText = stripHtml(content, 6000);

    const prompt = `You are a senior technical interviewer. Generate exactly 6 interview questions (2 beginner, 2 intermediate, 2 advanced) for a lesson titled "${title || 'this lesson'}".

Lesson content:
${plainText}

CRITICAL — self-contained questions:
- The reader sees ONLY the question and your answer. No code block, image, or lesson text is shown alongside.
- NEVER write "the following code", "the snippet above/below", "as shown", or "in this lesson". If code is needed, write it inline as a short plain-text expression (no markdown, no backticks).

Other rules:
- "level" MUST be exactly one of: beginner, intermediate, advanced (all lowercase)
- Beginner: conceptual understanding, basic definitions
- Intermediate: practical application, comparisons
- Advanced: design decisions, edge cases, tradeoffs
- Answers should be 2-4 sentences

Return ONLY a valid JSON array, no markdown, no explanation:
[{"level":"beginner","question":"...","answer":"..."},{"level":"beginner","question":"...","answer":"..."},{"level":"intermediate","question":"...","answer":"..."},{"level":"intermediate","question":"...","answer":"..."},{"level":"advanced","question":"...","answer":"..."},{"level":"advanced","question":"...","answer":"..."}]`;

    const text = await callGemini(prompt, { json: true });
    const questions = normalizeInterviewQuestions(extractJSON(text, true)).slice(0, 6);
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateVisualization = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Lesson content is required' });

    const plainText = stripHtml(content, 3000);

    const prompt = `Based on this lesson about "${title || 'the topic'}", suggest ONE interactive visualization.

Content: ${plainText}

Return ONLY a valid JSON object:
{"dataType":"kebab-case-id","title":"Short title","description":"What this shows","elements":["element1","element2","element3"]}`;

    const text = await callGemini(prompt, { json: true });
    const viz = extractJSON(text, false);
    res.json({ success: true, data: viz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateTheory = async (req, res) => {
  try {
    const { title, difficulty, audience } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Lesson title is required' });

    const prompt = `Write a lesson on "${title}" for ${audience || 'beginner developers'} at ${difficulty || 'beginner'} level.

Rules:
- 800-1000 words, conversational NOT academic
- Never start with "In this lesson we will..."
- Structure: hook → concept → why it matters → code example → common mistake → 3-bullet summary
- Use HTML formatting: <h2>, <h3>, <p>, <pre><code>, <ul><li>
- Code examples should be practical and minimal

Return ONLY the HTML content, no markdown wrapper.`;

    const text = await callGemini(prompt);
    const html = text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    res.json({ success: true, data: html });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateTags = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content && !title) return res.status(400).json({ success: false, error: 'Content or title required' });

    const plainText = stripHtml(content, 2000);

    const prompt = `Generate 6-8 SEO tags for a lesson titled "${title || ''}" with this content: ${plainText}

Rules:
- Tags should be lowercase, 1-3 words each
- Include the main technology, sub-concepts, difficulty level
- Mix broad and specific terms

Return ONLY a JSON array of strings: ["tag1","tag2","tag3"]`;

    const text = await callGemini(prompt, { json: true });
    const tags = normalizeTags(extractJSON(text, true));
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
