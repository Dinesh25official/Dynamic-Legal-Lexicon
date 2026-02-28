import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { generateQuiz, getTermById } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Quiz.css";

export default function Quiz() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const termId = searchParams.get("term"); // Corrected param name for consistency

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [termData, setTermData] = useState(null);

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            try {
                let data;
                if (termId) {
                    const res = await getTermById(termId);
                    data = res.data;
                    setTermData(data);
                } else {
                    // Default term if none selected
                    data = { term: "General Law", oxford_definition: "Standard legal concepts", simplified_definition: "Basic legal rules" };
                }

                const quizRes = await generateQuiz(data);
                if (quizRes.questions && quizRes.questions.length > 0) {
                    setQuestions(quizRes.questions);
                } else {
                    throw new Error("No questions generated");
                }
            } catch (err) {
                setError(err.message || "Failed to generate quiz. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [termId]);

    const handleOptionSelect = (option) => {
        if (selectedOption !== null) return;
        setSelectedOption(option);
        if (option === questions[currentQuestion].answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedOption(null);
        } else {
            setShowResult(true);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setSelectedOption(null);
        setScore(0);
        setShowResult(false);
    };

    if (!user || (user.role !== "student" && user.role !== "admin")) return (
        <div className="page-shell quiz-page centered">
            <div className="error-card panel">
                <XCircle size={48} color="var(--primary)" />
                <h3>Access restricted</h3>
                <p>This interactive legal examination is reserved for qualified profiles.</p>
                <button onClick={() => navigate(-1)}>Return to Lexicon</button>
            </div>
        </div>
    );

    if (loading) return (
        <div className="page-shell quiz-page centered">
            <div className="spinner" />
            <p>Generating your legal examination...</p>
        </div>
    );

    if (error) return (
        <div className="page-shell quiz-page centered">
            <div className="error-card panel">
                <XCircle size={48} color="var(--error)" />
                <h3>Quiz Unavailable</h3>
                <p>{error}</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        </div>
    );

    if (showResult) return (
        <div className="page-shell quiz-page">
            <div className="quiz-result-card panel animate-in">
                <p style={{ textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", fontWeight: "700", fontSize: "0.85rem", marginBottom: "-10px", width: "100%", textAlign: "center" }}>Quiz Completed</p>
                <div className="award-icon" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <Trophy size={64} color="var(--primary)" />
                </div>
                <h2 style={{ margin: 0, width: "100%", textAlign: "center" }}>Your Score</h2>

                <div className="score-display">
                    <div className="score-circle">
                        <span className="big-score">{score}</span>
                        <span className="total">/ {questions.length}</span>
                    </div>
                    <p className="score-label">Correct Responses</p>
                </div>

                <div className="action-row">
                    <button className="secondary" onClick={resetQuiz}>
                        <RotateCcw size={18} /> Re-examine
                    </button>
                    <button onClick={() => navigate("/search")}>
                        Return to Lexicon
                    </button>
                </div>
            </div>
        </div>
    );

    if (!questions || questions.length === 0) return (
        <div className="page-shell quiz-page centered">
            <div className="error-card panel">
                <RotateCcw size={48} color="var(--primary)" />
                <h3>No questions available</h3>
                <p>We encountered an issue preparing the examination. Please try again.</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        </div>
    );

    const q = questions[currentQuestion];

    // Ultra-defensive check for question structure
    if (!q || !q.question || !Array.isArray(q.options)) {
        return (
            <div className="page-shell quiz-page centered">
                <div className="error-card panel">
                    <XCircle size={48} color="var(--danger)" />
                    <h3>Invalid Question Format</h3>
                    <p>The AI generated a question that we couldn't process. Skipping to next or restart.</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <main className="page-shell quiz-page">
            <header className="page-header">
                <div className="quiz-meta">
                    <HelpCircle size={20} color="var(--primary)" />
                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                </div>
                <h2>{termData ? `Quiz: ${termData.term}` : "Legal Knowledge Test"}</h2>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </header>

            <div className="question-card panel animate-in">
                <h3 className="question-text">{q.question}</h3>
                <div className="options-grid">
                    {q.options?.map((opt, idx) => {
                        if (opt === null || opt === undefined) return null;

                        const isSelected = selectedOption === opt;
                        const isCorrect = opt.trim?.() === q.answer?.trim?.();
                        const showStatus = selectedOption !== null;

                        let cardClass = "option-btn";
                        if (showStatus) {
                            if (isCorrect) cardClass += " correct";
                            else if (isSelected) cardClass += " incorrect";
                            else cardClass += " dimmed";
                        }

                        return (
                            <button
                                key={idx}
                                className={cardClass}
                                onClick={() => handleOptionSelect(opt)}
                                disabled={showStatus}
                                style={showStatus && isCorrect ? { borderColor: "#10b981", background: "rgba(16, 185, 129, 0.1)", opacity: 1 } : {}}
                            >
                                <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                                <span className="opt-text">{opt}</span>
                                {showStatus && isCorrect && <CheckCircle2 size={20} className="status-icon" color="#10b981" />}
                                {showStatus && isSelected && !isCorrect && <XCircle size={20} className="status-icon" color="#ef4444" />}
                            </button>
                        );
                    })}
                </div>

                {selectedOption && (
                    <div className="feedback-area animate-fade">
                        <p className={selectedOption === q.answer ? "text-success" : "text-error"}>
                            {selectedOption === q.answer ? "Excellent. Your reasoning is correct." : "Incorrect. Re-evaluate the conceptual definition."}
                        </p>
                        <button className="next-btn" onClick={handleNext}>
                            {currentQuestion === questions.length - 1 ? "Finish Exam" : "Next Question"} <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
