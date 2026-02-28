import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, Book, Lightbulb, ArrowLeft, Bot, PencilLine } from "lucide-react";
import { getTermById, getBookmarks, addBookmark, removeBookmark, addStatutory } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function TermDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const fromDaily = searchParams.get("from") === "daily";

  const [term, setTerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showStatModal, setShowStatModal] = useState(false);
  const [statForm, setStatForm] = useState({ statute_name: "", section: "", description: "" });
  const [addingStat, setAddingStat] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const termRes = await getTermById(id); // id is termName
        setTerm(termRes.data);

        if (user) {
          try {
            const bookmarkRes = await getBookmarks();
            const bookmarkedNames = bookmarkRes.data.map(b => b.term_name);
            setIsBookmarked(bookmarkedNames.includes(id));
          } catch (bErr) {
            console.error("Error checking bookmarks:", bErr);
          }
        }
      } catch (err) {
        setError("Term details could not be retrieved.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const toggleBookmark = async () => {
    if (!user) {
      alert("Please login to save terms.");
      navigate("/login");
      return;
    }

    try {
      if (isBookmarked) {
        await removeBookmark(id);
        setIsBookmarked(false);
      } else {
        await addBookmark(id);
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark Error:", err);
    }
  };

  const handleAddStatutory = async (e) => {
    e.preventDefault();
    if (!statForm.statute_name) return;

    setAddingStat(true);
    try {
      await addStatutory({
        term: id,
        ...statForm
      });
      // Refresh data
      const res = await getTermById(id);
      setTerm(res.data);
      setShowStatModal(false);
      setStatForm({ statute_name: "", section: "", description: "" });
    } catch (err) {
      alert("Failed to add reference: " + err.message);
    } finally {
      setAddingStat(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-state">
          <div className="spinner" />
          <span>Curating term details...</span>
        </div>
      </main>
    );
  }

  if (error || !term) {
    return (
      <main className="page-shell">
        <section className="panel" style={{ textAlign: "center", padding: "60px" }}>
          <h2>Concept not found</h2>
          <p style={{ margin: "16px 0 24px" }}>The requested legal term does not exist in our current database.</p>
          <button onClick={() => navigate("/search")} type="button">Return to Lexicon</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>{term.term}</h1>
          {term.pronunciation && (
            <p style={{ fontStyle: "italic", marginTop: "8px" }}>/{term.pronunciation}/</p>
          )}
        </div>
        <button
          className="btn-secondary"
          onClick={toggleBookmark}
          type="button"
          title={isBookmarked ? "Remove from Saved" : "Save for Later"}
        >
          {isBookmarked ? <><BookmarkCheck size={18} /> Saved</> : <><Bookmark size={18} /> Save Term</>}
        </button>
      </header>

      <section className="panel" style={{ display: "grid", gap: "32px" }}>
        <div className="def-section">
          <strong style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Book size={14} /> Oxford Definition
          </strong>
          <p style={{ fontSize: "1.2rem", color: "var(--text-main)", marginTop: "8px" }}>
            {term.oxford_definition || "Formal definition not available."}
          </p>
        </div>

        <div className="def-section">
          <strong style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Lightbulb size={14} /> Simplified Meaning
          </strong>
          <p style={{ fontSize: "1.1rem", marginTop: "8px" }}>
            {term.simplified_definition || "Simplified summary not available."}
          </p>
        </div>

        {/* Statutory References Section - Hidden for Daily Terms */}
        {term.source !== "daily_term" && !fromDaily && (
          <div className="statutory-section" style={{ borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <strong style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                ⚖ Statutory References
              </strong>
              {user?.role === "admin" && (
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                  onClick={() => setShowStatModal(true)}
                >
                  + Add Reference
                </button>
              )}
            </div>

            {!term.statutory || term.statutory.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                No statutory references linked to this term yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {term.statutory.map((s, idx) => (
                  <div key={idx} className="stat-card-inline" style={{ background: "rgba(0,0,0,0.15)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600", color: "var(--accent)" }}>{s.statute_name}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{s.section}</span>
                    </div>
                    <p style={{ fontSize: "0.9rem" }}>{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="actions-row" style={{ borderTop: "1px solid var(--line)", paddingTop: "24px", display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: "12px" }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={18} /> Back
          </button>
          <button
            onClick={() => navigate(`/ai-assistant?term=${encodeURIComponent(term.term || id)}`)}
            type="button"
            className="secondary"
          >
            <Bot size={18} /> Consult AI Assistant
          </button>
          <button
            onClick={() => navigate(`/quiz?term=${encodeURIComponent(term.term || id)}`)}
            type="button"
          >
            <PencilLine size={18} /> Take Practice Quiz
          </button>
        </div>
      </section>

      {/* Admin Statutory Modal */}
      {showStatModal && (
        <div className="modal-overlay" onClick={() => setShowStatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "24px", borderRadius: "16px", width: "min(400px, 90%)" }}>
            <h3 style={{ marginBottom: "16px" }}>Add Statutory Reference</h3>
            <form onSubmit={handleAddStatutory} style={{ display: "grid", gap: "12px" }}>
              <input
                placeholder="Statute Name (e.g. IPC, 1860)"
                required
                value={statForm.statute_name}
                onChange={e => setStatForm({ ...statForm, statute_name: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)" }}
              />
              <input
                placeholder="Section (e.g. Section 302)"
                value={statForm.section}
                onChange={e => setStatForm({ ...statForm, section: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)" }}
              />
              <textarea
                placeholder="Brief description..."
                value={statForm.description}
                onChange={e => setStatForm({ ...statForm, description: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", minHeight: "80px" }}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowStatModal(false)}>Cancel</button>
                <button type="submit" disabled={addingStat}>{addingStat ? "Adding..." : "Save Reference"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
