import { useState, useEffect, useRef } from "react";
import {
  getAdminTerms, addTerm, updateTerm, deleteTerm, uploadCSV,
  getStatutes, addStatutory, updateStatutory, deleteStatutory,
  getDailyPool, addToDailyPool, removeFromDailyPool, setDailyActive,
  searchByTerm
} from "../services/api";
import "./Admin.css";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("glossary"); // glossary, statutes, daily

  // Glossary State
  const [terms, setTerms] = useState([]);
  const [glossaryPagination, setGlossaryPagination] = useState(null);
  const [glossaryPage, setGlossaryPage] = useState(1);

  // Statutes State
  const [statutes, setStatutes] = useState([]);
  const [statuteSelection, setStatuteSelection] = useState("");
  const [statutePagination, setStatutePagination] = useState(null);
  const [statutePage, setStatutePage] = useState(1);
  const [isShowingAllStatutes, setIsShowingAllStatutes] = useState(true);

  // Daily Term State
  const [dailyPool, setDailyPool] = useState([]);

  // Common State
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [modal, setModal] = useState(null); // add-term, edit-term, add-statute, edit-statute, add-daily, edit-daily
  const [editId, setEditId] = useState(null); // id for terms, ctid for statutes
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    if (activeTab === "glossary") loadGlossary(glossaryPage);
    if (activeTab === "statutes") isShowingAllStatutes ? loadAllStatutes(statutePage) : fetchStatutesByTerm();
    if (activeTab === "daily") loadDailyPool();
  }, [activeTab, glossaryPage, statutePage]);

  // --- GLOSSARY LOGIC ---
  const loadGlossary = async (p = glossaryPage) => {
    setLoading(true);
    try {
      const data = await getAdminTerms(p, 20);
      setTerms(data.terms);
      setGlossaryPagination(data.pagination);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerm = async () => {
    if (!form.term || !form.oxford_definition || !form.simplified_definition) {
      flash("error", "All fields are required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "edit-term" && editId) {
        await updateTerm(editId, form);
        flash("success", `"${form.term}" updated`);
      } else {
        await addTerm(form.term, form.oxford_definition, form.simplified_definition);
        flash("success", `"${form.term}" added`);
      }
      setModal(null);
      loadGlossary(glossaryPage);
    } catch (err) {
      flash("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerm = async (id, termName) => {
    if (!confirm(`Delete "${termName}" from glossary?`)) return;
    try {
      await deleteTerm(id);
      flash("success", `"${termName}" deleted`);
      loadGlossary(glossaryPage);
    } catch (err) {
      flash("error", err.message);
    }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await uploadCSV(file);
      flash("success", `CSV imported: ${data.data?.totalParsed || 0} terms processed`);
      loadGlossary(1);
      setGlossaryPage(1);
    } catch (err) {
      flash("error", err.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  // --- STATUTES LOGIC ---
  const loadAllStatutes = async (p = statutePage) => {
    setLoading(true);
    setIsShowingAllStatutes(true);
    try {
      const data = await getStatutes(p, 20);
      setStatutes(data.statutes);
      setStatutePagination({ total: data.total, totalPages: Math.ceil(data.total / 20) });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatutesByTerm = async () => {
    if (!statuteSelection.trim()) {
      loadAllStatutes(1);
      return;
    }
    setLoading(true);
    setIsShowingAllStatutes(false);
    try {
      const data = await searchByTerm(statuteSelection, 1, 100);
      if (data.terms && data.terms.length > 0 && data.terms[0].statutory) {
        setStatutes(data.terms[0].statutory);
      } else {
        setStatutes([]);
      }
      setStatutePagination(null);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatute = async () => {
    if (!form.term || !form.statute_name || !form.description) {
      flash("error", "Term, Name, and Description are required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "edit-statute" && editId) {
        await updateStatutory(editId, form);
        flash("success", "Statute updated");
      } else {
        await addStatutory(form);
        flash("success", "Statute added");
      }
      setModal(null);
      isShowingAllStatutes ? loadAllStatutes(statutePage) : fetchStatutesByTerm();
    } catch (err) {
      flash("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStatute = async (ctid) => {
    if (!confirm(`Delete this statutory reference?`)) return;
    try {
      await deleteStatutory(ctid);
      flash("success", "Statute deleted");
      isShowingAllStatutes ? loadAllStatutes(statutePage) : fetchStatutesByTerm();
    } catch (err) {
      flash("error", err.message);
    }
  };

  // --- DAILY TERM LOGIC ---
  const loadDailyPool = async () => {
    setLoading(true);
    try {
      const data = await getDailyPool();
      setDailyPool(data.pool);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDaily = async () => {
    if (!form.term) {
      flash("error", "Term name is required");
      return;
    }
    setSaving(true);
    try {
      await addToDailyPool(form);
      flash("success", `"${form.term}" added to Daily Pool`);
      setModal(null);
      loadDailyPool();
    } catch (err) {
      flash("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (term) => {
    try {
      await setDailyActive(term);
      flash("success", `"${term}" is now active`);
      loadDailyPool();
    } catch (err) {
      flash("error", err.message);
    }
  };

  const handleRemoveDaily = async (term) => {
    if (!confirm(`Remove "${term}" from daily pool?`)) return;
    try {
      await removeFromDailyPool(term);
      flash("success", `"${term}" removed from pool`);
      loadDailyPool();
    } catch (err) {
      flash("error", err.message);
    }
  };

  // --- HELPERS ---
  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const openModal = (type, data = null) => {
    setModal(type);
    if (type.includes("edit") && data) {
      setEditId(data.id || data.ctid || data.term || data.legal_term);
      setForm({
        ...data,
        term: data.term || data.legal_term || "",
        oxford_definition: data.oxford_definition || data["Fixed (Oxford) Definition"] || "",
        simplified_definition: data.simplified_definition || data["Simplified Definition"] || ""
      });
    } else {
      setEditId(null);
      setForm({});
    }
  };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="header-icon">⚙</div>
        <div className="header-text">
          <h2>Admin Panel</h2>
          <p>Manage Lexicon, Statutes, and Daily Highlights</p>
        </div>
      </header>

      <nav className="admin-tabs">
        <button className={activeTab === "glossary" ? "active" : ""} onClick={() => setActiveTab("glossary")}>Glossary</button>
        <button className={activeTab === "statutes" ? "active" : ""} onClick={() => setActiveTab("statutes")}>Statutes</button>
        <button className={activeTab === "daily" ? "active" : ""} onClick={() => setActiveTab("daily")}>Daily Term</button>
      </nav>

      {/* Stats Cards Row */}
      <div className="admin-stats">
        {activeTab === "glossary" && (
          <>
            <div className="stat-card">
              <div className="stat-value">{glossaryPagination?.total ?? "—"}</div>
              <div className="stat-label">Total Terms</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{glossaryPagination?.totalPages ?? "—"}</div>
              <div className="stat-label">Pages</div>
            </div>
          </>
        )}
        {activeTab === "statutes" && (
          <>
            <div className="stat-card">
              <div className="stat-value">{statutePagination?.total ?? statutes.length}</div>
              <div className="stat-label">Total Statutes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statutePagination?.totalPages ?? 1}</div>
              <div className="stat-label">Pages</div>
            </div>
          </>
        )}
        {activeTab === "daily" && (
          <>
            <div className="stat-card">
              <div className="stat-value">{dailyPool.length}</div>
              <div className="stat-label">Total highlights</div>
            </div>
            <div className="stat-card">
              <div className="stat-value accent">Active</div>
              <div className="stat-label">Selection Mode</div>
            </div>
          </>
        )}
      </div>

      {msg && <div className={`admin-msg ${msg.type}`}>{msg.text}</div>}

      <div className="admin-actions">
        {activeTab === "glossary" && (
          <>
            <button className="btn btn-primary" onClick={() => openModal("add-term")}>+ Add Term</button>
            <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
              📄 Import CSV
              <input type="file" accept=".csv" onChange={handleCSV} ref={fileRef} hidden />
            </label>
          </>
        )}
        {activeTab === "statutes" && (
          <div className="statute-actions">
            <button className="btn btn-primary" onClick={() => openModal("add-statute")}>+ Add Statute</button>
            <button className="btn btn-secondary" onClick={() => loadAllStatutes(1)}>📄 Show All</button>
            <div className="search-box">
              <input
                placeholder="Search by term..."
                value={statuteSelection}
                onChange={(e) => setStatuteSelection(e.target.value)}
              />
              <button className="fetch-btn" onClick={fetchStatutesByTerm}>🔍 Fetch</button>
            </div>
          </div>
        )}
        {activeTab === "daily" && (
          <>
            <button className="btn btn-primary" onClick={() => openModal("add-daily")}>+ Add Highlight</button>
            <div className="search-box filter">
              <input placeholder="Filter highlights..." />
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">Loading content...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            {activeTab === "glossary" && (
              <>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Oxford Def</th>
                    <th>Simple Def</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map((t) => (
                    <tr key={t.id}>
                      <td className="td-term">{t.term}</td>
                      <td className="td-desc"><div className="truncate">{t.oxford_definition}</div></td>
                      <td className="td-desc"><div className="truncate">{t.simplified_definition}</div></td>
                      <td className="td-actions align-right">
                        <button className="edit-btn" onClick={() => openModal("edit-term", t)}>Edit</button>
                        <button className="del-btn" onClick={() => handleDeleteTerm(t.id, t.term)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === "statutes" && (
              <>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Name</th>
                    <th>Section</th>
                    <th>Desc</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statutes.map((s, idx) => (
                    <tr key={s.ctid || idx}>
                      <td className="td-term">{s.term || statuteSelection}</td>
                      <td>{s.statute_name}</td>
                      <td>{s.section}</td>
                      <td className="td-desc"><div className="truncate">{s.description}</div></td>
                      <td className="td-actions align-right">
                        <button className="edit-btn" onClick={() => openModal("edit-statute", s)}>Edit</button>
                        <button className="del-btn" onClick={() => handleDeleteStatute(s.ctid)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === "daily" && (
              <>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Oxford Def</th>
                    <th>Simple Def</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyPool.map((d) => (
                    <tr key={d.legal_term} className={d.is_active ? "row-active" : ""}>
                      <td className="td-term">{d.legal_term} {d.is_active && <span className="active-badge">ACTIVE</span>}</td>
                      <td className="td-desc"><div className="truncate">{d.oxford_definition}</div></td>
                      <td className="td-desc"><div className="truncate">{d.simplified_definition}</div></td>
                      <td className="td-actions align-right">
                        {!d.is_active && <button className="daily-btn" onClick={() => handleToggleActive(d.legal_term)}>Set Active</button>}
                        <button className="edit-btn" onClick={() => openModal("edit-daily", d)}>Edit</button>
                        <button className="del-btn" onClick={() => handleRemoveDaily(d.legal_term)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>

          {activeTab === "glossary" && glossaryPagination && glossaryPagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button disabled={glossaryPage <= 1} onClick={() => setGlossaryPage(glossaryPage - 1)}>← Prev</button>
              <span>Page {glossaryPage} of {glossaryPagination.totalPages}</span>
              <button disabled={glossaryPage >= glossaryPagination.totalPages} onClick={() => setGlossaryPage(glossaryPage + 1)}>Next →</button>
            </div>
          )}
          {activeTab === "statutes" && statutePagination && statutePagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button disabled={statutePage <= 1} onClick={() => setStatutePage(statutePage - 1)}>← Prev</button>
              <span>Page {statutePage} of {statutePagination.totalPages}</span>
              <button disabled={statutePage >= statutePagination.totalPages} onClick={() => setStatutePage(statutePage + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.includes("edit") ? "Edit" : "Add"} {modal.includes("statute") ? "Statute" : "Term"}</h3>

            <div className="modal-field">
              <label>{modal.includes("statute") ? "Linked Legal Term" : "Legal Term"}</label>
              <input
                value={form.term || ""}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                placeholder="e.g. Habeas Corpus"
              />
            </div>

            {modal.includes("statute") ? (
              <>
                <div className="modal-field">
                  <label>Statute Name</label>
                  <input
                    value={form.statute_name || ""}
                    onChange={(e) => setForm({ ...form, statute_name: e.target.value })}
                    placeholder="e.g. Indian Penal Code"
                  />
                </div>
                <div className="modal-field">
                  <label>Section</label>
                  <input
                    value={form.section || ""}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="e.g. 302"
                  />
                </div>
                <div className="modal-field">
                  <label>Description</label>
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Statutory explanation..."
                  />
                </div>
                <div className="modal-field">
                  <label>External URL</label>
                  <input
                    value={form.url || ""}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="modal-field">
                  <label>Oxford (Fixed) Definition</label>
                  <textarea
                    value={form.oxford_definition || ""}
                    onChange={(e) => setForm({ ...form, oxford_definition: e.target.value })}
                    placeholder="Inherits from glossary if left blank..."
                  />
                </div>
                <div className="modal-field">
                  <label>Simplified Definition</label>
                  <textarea
                    value={form.simplified_definition || ""}
                    onChange={(e) => setForm({ ...form, simplified_definition: e.target.value })}
                    placeholder="Inherits from glossary if left blank..."
                  />
                </div>
              </>
            )}

            <div className="modal-btns">
              <button className="cancel-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="save-btn" onClick={modal.includes("statute") ? handleSaveStatute : modal.includes("daily") ? handleSaveDaily : handleSaveTerm} disabled={saving}>
                {saving ? "Saving..." : modal.includes("edit") ? "Update" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
