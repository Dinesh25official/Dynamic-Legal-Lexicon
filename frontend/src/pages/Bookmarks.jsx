import { useState, useEffect } from "react";
import { getBookmarks, removeBookmark } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bookmark, Search } from "lucide-react";
import TermCard from "../components/TermCard";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks();
      setBookmarks(res.data);
    } catch (err) {
      console.error("Fetch Bookmarks Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (termId) => {
    // Optimistic Update: Remove from UI immediately
    const previousBookmarks = [...bookmarks];
    setBookmarks(bookmarks.filter((b) => b.term !== termId));

    try {
      await removeBookmark(termId);
    } catch (err) {
      console.error("Remove Bookmark Error:", err);
      // Rollback if API fails
      setBookmarks(previousBookmarks);
      alert("Failed to remove bookmark. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <header className="page-header">
          <h2>Your Saved Terms</h2>
        </header>
        <div className="loading-state">
          <div className="spinner" />
          <span>Retrieving your collection...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h2>Your Saved Terms</h2>
      </header>

      {bookmarks.length === 0 ? (
        <section className="panel" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ marginBottom: "24px", color: "var(--line)" }}>
            <Bookmark size={64} strokeWidth={1} />
          </div>
          <h3>No saved terms yet</h3>
          <p>Search the lexicon and save terms to build your personal collection.</p>
          <button
            onClick={() => navigate("/search")}
            style={{ marginTop: "24px" }}
            type="button"
          >
            <Search size={18} /> Go to Search
          </button>
        </section>
      ) : (
        <section className="grid two">
          {bookmarks.map((term) => (
            <TermCard
              key={term.term}
              term={term}
              isBookmarked={true}
              onToggleBookmark={() => toggleBookmark(term.term)}
            />
          ))}
        </section>
      )}
    </main>
  );
}

