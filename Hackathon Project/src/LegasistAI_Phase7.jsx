import { useState, useRef, useEffect } from "react";

const COLORS = {
  navy: "#1E3A8A",
  navyLight: "#2D4FA8",
  emerald: "#10B981",
  emeraldLight: "#34D399",
  amber: "#F59E0B",
  danger: "#EF4444",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  white: "#FFFFFF",
};

const SAMPLE_TEXT = `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of January 1, 2025, between Acme Corp ("Company") and the Employee.

1. NON-COMPETE CLAUSE: Employee agrees that for a period of 24 months following termination of employment, Employee shall not directly or indirectly engage in any business that competes with the Company within a 500-mile radius. Violation of this clause shall result in liquidated damages of $50,000.

2. INTELLECTUAL PROPERTY: Any and all inventions, improvements, discoveries, methods, and works of authorship conceived, made, developed or created by Employee during the term of employment, whether or not during working hours, shall be the exclusive property of the Company. Employee irrevocably assigns all rights thereto.

3. TERMINATION: Company may terminate this Agreement at will, with or without cause, and without prior notice. Employee shall not be entitled to severance pay unless explicitly provided herein.

4. ARBITRATION: Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration. Employee waives the right to a jury trial. Employee agrees to pay 50% of arbitration costs.

5. CONFIDENTIALITY: Employee agrees to keep confidential all proprietary information for a period of 5 years post-termination. Breach shall entitle Company to injunctive relief without posting bond.`;

const riskColor = (level) => {
  if (level === "high") return { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B", dot: "#EF4444" };
  if (level === "medium") return { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E", dot: "#F59E0B" };
  return { bg: "#F0FDF4", border: "#10B981", text: "#065F46", dot: "#10B981" };
};

function Spinner() {
  return (
    <div style={{
      display: "inline-block", width: 16, height: 16,
      border: "2px solid #e5e7eb", borderTop: "2px solid " + COLORS.navy,
      borderRadius: "50%", animation: "spin 0.8s linear infinite"
    }} />
  );
}

// ── OpenAI API caller ─────────────────────────────────────────────────────────
async function callOpenAI(messages, jsonMode = false) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1500,
      temperature: 0.2,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LegasistAI() {
  const [tab, setTab] = useState("overview");
  const [docText, setDocText] = useState(SAMPLE_TEXT);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Analyze document ────────────────────────────────────────────────────────
  const analyzeDocument = async () => {
    if (!docText.trim()) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setTab("overview");
    setChatMessages([]);

    try {
      const raw = await callOpenAI([
        {
          role: "system",
          content: `You are a legal document analysis AI. Analyze the provided legal document and return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:
{
  "summary": "2-3 sentence plain English summary of what this document is about",
  "overallRisk": "low|medium|high",
  "riskScore": 0-100,
  "risks": [
    {"title": "...", "description": "...", "severity": "high|medium|low", "clause": "exact short quote from doc"}
  ],
  "obligations": [
    {"title": "...", "description": "...", "party": "Employee|Company|Both"}
  ],
  "keyTerms": [
    {"term": "...", "definition": "..."}
  ],
  "recommendations": ["...", "..."]
}
Limit to 4 risks, 4 obligations, 4 key terms, 3 recommendations. Identify the most impactful items.`,
        },
        {
          role: "user",
          content: `Analyze this legal document:\n\n${docText}`,
        },
      ], true /* json mode */);

      const clean = raw.replace(/```json|```/g, "").trim();
      setAnalysis(JSON.parse(clean));
    } catch (e) {
      console.error(e);
      setError(e.message?.includes("API key") 
        ? "Invalid OpenAI API key. Check your .env file." 
        : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Chat Q&A ────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || !analysis) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const reply = await callOpenAI([
        {
          role: "system",
          content: `You are a legal document assistant. The user has uploaded a legal document. Here is its content:\n\n${docText}\n\nAnswer questions about this document in plain English. Be concise, specific, and always reference the relevant section when possible. Never give formal legal advice — provide information to help the user understand their situation.`,
        },
        ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
        userMsg,
      ]);

      setChatMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setChatMessages((m) => [...m, {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = ["overview", "risks", "obligations", "terms", "chat"];
  const tabLabels = {
    overview: "Overview",
    risks: "Risks",
    obligations: "Obligations",
    terms: "Key Terms",
    chat: "Q&A Chat",
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'Source Sans Pro', 'Segoe UI', sans-serif",
      background: "#F8FAFC", minHeight: "100vh",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .tab-btn { background:none; border:none; padding:10px 18px; cursor:pointer; font-size:14px; font-family:inherit; font-weight:500; color:#6B7280; border-bottom:2px solid transparent; transition:all 0.2s; white-space:nowrap; }
        .tab-btn.active { color:#1E3A8A; border-bottom-color:#1E3A8A; }
        .tab-btn:hover:not(.active) { color:#374151; }
        .analyze-btn { background:#1E3A8A; color:white; border:none; padding:12px 28px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; transition:background 0.2s; display:flex; align-items:center; gap:8px; }
        .analyze-btn:hover:not(:disabled) { background:#2D4FA8; }
        .analyze-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .risk-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
        .card { background:white; border-radius:12px; border:1px solid #E5E7EB; padding:20px; margin-bottom:12px; animation:fadeIn 0.3s ease; }
        .chat-bubble-user { background:#1E3A8A; color:white; border-radius:16px 16px 4px 16px; padding:10px 15px; max-width:80%; margin-left:auto; font-size:14px; line-height:1.5; }
        .chat-bubble-ai { background:white; border:1px solid #E5E7EB; border-radius:16px 16px 16px 4px; padding:10px 15px; max-width:85%; font-size:14px; line-height:1.5; }
        .chat-input { flex:1; border:1px solid #D1D5DB; border-radius:8px; padding:10px 14px; font-size:14px; font-family:inherit; outline:none; }
        .chat-input:focus { border-color:#1E3A8A; box-shadow:0 0 0 3px rgba(30,58,138,0.1); }
        .send-btn { background:#1E3A8A; color:white; border:none; border-radius:8px; padding:10px 18px; cursor:pointer; font-size:14px; font-family:inherit; font-weight:600; }
        .send-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .suggestion-chip { background:#EEF2FF; color:#1E3A8A; border:1px solid #C7D2FE; border-radius:20px; padding:6px 14px; font-size:13px; cursor:pointer; transition:background 0.2s; font-family:inherit; }
        .suggestion-chip:hover { background:#E0E7FF; }
        .score-bar { height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden; margin-top:6px; }
        .score-fill { height:100%; border-radius:4px; transition:width 1s ease; }
        textarea { font-family:'JetBrains Mono', monospace; font-size:13px; width:100%; box-sizing:border-box; border:1px solid #D1D5DB; border-radius:8px; padding:14px; resize:vertical; outline:none; line-height:1.6; color:#374151; }
        textarea:focus { border-color:#1E3A8A; box-shadow:0 0 0 3px rgba(30,58,138,0.1); }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#1E3A8A", padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#10B981", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span style={{
            color: "white", fontFamily: "Inter, sans-serif",
            fontWeight: 700, fontSize: 20, letterSpacing: "-0.3px",
          }}>
            LegasistAI
          </span>
          <span style={{
            background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 12, padding: "2px 10px", fontSize: 11,
            color: "#10B981", fontWeight: 600, letterSpacing: "0.05em",
          }}>
            Powered by GPT-4o
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Documents", "Analysis", "Chat", "Help"].map((item) => (
            <button key={item} style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.75)", fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
              padding: "6px 12px", borderRadius: 6,
            }}>{item}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>

        {/* ── Input area ───────────────────────────────────────────────────── */}
        <div style={{
          background: "white", borderRadius: 14,
          border: "1px solid #E5E7EB", padding: "24px", marginBottom: 24,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 14,
          }}>
            <div>
              <h2 style={{
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                fontSize: 18, color: "#111827", margin: 0,
              }}>
                Legal Document Analysis
              </h2>
              <p style={{ color: "#6B7280", fontSize: 14, margin: "4px 0 0" }}>
                Paste your legal document text below and click Analyze
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {error && (
                <span style={{
                  color: "#EF4444", fontSize: 13,
                  background: "#FEF2F2", padding: "6px 12px",
                  borderRadius: 8, border: "1px solid #FCA5A5",
                }}>
                  ⚠ {error}
                </span>
              )}
              <button
                className="analyze-btn"
                onClick={analyzeDocument}
                disabled={loading || !docText.trim()}
              >
                {loading ? (
                  <><Spinner /> Analyzing…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    Analyze Document
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            rows={7}
            placeholder="Paste your legal document here... (contract, NDA, lease, terms of service, etc.)"
            style={{ background: "#F9FAFB" }}
          />
          <div style={{
            display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 12, color: "#94A3B8", alignSelf: "center" }}>
              Try a sample:
            </span>
            {["Employment Contract", "NDA", "Lease Agreement"].map((label) => (
              <button
                key={label}
                onClick={() => setDocText(SAMPLE_TEXT)}
                style={{
                  background: "#F1F5F9", border: "1px solid #E2E8F0",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12,
                  color: "#64748B", cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {analysis && (
          <div style={{
            background: "white", borderRadius: 14,
            border: "1px solid #E5E7EB", overflow: "hidden",
          }}>
            {/* Tab bar */}
            <div style={{
              borderBottom: "1px solid #E5E7EB", padding: "0 20px",
              display: "flex", gap: 4, overflowX: "auto",
            }}>
              {tabs.map((t) => (
                <button
                  key={t}
                  className={`tab-btn ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {tabLabels[t]}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>

              {/* ── OVERVIEW ─────────────────────────────────────────────── */}
              {tab === "overview" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {/* Risk banner */}
                  <div style={{
                    background: riskColor(analysis.overallRisk).bg,
                    borderRadius: 12, padding: "18px 22px", marginBottom: 20,
                    border: `1px solid ${riskColor(analysis.overallRisk).border}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{
                          margin: 0, fontSize: 13,
                          color: riskColor(analysis.overallRisk).text,
                          fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          Overall Risk Level
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                          <span style={{
                            fontSize: 28, fontWeight: 700,
                            color: riskColor(analysis.overallRisk).text,
                            fontFamily: "Inter, sans-serif",
                          }}>
                            {analysis.riskScore}/100
                          </span>
                          <span className="risk-pill" style={{
                            background: riskColor(analysis.overallRisk).border + "22",
                            color: riskColor(analysis.overallRisk).text,
                          }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: riskColor(analysis.overallRisk).dot,
                              display: "inline-block",
                            }} />
                            {analysis.overallRisk.toUpperCase()} RISK
                          </span>
                        </div>
                        <div className="score-bar" style={{ width: 220, marginTop: 10 }}>
                          <div className="score-fill" style={{
                            width: `${analysis.riskScore}%`,
                            background: riskColor(analysis.overallRisk).dot,
                          }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{
                          margin: 0, fontSize: 13,
                          color: riskColor(analysis.overallRisk).text, fontWeight: 600,
                        }}>
                          {analysis.risks?.length || 0} risks identified
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: riskColor(analysis.overallRisk).text }}>
                          {analysis.obligations?.length || 0} obligations found
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="card">
                    <h3 style={{
                      fontFamily: "Inter, sans-serif", fontWeight: 600,
                      fontSize: 15, color: "#111827", margin: "0 0 10px",
                    }}>
                      Document Summary
                    </h3>
                    <p style={{ margin: 0, color: "#374151", lineHeight: 1.7, fontSize: 15 }}>
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="card">
                    <h3 style={{
                      fontFamily: "Inter, sans-serif", fontWeight: 600,
                      fontSize: 15, color: "#111827", margin: "0 0 12px",
                    }}>
                      Recommendations
                    </h3>
                    {analysis.recommendations?.map((r, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start",
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: "#10B981", color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ margin: 0, color: "#374151", fontSize: 14, lineHeight: 1.6 }}>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── RISKS ────────────────────────────────────────────────── */}
              {tab === "risks" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <p style={{ color: "#6B7280", fontSize: 14, marginTop: 0, marginBottom: 18 }}>
                    Identified risks sorted by severity
                  </p>
                  {analysis.risks?.map((risk, i) => {
                    const c = riskColor(risk.severity);
                    return (
                      <div key={i} className="card" style={{ borderLeft: `4px solid ${c.border}`, paddingLeft: 18 }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "flex-start", marginBottom: 8,
                        }}>
                          <h4 style={{
                            margin: 0, fontFamily: "Inter, sans-serif",
                            fontWeight: 600, fontSize: 15, color: "#111827",
                          }}>
                            {risk.title}
                          </h4>
                          <span className="risk-pill" style={{
                            background: c.bg, color: c.text, flexShrink: 0, marginLeft: 12,
                          }}>
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: c.dot, display: "inline-block",
                            }} />
                            {risk.severity}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 10px", color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
                          {risk.description}
                        </p>
                        {risk.clause && (
                          <div style={{
                            background: "#F9FAFB", borderRadius: 6,
                            padding: "8px 12px", border: "1px solid #E5E7EB",
                          }}>
                            <p style={{
                              margin: 0, fontFamily: "JetBrains Mono, monospace",
                              fontSize: 12, color: "#6B7280", lineHeight: 1.6,
                            }}>
                              "{risk.clause}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── OBLIGATIONS ──────────────────────────────────────────── */}
              {tab === "obligations" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <p style={{ color: "#6B7280", fontSize: 14, marginTop: 0, marginBottom: 18 }}>
                    Key obligations identified in the document
                  </p>
                  {analysis.obligations?.map((ob, i) => (
                    <div key={i} className="card">
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", marginBottom: 8,
                      }}>
                        <h4 style={{
                          margin: 0, fontFamily: "Inter, sans-serif",
                          fontWeight: 600, fontSize: 15, color: "#111827",
                        }}>
                          {ob.title}
                        </h4>
                        <span style={{
                          background: "#EEF2FF", color: "#4338CA",
                          fontSize: 12, fontWeight: 600,
                          padding: "3px 10px", borderRadius: 20,
                        }}>
                          {ob.party}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
                        {ob.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── KEY TERMS ────────────────────────────────────────────── */}
              {tab === "terms" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <p style={{ color: "#6B7280", fontSize: 14, marginTop: 0, marginBottom: 18 }}>
                    Legal terms defined in plain English
                  </p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 12,
                  }}>
                    {analysis.keyTerms?.map((kt, i) => (
                      <div key={i} className="card" style={{ marginBottom: 0 }}>
                        <p style={{
                          margin: "0 0 6px",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 13, color: "#1E3A8A", fontWeight: 600,
                        }}>
                          {kt.term}
                        </p>
                        <p style={{ margin: 0, color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
                          {kt.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CHAT ─────────────────────────────────────────────────── */}
              {tab === "chat" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{
                    minHeight: 300, maxHeight: 400, overflowY: "auto",
                    padding: "0 0 12px", display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    {chatMessages.length === 0 && (
                      <div>
                        <p style={{ color: "#6B7280", fontSize: 14, marginTop: 0 }}>
                          Ask any question about this document. Some suggestions:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {[
                            "Can I negotiate the non-compete?",
                            "What happens if I break confidentiality?",
                            "Is the arbitration clause enforceable?",
                            "What are my termination rights?",
                            "Summarize the biggest risks in one sentence",
                          ].map((q) => (
                            <button
                              key={q}
                              className="suggestion-chip"
                              onClick={() => setChatInput(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{
                        display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        alignItems: "flex-end", gap: 8,
                      }}>
                        {msg.role === "assistant" && (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "#1E3A8A",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </div>
                        )}
                        <div
                          className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                          style={{ color: msg.role === "user" ? "white" : "#374151" }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {chatLoading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "#1E3A8A",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </div>
                        <div style={{
                          background: "white", border: "1px solid #E5E7EB",
                          borderRadius: "16px 16px 16px 4px", padding: "12px 16px",
                          display: "flex", gap: 5,
                        }}>
                          {[0, 1, 2].map((d) => (
                            <span key={d} style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: "#94A3B8", display: "inline-block",
                              animation: `bounce 1.2s ${d * 0.2}s ease-in-out infinite`,
                            }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input row */}
                  <div style={{
                    display: "flex", gap: 8, padding: "12px",
                    background: "white", borderTop: "1px solid #E5E7EB",
                    margin: "0 -24px -24px", borderRadius: "0 0 14px 14px",
                  }}>
                    <input
                      className="chat-input"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                      placeholder="Ask a question about this document..."
                    />
                    <button
                      className="send-btn"
                      onClick={sendChat}
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      {chatLoading ? <Spinner /> : "Send"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Placeholder ──────────────────────────────────────────────────── */}
        {!analysis && !loading && (
          <div style={{
            background: "white", borderRadius: 14,
            border: "2px dashed #D1D5DB", padding: "48px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, background: "#EEF2FF", borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 600,
              fontSize: 18, color: "#111827", margin: "0 0 8px",
            }}>
              Ready to analyze your document
            </h3>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 20px" }}>
              A sample employment agreement is pre-loaded. Click "Analyze Document" to see AI-powered legal insights powered by GPT-4o.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              {[
                { icon: "🔍", label: "Risk Detection" },
                { icon: "📋", label: "Plain English" },
                { icon: "💬", label: "Q&A Chat" },
                { icon: "⚖️", label: "Obligations" },
              ].map((f) => (
                <div key={f.label} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}