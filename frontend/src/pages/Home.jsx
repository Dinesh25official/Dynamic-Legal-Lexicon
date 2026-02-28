import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bot, PencilLine, Bookmark } from "lucide-react";
import { getTermOfTheDay } from "../services/api";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTermOfTheDay()
      .then((res) => setTerm(res.data))
      .catch(() => setTerm(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="home-container page-shell">
      <section className="hero">
        <h1>Legal Lexicon</h1>
        <p className="subtitle">A Practical legal dictionary designed for students and professionals</p>
      </section>

      <section className="tod-card panel">
        <span className="eyebrow tod-eyebrow">Term of the day</span>
        {loading ? (
          <div className="tod-loading">
            <div className="spinner" />
          </div>
        ) : term ? (
          <>
            <h2>{term.term}</h2>
            <p>{term.simplified_definition
              ? term.simplified_definition.length > 220
                ? term.simplified_definition.substring(0, 220) + "..."
                : term.simplified_definition
              : "Expand your awareness of this legal concept."
            }</p>
            <button onClick={() => navigate(`/term/${encodeURIComponent(term.term)}?from=daily`)} type="button">
              View Full Meaning →
            </button>
          </>
        ) : (
          <>
            <h2>Welcome</h2>
            <p>Enter the lexicon to begin your research into legal structures and definitions.</p>
            <button onClick={() => navigate("/search")} type="button">
              Explore Dictionary →
            </button>
          </>
        )}
      </section>

      <section className="features" aria-label="Lexicon Services">
        <button className="feature-box" onClick={() => navigate("/search")} type="button">
          <div className="icon">
            <Search size={32} />
          </div>
          <h3>Dictionary Search</h3>
          <p>Access precise legal definitions and simplified plain-language summaries.</p>
        </button>

        <button className="feature-box" onClick={() => navigate("/ai-assistant")} type="button">
          <div className="icon">
            <Bot size={32} />
          </div>
          <h3>AI Assistant</h3>
          <p>Consult our generative model for contextual legal study and scenario analysis.</p>
        </button>

        <button className="feature-box" onClick={() => navigate("/quiz")} type="button">
          <div className="icon">
            <PencilLine size={32} />
          </div>
          <h3>Practice Quiz</h3>
          <p>Validate your understanding of key legal concepts with structured examinations.</p>
        </button>

        <button className="feature-box" onClick={() => navigate("/bookmarks")} type="button">
          <div className="icon">
            <Bookmark size={32} />
          </div>
          <h3>Saved Terms</h3>
          <p>Maintain a curated collection of terms for your professional revision.</p>
        </button>
      </section>
    </main>
  );
}
