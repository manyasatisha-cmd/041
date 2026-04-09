import { useState, useEffect, useRef } from "react";

const COLORS = {
  navy: "#1E3A8A",
  navyDark: "#162C6E",
  navyLight: "#2B4EAE",
  emerald: "#10B981",
  emeraldDark: "#0D9E6E",
  amber: "#F59E0B",
  red: "#EF4444",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  grayMed: "#E5E7EB",
  white: "#FFFFFF",
  dark: "#0F1C3F",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,300&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap');
`;

const styles = `
  ${fonts}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --navy: ${COLORS.navy};
    --navy-dark: ${COLORS.navyDark};
    --emerald: ${COLORS.emerald};
    --amber: ${COLORS.amber};
    --gray: ${COLORS.gray};
    --font-display: 'Fraunces', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  body { font-family: var(--font-body); color: #1a1a2e; background: #fff; }
  
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.6; }
  }
  @keyframes scanLine {
    from { top: 0%; }
    to { top: 100%; }
  }
  .fade-up { animation: fadeUp 0.7s ease forwards; }
  .fade-in { animation: fadeIn 0.7s ease forwards; }

  .nav-link {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255,255,255,0.75);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 0.2s;
    cursor: pointer;
  }
  .nav-link:hover { color: #fff; }

  .btn-primary {
    background: var(--emerald);
    color: #fff;
    border: none;
    padding: 12px 28px;
    border-radius: 6px;
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    letter-spacing: 0.01em;
  }
  .btn-primary:hover { background: ${COLORS.emeraldDark}; transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }

  .btn-outline {
    background: transparent;
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.4);
    padding: 11px 28px;
    border-radius: 6px;
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.01em;
  }
  .btn-outline:hover { border-color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.06); }

  .btn-outline-dark {
    background: transparent;
    color: var(--navy);
    border: 1.5px solid var(--navy);
    padding: 11px 28px;
    border-radius: 6px;
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-outline-dark:hover { background: var(--navy); color: #fff; }

  .feature-card {
    background: #fff;
    border: 1px solid ${COLORS.grayMed};
    border-radius: 12px;
    padding: 28px;
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .feature-card:hover { box-shadow: 0 8px 32px rgba(30,58,138,0.10); transform: translateY(-3px); }

  .pricing-card {
    background: #fff;
    border: 1.5px solid ${COLORS.grayMed};
    border-radius: 14px;
    padding: 36px 32px;
    transition: box-shadow 0.25s, transform 0.25s;
    position: relative;
  }
  .pricing-card.featured {
    border-color: var(--navy);
    box-shadow: 0 0 0 4px rgba(30,58,138,0.07);
  }
  .pricing-card:hover { box-shadow: 0 12px 40px rgba(30,58,138,0.12); transform: translateY(-4px); }

  .testimonial-card {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 28px;
    transition: background 0.2s;
  }
  .testimonial-card:hover { background: rgba(255,255,255,0.09); }

  .risk-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-body);
  }

  .hero-doc-card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    overflow: hidden;
    position: relative;
  }

  .clause-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f5;
    font-size: 13px;
  }
  .clause-row:last-child { border-bottom: none; }

  input[type="email"] {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    padding: 12px 18px;
    border-radius: 6px;
    font-family: var(--font-body);
    font-size: 14px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  input[type="email"]::placeholder { color: rgba(255,255,255,0.5); }
  input[type="email"]:focus { border-color: var(--emerald); }

  .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; }
  .hamburger span { width: 22px; height: 2px; background: #fff; border-radius: 2px; }

  @media (max-width: 768px) {
    .nav-desktop { display: none !important; }
    .hamburger { display: flex; }
    .hero-grid { grid-template-columns: 1fr !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .testimonials-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

// ── Icon components ───────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    messageCircle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    fileText: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    checkCircle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    alertTriangle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    arrowRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    twitter: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>,
    linkedin: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
  };
  return icons[name] || null;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const RiskBadge = ({ level }) => {
  const cfg = {
    high: { bg: "#FEE2E2", color: "#991B1B", label: "High Risk" },
    medium: { bg: "#FEF3C7", color: "#92400E", label: "Medium Risk" },
    low: { bg: "#D1FAE5", color: "#065F46", label: "Low Risk" },
  }[level];
  return (
    <span className="risk-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
};

const HeroDocPreview = () => (
  <div className="hero-doc-card" style={{ width: "100%", maxWidth: 440 }}>
    {/* Header bar */}
    <div style={{ background: COLORS.navy, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {["#EF4444","#F59E0B","#10B981"].map(c => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "var(--font-mono)", marginLeft: 6 }}>
        NDA_Agreement_v3.pdf
      </span>
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.grayMed}`, background: "#FAFAFA" }}>
      {["Overview","Risks","Obligations","Q&A"].map((t, i) => (
        <div key={t} style={{
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: i === 1 ? 500 : 400,
          color: i === 1 ? COLORS.navy : COLORS.gray,
          borderBottom: i === 1 ? `2px solid ${COLORS.navy}` : "2px solid transparent",
          cursor: "pointer",
        }}>
          {t}
        </div>
      ))}
    </div>

    {/* Content */}
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>
          Risk Assessment
        </div>
        <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>
          3 Critical
        </div>
      </div>

      {/* Risk items */}
      {[
        { label: "Unlimited liability clause", level: "high", text: "Section 4.2 exposes you to uncapped financial penalties with no ceiling amount." },
        { label: "Auto-renewal terms", level: "medium", text: "Contract renews automatically for 24-month periods with 90-day cancel window." },
        { label: "IP ownership transfer", level: "high", text: "All work product and derivatives become exclusive property of the counterparty." },
        { label: "Governing jurisdiction", level: "low", text: "Disputes governed under Delaware law, favorable for standard commercial terms." },
      ].map((item, i) => (
        <div key={i} className="clause-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 12, color: "#1a1a2e", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: COLORS.gray, lineHeight: 1.4 }}>{item.text}</div>
          </div>
          <RiskBadge level={item.level} />
        </div>
      ))}

      {/* Scan indicator */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F0F9FF", borderRadius: 6, border: "1px solid #BAE6FD" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.emerald, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, color: "#0369A1", fontFamily: "var(--font-body)" }}>
          AI analysis complete — 47 clauses reviewed
        </span>
      </div>
    </div>
  </div>
);

const NavBar = ({ scrolled, mobileOpen, setMobileOpen }) => (
  <header style={{
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: scrolled ? "rgba(15,28,63,0.97)" : "transparent",
    backdropFilter: scrolled ? "blur(12px)" : "none",
    borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
    transition: "all 0.3s ease",
    padding: "0 32px",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 40 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, background: COLORS.emerald, borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon name="shield" size={16} color="#fff" />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
          LegasistAI
        </span>
      </div>

      {/* Desktop nav */}
      <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 28, flex: 1 }}>
        {["Features","How it Works","Pricing","FAQ"].map(item => (
          <a key={item} className="nav-link">{item}</a>
        ))}
      </nav>

      {/* CTA */}
      <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <a className="nav-link" style={{ fontSize: 14 }}>Log in</a>
        <button className="btn-primary" style={{ padding: "9px 22px", fontSize: 14 }}>Get Started Free</button>
      </div>

      {/* Hamburger */}
      <button
        className="hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}
      >
        <Icon name={mobileOpen ? "x" : "menu"} size={22} color="#fff" />
      </button>
    </div>

    {/* Mobile menu */}
    {mobileOpen && (
      <div style={{ background: COLORS.dark, padding: "16px 32px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {["Features","How it Works","Pricing","FAQ","Log in"].map(item => (
          <div key={item} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <a className="nav-link" style={{ fontSize: 16 }}>{item}</a>
          </div>
        ))}
        <button className="btn-primary" style={{ marginTop: 16, width: "100%" }}>Get Started Free</button>
      </div>
    )}
  </header>
);

const HeroSection = () => (
  <section style={{
    background: `linear-gradient(160deg, ${COLORS.dark} 0%, ${COLORS.navy} 55%, #1a4a7a 100%)`,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    padding: "100px 32px 80px",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Background grid pattern */}
    <div style={{
      position: "absolute", inset: 0, opacity: 0.05,
      backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }} />
    {/* Glow orbs */}
    <div style={{ position: "absolute", top: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(16,185,129,0.08)", filter: "blur(80px)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", bottom: "15%", right: "8%", width: 500, height: 500, borderRadius: "50%", background: "rgba(30,58,138,0.3)", filter: "blur(100px)", pointerEvents: "none" }} />

    <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
      <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        {/* Left */}
        <div style={{ animation: "fadeUp 0.8s ease forwards" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 20, padding: "5px 14px", marginBottom: 24,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.emerald, animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ color: COLORS.emerald, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              AI-Powered Legal Intelligence
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 58px)",
            fontWeight: 500, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em",
            marginBottom: 20,
          }}>
            Understand Any<br />
            <em style={{ fontStyle: "italic", color: COLORS.emerald }}>Legal Document</em><br />
            In Minutes
          </h1>

          <p style={{
            fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.7,
            marginBottom: 36, maxWidth: 460, fontWeight: 300,
          }}>
            LegasistAI transforms complex legal language into clear, actionable insights. Identify risks, understand obligations, and make confident decisions — without a law degree.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
            <button className="btn-primary" style={{ fontSize: 16, padding: "14px 32px" }}>
              Analyze a Document Free
            </button>
            <button className="btn-outline" style={{ fontSize: 16, padding: "14px 32px" }}>
              See How It Works
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { icon: "checkCircle", text: "No credit card required" },
              { icon: "shield", text: "SOC 2 compliant" },
              { icon: "zap", text: "Results in under 60s" },
            ].map(item => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name={item.icon} size={15} color={COLORS.emerald} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Doc preview */}
        <div style={{ display: "flex", justifyContent: "center", animation: "fadeUp 0.8s ease 0.2s both" }}>
          <HeroDocPreview />
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
        marginTop: 72, background: "rgba(255,255,255,0.08)", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
        animation: "fadeUp 0.8s ease 0.4s both",
      }}>
        {[
          { value: "250,000+", label: "Documents analyzed" },
          { value: "98.4%", label: "Risk detection accuracy" },
          { value: "< 60s", label: "Average analysis time" },
          { value: "12,000+", label: "Businesses protected" },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: "24px 28px",
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: "fileText", color: COLORS.navy,
      title: "Instant Document Parsing",
      desc: "Upload PDF, DOCX, or TXT files and receive a structured breakdown within seconds. Our AI extracts and categorizes every clause automatically.",
    },
    {
      icon: "alertTriangle", color: "#DC2626",
      title: "Risk Detection & Scoring",
      desc: "Every potential liability, penalty clause, and unfavorable term is flagged with severity scores and plain-English explanations.",
    },
    {
      icon: "messageCircle", color: COLORS.emerald,
      title: "Contextual Q&A Assistant",
      desc: "Ask questions in plain English. Get precise, document-grounded answers about any clause, term, or obligation instantly.",
    },
    {
      icon: "layers", color: "#7C3AED",
      title: "Clause Categorization",
      desc: "Obligations, termination rights, IP ownership, payment terms — every section is organized into intuitive categories for fast navigation.",
    },
    {
      icon: "eye", color: COLORS.amber,
      title: "Side-by-Side Comparison",
      desc: "View the original legal text next to a simplified explanation simultaneously. Never lose context while understanding your document.",
    },
    {
      icon: "zap", color: "#0891B2",
      title: "Actionable Recommendations",
      desc: "Receive specific negotiation points and red-flag alerts with concrete suggestions for protecting your interests.",
    },
  ];

  return (
    <section style={{ padding: "96px 32px", background: "#FAFAFA" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", background: `${COLORS.navy}12`, borderRadius: 20, padding: "5px 16px", marginBottom: 16 }}>
            <span style={{ color: COLORS.navy, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Core Features
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: "#1a1a2e", letterSpacing: "-0.02em", marginBottom: 16 }}>
            Everything you need to<br />
            <em style={{ fontStyle: "italic", color: COLORS.navy }}>navigate legal complexity</em>
          </h2>
          <p style={{ fontSize: 17, color: COLORS.gray, maxWidth: 520, margin: "0 auto", fontWeight: 300, lineHeight: 1.6 }}>
            From a simple freelance contract to a multi-party enterprise agreement, LegasistAI gives you the tools to understand every word.
          </p>
        </div>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <Icon name={f.icon} size={20} color={f.color} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "#1a1a2e", marginBottom: 8, letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.65, fontWeight: 300 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    { num: "01", title: "Upload your document", desc: "Drag and drop any PDF, Word file, or paste text directly. We support files up to 50MB." },
    { num: "02", title: "AI analysis runs instantly", desc: "Our legal AI reads every clause, identifies risks, and categorizes obligations in under 60 seconds." },
    { num: "03", title: "Review your insights", desc: "Navigate a clean dashboard showing risks by severity, key obligations, and simplified explanations." },
    { num: "04", title: "Ask follow-up questions", desc: "Use the chat assistant to drill into specific clauses, ask about implications, or get negotiation tips." },
  ];

  return (
    <section style={{ padding: "96px 32px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-block", background: `${COLORS.emerald}15`, borderRadius: 20, padding: "5px 16px", marginBottom: 16 }}>
            <span style={{ color: COLORS.emeraldDark, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              How It Works
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: "#1a1a2e", letterSpacing: "-0.02em" }}>
            From upload to clarity<br />
            <em style={{ fontStyle: "italic", color: COLORS.navy }}>in four simple steps</em>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "28px 0", borderBottom: i < 2 ? `1px solid ${COLORS.grayMed}` : "none" }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 400,
                color: `${COLORS.navy}20`, lineHeight: 1, flexShrink: 0, minWidth: 48,
              }}>
                {step.num}
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "#1a1a2e", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.65, fontWeight: 300 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload CTA */}
        <div style={{
          marginTop: 56, background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.navy} 100%)`,
          borderRadius: 16, padding: "48px 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap",
        }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, color: "#fff", marginBottom: 8 }}>
              Try it right now — it's free
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>
              No account required for your first analysis. Upload any document.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              border: "2px dashed rgba(255,255,255,0.25)", borderRadius: 10,
              padding: "16px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              cursor: "pointer", transition: "border-color 0.2s",
            }}>
              <Icon name="upload" size={22} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Drop file here or click</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>or</span>
            <button className="btn-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
              Start for Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "We reviewed a 40-page SaaS vendor agreement in 3 minutes. The risk flagging alone saved us from a very one-sided indemnification clause we would have missed.",
      name: "Priya Nair",
      role: "Operations Director, TechScale",
      rating: 5,
    },
    {
      quote: "As a solo founder, I can't afford a lawyer for every contract. LegasistAI is the next best thing — it's like having a sharp legal eye on retainer.",
      name: "Marcus Weber",
      role: "Founder, Stacklane",
      rating: 5,
    },
    {
      quote: "I used it for a lease agreement and found three clauses that my landlord glossed over. The plain English summaries made negotiation so much easier.",
      name: "Fatima Al-Hassan",
      role: "Small Business Owner",
      rating: 5,
    },
    {
      quote: "Our nonprofit uses LegasistAI to vet grant agreements before signing. It's increased our due diligence without increasing our legal budget.",
      name: "David Chen",
      role: "Executive Director, Open Access Fund",
      rating: 5,
    },
    {
      quote: "The Q&A feature is remarkable. I asked specific questions about termination clauses and got accurate, well-reasoned answers in seconds.",
      name: "Sarah Okonkwo",
      role: "Procurement Manager, Meridian Group",
      rating: 5,
    },
    {
      quote: "Switching between the original text and the simplified explanation side-by-side made a complex IP agreement finally understandable.",
      name: "James Thornton",
      role: "Freelance Designer",
      rating: 5,
    },
  ];

  return (
    <section style={{ padding: "96px 32px", background: COLORS.dark }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", background: "rgba(16,185,129,0.15)", borderRadius: 20, padding: "5px 16px", marginBottom: 16 }}>
            <span style={{ color: COLORS.emerald, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Trusted by thousands
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: "#fff", letterSpacing: "-0.02em" }}>
            What our users are saying
          </h2>
        </div>

        <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                {Array(t.rating).fill(0).map((_, j) => (
                  <Icon key={j} name="star" size={14} color={COLORS.amber} />
                ))}
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 20, fontWeight: 300, fontStyle: "italic" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `rgba(16,185,129,0.2)`, border: "1px solid rgba(16,185,129,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 500, color: COLORS.emerald,
                }}>
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      desc: "For individuals and freelancers",
      monthly: 0, annual: 0,
      features: ["5 documents/month", "Basic risk detection", "Plain English summaries", "PDF & DOCX support"],
      excluded: ["AI Q&A assistant", "Advanced risk scoring", "Document comparison", "Priority support"],
      cta: "Get Started Free",
      featured: false,
    },
    {
      name: "Professional",
      desc: "For small businesses and growing teams",
      monthly: 49, annual: 39,
      features: ["50 documents/month", "Advanced risk detection", "AI Q&A assistant", "Risk scoring matrix", "Document comparison", "Export reports", "Email support"],
      excluded: ["Unlimited documents", "API access"],
      cta: "Start 14-Day Trial",
      featured: true,
    },
    {
      name: "Enterprise",
      desc: "For organizations and legal teams",
      monthly: null, annual: null,
      features: ["Unlimited documents", "All Professional features", "API access", "Custom AI prompts", "Team management", "SSO & 2FA", "Dedicated support", "SLA guarantee"],
      excluded: [],
      cta: "Contact Sales",
      featured: false,
    },
  ];

  return (
    <section id="pricing" style={{ padding: "96px 32px", background: COLORS.grayLight }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-block", background: `${COLORS.navy}12`, borderRadius: 20, padding: "5px 16px", marginBottom: 16 }}>
            <span style={{ color: COLORS.navy, fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Pricing
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: "#1a1a2e", letterSpacing: "-0.02em", marginBottom: 24 }}>
            Simple, transparent pricing
          </h2>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${COLORS.grayMed}`, borderRadius: 8, padding: "4px 4px 4px 16px" }}>
            <span style={{ fontSize: 14, color: COLORS.gray }}>Monthly</span>
            <div
              onClick={() => setAnnual(!annual)}
              style={{
                width: 44, height: 24, background: annual ? COLORS.navy : COLORS.grayMed,
                borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 18, height: 18, background: "#fff", borderRadius: "50%",
                position: "absolute", top: 3, left: annual ? 23 : 3, transition: "left 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 14, color: annual ? COLORS.navy : COLORS.gray, fontWeight: annual ? 500 : 400 }}>Annual</span>
            <div style={{ background: `${COLORS.emerald}20`, color: COLORS.emeraldDark, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 500 }}>
              Save 20%
            </div>
          </div>
        </div>

        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
              {plan.featured && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: COLORS.navy, color: "#fff", borderRadius: 20, padding: "4px 16px",
                  fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                }}>
                  Most Popular
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "#1a1a2e", marginBottom: 4 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 20, fontWeight: 300 }}>{plan.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {plan.monthly === null ? (
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "#1a1a2e" }}>Custom</span>
                  ) : plan.monthly === 0 ? (
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500, color: "#1a1a2e" }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500, color: "#1a1a2e" }}>
                        ${annual ? plan.annual : plan.monthly}
                      </span>
                      <span style={{ fontSize: 14, color: COLORS.gray }}>/month</span>
                    </>
                  )}
                </div>
                {plan.monthly !== null && plan.monthly !== 0 && annual && (
                  <div style={{ fontSize: 12, color: COLORS.emeraldDark, marginTop: 4 }}>
                    Billed ${plan.annual * 12}/year
                  </div>
                )}
              </div>

              <button
                className={plan.featured ? "btn-primary" : "btn-outline-dark"}
                style={{ width: "100%", marginBottom: 24, padding: "12px 0" }}
              >
                {plan.cta}
              </button>

              <div style={{ borderTop: `1px solid ${COLORS.grayMed}`, paddingTop: 20 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}><Icon name="check" size={14} color={COLORS.emerald} /></div>
                    <span style={{ fontSize: 14, color: "#374151" }}>{f}</span>
                  </div>
                ))}
                {plan.excluded.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, opacity: 0.35 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}><Icon name="x" size={14} color={COLORS.gray} /></div>
                    <span style={{ fontSize: 14, color: COLORS.gray }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section style={{ padding: "96px 32px", background: `linear-gradient(160deg, ${COLORS.navy} 0%, ${COLORS.dark} 100%)` }}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 500, color: "#fff", letterSpacing: "-0.02em", marginBottom: 16 }}>
          Start understanding your<br />
          <em style={{ fontStyle: "italic", color: COLORS.emerald }}>legal documents today</em>
        </h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", marginBottom: 36, lineHeight: 1.6, fontWeight: 300 }}>
          Join thousands of businesses and individuals who've stopped signing contracts they don't fully understand.
        </p>

        {!submitted ? (
          <div style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto" }}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="btn-primary" style={{ flexShrink: 0, padding: "12px 20px" }}
              onClick={() => email && setSubmitted(true)}>
              Get Started
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", color: COLORS.emerald }}>
            <Icon name="checkCircle" size={22} color={COLORS.emerald} />
            <span style={{ fontSize: 16 }}>You're on the list! We'll be in touch shortly.</span>
          </div>
        )}

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 14 }}>
          No credit card. Free plan available. Upgrade or cancel anytime.
        </p>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer style={{ background: "#080E1F", padding: "56px 32px 32px" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, background: COLORS.emerald, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="shield" size={15} color="#fff" />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "#fff" }}>LegasistAI</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 260, fontWeight: 300 }}>
            AI-powered legal document analysis for everyone. Understand before you sign.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            {["twitter", "linkedin", "globe"].map(icon => (
              <div key={icon} style={{
                width: 32, height: 32, border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "border-color 0.2s",
              }}>
                <Icon name={icon} size={14} color="rgba(255,255,255,0.5)" />
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          { title: "Product", links: ["Features", "How it Works", "Pricing", "Security", "API"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
          { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"] },
        ].map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              {col.title}
            </div>
            {col.links.map(link => (
              <div key={link} style={{ marginBottom: 10 }}>
                <a style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}>
                  {link}
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          © 2025 LegasistAI. All rights reserved.
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>
          Not a law firm. For informational purposes only.
        </span>
      </div>
    </div>
  </footer>
);

// ── Main App ──────────────────────────────────────────────────────────────────
export default function LegasistAI() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <NavBar scrolled={scrolled} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
