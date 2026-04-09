import { useState, useCallback } from "react";

const MOCK_DOCUMENTS = [
  { id: 1, name: "Employment Contract - Acme Corp.pdf", type: "pdf", status: "completed", risk: "high", date: "Apr 5, 2026", size: "1.2 MB", folder: "Employment", tags: ["contract", "employment"] },
  { id: 2, name: "SaaS Service Agreement v3.docx", type: "docx", status: "completed", risk: "medium", date: "Apr 3, 2026", size: "890 KB", folder: "Vendor", tags: ["saas", "agreement"] },
  { id: 3, name: "NDA - Confidential Partners.pdf", type: "pdf", status: "processing", risk: null, date: "Apr 7, 2026", size: "340 KB", folder: "Legal", tags: ["nda"] },
  { id: 4, name: "Lease Agreement - Office Space.pdf", type: "pdf", status: "completed", risk: "low", date: "Mar 28, 2026", size: "2.1 MB", folder: "Real Estate", tags: ["lease", "property"] },
  { id: 5, name: "Terms of Service - Platform X.txt", type: "txt", status: "completed", risk: "medium", date: "Mar 20, 2026", size: "145 KB", folder: "Vendor", tags: ["tos", "platform"] },
  { id: 6, name: "Independent Contractor Agreement.pdf", type: "pdf", status: "error", risk: null, date: "Mar 15, 2026", size: "512 KB", folder: "Employment", tags: ["contractor"] },
];

const FOLDERS = ["All Documents", "Employment", "Vendor", "Legal", "Real Estate", "Favorites"];

const STATS = [
  { label: "Documents Analyzed", value: "24", sub: "+3 this week", color: "#1E3A8A" },
  { label: "High Risk Found", value: "5", sub: "Needs attention", color: "#EF4444" },
  { label: "Avg. Risk Score", value: "6.2", sub: "Out of 10", color: "#F59E0B" },
  { label: "Time Saved", value: "18h", sub: "Est. this month", color: "#10B981" },
];

const NOTIFICATIONS = [
  { id: 1, type: "alert", text: "3 critical clauses in Employment Contract", time: "2h ago" },
  { id: 2, type: "info", text: "NDA analysis completed", time: "5h ago" },
  { id: 3, type: "warn", text: "SaaS Agreement renewal due in 30 days", time: "1d ago" },
];

function RiskBadge({ risk }) {
  if (!risk) return null;
  const map = { high: ["#FEF2F2", "#EF4444", "HIGH RISK"], medium: ["#FFFBEB", "#D97706", "MEDIUM"], low: ["#F0FDF4", "#10B981", "LOW RISK"] };
  const [bg, color, label] = map[risk];
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 4, border: `1px solid ${color}22` }}>
      {label}
    </span>
  );
}

function StatusDot({ status }) {
  const map = { completed: "#10B981", processing: "#F59E0B", error: "#EF4444" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: map[status], display: "inline-block" }} />
      <span style={{ fontSize: 12, color: "#6B7280", textTransform: "capitalize" }}>{status === "processing" ? "Processing…" : status}</span>
    </span>
  );
}

function FileIcon({ type }) {
  const colors = { pdf: "#EF4444", docx: "#1E3A8A", txt: "#6B7280" };
  return (
    <div style={{ width: 40, height: 48, background: colors[type] + "15", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px solid ${colors[type]}30`, flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: colors[type], letterSpacing: "0.05em" }}>{type.toUpperCase()}</span>
    </div>
  );
}

function UploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onUpload(e.dataTransfer.files);
  }, [onUpload]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput").click()}
      style={{
        border: `2px dashed ${dragging ? "#1E3A8A" : "#CBD5E1"}`,
        borderRadius: 12,
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#EFF6FF" : "#F8FAFC",
        transition: "all 0.15s ease",
      }}
    >
      <input id="fileInput" type="file" accept=".pdf,.docx,.txt" multiple style={{ display: "none" }} onChange={(e) => onUpload(e.target.files)} />
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1E3A8A15", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: "#1E3A8A", fontSize: 14 }}>Drop files here or click to browse</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8" }}>PDF, DOCX, TXT — up to 50MB each</p>
    </div>
  );
}

function UploadProgress({ files, onDismiss }) {
  if (!files.length) return null;
  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {files.map((f, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1E293B", marginBottom: 4 }}>{f.name}</div>
            <div style={{ height: 4, background: "#E2E8F0", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: f.progress + "%", background: f.progress === 100 ? "#10B981" : "#1E3A8A", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>
          <span style={{ fontSize: 12, color: f.progress === 100 ? "#10B981" : "#64748B", fontWeight: 500, minWidth: 36 }}>{f.progress}%</span>
          {f.progress === 100 && (
            <button onClick={() => onDismiss(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16, padding: 2 }}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LegasistAIDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedFolder, setSelectedFolder] = useState("All Documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("date");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const filteredDocs = MOCK_DOCUMENTS.filter(d => {
    const matchFolder = selectedFolder === "All Documents" || d.folder === selectedFolder || (selectedFolder === "Favorites" && d.id <= 2);
    const matchSearch = !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.tags.some(t => t.includes(searchQuery.toLowerCase()));
    return matchFolder && matchSearch;
  }).sort((a, b) => sortBy === "date" ? (b.id - a.id) : a.name.localeCompare(b.name));

  const handleUpload = (files) => {
    const arr = Array.from(files).map(f => ({ name: f.name, progress: 0 }));
    setUploadedFiles(prev => [...prev, ...arr]);
    arr.forEach((_, idx) => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.floor(Math.random() * 20) + 5;
        if (prog >= 100) { prog = 100; clearInterval(interval); }
        setUploadedFiles(prev => prev.map((f, i) => i === prev.length - arr.length + idx ? { ...f, progress: prog } : f));
      }, 300);
    });
  };

  const toggleDoc = (id) => setSelectedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 240,
        background: "#0F2461",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease",
        flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? "20px 16px" : "20px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #ffffff15" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          {!sidebarCollapsed && <span style={{ fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.01em" }}>LegasistAI</span>}
        </div>

        {/* Quick Actions */}
        <div style={{ padding: sidebarCollapsed ? "16px 10px" : "16px 12px", borderBottom: "1px solid #ffffff15" }}>
          {!sidebarCollapsed && <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px 8px" }}>Quick Actions</p>}
          {[
            { id: "upload", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>, label: "Upload Document", accent: true },
            { id: "chat", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: "Start AI Chat" },
          ].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "10px" : "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 4, background: item.accent ? "#10B981" : (activePage === item.id ? "#ffffff15" : "transparent"), color: item.accent ? "#fff" : "#CBD5E1", fontWeight: item.accent ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? "center" : "flex-start", transition: "background 0.15s" }}>
              {item.icon}
              {!sidebarCollapsed && item.label}
            </button>
          ))}
        </div>

        {/* Library Management */}
        <div style={{ padding: sidebarCollapsed ? "16px 10px" : "16px 12px", flex: 1, overflowY: "auto" }}>
          {!sidebarCollapsed && <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px 8px" }}>Library</p>}
          {FOLDERS.map(folder => (
            <button key={folder} onClick={() => { setSelectedFolder(folder); setActivePage("documents"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "9px" : "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: selectedFolder === folder && activePage === "documents" ? "#ffffff20" : "transparent", color: selectedFolder === folder && activePage === "documents" ? "#fff" : "#94A3B8", fontSize: 13, justifyContent: sidebarCollapsed ? "center" : "flex-start", transition: "background 0.15s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {!sidebarCollapsed && <span>{folder}</span>}
              {!sidebarCollapsed && folder !== "All Documents" && folder !== "Favorites" && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", background: "#ffffff10", borderRadius: 10, padding: "1px 7px" }}>
                  {MOCK_DOCUMENTS.filter(d => d.folder === folder).length}
                </span>
              )}
            </button>
          ))}

          {!sidebarCollapsed && <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "16px 0 8px 8px" }}>Tools</p>}
          {[
            { id: "risk", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: "Risk Assessment" },
            { id: "compare", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, label: "Compare Docs" },
          ].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "9px" : "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: activePage === item.id ? "#ffffff15" : "transparent", color: "#94A3B8", fontSize: 13, justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
              {item.icon}
              {!sidebarCollapsed && item.label}
            </button>
          ))}
        </div>

        {/* Bottom collapse button */}
        <div style={{ padding: "12px", borderTop: "1px solid #ffffff15" }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-end", gap: 8, padding: "8px", borderRadius: 8, border: "none", background: "transparent", color: "#6B7280", cursor: "pointer", fontSize: 12 }}>
            {!sidebarCollapsed && <span>Collapse</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "none" }}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header */}
        <header style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ flex: 1 }}>
            {activePage === "dashboard" ? (
              <div>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>Good morning, </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>Alex</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B" }}>
                <button onClick={() => setActivePage("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 13, padding: 0 }}>Dashboard</button>
                <span>/</span>
                <span style={{ color: "#1E293B", fontWeight: 500, textTransform: "capitalize" }}>{activePage === "documents" ? selectedFolder : activePage}</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: 260 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActivePage("documents"); }} placeholder="Search documents…" style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 36, border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, background: "#EF4444", borderRadius: "50%", border: "2px solid #F8FAFC" }} />
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", right: 0, top: 44, width: 300, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 100, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#1E293B" }}>Notifications</span>
                  <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>×</button>
                </div>
                {NOTIFICATIONS.map(n => (
                  <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #F8FAFC", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.type === "alert" ? "#EF4444" : n.type === "warn" ? "#F59E0B" : "#10B981", marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{n.text}</p>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>AK</div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* DASHBOARD PAGE */}
          {activePage === "dashboard" && (
            <div>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {STATS.map(s => (
                  <div key={s.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", borderTop: `3px solid ${s.color}` }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748B", fontWeight: 500 }}>{s.label}</p>
                    <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
                {/* Left: Upload + Recent docs */}
                <div>
                  <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Upload New Document</h3>
                    <UploadZone onUpload={handleUpload} />
                    <UploadProgress files={uploadedFiles} onDismiss={i => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Recent Documents</h3>
                      <button onClick={() => setActivePage("documents")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#1E3A8A", fontWeight: 500, padding: 0 }}>View all →</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {MOCK_DOCUMENTS.slice(0, 4).map(doc => (
                        <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid #F1F5F9", background: "#FAFAFA", cursor: "pointer", transition: "border-color 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#F1F5F9"}>
                          <FileIcon type={doc.type} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 3 }}>
                              <StatusDot status={doc.status} />
                              <span style={{ fontSize: 11, color: "#CBD5E1" }}>•</span>
                              <span style={{ fontSize: 11, color: "#94A3B8" }}>{doc.date}</span>
                            </div>
                          </div>
                          <RiskBadge risk={doc.risk} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Chat + Notifications */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* AI Chat Quick Access */}
                  <div style={{ background: "linear-gradient(135deg, #0F2461 0%, #1E3A8A 100%)", borderRadius: 12, padding: 20, color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>AI Legal Assistant</span>
                    </div>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#93C5FD", lineHeight: 1.5 }}>Ask questions about any of your documents or get general legal guidance.</p>
                    <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                      {["What are my obligations in the NDA?", "Flag any auto-renewal clauses"].map(q => (
                        <button key={q} onClick={() => setActivePage("chat")} style={{ background: "#ffffff15", border: "1px solid #ffffff20", borderRadius: 8, padding: "8px 12px", color: "#E2E8F0", fontSize: 12, cursor: "pointer", textAlign: "left" }}>{q}</button>
                      ))}
                    </div>
                    <button onClick={() => setActivePage("chat")} style={{ width: "100%", marginTop: 14, background: "#10B981", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Open Chat →</button>
                  </div>

                  {/* Notifications Panel */}
                  <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Alerts</h3>
                      <span style={{ background: "#FEF2F2", color: "#EF4444", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{NOTIFICATIONS.length} new</span>
                    </div>
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.type === "alert" ? "#EF4444" : n.type === "warn" ? "#F59E0B" : "#10B981", marginTop: 4, flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{n.text}</p>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS PAGE */}
          {activePage === "documents" && (
            <div>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A", flex: 1 }}>{selectedFolder}</h2>

                {selectedDocs.length > 0 && (
                  <div style={{ display: "flex", gap: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "6px 12px", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#1E3A8A", fontWeight: 500 }}>{selectedDocs.length} selected</span>
                    <button onClick={() => setSelectedDocs([])} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 13 }}>Delete</button>
                    <button onClick={() => setSelectedDocs([])} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 13 }}>Clear</button>
                  </div>
                )}

                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ height: 36, border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#475569", background: "#fff", padding: "0 12px", outline: "none" }}>
                  <option value="date">Sort: Date</option>
                  <option value="name">Sort: Name</option>
                </select>

                {/* View toggle */}
                <div style={{ display: "flex", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                  {["grid", "list"].map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "7px 11px", border: "none", background: viewMode === mode ? "#1E3A8A" : "#fff", color: viewMode === mode ? "#fff" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      {mode === "grid" ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
                    </button>
                  ))}
                </div>

                <button onClick={() => setActivePage("upload")} style={{ height: 36, background: "#1E3A8A", border: "none", borderRadius: 8, color: "#fff", padding: "0 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Upload
                </button>
              </div>

              {filteredDocs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, border: "1px dashed #CBD5E1" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#475569" }}>No documents found</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94A3B8" }}>Try a different search or folder</p>
                </div>
              ) : viewMode === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                  {filteredDocs.map(doc => (
                    <div key={doc.id} style={{ background: "#fff", border: `1px solid ${selectedDocs.includes(doc.id) ? "#1E3A8A" : "#E2E8F0"}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.15s", position: "relative" }}
                      onClick={() => toggleDoc(doc.id)}
                      onMouseEnter={e => { if (!selectedDocs.includes(doc.id)) e.currentTarget.style.borderColor = "#94A3B8"; }}
                      onMouseLeave={e => { if (!selectedDocs.includes(doc.id)) e.currentTarget.style.borderColor = "#E2E8F0"; }}>
                      {selectedDocs.includes(doc.id) && (
                        <div style={{ position: "absolute", top: 12, right: 12, width: 18, height: 18, borderRadius: 4, background: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                      <FileIcon type={doc.type} />
                      <p style={{ margin: "12px 0 4px", fontSize: 13, fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <StatusDot status={doc.status} />
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{doc.size}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <RiskBadge risk={doc.risk} />
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{doc.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 100px 100px 100px 80px 40px", gap: 0, padding: "10px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    <span />
                    <span>Document</span><span>Status</span><span>Risk</span><span>Date</span><span>Size</span><span />
                  </div>
                  {filteredDocs.map((doc, i) => (
                    <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 100px 100px 100px 80px 40px", gap: 0, padding: "12px 16px", borderBottom: i < filteredDocs.length - 1 ? "1px solid #F1F5F9" : "none", alignItems: "center", cursor: "pointer", background: selectedDocs.includes(doc.id) ? "#EFF6FF" : "transparent", transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!selectedDocs.includes(doc.id)) e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={e => { if (!selectedDocs.includes(doc.id)) e.currentTarget.style.background = "transparent"; }}>
                      <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} style={{ cursor: "pointer" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <FileIcon type={doc.type} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>{doc.folder}</p>
                        </div>
                      </div>
                      <StatusDot status={doc.status} />
                      <div><RiskBadge risk={doc.risk} /></div>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{doc.date}</span>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>{doc.size}</span>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UPLOAD PAGE */}
          {activePage === "upload" && (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#0F172A" }}>Upload Document</h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748B" }}>Upload legal documents for AI-powered analysis</p>
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
                <UploadZone onUpload={handleUpload} />
                <UploadProgress files={uploadedFiles} onDismiss={i => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} />

                <div style={{ marginTop: 20, padding: 16, background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#065F46" }}>Supported formats</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["PDF", "DOCX", "TXT"].map(f => <span key={f} style={{ background: "#D1FAE5", color: "#065F46", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 4 }}>{f}</span>)}
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#047857" }}>Maximum file size: 50MB • Files are encrypted and stored securely</p>
                </div>
              </div>
            </div>
          )}

          {/* CHAT PAGE */}
          {activePage === "chat" && (
            <div style={{ maxWidth: 800, margin: "0 auto", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: "#0F172A", flexShrink: 0 }}>AI Legal Assistant</h2>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Context selector */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>Context:</span>
                  <select style={{ fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px", color: "#475569", background: "#fff", outline: "none" }}>
                    <option>All Documents</option>
                    {MOCK_DOCUMENTS.map(d => <option key={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div style={{ background: "#F1F5F9", borderRadius: "0 12px 12px 12px", padding: "12px 16px", maxWidth: "80%" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>Hello! I'm your AI Legal Assistant. I can help you understand your legal documents, identify risks, and answer questions. What would you like to know?</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexDirection: "row-reverse" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 11, fontWeight: 700 }}>AK</div>
                    <div style={{ background: "#1E3A8A", borderRadius: "12px 0 12px 12px", padding: "12px 16px", maxWidth: "80%" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#E2E8F0", lineHeight: 1.6 }}>What are my main obligations in the Employment Contract?</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div style={{ background: "#F1F5F9", borderRadius: "0 12px 12px 12px", padding: "12px 16px", maxWidth: "80%" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>Based on the Employment Contract with Acme Corp, your key obligations include: <br/><br/><strong>1. Non-compete clause</strong> — 12-month restriction in your industry post-employment.<br/><br/><strong>2. Confidentiality</strong> — Perpetual NDA covering all company IP and trade secrets.<br/><br/><strong>3. IP Assignment</strong> — All work created during employment belongs to the company.<br/><br/>⚠️ The non-compete is broader than industry standard — I'd recommend legal review.</p>
                    </div>
                  </div>
                </div>

                {/* Suggested questions */}
                <div style={{ padding: "10px 16px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8, overflowX: "auto" }}>
                  {["Explain the termination clause", "What are the penalty provisions?", "Is this standard for my industry?"].map(q => (
                    <button key={q} style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#475569", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
                  ))}
                </div>

                {/* Input */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10 }}>
                  <input placeholder="Ask about your documents…" style={{ flex: 1, height: 40, border: "1px solid #E2E8F0", borderRadius: 10, padding: "0 14px", fontSize: 13, outline: "none", color: "#1E293B" }} />
                  <button style={{ width: 40, height: 40, background: "#1E3A8A", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OTHER PAGES PLACEHOLDER */}
          {["risk", "compare"].includes(activePage) && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{activePage === "risk" ? "Risk Assessment" : "Document Comparison"}</h3>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748B" }}>This feature is available in Phase 4 implementation</p>
              <button onClick={() => setActivePage("dashboard")} style={{ background: "#1E3A8A", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back to Dashboard</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
