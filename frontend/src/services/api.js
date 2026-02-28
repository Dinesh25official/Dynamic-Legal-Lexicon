const BACKEND_URL = 'http://localhost:5000/api';
const AI_URL = 'http://localhost:5001/api';

// ──────────────────────────────────────────
// Authentication API
// ──────────────────────────────────────────

export async function loginUser(email, password) {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
}

export async function registerUser(fullName, email, password, role) {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
}

// ──────────────────────────────────────────
// Backend API (Lexicon Search & Terms)
// ──────────────────────────────────────────

export async function searchByTerm(query, page = 1, limit = 10) {
    const res = await fetch(
        `${BACKEND_URL}/lexicon/search/term?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    if (!res.ok) throw new Error('Search failed');
    return res.json();
}

export async function searchByDescription(query, page = 1, limit = 10) {
    const res = await fetch(
        `${BACKEND_URL}/lexicon/search/description?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    if (!res.ok) throw new Error('Search failed');
    return res.json();
}

export async function getTermById(termName) {
    const res = await fetch(`${BACKEND_URL}/lexicon/term/${encodeURIComponent(termName)}`);
    if (!res.ok) throw new Error('Term not found');
    return res.json();
}

export async function getTermOfTheDay() {
    const res = await fetch(`${BACKEND_URL}/lexicon/term-of-the-day`);
    if (!res.ok) throw new Error('Failed to get term of the day');
    return res.json();
}

// ──────────────────────────────────────────
// AI Integration API (Direct Groq / Gemini)
// ──────────────────────────────────────────

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function aiChat(termId, message, context = "") {
    if (!GROQ_API_KEY) {
        throw new Error("AI API Key not configured in frontend .env");
    }

    const prompt = `
You are a friendly law tutor for students.
Use ONLY this information - do NOT add anything extra or give legal advice:

${context || "No specific legal term selected. Provide general legal definitions based on standard Indian law (IPC/CrPC) if asked."}

Student question: ${message}

Answer in simple language. Use bullet points if helpful.
    `;

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Groq API error');

        return { reply: data.choices[0].message.content };
    } catch (err) {
        console.error('AI chat failed:', err);
        throw err;
    }
}

export async function generateQuiz(termData) {
    if (!GROQ_API_KEY) {
        throw new Error("AI API Key not configured in frontend .env");
    }

    const context = `Term: ${termData.term}\nOxford: ${termData.oxford_definition}\nSimple: ${termData.simplified_definition}`;

    const prompt = `
You are a legal quiz generator. Based on the legal term information below, generate exactly 4 multiple-choice questions to test a student's understanding.

${context}

Rules:
- Generate 4 distinct options for each question.
- Each option MUST be a descriptive sentence or phrase, NOT just a single letter.
- Only one option must be correct.
- Return ONLY valid JSON. No markdown, no backticks.
`;

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Groq API error');

        const cleaned = data.choices[0].message.content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Handle both { questions: [] } and direct [] formats
        if (Array.isArray(parsed)) return { questions: parsed };
        if (parsed.questions) return parsed;

        return { questions: [] }; // Fallback
    } catch (err) {
        console.error('Quiz generation failed:', err);
        throw err;
    }
}

// ──────────────────────────────────────────
// Admin API (requires JWT token)
// ──────────────────────────────────────────

function authHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export async function getAdminTerms(page = 1, limit = 20) {
    const res = await fetch(
        `${BACKEND_URL}/admin/lexicon?page=${page}&limit=${limit}`,
        { headers: authHeaders() }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load terms');
    return data;
}

export async function addTerm(term, oxford_definition, simplified_definition) {
    const res = await fetch(`${BACKEND_URL}/admin/lexicon/import-text`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ term, oxford_definition, simplified_definition }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add term');
    return data;
}

export async function updateTerm(termName, termData) {
    const res = await fetch(`${BACKEND_URL}/admin/lexicon/${encodeURIComponent(termName)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(termData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update term');
    return data;
}

export async function deleteTerm(termName) {
    const res = await fetch(`${BACKEND_URL}/admin/lexicon/${encodeURIComponent(termName)}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete term');
    return data;
}

export async function uploadCSV(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BACKEND_URL}/admin/lexicon/import-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'CSV upload failed');
    return data;
}

/**
 * Get all statutory references (paginated)
 */
export async function getStatutes(page = 1, limit = 20) {
    const res = await fetch(
        `${BACKEND_URL}/admin/statutory?page=${page}&limit=${limit}`,
        { headers: authHeaders() }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load statutes');
    return data;
}

/**
 * Add a statutory reference
 */
export async function addStatutory(statutoryData) {
    const res = await fetch(`${BACKEND_URL}/admin/statutory`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(statutoryData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add statutory reference');
    return data;
}

/**
 * Update a statutory reference by ctid
 */
export async function updateStatutory(ctid, statutoryData) {
    const res = await fetch(`${BACKEND_URL}/admin/statutory/${ctid}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(statutoryData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update statutory reference');
    return data;
}

/**
 * Delete a statutory reference by ctid
 */
export async function deleteStatutory(ctid) {
    const res = await fetch(`${BACKEND_URL}/admin/statutory/${ctid}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete statutory reference');
    return data;
}

/**
 * Get all terms in the daily pool
 */
export async function getDailyPool() {
    const res = await fetch(`${BACKEND_URL}/admin/daily-pool`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch daily pool');
    return data;
}

/**
 * Add a term to the daily pool
 */
export async function addToDailyPool(termData) {
    const res = await fetch(`${BACKEND_URL}/admin/daily-pool`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(termData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add to pool');
    return data;
}

/**
 * Remove a term from the daily pool
 */
export async function removeFromDailyPool(termName) {
    const res = await fetch(`${BACKEND_URL}/admin/daily-pool/${encodeURIComponent(termName)}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to remove from pool');
    return data;
}

/**
 * Set a term in the pool as the active daily term
 */
export async function setDailyActive(termName) {
    const res = await fetch(`${BACKEND_URL}/admin/daily-pool/set-active/${encodeURIComponent(termName)}`, {
        method: 'POST',
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to set active term');
    return data;
}

/**
 * Legacy support for setDailyTerm
 */
export async function setDailyTerm(termName) {
    return setDailyActive(termName);
}

// ──────────────────────────────────────────
// Bookmarks API
// ──────────────────────────────────────────

export async function getBookmarks() {
    const res = await fetch(`${BACKEND_URL}/lexicon/bookmarks`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch bookmarks');
    return data;
}

export async function addBookmark(termName) {
    const res = await fetch(`${BACKEND_URL}/lexicon/bookmarks`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ termId: termName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add bookmark');
    return data;
}

export async function removeBookmark(termName) {
    const res = await fetch(`${BACKEND_URL}/lexicon/bookmarks/${encodeURIComponent(termName)}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to remove bookmark');
    return data;
}
