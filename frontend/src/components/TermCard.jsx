import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, Book, Lightbulb } from "lucide-react";

function TermCard({
  term,
  showBookmark = true,
  isBookmarked = false,
  onToggleBookmark,
  actionLabel,
  onAction
}) {
  const navigate = useNavigate();

  const oxfordDefRef = useRef(null);
  const simpleDefRef = useRef(null);
  const [showOxfordReadMore, setShowOxfordReadMore] = useState(false);
  const [showSimpleReadMore, setShowSimpleReadMore] = useState(false);

  const oxfordDef = term.oxford_definition || term["Fixed (Oxford) Definition"] || term.technical || "N/A";
  const simpleDef = term.simplified_definition || term["Simplified Definition"] || term.simple || "N/A";

  useEffect(() => {
    // Check if the text overflows beyond the 4 lines
    if (oxfordDefRef.current) {
      setShowOxfordReadMore(oxfordDefRef.current.scrollHeight > oxfordDefRef.current.clientHeight);
    }
    if (simpleDefRef.current) {
      setShowSimpleReadMore(simpleDefRef.current.scrollHeight > simpleDefRef.current.clientHeight);
    }
  }, [oxfordDef, simpleDef]);

  const handleReadMoreClick = (e) => {
    e.stopPropagation();
    navigate(`/term/${encodeURIComponent(term.term || term.term_name || term["Legal Term"])}`);
  };

  return (
    <>
      <article
        className="term-card result-card"
        onClick={() => navigate(`/term/${encodeURIComponent(term.term || term.term_name || term["Legal Term"])}`)}
        style={{ cursor: "pointer" }}
      >
        {showBookmark && (
          <button
            className="bookmark-btn"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              minWidth: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isBookmarked ? "var(--primary)" : "transparent",
              border: `1px solid ${isBookmarked ? "var(--primary)" : "var(--line)"}`,
              color: isBookmarked ? "white" : "var(--text-muted)",
              transition: "all 0.2s ease",
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark?.(term.term || term.term_name || term["Legal Term"], !isBookmarked);
            }}
            type="button"
            title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
          >
            {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        )}

        <div className="card-header">
          <h3>{term.term || term.term_name || term["Legal Term"]}</h3>
        </div>

        <div className="def-section">
          <strong><Book size={14} style={{ marginRight: "6px" }} /> Oxford Definition</strong>
          <p ref={oxfordDefRef} className="line-clamp-4">
            {oxfordDef}
          </p>
          {showOxfordReadMore && (
            <button
              className="read-more-link"
              onClick={handleReadMoreClick}
            >
              Read more
            </button>
          )}
        </div>

        <div className="def-section">
          <strong><Lightbulb size={14} style={{ marginRight: "6px" }} /> Simplified Meaning</strong>
          <p ref={simpleDefRef} className="line-clamp-4">
            {simpleDef}
          </p>
          {showSimpleReadMore && (
            <button
              className="read-more-link"
              onClick={handleReadMoreClick}
            >
              Read more
            </button>
          )}
        </div>

        {term.statutory && term.statutory.length > 0 && (
          <div className="def-section">
            <strong><Book size={14} style={{ marginRight: "6px" }} /> Statutory References</strong>
            {term.statutory.slice(0, 1).map((statute, idx) => (
              <p key={idx} style={{ fontWeight: 600, color: "var(--primary)", fontSize: "0.9rem" }}>
                {statute.statute_name} {statute.section && `(${statute.section})`}
              </p>
            ))}
            {term.statutory.slice(0, 1).map((statute, idx) => (
              <p key={`desc-${idx}`} className="line-clamp-4">{statute.description}</p>
            ))}
          </div>
        )}

        {(actionLabel || onAction) && (
          <div className="actions-row">
            <button
              className="btn-secondary"
              style={{ width: "100%" }}
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
              }}
              type="button"
            >
              {actionLabel || "Action"}
            </button>
          </div>
        )}
      </article>
    </>
  );
}

export default TermCard;
