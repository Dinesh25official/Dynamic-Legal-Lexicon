import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, BookOpen, Type, FileCode, Info } from "lucide-react";
import { searchByTerm, searchByDescription, getBookmarks, addBookmark, removeBookmark } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TermCard from "../components/TermCard";
import "./Search.css";

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [mode, setMode] = useState("term"); // "term" or "description"
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  // Fetch bookmarks if logged in
  useEffect(() => {
    if (user) {
      getBookmarks()
        .then(res => setBookmarks(res.data.map(b => b.term_name)))
        .catch(err => console.error("Error loading bookmarks:", err));
    }
  }, [user]);

  const doSearch = useCallback(async (q, searchMode) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = searchMode === "term"
        ? await searchByTerm(q)
        : await searchByDescription(q);

      setResults(res.data?.terms || []);
      setPagination(res.data?.pagination || null);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search if query param exists
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doSearch(q, mode);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(query, mode);
  };

  const toggleBookmark = async (termName, shouldAdd) => {
    if (!user) {
      alert("Please login to bookmark terms.");
      navigate("/login");
      return;
    }

    try {
      if (shouldAdd) {
        await addBookmark(termName);
        setBookmarks([...bookmarks, termName]);
      } else {
        await removeBookmark(termName);
        setBookmarks(bookmarks.filter(name => name !== termName));
      }
    } catch (err) {
      console.error("Bookmark Error:", err);
    }
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setQuery("");
    setResults([]);
    setSearched(false);
    setPagination(null);
  };

  return (
    <main className="page-shell search-page">
      <header className="page-header">
        <h2>Legal Dictionary Search</h2>
        <p>Find legal terms with precise definitions </p>
      </header>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === "term" ? "active" : ""}`}
          onClick={() => handleModeSwitch("term")}
          type="button"
        >
          <Type size={18} /> Search by Term
        </button>
        <button
          className={`mode-btn ${mode === "description" ? "active" : ""}`}
          onClick={() => handleModeSwitch("description")}
          type="button"
        >
          <BookOpen size={18} /> Search by Description
        </button>
      </div>

      {/* Info Banner */}
      <div className="search-info">
        <span className="icon">
          {mode === "term" ? <SearchIcon size={20} /> : <BookOpen size={20} />}
        </span>
        <p>
          {mode === "term"
            ? <>Enter a <strong>legal term</strong> (e.g., "action", "bond") to see its description</>
            : <>Enter <strong>description keywords</strong> (e.g., "court proceedings") to find the term</>
          }
        </p>
      </div>

      {/* Search Bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          placeholder={mode === "term" ? "Enter a legal term..." : "Enter description keywords..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Results Meta */}
      {searched && !loading && (
        <div className="results-meta">
          <span className="count">
            {results.length > 0
              ? `${pagination?.total || results.length} result(s) found`
              : "No results found"
            }
          </span>
          <span className="search-type-badge">
            {mode === "term" ? "Term → Description" : "Description → Term"}
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Searching the legal database...</span>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <section className="grid two">
          {results.map((t) => (
            <TermCard
              key={t.term}
              term={t}
              isBookmarked={bookmarks.includes(t.term)}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </section>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="emoji">
            <SearchIcon size={48} strokeWidth={1.5} />
          </div>
          <h3>No results found</h3>
          <p>Try different keywords or switch search mode.</p>
        </div>
      )}
    </main>
  );
}
