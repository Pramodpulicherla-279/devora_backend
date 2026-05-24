const { GoogleGenerativeAI } = require('@google/generative-ai');

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured in .env');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const callGemini = async (prompt) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const extractJSON = (text, isArray) => {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = isArray ? cleaned.indexOf('[') : cleaned.indexOf('{');
  const end = isArray ? cleaned.lastIndexOf(']') + 1 : cleaned.lastIndexOf('}') + 1;
  return JSON.parse(cleaned.substring(start, end));
};

exports.generateQuiz = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Lesson content is required' });

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 6000);

    const prompt = `You are an expert educator. Generate exactly 5 multiple-choice quiz questions for a lesson titled "${title || 'this lesson'}".

Lesson content:
${plainText}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Questions should test understanding, not just recall
- Keep explanations concise (1-2 sentences)

Return ONLY a valid JSON array, no markdown, no explanation:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]`;

    const text = await callGemini(prompt);
    const quiz = extractJSON(text, true);
    res.json({ success: true, data: quiz.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateInterviewQuestions = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Lesson content is required' });

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 6000);

    const prompt = `You are a senior technical interviewer. Generate exactly 6 interview questions (2 beginner, 2 intermediate, 2 advanced) for a lesson titled "${title || 'this lesson'}".

Lesson content:
${plainText}

Rules:
- Beginner: conceptual understanding, basic definitions
- Intermediate: practical application, comparisons
- Advanced: design decisions, edge cases, tradeoffs
- Answers should be 2-4 sentences

Return ONLY a valid JSON array, no markdown, no explanation:
[{"level":"beginner","question":"...","answer":"..."},{"level":"beginner","question":"...","answer":"..."},{"level":"intermediate","question":"...","answer":"..."},{"level":"intermediate","question":"...","answer":"..."},{"level":"advanced","question":"...","answer":"..."},{"level":"advanced","question":"...","answer":"..."}]`;

    const text = await callGemini(prompt);
    const questions = extractJSON(text, true);
    res.json({ success: true, data: questions.slice(0, 6) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.generateVisualization = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Lesson content is required' });

    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);

    const prompt = `Based on this lesson about "${title || 'the topic'}", suggest ONE interactive visualization.

Content: ${plainText}

Return ONLY a valid JSON object:
{"dataType":"kebab-case-id","title":"Short title","description":"What this shows","elements":["element1","element2","element3"]}`;

    const text = await callGemini(prompt);
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

    const plainText = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);

    const prompt = `Generate 6-8 SEO tags for a lesson titled "${title || ''}" with this content: ${plainText}

Rules:
- Tags should be lowercase, 1-3 words each
- Include the main technology, sub-concepts, difficulty level
- Mix broad and specific terms

Return ONLY a JSON array of strings: ["tag1","tag2","tag3"]`;

    const text = await callGemini(prompt);
    const tags = extractJSON(text, true);
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
