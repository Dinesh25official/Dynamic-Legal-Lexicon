import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scale, LogOut, ChevronDown, User, Search, Bot, PencilLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const isActive = (path) => location.pathname === path;
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  return (
    <header className="navbar">
      <div className="nav-content">
        <button className="logo" onClick={() => navigate("/home")} type="button">
          <Scale size={24} color="var(--primary)" />
          <span>Legal Lexicon</span>
        </button>

        <nav className="nav-links">
          {user && (
            <>
              <button
                className={`nav-link ${isActive("/search") ? "active" : ""}`}
                onClick={() => navigate("/search")}
                type="button"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Search size={18} /> Search
              </button>
              <button
                className={`nav-link ${isActive("/ai-assistant") ? "active" : ""}`}
                onClick={() => navigate("/ai-assistant")}
                type="button"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Bot size={18} /> AI Assistant
              </button>
              <button
                className={`nav-link ${isActive("/quiz") ? "active" : ""}`}
                onClick={() => navigate("/quiz")}
                type="button"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <PencilLine size={18} /> Practice Quiz
              </button>

              {user?.role === "admin" && (
                <button
                  className={`nav-link admin-nav-link ${isActive("/admin") ? "active" : ""}`}
                  onClick={() => navigate("/admin")}
                  type="button"
                >
                  Admin Panel
                </button>
              )}
            </>
          )}

          {!user && !isActive("/") && !isActive("/login") && (
            <button className="nav-link login-btn" onClick={() => navigate("/login")} type="button">
              Login
            </button>
          )}

          {user && (
            <div className="user-area">
              <div className="user-profile-trigger" onClick={() => setShowProfile(!showProfile)}>
                <div className="avatar-circle">
                  {getInitial(user.full_name || user.email)}
                </div>
                <ChevronDown size={14} className={showProfile ? "rotate-180" : ""} />

                {showProfile && (
                  <div className="user-dropdown panel animate-fade">
                    <div className="dropdown-header">
                      <span className="full-name">{user.full_name || user.email}</span>
                      <span className={`role-tag role-${user.role}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="divider-v"></div>

              <button
                className="logout-icon-btn"
                onClick={logout}
                title="Logout"
                type="button"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
