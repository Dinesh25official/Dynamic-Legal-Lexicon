import defaultTerms from "../data/terms.json";

const USER_KEY = "legalLexiconUser";
const BOOKMARKS_KEY = "legalLexiconBookmarks";
const TERMS_KEY = "legalLexiconTerms";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setBookmarks(ids) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
}

export function toggleBookmark(termId) {
  const current = getBookmarks();
  const exists = current.includes(termId);
  const next = exists ? current.filter((id) => id !== termId) : [...current, termId];
  setBookmarks(next);
  return next;
}

export function removeBookmark(termId) {
  const next = getBookmarks().filter((id) => id !== termId);
  setBookmarks(next);
  return next;
}

export function getTerms() {
  try {
    const raw = localStorage.getItem(TERMS_KEY);
    if (!raw) return defaultTerms;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultTerms;
  } catch {
    return defaultTerms;
  }
}

export function saveTerms(terms) {
  localStorage.setItem(TERMS_KEY, JSON.stringify(terms));
}

export function ensureInitialTerms() {
  const existing = localStorage.getItem(TERMS_KEY);
  if (!existing) {
    saveTerms(defaultTerms);
  }
}
