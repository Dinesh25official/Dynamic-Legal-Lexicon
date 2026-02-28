import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loginUser, registerUser } from "../services/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("public");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Requirement: First page should always be authentication.
  // We clear any existing session when the Login page is loaded.
  useEffect(() => {
    logout();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (isRegister && !fullName) {
      setError("Full name is required");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isRegister) {
        data = await registerUser(fullName, email, password, role);
      } else {
        data = await loginUser(email, password);
      }

      login(data.user, data.token);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} autoComplete="off">
        <h2><Scale size={32} color="var(--primary)" /> Legal Lexicon</h2>
        <p className="login-subtitle">
          {isRegister ? "Create your account" : "Sign in to continue"}
        </p>

        {error && <div className="login-error">{error}</div>}

        {isRegister && (
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="off"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        {isRegister && (
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="public">Public (Default)</option>
            <option value="student">Student</option>
            <option value="advocate">Advocate</option>
            <option value="admin">Admin</option>
          </select>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p className="login-toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Sign In" : "Register"}
          </span>
        </p>
      </form>
    </div>
  );
}