import { useState, useRef, useEffect } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DOCUMENT = {
  name: "Employment Contract — Acme Corp",
  type: "pdf",
  date: "Apr 5, 2026",
  pages: 12,
  wordCount: 4820,
};

const CLAUSES = [
  {
    id: 1, category: "obligations", risk: "high", title: "Non-Compete Restriction",
    original: `Employee agrees that for a period of twelve (12) months following the termination of employment, for any reason whatsoever, Employee shall not, directly or indirectly, engage in, be employed by, consult for, or have any ownership interest in any business that competes with the Company's business within the Territory, as defined in Schedule A.`,
    simplified: `For 1 year after you leave this job — for any reason — you cannot work for, consult with, or own part of any competing company in the defined territory. This is very broad and may be difficult to enforce depending on your state, but you should assume it applies.`,
    action: "Negotiate: Request a narrower geographic scope or a shorter duration (6 months is more standard). Consider asking for a carve-out for roles that don't directly compete.",
    riskScore: 8.4,
    tags: ["post-employment", "restriction", "territory"],
  },
  {
    id: 2, category: "obligations", risk: "high", title: "IP Assignment — Broad Scope",
    original: `Employee hereby assigns to the Company all right, title, and interest in and to any and all inventions, discoveries, developments, improvements, innovations, ideas, designs, processes, formulae, software, data, works of authorship, and other intellectual property (collectively, "Work Product") that Employee conceives, develops, makes, or reduces to practice during the term of employment, whether or not during working hours.`,
    simplified: `Everything you create — even on your own time, with your own equipment — belongs to the company if it's remotely related to company business. This includes personal projects and side work.`,
    action: "Critical: Negotiate an exclusion for personal projects created on your own time without company resources. Many states (CA, DE, IL) have laws limiting this clause.",
    riskScore: 9.1,
    tags: ["ip", "ownership", "inventions"],
  },
  {
    id: 3, category: "obligations", risk: "medium", title: "Confidentiality — Perpetual",
    original: `Employee acknowledges that during the course of employment, Employee will have access to Confidential Information. Employee agrees to hold such Confidential Information in strict confidence and not to disclose it to any third party, both during and after the term of employment, without limit as to time.`,
    simplified: `You must keep company secrets forever — even after you leave. This obligation never expires. Confidential Information is broadly defined to include almost any business information you encounter.`,
    action: "Ask for a reasonable time limit (2–5 years post-employment) for general confidential information. Trade secrets can remain perpetual, but general business information should not.",
    riskScore: 6.2,
    tags: ["confidentiality", "perpetual", "disclosure"],
  },
  {
    id: 4, category: "termination", risk: "medium", title: "At-Will Termination",
    original: `Either party may terminate this Agreement at any time, with or without cause, and with or without notice. The Company reserves the right to terminate employment immediately upon written notice. Upon termination, Employee shall receive compensation earned through the date of termination only.`,
    simplified: `You can be fired at any time, for any reason, with no notice and no severance beyond your last paycheck. The company has no obligation to give you advance warning.`,
    action: "Negotiate: Request a minimum notice period (2–4 weeks) or severance equivalent. At minimum, ask for final paycheck on the termination date, not the next pay cycle.",
    riskScore: 5.5,
    tags: ["termination", "at-will", "notice"],
  },
  {
    id: 5, category: "rights", risk: "low", title: "Salary & Compensation",
    original: `Company shall pay Employee an annual base salary of $95,000, payable in accordance with the Company's regular payroll schedule. Employee shall be eligible for an annual performance review and merit increase consideration, at the Company's sole discretion.`,
    simplified: `Your annual salary is $95,000 paid on the company's standard payroll schedule. Raises are possible but never guaranteed — the company has complete discretion over whether to give you one.`,
    action: "Acceptable. Consider requesting that the review schedule be formalized (e.g., within 30 days of your anniversary). The 'sole discretion' language is standard.",
    riskScore: 2.1,
    tags: ["compensation", "salary", "review"],
  },
  {
    id: 6, category: "rights", risk: "low", title: "Benefits & PTO",
    original: `Employee shall be entitled to participate in the Company's standard employee benefits package, including health insurance, dental and vision coverage, and a 401(k) retirement plan with 4% employer match. Employee shall accrue fifteen (15) days of paid time off per year.`,
    simplified: `You get standard health, dental, vision insurance and a 401(k) with 4% match. You earn 15 PTO days per year. This is reasonable and on par with industry standards.`,
    action: "No action needed. 15 days PTO and 4% 401(k) match are standard. Check that there's no PTO forfeiture clause elsewhere in the document.",
    riskScore: 1.8,
    tags: ["benefits", "pto", "401k"],
  },
  {
    id: 7, category: "penalties", risk: "high", title: "Liquidated Damages",
    original: `In the event Employee breaches any provision of this Agreement, including but not limited to the non-compete and confidentiality provisions, Employee shall be liable to the Company for liquidated damages in the amount of $50,000, plus all attorneys' fees and costs incurred by the Company in enforcing this Agreement.`,
    simplified: `If you violate the non-compete or confidentiality clauses, you automatically owe the company $50,000 plus their legal fees. This can apply even if the company suffers no actual harm.`,
    action: "This is aggressive. Negotiate: Request removal of the liquidated damages clause entirely, or cap it to actual proven damages only. The $50,000 flat fee plus attorney fees is punitive.",
    riskScore: 9.6,
    tags: ["damages", "penalty", "enforcement"],
  },
];

const GLOSSARY_TERMS = [
  { term: "Liquidated Damages", definition: "A pre-agreed sum payable as compensation for a specific breach, regardless of actual harm caused." },
  { term: "Non-Compete", definition: "A contractual clause restricting an employee from working for competitors after leaving." },
  { term: "IP Assignment", definition: "Transfer of intellectual property ownership from the creator to another party, typically an employer." },
  { term: "At-Will Employment", definition: "An employment arrangement where either party may terminate the relationship at any time without cause." },
  { term: "Confidential Information", definition: "Proprietary or sensitive business data that must be protected from unauthorized disclosure." },
  { term: "Territory", definition: "The geographic area within which a non-compete or other restrictive covenant applies." },
  { term: "Work Product", definition: "Inventions, writings, code, or other creative output produced during employment." },
  { term: "Merit Increase", definition: "A salary raise based on individual performance, as opposed to a cost-of-living adjustment." },
];

const CHAT_HISTORY = [
  { role: "assistant", text: "I've analyzed this Employment Contract. I found 3 high-risk clauses requiring immediate attention — particularly the liquidated damages clause ($50k penalty) and the overly broad IP assignment. What would you like to explore first?" },
  { role: "user", text: "What's the most dangerous clause I should focus on?" },
  { role: "assistant", text: "The Liquidated Damages clause (§7) is the most immediately dangerous. It creates a $50,000 automatic liability plus attorney fees for breaching the non-compete — even if the company suffers no real harm. Combined with the very broad non-compete scope, you could face a $50k+ lawsuit just for taking a job at a competitor. I'd make removing or capping this clause a dealbreaker in negotiations." },
];

const RISK_CATEGORIES = [
  { label: "Obligations", score: 7.8, count: 2, color: "#EF4444" },
  { label: "Penalties", score: 9.6, count: 1, color: "#EF4444" },
  { label: "Confidentiality", score: 6.2, count: 1, color: "#F59E0B" },
  { label: "Termination", score: 5.5, count: 1, color: "#F59E0B" },
  { label: "Rights", score: 2.0, count: 2, color: "#10B981" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const riskColor = (score) => score >= 7 ? "#EF4444" : score >= 4 ? "#F59E0B" : "#10B981";
const riskBg = (score) => score >= 7 ? "#FEF2F2" : score >= 4 ? "#FFFBEB" : "#F0FDF4";
const riskLabel = (r) => r === "high" ? "HIGH" : r === "medium" ? "MED" : "LOW";
const categoryIcon = (cat) => ({
  obligations: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  termination: "M6 18L18 6M6 6l12 12",
  rights: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  penalties: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
})[cat] || "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

function Icon({ path, size = 16, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function RiskPill({ risk, score }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: riskBg(score ?? (risk === "high" ? 8 : risk === "medium" ? 5 : 2)), color: riskColor(score ?? (risk === "high" ? 8 : risk === "medium" ? 5 : 2)), fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", padding: "3px 8px", borderRadius: 4 }}>
      {riskLabel(risk)}
      {score && <span style={{ fontWeight: 400, opacity: 0.7 }}>{score.toFixed(1)}</span>}
    </span>
  );
}

function ScoreGauge({ score }) {
  const pct = (score / 10) * 100;
  const color = riskColor(score);
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - pct / 100);
  return (
    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.05em", marginTop: 2 }}>/ 10</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LegasistAIAnalysis() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activePage, setActivePage] = useState("analysis"); // analysis | risks | settings | help | chat
  const [expandedClause, setExpandedClause] = useState(null);
  const [chatMessages, setChatMessages] = useState(CHAT_HISTORY);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState({});
  const [glossarySearch, setGlossarySearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedClauseForChat, setSelectedClauseForChat] = useState(null);
  const [settingsTab, setSettingsTab] = useState("profile");
  const [helpSearch, setHelpSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [chatWidget, setChatWidget] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const overallRisk = 6.8;

  const filteredClauses = CLAUSES.filter(c =>
    activeCategory === "all" || c.category === activeCategory
  );

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        text: `Based on the Employment Contract with Acme Corp, here's what I found regarding "${msg.toLowerCase().slice(0, 40)}…": The contract contains provisions that may affect this directly. The non-compete clause in §2.1 and the IP assignment in §3.4 are most relevant here. I recommend reviewing these sections carefully and consulting with an employment attorney before signing.`
      }]);
      setChatLoading(false);
    }, 1400);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const S = {
    page: { minHeight: "100vh", background: "#F0F4F8", fontFamily: "'Outfit', 'DM Sans', sans-serif" },
    topBar: { background: "#0D1B3E", height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid #ffffff10" },
    content: { maxWidth: 1280, margin: "0 auto", padding: "24px 20px" },
    card: { background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" },
  };

  // ── TOP BAR ──
  const TopBar = () => (
    <div style={S.topBar}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, background: "#10B981", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={14} color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>LegasistAI</span>
      </div>
      <span style={{ color: "#4A6280", fontSize: 13 }}>›</span>
      <span style={{ color: "#94A3B8", fontSize: 13 }}>Documents</span>
      <span style={{ color: "#4A6280", fontSize: 13 }}>›</span>
      <span style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 500 }}>{DOCUMENT.name}</span>
      <div style={{ flex: 1 }} />
      {[
        { id: "analysis", label: "Analysis" },
        { id: "risks", label: "Risk Report" },
        { id: "chat", label: "AI Chat" },
        { id: "settings", label: "Settings" },
        { id: "help", label: "Help" },
      ].map(item => (
        <button key={item.id} onClick={() => setActivePage(item.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: activePage === item.id ? "#1E3A8A" : "transparent", color: activePage === item.id ? "#fff" : "#94A3B8", transition: "all 0.15s" }}>
          {item.label}
        </button>
      ))}
      <div style={{ width: 1, height: 20, background: "#ffffff15", margin: "0 6px" }} />
      <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 8, border: "1px solid #ffffff20", background: "transparent", color: "#E2E8F0", fontSize: 13, cursor: "pointer" }}>
        <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={14} color="#10B981" />
        Export
      </button>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>AK</div>
    </div>
  );

  // ── ANALYSIS PAGE ──
  const AnalysisPage = () => (
    <div style={S.content}>
      {/* Doc meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0D1B3E", letterSpacing: "-0.02em" }}>{DOCUMENT.name}</h1>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#94A3B8" }}>
            {[`${DOCUMENT.pages} pages`, `${DOCUMENT.wordCount.toLocaleString()} words`, DOCUMENT.date, `PDF`].map((m, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setActivePage("risks")} style={{ padding: "8px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            View Risk Report
          </button>
          <button onClick={() => setChatWidget(true)} style={{ padding: "8px 16px", background: "#1E3A8A", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Ask AI
          </button>
        </div>
      </div>

      {/* Overall risk banner */}
      <div style={{ background: "linear-gradient(135deg, #0D1B3E, #1E3A8A)", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <ScoreGauge score={overallRisk} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Overall Risk Score</span>
            <RiskPill risk="medium" score={overallRisk} />
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#93C5FD", lineHeight: 1.6 }}>
            This contract has <strong style={{ color: "#FCA5A5" }}>3 high-risk clauses</strong> requiring negotiation before signing — particularly the liquidated damages ($50k penalty) and the overly broad IP assignment. The non-compete clause has significant exposure.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[{ c: "#EF4444", n: 3, l: "High Risk" }, { c: "#F59E0B", n: 2, l: "Medium" }, { c: "#10B981", n: 2, l: "Low Risk" }].map(({ c, n, l }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#CBD5E1" }}>{n} {l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
          {[{ label: "Recommendation", val: "Do Not Sign Yet", c: "#EF4444" }, { label: "Review Priority", val: "High — 3 items", c: "#F59E0B" }].map(({ label, val, c }) => (
            <div key={label} style={{ background: "#ffffff10", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ margin: 0, fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 700, color: c }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "#F1F5F9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {["overview", "clauses", "obligations", "glossary", "qa"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#0D1B3E" : "#64748B", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s", textTransform: "capitalize" }}>
            {tab === "qa" ? "Q&A" : tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Proactive alerts */}
            <div style={{ ...S.card }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={16} color="#1E3A8A" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>Proactive Alerts</span>
                <span style={{ background: "#FEF2F2", color: "#EF4444", fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 10, marginLeft: "auto" }}>3 critical</span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { level: "high", text: "Liquidated damages clause imposes $50,000 automatic penalty — highest risk item", clause: 7 },
                  { level: "high", text: "IP assignment extends to personal projects made outside of work hours", clause: 2 },
                  { level: "medium", text: "Confidentiality obligation has no time limit — unusual and potentially unenforceable", clause: 3 },
                ].map((alert, i) => (
                  <div key={i} onClick={() => { setActiveTab("clauses"); setExpandedClause(alert.clause); }} style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 9, background: alert.level === "high" ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${alert.level === "high" ? "#FCA5A5" : "#FCD34D"}`, cursor: "pointer" }}>
                    <Icon path={alert.level === "high" ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} size={16} color={alert.level === "high" ? "#EF4444" : "#F59E0B"} />
                    <p style={{ margin: 0, fontSize: 13, color: alert.level === "high" ? "#991B1B" : "#92400E", lineHeight: 1.4, flex: 1 }}>{alert.text}</p>
                    <Icon path="M9 5l7 7-7 7" size={14} color="#94A3B8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary split view */}
            <div style={{ ...S.card }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
                <Icon path="M4 6h16M4 12h16M4 18h7" size={16} color="#1E3A8A" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>Document Summary</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: 18, borderRight: "1px solid #F1F5F9" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase" }}>Original Text (excerpt)</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.7, fontFamily: "JetBrains Mono, monospace", background: "#F8FAFC", padding: "12px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    "Employee agrees that for a period of twelve (12) months following the termination of employment, for any reason whatsoever, Employee shall not, directly or indirectly, engage in, be employed by..."
                  </p>
                </div>
                <div style={{ padding: 18 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.07em", textTransform: "uppercase" }}>Plain English</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7, background: "#F0FDF4", padding: "12px 14px", borderRadius: 8, border: "1px solid #BBF7D0" }}>
                    For 1 year after leaving — for any reason — you cannot work for or consult with any competing company in the defined territory. This clause is broader than industry standard and may be negotiable.
                  </p>
                </div>
              </div>
            </div>

            {/* Decision framework */}
            <div style={{ ...S.card }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" size={16} color="#1E3A8A" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>Decision Framework</span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { q: "Are the compensation terms acceptable?", a: "Yes — $95k with 4% 401k match and 15 PTO days is market rate.", ok: true },
                  { q: "Is the non-compete enforceable in your state?", a: "Uncertain — varies by state. CA bans them entirely; check your jurisdiction.", ok: null },
                  { q: "Can you accept the $50k liquidated damages clause?", a: "No — this is an unacceptable risk. Must be renegotiated or removed.", ok: false },
                  { q: "Does the IP clause exclude personal projects?", a: "No — it currently covers all work, including personal projects. Needs amendment.", ok: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 8, background: item.ok === true ? "#F0FDF4" : item.ok === false ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${item.ok === true ? "#BBF7D0" : item.ok === false ? "#FCA5A5" : "#FCD34D"}` }}>
                    <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{item.ok === true ? "✓" : item.ok === false ? "✗" : "?"}</span>
                    <div>
                      <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{item.q}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.4 }}>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...S.card, padding: 18 }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0D1B3E" }}>Risk by Category</p>
              {RISK_CATEGORIES.map(cat => (
                <div key={cat.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#475569" }}>{cat.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{cat.score.toFixed(1)}</span>
                  </div>
                  <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(cat.score / 10) * 100}%`, background: cat.color, borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, padding: 18 }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0D1B3E" }}>Clause Breakdown</p>
              {["obligations", "termination", "rights", "penalties"].map(cat => {
                const count = CLAUSES.filter(c => c.category === cat).length;
                const highCount = CLAUSES.filter(c => c.category === cat && c.risk === "high").length;
                return (
                  <div key={cat} onClick={() => { setActiveTab("clauses"); setActiveCategory(cat); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: cat === "penalties" ? "#FEF2F2" : cat === "obligations" ? "#EFF6FF" : cat === "termination" ? "#FFFBEB" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon path={categoryIcon(cat)} size={13} color={cat === "penalties" ? "#EF4444" : cat === "obligations" ? "#1E3A8A" : cat === "termination" ? "#F59E0B" : "#10B981"} />
                    </div>
                    <span style={{ flex: 1, fontSize: 12, color: "#475569", textTransform: "capitalize" }}>{cat}</span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{count} clause{count !== 1 ? "s" : ""}</span>
                    {highCount > 0 && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ ...S.card, padding: 18, background: "linear-gradient(135deg, #0D1B3E, #1E3A8A)" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#fff" }}>AI Assistant</p>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "#93C5FD", lineHeight: 1.5 }}>Have questions about this contract? Ask me anything.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Is this non-compete enforceable?", "What can I negotiate?", "Summarize the key risks"].map(q => (
                  <button key={q} onClick={() => { setChatInput(q); setActivePage("chat"); }} style={{ background: "#ffffff15", border: "1px solid #ffffff20", borderRadius: 8, padding: "8px 12px", color: "#E2E8F0", fontSize: 12, cursor: "pointer", textAlign: "left" }}>{q}</button>
                ))}
              </div>
              <button onClick={() => setActivePage("chat")} style={{ width: "100%", marginTop: 12, background: "#10B981", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Open Full Chat →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLAUSES TAB ── */}
      {activeTab === "clauses" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
          <div>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {["all", "obligations", "termination", "rights", "penalties"].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer", borderColor: activeCategory === cat ? "#1E3A8A" : "#E2E8F0", background: activeCategory === cat ? "#1E3A8A" : "#fff", color: activeCategory === cat ? "#fff" : "#64748B", textTransform: "capitalize" }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredClauses.map(clause => (
                <div key={clause.id} style={{ ...S.card, border: `1px solid ${expandedClause === clause.id ? "#1E3A8A" : "#E2E8F0"}`, transition: "border-color 0.2s" }}>
                  <div onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: riskBg(clause.riskScore), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon path={categoryIcon(clause.category)} size={14} color={riskColor(clause.riskScore)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>{clause.title}</span>
                        <RiskPill risk={clause.risk} score={clause.riskScore} />
                        <span style={{ fontSize: 11, color: "#94A3B8", background: "#F1F5F9", padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{clause.category}</span>
                      </div>
                      {expandedClause !== clause.id && (
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {clause.simplified.slice(0, 90)}…
                        </p>
                      )}
                    </div>
                    <Icon path={expandedClause === clause.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} size={16} color="#94A3B8" />
                  </div>

                  {expandedClause === clause.id && (
                    <div style={{ borderTop: "1px solid #F1F5F9" }}>
                      {/* Toggle original/simplified */}
                      <div style={{ padding: "12px 18px 0", display: "flex", gap: 6 }}>
                        <button onClick={() => setShowOriginal(p => ({ ...p, [clause.id]: false }))} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid", fontSize: 12, cursor: "pointer", borderColor: !showOriginal[clause.id] ? "#1E3A8A" : "#E2E8F0", background: !showOriginal[clause.id] ? "#EFF6FF" : "#fff", color: !showOriginal[clause.id] ? "#1E3A8A" : "#64748B", fontWeight: !showOriginal[clause.id] ? 600 : 400 }}>
                          Plain English
                        </button>
                        <button onClick={() => setShowOriginal(p => ({ ...p, [clause.id]: true }))} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid", fontSize: 12, cursor: "pointer", borderColor: showOriginal[clause.id] ? "#1E3A8A" : "#E2E8F0", background: showOriginal[clause.id] ? "#EFF6FF" : "#fff", color: showOriginal[clause.id] ? "#1E3A8A" : "#64748B", fontWeight: showOriginal[clause.id] ? 600 : 400 }}>
                          Original Text
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: showOriginal[clause.id] ? "1fr" : "1fr", padding: "14px 18px", gap: 14 }}>
                        {showOriginal[clause.id] ? (
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Original Legal Text</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.8, fontFamily: "JetBrains Mono, monospace", background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>{clause.original}</p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.06em", textTransform: "uppercase" }}>What This Means</p>
                              <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7, background: "#F0FDF4", padding: 14, borderRadius: 8, border: "1px solid #BBF7D0" }}>{clause.simplified}</p>
                            </div>
                            <div style={{ background: riskBg(clause.riskScore), border: `1px solid ${riskColor(clause.riskScore)}30`, borderRadius: 8, padding: 14 }}>
                              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: riskColor(clause.riskScore), letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={13} color={riskColor(clause.riskScore)} /> Recommended Action
                              </p>
                              <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{clause.action}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ padding: "0 18px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {clause.tags.map(tag => (
                          <span key={tag} style={{ background: "#F1F5F9", color: "#64748B", fontSize: 11, padding: "2px 10px", borderRadius: 10 }}>#{tag}</span>
                        ))}
                        <button onClick={() => { setChatMessages(p => [...p, { role: "user", text: `Explain the "${clause.title}" clause in more detail` }]); setActivePage("chat"); }} style={{ marginLeft: "auto", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "4px 12px", color: "#1E3A8A", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                          Ask AI about this →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Glossary sidebar */}
          <div style={{ ...S.card, padding: 18, alignSelf: "start", position: "sticky", top: 76 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0D1B3E" }}>Key Terms</p>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={13} color="#94A3B8" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
              <input value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} placeholder="Search terms…" style={{ width: "100%", paddingLeft: 30, height: 34, border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box", color: "#1E293B" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GLOSSARY_TERMS.filter(t => !glossarySearch || t.term.toLowerCase().includes(glossarySearch.toLowerCase())).map(t => (
                <div key={t.term} style={{ padding: "10px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#0D1B3E" }}>{t.term}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{t.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── OBLIGATIONS TAB ── */}
      {activeTab === "obligations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { title: "Your Obligations", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "#1E3A8A", items: ["No competing work for 12 months after leaving", "Assign all IP created during employment to company", "Keep all confidential info secret — forever", "Return all company property on last day", "Give 2-week notice (customary, not required by contract)"] },
            { title: "Company Obligations", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 5h-3", color: "#10B981", items: ["Pay $95,000 base salary on regular schedule", "Provide health, dental, vision insurance", "Contribute 4% 401(k) match", "Provide 15 days PTO per year", "Annual performance review (increase at discretion)"] },
          ].map(section => (
            <div key={section.title} style={{ ...S.card }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: section.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path={section.icon} size={14} color={section.color} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>{section.title}</span>
              </div>
              <div style={{ padding: 16 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < section.items.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: section.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: section.color }} />
                    </span>
                    <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ ...S.card, gridColumn: "1 / -1", padding: 20 }}>
            <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>Upcoming Deadlines & Triggers</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { event: "Contract Start Date", date: "May 1, 2026", type: "info" },
                { event: "Benefits Enrollment Window", date: "May 1–15, 2026", type: "warn" },
                { event: "IP Assignment Effective", date: "Day 1 of employment", type: "danger" },
              ].map(d => (
                <div key={d.event} style={{ padding: 14, borderRadius: 10, background: d.type === "danger" ? "#FEF2F2" : d.type === "warn" ? "#FFFBEB" : "#EFF6FF", border: `1px solid ${d.type === "danger" ? "#FCA5A5" : d.type === "warn" ? "#FCD34D" : "#BFDBFE"}` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: d.type === "danger" ? "#991B1B" : d.type === "warn" ? "#92400E" : "#1E3A8A" }}>{d.date}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{d.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GLOSSARY TAB ── */}
      {activeTab === "glossary" && (
        <div>
          <div style={{ position: "relative", marginBottom: 16, maxWidth: 380 }}>
            <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14} color="#94A3B8" />
            <input value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} placeholder="Search legal terms…" style={{ width: "100%", paddingLeft: 36, height: 40, border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box", color: "#1E293B", background: "#fff" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {GLOSSARY_TERMS.filter(t => !glossarySearch || t.term.toLowerCase().includes(glossarySearch.toLowerCase())).map(t => (
              <div key={t.term} style={{ ...S.card, padding: 18 }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>{t.term}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{t.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Q&A TAB ── */}
      {activeTab === "qa" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          <div style={{ ...S.card, display: "flex", flexDirection: "column", height: 540 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>Document Q&A</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8" }}>Context: {DOCUMENT.name}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: msg.role === "user" ? "50%" : 8, background: msg.role === "user" ? "#1E3A8A" : "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {msg.role === "user" ? "AK" : <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} color="white" />}
                  </div>
                  <div style={{ background: msg.role === "user" ? "#0D1B3E" : "#F1F5F9", borderRadius: msg.role === "user" ? "12px 0 12px 12px" : "0 12px 12px 12px", padding: "11px 15px", maxWidth: "78%" }}>
                    <p style={{ margin: 0, fontSize: 13, color: msg.role === "user" ? "#E2E8F0" : "#334155", lineHeight: 1.65 }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} color="white" />
                  </div>
                  <div style={{ background: "#F1F5F9", borderRadius: "0 12px 12px 12px", padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#94A3B8", animation: "bounce 1s infinite", animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto" }}>
                {["What can I negotiate?", "Is this enforceable?", "Explain the IP clause"].map(q => (
                  <button key={q} onClick={() => { setChatInput(q); chatInputRef.current?.focus(); }} style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#475569", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask about this document…" style={{ flex: 1, height: 40, border: "1px solid #E2E8F0", borderRadius: 10, padding: "0 14px", fontSize: 13, outline: "none", color: "#1E293B" }} />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{ width: 40, height: 40, background: chatInput.trim() ? "#1E3A8A" : "#F1F5F9", border: "none", borderRadius: 10, cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                  <Icon path="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={15} color={chatInput.trim() ? "#fff" : "#94A3B8"} />
                </button>
              </div>
            </div>
          </div>
          <div style={{ ...S.card, padding: 18, alignSelf: "start" }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0D1B3E" }}>Suggested Questions</p>
            {["What are the key risks I should know?", "Can I work on side projects?", "What happens if I break the non-compete?", "How does the bonus structure work?", "Is the termination clause standard?", "What does 'territory' mean in this contract?"].map(q => (
              <button key={q} onClick={() => setChatInput(q)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "1px solid #F1F5F9", background: "#F8FAFC", fontSize: 12, color: "#475569", cursor: "pointer", marginBottom: 6, lineHeight: 1.4, transition: "border-color 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#F1F5F9"}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── RISK REPORT PAGE ──
  const RiskReportPage = () => (
    <div style={S.content}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0D1B3E", letterSpacing: "-0.02em" }}>Risk Assessment Report</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>{DOCUMENT.name} · Generated {DOCUMENT.date}</p>
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ padding: "8px 16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#475569", cursor: "pointer", display: "flex", gap: 7, alignItems: "center" }}>
          <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={14} color="#64748B" />
          Export PDF
        </button>
      </div>

      {/* Executive summary */}
      <div style={{ ...S.card, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <ScoreGauge score={overallRisk} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase" }}>Executive Summary</p>
            <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#0D1B3E" }}>This contract carries significant risk and should not be signed without negotiation.</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
              Analysis identified 7 clauses across 4 categories. Three clauses present high risk: a $50,000 liquidated damages penalty, an overly broad IP assignment covering personal work, and a non-compete with potentially unenforceable scope. The financial and rights protections are standard and acceptable. Two medium-risk items (perpetual confidentiality and at-will termination) are common but worth reviewing.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[{ v: "7", l: "Clauses Analyzed", c: "#1E3A8A" }, { v: "3", l: "High Risk", c: "#EF4444" }, { v: "2", l: "Medium Risk", c: "#F59E0B" }, { v: "2", l: "Low Risk", c: "#10B981" }].map(s => (
              <div key={s.l} style={{ textAlign: "center", padding: "8px 16px", background: "#F8FAFC", borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk matrix */}
      <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
        <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>Risk Matrix</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, position: "relative" }}>
          {/* Y-axis label */}
          <div style={{ gridColumn: "1", gridRow: "1 / 4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "#94A3B8", writingMode: "vertical-rl", transform: "rotate(180deg)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Impact</span>
          </div>
          {/* Matrix cells */}
          {[
            ["#FEF2F2", "#FEF2F2", "#FEF2F2"],
            ["#FFFBEB", "#FFFBEB", "#FEF2F2"],
            ["#F0FDF4", "#FFFBEB", "#FFFBEB"],
          ].map((row, ri) =>
            row.map((cell, ci) => (
              <div key={`${ri}-${ci}`} style={{ gridColumn: ci + 2, gridRow: ri + 1, background: cell, border: "1px solid #F1F5F9", height: 90, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 4, padding: 4 }}>
                {CLAUSES.filter(c => {
                  const impact = c.riskScore >= 7 ? 0 : c.riskScore >= 4 ? 1 : 2;
                  const likelihood = c.category === "penalties" ? 2 : c.category === "obligations" ? 2 : c.category === "termination" ? 1 : 0;
                  return impact === ri && likelihood === ci;
                }).map(c => (
                  <span key={c.id} style={{ fontSize: 9, background: riskColor(c.riskScore), color: "#fff", padding: "2px 6px", borderRadius: 3, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{c.title.split(" ").slice(0, 2).join(" ")}</span>
                ))}
              </div>
            ))
          )}
          {/* X-axis */}
          {["Low", "Medium", "High"].map((l, i) => (
            <div key={l} style={{ gridColumn: i + 2, gridRow: 4, textAlign: "center", padding: "6px 0", fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
          ))}
          <div style={{ gridColumn: "2 / 5", gridRow: 5, textAlign: "center", fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: 2 }}>Likelihood</div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div style={{ ...S.card }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>Detailed Risk Breakdown</span>
        </div>
        {CLAUSES.sort((a, b) => b.riskScore - a.riskScore).map((clause, i) => (
          <div key={clause.id} style={{ padding: "16px 18px", borderBottom: i < CLAUSES.length - 1 ? "1px solid #F8FAFC" : "none", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: riskBg(clause.riskScore), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: riskColor(clause.riskScore), lineHeight: 1 }}>{clause.riskScore.toFixed(1)}</span>
              <span style={{ fontSize: 8, color: riskColor(clause.riskScore), fontWeight: 700, letterSpacing: "0.05em" }}>/10</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>{clause.title}</span>
                <RiskPill risk={clause.risk} score={clause.riskScore} />
                <span style={{ fontSize: 11, color: "#94A3B8", background: "#F1F5F9", padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{clause.category}</span>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{clause.simplified}</p>
              <div style={{ background: riskBg(clause.riskScore), border: `1px solid ${riskColor(clause.riskScore)}25`, borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(clause.riskScore), textTransform: "uppercase", letterSpacing: "0.05em" }}>Action: </span>
                <span style={{ fontSize: 12, color: "#334155" }}>{clause.action}</span>
              </div>
            </div>
            <div style={{ width: 80, flexShrink: 0 }}>
              <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(clause.riskScore / 10) * 100}%`, background: riskColor(clause.riskScore), borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── FULL CHAT PAGE ──
  const ChatPage = () => (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", boxSizing: "border-box" }}>
      <div style={{ ...S.card, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0D1B3E, #1E3A8A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>AI Legal Assistant</p>
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Context: {DOCUMENT.name}</p>
          </div>
          <div style={{ flex: 1 }} />
          <select style={{ fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 10px", color: "#475569", background: "#F8FAFC", outline: "none" }}>
            <option>{DOCUMENT.name}</option>
            <option>All Documents</option>
          </select>
          <button style={{ padding: "6px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: "#64748B", cursor: "pointer", display: "flex", gap: 5, alignItems: "center" }}>
            <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={12} color="#64748B" />
            Export
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: msg.role === "user" ? "50%" : 9, background: msg.role === "user" ? "#1E3A8A" : "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>
                {msg.role === "user" ? "AK" : <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={15} color="white" />}
              </div>
              <div style={{ background: msg.role === "user" ? "#0D1B3E" : "#F1F5F9", borderRadius: msg.role === "user" ? "14px 0 14px 14px" : "0 14px 14px 14px", padding: "12px 16px", maxWidth: "76%" }}>
                <p style={{ margin: 0, fontSize: 13, color: msg.role === "user" ? "#E2E8F0" : "#334155", lineHeight: 1.7 }}>{msg.text}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={15} color="white" />
              </div>
              <div style={{ background: "#F1F5F9", borderRadius: "0 14px 14px 14px", padding: "14px 18px" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#94A3B8", display: "inline-block" }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Qs */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 6, overflowX: "auto" }}>
          {["Is the non-compete enforceable?", "What should I negotiate?", "Explain liquidated damages", "Summarize the top 3 risks", "Can I work on side projects?"].map(q => (
            <button key={q} onClick={() => setChatInput(q)} style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#475569", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
          <button style={{ width: 36, height: 40, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" size={15} color="#64748B" />
          </button>
          <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask anything about this document…" style={{ flex: 1, height: 40, border: "1px solid #E2E8F0", borderRadius: 10, padding: "0 14px", fontSize: 13, outline: "none", color: "#1E293B", background: "#F8FAFC" }} />
          <button onClick={sendChat} disabled={!chatInput.trim()} style={{ width: 40, height: 40, background: chatInput.trim() ? "#1E3A8A" : "#F1F5F9", border: "none", borderRadius: 10, cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
            <Icon path="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={15} color={chatInput.trim() ? "#fff" : "#94A3B8"} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── SETTINGS PAGE ──
  const SettingsPage = () => {
    const tabs = ["profile", "notifications", "billing", "privacy", "security"];
    return (
      <div style={{ ...S.content, maxWidth: 860 }}>
        <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#0D1B3E" }}>Settings</h1>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
          <div style={{ ...S.card, padding: 8, alignSelf: "start" }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setSettingsTab(tab)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: settingsTab === tab ? "#EFF6FF" : "transparent", color: settingsTab === tab ? "#1E3A8A" : "#64748B", fontSize: 13, fontWeight: settingsTab === tab ? 600 : 400, textTransform: "capitalize", marginBottom: 2 }}>
                <Icon path={{ profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", billing: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", privacy: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", security: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }[tab]} size={14} color={settingsTab === tab ? "#1E3A8A" : "#94A3B8"} />
                {tab}
              </button>
            ))}
          </div>

          <div style={{ ...S.card, padding: 24 }}>
            {settingsTab === "profile" && (
              <div>
                <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0D1B3E" }}>Profile Information</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 16, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>AK</div>
                  <div style={{ flex: 1 }}><p style={{ margin: "0 0 2px", fontWeight: 700, color: "#0D1B3E" }}>Alex Kim</p><p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>alex.kim@example.com</p></div>
                  <button style={{ padding: "7px 14px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, color: "#475569", cursor: "pointer" }}>Change Photo</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[["First Name", "Alex"], ["Last Name", "Kim"], ["Email", "alex.kim@example.com"], ["Company", "—"]].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</p>
                      <input defaultValue={val} style={{ width: "100%", height: 38, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 12px", fontSize: 13, outline: "none", color: "#1E293B", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                <button style={{ marginTop: 20, padding: "9px 20px", background: "#1E3A8A", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Changes</button>
              </div>
            )}

            {settingsTab === "notifications" && (
              <div>
                <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0D1B3E" }}>Notification Preferences</h2>
                {[["Document Analysis Complete", "Notify when AI finishes analyzing a document", true], ["High Risk Alerts", "Immediate alerts for high-risk clause detections", true], ["Document Deadline Reminders", "Reminders for contract renewal dates and deadlines", true], ["Weekly Summary Email", "Weekly digest of document activity and insights", false], ["Product Updates", "New features and improvements to LegasistAI", false]].map(([title, desc, defaultOn]) => {
                  const [on, setOn] = useState(defaultOn);
                  return (
                    <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#0D1B3E" }}>{title}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>{desc}</p>
                      </div>
                      <div onClick={() => setOn(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? "#1E3A8A" : "#E2E8F0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {settingsTab === "billing" && (
              <div>
                <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0D1B3E" }}>Billing & Subscription</h2>
                <div style={{ padding: 18, background: "linear-gradient(135deg, #0D1B3E, #1E3A8A)", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#93C5FD", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Plan</p>
                    <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#fff" }}>Pro</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#93C5FD" }}>$29/month · Renews May 8, 2026</p>
                  </div>
                  <div style={{ flex: 1 }} />
                  <button style={{ padding: "8px 16px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Upgrade to Enterprise</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[["Documents this month", "8 / 25"], ["AI Queries", "47 / 200"], ["Storage Used", "12.4 MB / 5 GB"]].map(([l, v]) => (
                    <div key={l} style={{ padding: 14, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748B" }}>{l}</p>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0D1B3E" }}>{v}</p>
                    </div>
                  ))}
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#0D1B3E" }}>Payment Method</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ padding: "4px 10px", background: "#1E3A8A", borderRadius: 6, fontSize: 11, fontWeight: 800, color: "#fff" }}>VISA</div>
                  <span style={{ fontSize: 13, color: "#475569" }}>•••• •••• •••• 4242</span>
                  <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: "auto" }}>Expires 09/28</span>
                  <button style={{ padding: "4px 10px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, color: "#64748B", cursor: "pointer" }}>Update</button>
                </div>
              </div>
            )}

            {settingsTab === "privacy" && (
              <div>
                <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0D1B3E" }}>Privacy & Data</h2>
                {[["Use my documents to improve AI", "Allow anonymized document data to improve the AI model", false], ["Analytics & Usage Data", "Share usage patterns to help improve the product", true], ["Marketing Communications", "Receive tips and product news from LegasistAI", false]].map(([title, desc, defaultOn]) => {
                  const [on, setOn] = useState(defaultOn);
                  return (
                    <div key={title} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#0D1B3E" }}>{title}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>{desc}</p>
                      </div>
                      <div onClick={() => setOn(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? "#1E3A8A" : "#E2E8F0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 24, padding: 16, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#991B1B" }}>Danger Zone</p>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#7F1D1D" }}>Deleting your account is permanent and cannot be undone. All documents and analyses will be lost.</p>
                  <button style={{ padding: "7px 14px", background: "#fff", border: "1px solid #EF4444", borderRadius: 8, color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete Account</button>
                </div>
              </div>
            )}

            {settingsTab === "security" && (
              <div>
                <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0D1B3E" }}>Security Settings</h2>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#0D1B3E" }}>Change Password</p>
                  {["Current Password", "New Password", "Confirm New Password"].map(label => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 5px", fontSize: 12, color: "#475569" }}>{label}</p>
                      <input type="password" style={{ width: "100%", height: 38, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <button style={{ marginTop: 6, padding: "9px 20px", background: "#1E3A8A", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Update Password</button>
                </div>
                <div style={{ padding: 16, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" size={16} color="#10B981" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#065F46" }}>Two-Factor Authentication</span>
                    <span style={{ background: "#BBF7D0", color: "#065F46", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, marginLeft: "auto" }}>OFF</span>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#047857" }}>Add an extra layer of security to your account with 2FA.</p>
                  <button style={{ padding: "7px 14px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enable 2FA</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── HELP PAGE ──
  const FAQ_DATA = [
    { q: "How does LegasistAI analyze my documents?", a: "LegasistAI uses advanced AI to extract text from your uploaded documents, identify legal clauses and provisions, assess risk levels based on common legal standards, and generate plain-English explanations. The analysis typically completes within 30–60 seconds." },
    { q: "Is my document data kept private?", a: "Yes. All documents are encrypted in transit and at rest. Your documents are only accessible to you and are never shared with third parties or used to train AI models without explicit consent." },
    { q: "Can LegasistAI replace a lawyer?", a: "No. LegasistAI is an educational tool to help you understand documents, not legal advice. For high-stakes contracts, you should always consult a licensed attorney. Our analysis helps you know what questions to ask." },
    { q: "What file types are supported?", a: "We currently support PDF, DOCX, and TXT files up to 50MB each. Scanned PDFs with OCR text are supported. Image-only PDFs (without text layer) may have reduced accuracy." },
    { q: "How accurate is the risk scoring?", a: "Risk scores are based on analysis of common legal standards and clause patterns. They are directionally accurate but should not be treated as definitive legal opinions. Scores from 7–10 indicate clauses warranting close attention or legal review." },
    { q: "Can I share analyses with my lawyer?", a: "Yes. From any analysis page, use the Share button to generate a secure link or export a PDF report that you can share with advisors, colleagues, or legal counsel." },
  ];

  const HelpPage = () => (
    <div style={{ ...S.content, maxWidth: 860 }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#0D1B3E" }}>Help & Support</h1>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748B" }}>Find answers, tutorials, and ways to get in touch.</p>

      <div style={{ position: "relative", marginBottom: 24, maxWidth: 500 }}>
        <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} color="#94A3B8" />
        <input value={helpSearch} onChange={e => setHelpSearch(e.target.value)} placeholder="Search help articles…" style={{ width: "100%", paddingLeft: 40, height: 44, border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#1E293B", background: "#fff" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "Getting Started", desc: "Set up your account and upload your first document", color: "#1E3A8A" },
          { icon: "M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", title: "Video Tutorials", desc: "Watch step-by-step guides for all major features", color: "#10B981" },
          { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", title: "Contact Support", desc: "Get help from our team via chat or email", color: "#F59E0B" },
        ].map(card => (
          <div key={card.title} style={{ ...S.card, padding: 18, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: card.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon path={card.icon} size={18} color={card.color} />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>{card.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0D1B3E" }}>Frequently Asked Questions</span>
        </div>
        {FAQ_DATA.filter(f => !helpSearch || f.q.toLowerCase().includes(helpSearch.toLowerCase()) || f.a.toLowerCase().includes(helpSearch.toLowerCase())).map((faq, i) => (
          <div key={i} style={{ borderBottom: i < FAQ_DATA.length - 1 ? "1px solid #F8FAFC" : "none" }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#0D1B3E" }}>{faq.q}</span>
              <Icon path={openFaq === i ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} size={16} color="#94A3B8" />
            </button>
            {openFaq === i && (
              <div style={{ padding: "0 18px 16px 18px" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7, background: "#F8FAFC", padding: "12px 14px", borderRadius: 8 }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ ...S.card, padding: 20 }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#0D1B3E" }}>Still need help?</p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B" }}>Send us a message and we'll get back to you within 24 hours.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {["Your Name", "Email Address"].map(label => (
            <div key={label}>
              <p style={{ margin: "0 0 5px", fontSize: 12, color: "#475569", fontWeight: 500 }}>{label}</p>
              <input placeholder={label} style={{ width: "100%", height: 38, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 5px", fontSize: 12, color: "#475569", fontWeight: 500 }}>Message</p>
          <textarea placeholder="Describe your issue…" style={{ width: "100%", height: 90, border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        <button style={{ padding: "9px 20px", background: "#1E3A8A", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send Message</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }`}</style>
      <TopBar />
      {activePage === "analysis" && <AnalysisPage />}
      {activePage === "risks" && <RiskReportPage />}
      {activePage === "chat" && <ChatPage />}
      {activePage === "settings" && <SettingsPage />}
      {activePage === "help" && <HelpPage />}

      {/* Floating chat widget */}
      {chatWidget && activePage !== "chat" && (
        <div style={{ position: "fixed", bottom: 20, right: 20, width: 360, background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200, display: "flex", flexDirection: "column", height: 420 }}>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg, #0D1B3E, #1E3A8A)", borderRadius: "16px 16px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={13} color="white" />
            </div>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: "#fff" }}>AI Assistant</span>
            <button onClick={() => { setActivePage("chat"); setChatWidget(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#93C5FD", fontSize: 12 }}>Expand</button>
            <button onClick={() => setChatWidget(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#93C5FD", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {chatMessages.slice(-3).map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ background: msg.role === "user" ? "#1E3A8A" : "#F1F5F9", borderRadius: 10, padding: "8px 12px", maxWidth: "85%" }}>
                  <p style={{ margin: 0, fontSize: 12, color: msg.role === "user" ? "#E2E8F0" : "#334155", lineHeight: 1.5 }}>{msg.text.slice(0, 120)}{msg.text.length > 120 ? "…" : ""}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask a question…" style={{ flex: 1, height: 36, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 12px", fontSize: 12, outline: "none" }} />
            <button onClick={sendChat} style={{ width: 36, height: 36, background: "#1E3A8A", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={13} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Floating chat trigger */}
      {!chatWidget && activePage !== "chat" && (
        <button onClick={() => setChatWidget(true)} style={{ position: "fixed", bottom: 20, right: 20, width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #0D1B3E, #1E3A8A)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(30,58,138,0.35)", zIndex: 200 }}>
          <Icon path="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={20} color="white" />
        </button>
      )}
    </div>
  );
}
