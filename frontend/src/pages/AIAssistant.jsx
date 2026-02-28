import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Scale, Library, History, Gavel, FileSearch, Send, Bot } from "lucide-react";
import { aiChat, searchByTerm } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AIAssistant.css";

export default function AIAssistant() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTerm = searchParams.get("term") || "";

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contextTerm, setContextTerm] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch term data if term passed in URL
    useEffect(() => {
        if (initialTerm) {
            searchByTerm(initialTerm)
                .then((res) => {
                    if (res.data?.terms?.length > 0) {
                        setContextTerm(res.data.terms[0]);
                    }
                })
                .catch(console.error);
        }
    }, [initialTerm]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMsg = { role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            const context = contextTerm
                ? `Context Term: ${contextTerm.term}\nOxford: ${contextTerm.oxford_definition}\nSimple: ${contextTerm.simplified_definition}`
                : "";

            const res = await aiChat(contextTerm?.id, text, context);
            const aiMsg = { role: "ai", content: res.reply };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            setError(err.message || "The AI Assistant is currently experiencing high demand. Please try again shortly.");
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestion = (q) => {
        handleSend(q);
    };

    if (!user || user.role !== "student") return (
        <main className="page-shell ai-page centered" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
                <Bot size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                <h3>Access for students only</h3>
                <p style={{ margin: '16px 0' }}>The Juris AI Assistant is an exclusive benefit for accounts with the Student role.</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        </main>
    );

    return (
        <main className="page-shell ai-page">
            <header className="page-header">
                <h2>Juris AI Assistant</h2>
                <p>Expert legal analysis and contextual conceptual breakdown.</p>
            </header>

            <div className="chat-container">
                <div className="chat-header">
                    <div className="ai-avatar">
                        <Scale size={24} color="var(--primary)" />
                    </div>
                    <div className="title-group">
                        <h3>Legal Consultant</h3>
                        <p>{loading ? "Analyzing query..." : "Ready for scholarly inquiry"}</p>
                    </div>
                </div>

                <div className="messages">
                    {messages.length === 0 && (
                        <div className="welcome-msg">
                            <span className="emoji">
                                <Library size={48} color="var(--primary)" strokeWidth={1.5} />
                            </span>
                            <h3>How may I assist your research?</h3>
                            <p>Consult regarding specific terms, case scenarios, or complex legal doctrine.</p>

                            <div className="suggestions">
                                <button className="suggestion-btn" onClick={() => handleSuggestion(`Explain the historical context of "${initialTerm || "Property Law"}"`)}>
                                    <History size={16} /> Historical context of "{initialTerm || "this concept"}"
                                </button>
                                <button className="suggestion-btn" onClick={() => handleSuggestion(`How is "${initialTerm || "Negligence"}" applied in modern tort cases?`)}>
                                    <Gavel size={16} /> Application in modern case law
                                </button>
                                <button className="suggestion-btn" onClick={() => handleSuggestion(`Compare "${initialTerm || "Habeas Corpus"}" with related concepts.`)}>
                                    <FileSearch size={16} /> Comparative conceptual analysis
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`message ${m.role}`}>
                            {m.role === "ai" && <span className="label">Juris AI Response</span>}
                            <div className="content" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                        </div>
                    ))}

                    {loading && (
                        <div className="message ai">
                            <span className="label">Juris AI Analysis</span>
                            <div className="spinner-small" />
                        </div>
                    )}

                    {error && (
                        <div className="error-msg">
                            <strong>⚠️ Advisory:</strong> {error}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    <input
                        placeholder="Enter your legal inquiry..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !input.trim()}>
                        {loading ? "..." : <><Send size={18} /> Consult AI</>}
                    </button>
                </form>
            </div>
        </main>
    );
}
