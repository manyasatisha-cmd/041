import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS & GLOBAL STYLES
───────────────────────────────────────────────────────────── */
const T = {
  navy:        "#1E3A8A",
  navyDark:    "#0F1C3F",
  navyLight:   "#2B4EAE",
  emerald:     "#10B981",
  emeraldDark: "#0D9E6E",
  amber:       "#F59E0B",
  red:         "#EF4444",
  redLight:    "#FEE2E2",
  gray:        "#6B7280",
  grayLight:   "#F9FAFB",
  grayMed:     "#E5E7EB",
  grayBorder:  "#D1D5DB",
  white:       "#FFFFFF",
  text:        "#111827",
  textMuted:   "#6B7280",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,300&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');`;

const GLOBAL_CSS = `
${FONTS}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --navy: ${T.navy}; --emerald: ${T.emerald}; --amber: ${T.amber};
  --red: ${T.red}; --gray: ${T.gray};
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
  --radius:  8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.06);
  --shadow-lg: 0 16px 48px rgba(15,28,63,0.14), 0 4px 16px rgba(15,28,63,0.08);
}
body { font-family: var(--font-body); color: ${T.text}; background: ${T.grayLight}; -webkit-font-smoothing: antialiased; }

/* ── Animations ── */
@keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
@keyframes shake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 80%{transform:translateX(-3px)} }
@keyframes spin     { to { transform:rotate(360deg); } }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes drawLine { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes scanPulse{ 0%,100%{opacity:0.4;transform:scaleX(0.95)} 50%{opacity:1;transform:scaleX(1)} }

.fade-up   { animation: fadeUp  0.55s ease both; }
.fade-in   { animation: fadeIn  0.4s  ease both; }
.slide-in  { animation: slideIn 0.4s  ease both; }
.shake     { animation: shake   0.4s  ease; }

/* ── Layout ── */
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
@media(max-width:860px){ .auth-shell{ grid-template-columns:1fr; } .auth-panel-left{ display:none!important; } }

/* ── Form elements ── */
.field-wrap { display:flex; flex-direction:column; gap:5px; }
.field-label { font-size:13px; font-weight:500; color:${T.text}; letter-spacing:0.01em; }
.field-input {
  width:100%; height:44px; padding:0 14px;
  border:1.5px solid ${T.grayBorder};
  border-radius:var(--radius); background:#fff;
  font-family:var(--font-body); font-size:14px; color:${T.text};
  outline:none; transition:border-color 0.18s, box-shadow 0.18s;
  appearance:none;
}
.field-input::placeholder { color:${T.gray}; opacity:0.7; }
.field-input:focus {
  border-color:${T.navy};
  box-shadow: 0 0 0 3px rgba(30,58,138,0.12);
}
.field-input.error {
  border-color:${T.red};
  box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
}
.field-input.success {
  border-color:${T.emerald};
}
.field-error { font-size:12px; color:${T.red}; display:flex; align-items:center; gap:4px; }
.field-hint  { font-size:12px; color:${T.gray}; }

/* ── Buttons ── */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  height:44px; padding:0 22px; border-radius:var(--radius);
  font-family:var(--font-body); font-size:14px; font-weight:500;
  cursor:pointer; border:none; transition:all 0.18s; letter-spacing:0.01em;
  white-space:nowrap; user-select:none;
}
.btn-primary   { background:${T.navy}; color:#fff; }
.btn-primary:hover   { background:${T.navyLight}; transform:translateY(-1px); box-shadow:0 4px 14px rgba(30,58,138,0.3); }
.btn-primary:active  { transform:translateY(0); box-shadow:none; }
.btn-primary:disabled { opacity:0.55; cursor:not-allowed; transform:none; box-shadow:none; }

.btn-social {
  background:#fff; color:${T.text};
  border:1.5px solid ${T.grayBorder};
  height:44px; gap:10px;
}
.btn-social:hover { border-color:${T.navy}; background:${T.grayLight}; }

.btn-ghost {
  background:transparent; color:${T.navy};
  border:1.5px solid ${T.navy}; height:44px;
}
.btn-ghost:hover { background:rgba(30,58,138,0.06); }

.btn-full { width:100%; }

/* ── Checkbox ── */
.checkbox-wrap { display:flex; align-items:flex-start; gap:10px; cursor:pointer; }
.checkbox-box {
  flex-shrink:0; width:18px; height:18px; margin-top:1px;
  border:1.5px solid ${T.grayBorder}; border-radius:4px;
  background:#fff; display:flex; align-items:center; justify-content:center;
  transition:all 0.15s;
}
.checkbox-box.checked { background:${T.navy}; border-color:${T.navy}; }
.checkbox-label { font-size:13px; color:${T.gray}; line-height:1.5; }
.checkbox-label a { color:${T.navy}; text-decoration:none; }
.checkbox-label a:hover { text-decoration:underline; }

/* ── Misc ── */
.divider {
  display:flex; align-items:center; gap:12px;
  font-size:12px; color:${T.gray}; margin:4px 0;
}
.divider::before, .divider::after {
  content:''; flex:1; height:1px; background:${T.grayMed};
}
.link { color:${T.navy}; font-weight:500; text-decoration:none; cursor:pointer; font-size:14px; }
.link:hover { text-decoration:underline; }

.alert {
  display:flex; align-items:flex-start; gap:10px;
  padding:12px 14px; border-radius:var(--radius); font-size:13px; line-height:1.5;
}
.alert-error   { background:#FEF2F2; border:1px solid #FECACA; color:#991B1B; }
.alert-success { background:#ECFDF5; border:1px solid #A7F3D0; color:#065F46; }
.alert-info    { background:#EFF6FF; border:1px solid #BFDBFE; color:#1E40AF; }
.alert-warning { background:#FFFBEB; border:1px solid #FDE68A; color:#92400E; }

.spinner {
  width:16px; height:16px; border:2px solid rgba(255,255,255,0.3);
  border-top-color:#fff; border-radius:50%;
  animation:spin 0.7s linear infinite; flex-shrink:0;
}
.spinner-dark {
  border-color:rgba(30,58,138,0.2); border-top-color:${T.navy};
}

.badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 10px; border-radius:20px; font-size:11px; font-weight:500;
}

.strength-bar-wrap { display:flex; gap:4px; margin-top:6px; }
.strength-bar { height:3px; flex:1; border-radius:2px; background:${T.grayMed}; transition:background 0.3s; }

.tag {
  display:inline-flex; align-items:center; gap:5px;
  padding:2px 9px; border-radius:20px; font-size:11px;
  background:rgba(30,58,138,0.08); color:${T.navy};
}

/* ── Success tick ── */
.success-ring {
  width:64px; height:64px; border-radius:50%;
  background:${T.emerald}; display:flex; align-items:center; justify-content:center;
  animation:fadeUp 0.5s ease both;
}
`;

/* ─────────────────────────────────────────────────────────────
   ROUTER CONTEXT  (lightweight client-side router)
───────────────────────────────────────────────────────────── */
const RouterCtx = createContext(null);
const useRouter = () => useContext(RouterCtx);

function Router({ children }) {
  const [route, setRoute] = useState("/login");
  const navigate = useCallback((path) => setRoute(path), []);
  return (
    <RouterCtx.Provider value={{ route, navigate }}>
      {children}
    </RouterCtx.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────
   AUTH CONTEXT
───────────────────────────────────────────────────────────── */
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const login = (u) => setUser(u);
  const logout = () => { setUser(null); setSessionExpired(true); };
  return (
    <AuthCtx.Provider value={{ user, login, logout, sessionExpired, setSessionExpired }}>
      {children}
    </AuthCtx.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────── */
const Ico = ({ n, s = 16, c = "currentColor", stroke = c }) => {
  const paths = {
    eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    check:     <polyline points="20 6 9 17 4 12"/>,
    x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    mail:      <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    lock:      <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    user:      <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    info:      <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    arrowL:    <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    arrowR:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    google:    null,
    microsoft: null,
    checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    refresh:   <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
    building:  <><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="21" x2="8" y2="3"/><line x1="16" y1="21" x2="16" y2="3"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[n]}
    </svg>
  );
};

// Google & Microsoft logos (SVG inline)
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 23 23">
    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   REUSABLE FORM COMPONENTS
───────────────────────────────────────────────────────────── */
function FormField({ label, id, type = "text", placeholder, value, onChange, error, hint, success, disabled, autoComplete, children }) {
  return (
    <div className="field-wrap">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <div style={{ position: "relative" }}>
        {children || (
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`field-input${error ? " error" : ""}${success ? " success" : ""}`}
          />
        )}
      </div>
      {error && (
        <span className="field-error">
          <Ico n="alert" s={12} c={T.red} stroke={T.red} />
          {error}
        </span>
      )}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function PasswordInput({ label, id, value, onChange, error, showStrength, placeholder = "••••••••", autoComplete }) {
  const [show, setShow] = useState(false);

  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: T.grayMed };
    let s = 0;
    if (pw.length >= 8)  s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const map = [
      { label: "", color: T.grayMed },
      { label: "Weak",   color: T.red },
      { label: "Fair",   color: T.amber },
      { label: "Good",   color: "#3B82F6" },
      { label: "Strong", color: T.emerald },
    ];
    return { score: s, ...map[s] };
  };

  const strength = showStrength ? getStrength(value) : null;

  return (
    <div className="field-wrap">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`field-input${error ? " error" : ""}`}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.gray, display: "flex", padding: 2 }}
        >
          <Ico n={show ? "eyeOff" : "eye"} s={16} c={T.gray} stroke={T.gray} />
        </button>
      </div>
      {showStrength && value && (
        <div>
          <div className="strength-bar-wrap">
            {[1,2,3,4].map(i => (
              <div key={i} className="strength-bar" style={{ background: i <= strength.score ? strength.color : T.grayMed }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strength.color, fontWeight: 500, marginTop: 3, display: "block" }}>
            {strength.label && `Password strength: ${strength.label}`}
          </span>
        </div>
      )}
      {error && (
        <span className="field-error">
          <Ico n="alert" s={12} c={T.red} stroke={T.red} />
          {error}
        </span>
      )}
    </div>
  );
}

function Checkbox({ checked, onChange, children }) {
  return (
    <div className="checkbox-wrap" onClick={onChange}>
      <div className={`checkbox-box${checked ? " checked" : ""}`}>
        {checked && <Ico n="check" s={11} c="#fff" stroke="#fff" />}
      </div>
      <div className="checkbox-label">{children}</div>
    </div>
  );
}

function SocialButton({ provider, onClick, loading }) {
  return (
    <button className="btn btn-social btn-full" onClick={onClick} disabled={loading} type="button">
      {provider === "google" ? <GoogleLogo /> : <MicrosoftLogo />}
      <span>Continue with {provider === "google" ? "Google" : "Microsoft"}</span>
    </button>
  );
}

function Alert({ type = "info", icon, children }) {
  const iconMap = { error: "alert", success: "checkCircle", info: "info", warning: "alert" };
  const colorMap = { error: T.red, success: T.emerald, info: T.navy, warning: T.amber };
  return (
    <div className={`alert alert-${type}`}>
      <Ico n={icon || iconMap[type]} s={16} c={colorMap[type]} stroke={colorMap[type]} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LEFT PANEL  — shared visual brand panel
───────────────────────────────────────────────────────────── */
function AuthPanelLeft({ variant = "default" }) {
  const variants = {
    default:  { headline: ["Understand every", "contract you sign."],     sub: "AI-powered legal clarity — before you're bound." },
    register: { headline: ["Your legal co-pilot", "starts here."],         sub: "Join 12,000+ businesses making informed decisions." },
    forgot:   { headline: ["We've got you", "covered."],                   sub: "Password recovery is quick, secure, and simple." },
    verify:   { headline: ["One step away", "from clarity."],              sub: "Check your inbox and verify your account." },
    reset:    { headline: ["Fresh start,", "full security."],               sub: "Create a new password and get back to work." },
    success:  { headline: ["Welcome to", "LegasistAI."],                   sub: "Your legal intelligence platform is ready." },
    timeout:  { headline: ["Your session", "expired."],                    sub: "For your security, we log out inactive sessions." },
  };
  const v = variants[variant] || variants.default;

  return (
    <div
      className="auth-panel-left"
      style={{
        background: `linear-gradient(150deg, ${T.navyDark} 0%, ${T.navy} 60%, #1a4a7a 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 52px", position: "relative", overflow: "hidden",
      }}
    >
      {/* BG grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)",
        backgroundSize: "36px 36px", pointerEvents: "none",
      }} />
      {/* Glow */}
      <div style={{ position:"absolute", bottom:"-10%", right:"-10%", width:380, height:380, borderRadius:"50%", background:"rgba(16,185,129,0.07)", filter:"blur(80px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"5%", left:"-15%", width:300, height:300, borderRadius:"50%", background:"rgba(30,58,138,0.3)", filter:"blur(70px)", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, position:"relative", zIndex:1 }}>
        <div style={{ width:34, height:34, background:T.emerald, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ico n="shield" s={18} c="#fff" stroke="#fff" />
        </div>
        <span style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:600, color:"#fff", letterSpacing:"-0.02em" }}>
          LegasistAI
        </span>
      </div>

      {/* Document viz */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1, paddingTop:32 }}>
        <DocumentViz />
      </div>

      {/* Headline */}
      <div style={{ position:"relative", zIndex:1 }}>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(26px,3.5vw,36px)", fontWeight:500, color:"#fff", lineHeight:1.15, letterSpacing:"-0.02em", marginBottom:12 }}>
          {v.headline[0]}<br />
          <em style={{ fontStyle:"italic", color:T.emerald }}>{v.headline[1]}</em>
        </h2>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", fontWeight:300, lineHeight:1.6 }}>{v.sub}</p>

        {/* Micro-badges */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:20 }}>
          {["SOC 2 Compliant","256-bit Encryption","GDPR Ready"].map(b => (
            <span key={b} style={{
              background:"rgba(255,255,255,0.09)", border:"1px solid rgba(255,255,255,0.14)",
              borderRadius:20, padding:"4px 12px", fontSize:11, color:"rgba(255,255,255,0.6)",
              letterSpacing:"0.03em",
            }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Animated document card in the left panel */
function DocumentViz() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const risks = [
    { label:"Unlimited liability", lvl:"high" },
    { label:"Auto-renewal clause", lvl:"medium" },
    { label:"IP transfer terms",   lvl:"high" },
    { label:"Jurisdiction",        lvl:"low" },
  ];
  const colors = { high:T.red, medium:T.amber, low:T.emerald };
  const active = tick % risks.length;

  return (
    <div style={{ width:"100%", maxWidth:320, animation:"float 4s ease-in-out infinite" }}>
      <div style={{
        background:"rgba(255,255,255,0.06)", backdropFilter:"blur(10px)",
        border:"1px solid rgba(255,255,255,0.14)", borderRadius:14,
        overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.35)",
      }}>
        {/* Title bar */}
        <div style={{ background:"rgba(255,255,255,0.07)", padding:"10px 16px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", gap:5 }}>
            {[T.red,T.amber,T.emerald].map(c=>(
              <div key={c} style={{ width:8, height:8, borderRadius:"50%", background:c, opacity:0.7 }} />
            ))}
          </div>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"rgba(255,255,255,0.45)", marginLeft:4 }}>
            NDA_Agreement_2025.pdf
          </span>
        </div>

        {/* Scan line */}
        <div style={{ position:"relative", background:"rgba(255,255,255,0.03)", padding:"12px 16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:T.emerald, animation:"pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-mono)" }}>Analyzing clauses…</span>
          </div>
          {/* Simulated text lines */}
          {[80,60,90,45,70].map((w,i)=>(
            <div key={i} style={{
              height:5, borderRadius:3, marginBottom:6,
              background:`rgba(255,255,255,${i===2?0.15:0.07})`, width:`${w}%`,
            }} />
          ))}
        </div>

        {/* Risk rows */}
        <div style={{ padding:"8px 16px 14px" }}>
          {risks.map((r, i) => (
            <div key={i} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)",
              opacity: i === active ? 1 : 0.45, transition:"opacity 0.4s",
            }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)", fontFamily:"var(--font-body)" }}>{r.label}</span>
              <span style={{
                fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:10,
                background:`${colors[r.lvl]}22`, color:colors[r.lvl],
              }}>
                {r.lvl.charAt(0).toUpperCase()+r.lvl.slice(1)}
              </span>
            </div>
          ))}
          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ flex:1, height:3, borderRadius:2, background:`rgba(16,185,129,0.25)` }}>
              <div style={{ width:`${((active+1)/risks.length)*100}%`, height:"100%", background:T.emerald, borderRadius:2, transition:"width 0.5s ease" }} />
            </div>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-mono)" }}>
              {active+1}/{risks.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RIGHT PANEL wrapper
───────────────────────────────────────────────────────────── */
function AuthPanelRight({ children, delay = 0 }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
      background:"#fff", padding:"48px 40px", minHeight:"100vh",
    }}>
      <div style={{ width:"100%", maxWidth:420, animation:`fadeUp 0.55s ease ${delay}s both` }}>
        {children}
      </div>
    </div>
  );
}

function AuthHeader({ title, subtitle, back, onBack }) {
  return (
    <div style={{ marginBottom:28 }}>
      {back && (
        <button
          onClick={onBack}
          style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:T.gray, fontSize:13, padding:0, marginBottom:20 }}
        >
          <Ico n="arrowL" s={14} c={T.gray} stroke={T.gray} />
          {back}
        </button>
      )}
      <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(24px,4vw,30px)", fontWeight:500, color:T.text, letterSpacing:"-0.02em", marginBottom:6 }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.6, fontWeight:300 }}>{subtitle}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VALIDATION HELPERS
───────────────────────────────────────────────────────────── */
const validate = {
  email:    v => !v ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address" : null,
  password: v => !v ? "Password is required" : v.length < 8 ? "Password must be at least 8 characters" : null,
  name:     v => !v.trim() ? "Full name is required" : v.trim().length < 2 ? "Enter your full name" : null,
  confirmPw:(v,pw) => !v ? "Please confirm your password" : v !== pw ? "Passwords do not match" : null,
};

/* ─────────────────────────────────────────────────────────────
   PAGE: LOGIN
───────────────────────────────────────────────────────────── */
function LoginPage() {
  const { navigate } = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [remember, setRemember] = useState(false);
  const [shaking, setShaking] = useState(false);

  const set = (k) => (e) => { setForm(f => ({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:null})); setApiError(""); };

  const submit = async (e) => {
    e?.preventDefault();
    const errs = { email: validate.email(form.email), password: validate.password(form.password) };
    const hasErr = Object.values(errs).some(Boolean);
    setErrors(errs);
    if (hasErr) { setShaking(true); setTimeout(()=>setShaking(false),450); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    // Simulate wrong password scenario for demo
    if (form.password === "wrongpassword") {
      setApiError("Invalid email or password. Please try again.");
      setShaking(true); setTimeout(()=>setShaking(false),450);
      setLoading(false); return;
    }
    login({ email: form.email, name: form.email.split("@")[0] });
    navigate("/dashboard");
  };

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="default" />
      <AuthPanelRight>
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to your LegasistAI account to continue."
        />

        {apiError && <div style={{ marginBottom:16 }}><Alert type="error">{apiError}</Alert></div>}

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          <SocialButton provider="google" />
          <SocialButton provider="microsoft" />
        </div>

        <div className="divider" style={{ marginBottom:16 }}>or sign in with email</div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }} className={shaking ? "shake" : ""}>
          <FormField
            label="Email address" id="email" type="email"
            placeholder="you@company.com"
            value={form.email} onChange={set("email")}
            error={errors.email} autoComplete="email"
          />
          <div>
            <PasswordInput
              label="Password" id="password"
              value={form.password} onChange={set("password")}
              error={errors.password} autoComplete="current-password"
            />
            <div style={{ textAlign:"right", marginTop:6 }}>
              <span className="link" style={{ fontSize:13 }} onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </span>
            </div>
          </div>

          <Checkbox checked={remember} onChange={() => setRemember(!remember)}>
            Remember me for 30 days
          </Checkbox>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner"/>&nbsp;Signing in…</> : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign:"center", marginTop:24, fontSize:14, color:T.textMuted }}>
          Don't have an account?{" "}
          <span className="link" onClick={() => navigate("/register")}>Create one free</span>
        </p>

        {/* Demo hint */}
        <div style={{ marginTop:28, padding:"10px 14px", background:T.grayLight, borderRadius:8, border:`1px solid ${T.grayMed}` }}>
          <p style={{ fontSize:12, color:T.gray, lineHeight:1.5 }}>
            <strong style={{ color:T.text }}>Demo:</strong> Enter any email + any password (not "wrongpassword") to sign in. Use "wrongpassword" to test the error state.
          </p>
        </div>
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE: REGISTER
───────────────────────────────────────────────────────────── */
function RegisterPage() {
  const { navigate } = useRouter();
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = success redirect

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:null})); };

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {
      name:     validate.name(form.name),
      email:    validate.email(form.email),
      password: validate.password(form.password),
      confirm:  validate.confirmPw(form.confirm, form.password),
      terms:    !terms ? "You must accept the terms to continue" : null,
    };
    if (Object.values(errs).some(Boolean)) {
      setErrors(errs); setShaking(true); setTimeout(()=>setShaking(false),450); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);
    navigate("/verify-email");
  };

  // Password requirements checklist
  const pw = form.password;
  const reqs = [
    { ok: pw.length >= 8,          label:"At least 8 characters" },
    { ok: /[A-Z]/.test(pw),        label:"One uppercase letter" },
    { ok: /[0-9]/.test(pw),        label:"One number" },
    { ok: /[^A-Za-z0-9]/.test(pw), label:"One special character" },
  ];

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="register" />
      <AuthPanelRight>
        <AuthHeader
          title="Create your account"
          subtitle="Start with a free plan — no credit card required."
          back="Back to login"
          onBack={() => navigate("/login")}
        />

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          <SocialButton provider="google" />
          <SocialButton provider="microsoft" />
        </div>
        <div className="divider" style={{ marginBottom:16 }}>or register with email</div>

        <form onSubmit={submit} className={shaking ? "shake" : ""} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <FormField
            label="Full name" id="name"
            placeholder="Jane Smith"
            value={form.name} onChange={set("name")}
            error={errors.name} autoComplete="name"
          />
          <FormField
            label="Work email" id="email" type="email"
            placeholder="jane@company.com"
            value={form.email} onChange={set("email")}
            error={errors.email} autoComplete="email"
          />
          <PasswordInput
            label="Password" id="password"
            value={form.password} onChange={set("password")}
            error={errors.password}
            showStrength autoComplete="new-password"
          />

          {/* Requirements checklist */}
          {form.password && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", padding:"10px 12px", background:T.grayLight, borderRadius:8, border:`1px solid ${T.grayMed}` }} className="slide-in">
              {reqs.map(r => (
                <div key={r.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color: r.ok ? T.emerald : T.gray }}>
                  <Ico n={r.ok ? "check" : "x"} s={11} c={r.ok ? T.emerald : T.gray} stroke={r.ok ? T.emerald : T.gray} />
                  {r.label}
                </div>
              ))}
            </div>
          )}

          <PasswordInput
            label="Confirm password" id="confirm"
            value={form.confirm} onChange={set("confirm")}
            error={errors.confirm} autoComplete="new-password"
            placeholder="Re-enter password"
          />

          <div>
            <Checkbox checked={terms} onChange={() => setTerms(!terms)}>
              I agree to the <a href="#" onClick={e=>e.stopPropagation()}>Terms of Service</a> and{" "}
              <a href="#" onClick={e=>e.stopPropagation()}>Privacy Policy</a>
            </Checkbox>
            {errors.terms && <div className="field-error" style={{ marginTop:4 }}><Ico n="alert" s={12} c={T.red} stroke={T.red} />{errors.terms}</div>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop:4 }}>
            {loading ? <><span className="spinner"/>Creating account…</> : "Create free account"}
          </button>
        </form>

        <p style={{ textAlign:"center", marginTop:20, fontSize:14, color:T.textMuted }}>
          Already have an account?{" "}
          <span className="link" onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE: FORGOT PASSWORD
───────────────────────────────────────────────────────────── */
function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    const err = validate.email(email);
    if (err) { setError(err); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="forgot" />
      <AuthPanelRight>
        {!sent ? (
          <>
            <AuthHeader
              title="Reset your password"
              subtitle="Enter the email address on your account and we'll send you a reset link."
              back="Back to login"
              onBack={() => navigate("/login")}
            />
            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <FormField
                label="Email address" id="email" type="email"
                placeholder="you@company.com"
                value={email} onChange={e=>{ setEmail(e.target.value); setError(""); }}
                error={error} autoComplete="email"
              />
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="spinner"/>Sending…</> : "Send reset link"}
              </button>
            </form>

            <div style={{ marginTop:20 }}>
              <Alert type="info">
                For security, reset links expire after <strong>30 minutes</strong>.
              </Alert>
            </div>
          </>
        ) : (
          <div className="fade-up" style={{ textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:`${T.emerald}15`, border:`2px solid ${T.emerald}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Ico n="mail" s={28} c={T.emerald} stroke={T.emerald} />
              </div>
            </div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:500, color:T.text, marginBottom:8, letterSpacing:"-0.02em" }}>
              Check your inbox
            </h2>
            <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.65, marginBottom:24, fontWeight:300 }}>
              We sent a password reset link to <strong style={{ color:T.text }}>{email}</strong>. The link will expire in 30 minutes.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn btn-primary btn-full" onClick={() => navigate("/reset-password")}>
                I have the link →
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => setSent(false)}>
                <Ico n="refresh" s={14} c={T.navy} stroke={T.navy} />
                Resend email
              </button>
            </div>
            <p style={{ marginTop:20, fontSize:13, color:T.gray }}>
              Didn't get it? Check your spam folder, or{" "}
              <span className="link" style={{ fontSize:13 }} onClick={() => setSent(false)}>try again</span>
            </p>
          </div>
        )}
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE: RESET PASSWORD
───────────────────────────────────────────────────────────── */
function ResetPasswordPage() {
  const { navigate } = useRouter();
  const [form, setForm] = useState({ password:"", confirm:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:null})); };

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {
      password: validate.password(form.password),
      confirm:  validate.confirmPw(form.confirm, form.password),
    };
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1300));
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="reset" />
      <AuthPanelRight>
        {!done ? (
          <>
            <AuthHeader
              title="Set new password"
              subtitle="Choose a strong password for your account."
              back="Back to login"
              onBack={() => navigate("/login")}
            />

            {/* Token validity badge */}
            <div style={{ marginBottom:20 }}>
              <Alert type="success" icon="clock">
                Reset link valid for <strong>28 more minutes</strong>
              </Alert>
            </div>

            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <PasswordInput
                label="New password" id="password"
                value={form.password} onChange={set("password")}
                error={errors.password} showStrength autoComplete="new-password"
              />
              <PasswordInput
                label="Confirm new password" id="confirm"
                value={form.confirm} onChange={set("confirm")}
                error={errors.confirm} autoComplete="new-password"
                placeholder="Re-enter new password"
              />
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="spinner"/>Updating password…</> : "Set new password"}
              </button>
            </form>
          </>
        ) : (
          <div className="fade-up" style={{ textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
              <div className="success-ring">
                <Ico n="check" s={30} c="#fff" stroke="#fff" />
              </div>
            </div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:500, color:T.text, marginBottom:8, letterSpacing:"-0.02em" }}>
              Password updated
            </h2>
            <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.65, marginBottom:28, fontWeight:300 }}>
              Your password has been changed successfully. All other sessions have been signed out.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate("/login")}>
              Sign in with new password
            </button>
          </div>
        )}
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE: VERIFY EMAIL
───────────────────────────────────────────────────────────── */
function VerifyEmailPage() {
  const { navigate } = useRouter();
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const resend = () => {
    setResent(true);
    setCountdown(30);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="verify" />
      <AuthPanelRight>
        <div style={{ textAlign:"center" }}>
          {/* Animated envelope */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <div style={{
              width:80, height:80, borderRadius:"50%",
              background:`${T.navy}10`, border:`2px solid ${T.navy}22`,
              display:"flex", alignItems:"center", justifyContent:"center",
              animation:"float 3s ease-in-out infinite",
            }}>
              <Ico n="mail" s={36} c={T.navy} stroke={T.navy} />
            </div>
          </div>

          <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, color:T.text, letterSpacing:"-0.02em", marginBottom:8 }}>
            Verify your email
          </h1>
          <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.65, marginBottom:28, fontWeight:300, maxWidth:340, margin:"0 auto 28px" }}>
            We sent a confirmation link to your email address. Click the link to activate your account and get started.
          </p>

          {resent && (
            <div style={{ marginBottom:16 }}>
              <Alert type="success">Verification email re-sent successfully!</Alert>
            </div>
          )}

          {/* Steps */}
          <div style={{ background:T.grayLight, border:`1px solid ${T.grayMed}`, borderRadius:10, padding:"16px 20px", textAlign:"left", marginBottom:24 }}>
            {[
              { n:"1", text:"Open your inbox and find the email from LegasistAI." },
              { n:"2", text:'Click the "Verify Email Address" button in the email.' },
              { n:"3", text:"You'll be automatically redirected to your dashboard." },
            ].map(s => (
              <div key={s.n} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:T.navy, color:"#fff", fontSize:11, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  {s.n}
                </div>
                <span style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{s.text}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button
              className="btn btn-primary btn-full"
              onClick={resend}
              disabled={countdown > 0}
            >
              {countdown > 0
                ? `Resend in ${countdown}s`
                : <><Ico n="refresh" s={14} c="#fff" stroke="#fff" />Resend verification email</>
              }
            </button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => navigate("/login")}
            >
              Back to login
            </button>
          </div>

          <p style={{ marginTop:20, fontSize:12, color:T.gray }}>
            Wrong address?{" "}
            <span className="link" style={{ fontSize:12 }} onClick={() => navigate("/register")}>
              Register with a different email
            </span>
          </p>
        </div>
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE: ACCOUNT ACTIVATED (success)
───────────────────────────────────────────────────────────── */
function AccountActivatedPage() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    navigate("/dashboard");
  };

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="success" />
      <AuthPanelRight>
        <div style={{ textAlign:"center" }}>
          {/* Animated tick */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <div className="success-ring">
              <Ico n="check" s={30} c="#fff" stroke="#fff" />
            </div>
          </div>

          <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, color:T.text, letterSpacing:"-0.02em", marginBottom:8 }}>
            Account verified!
          </h1>
          <p style={{ fontSize:15, color:T.textMuted, lineHeight:1.65, marginBottom:32, fontWeight:300 }}>
            Your email has been confirmed. Welcome to LegasistAI — your legal intelligence platform is ready.
          </p>

          {/* Feature teasers */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28, textAlign:"left" }}>
            {[
              { icon:"fileText", text:"Upload and analyze your first document in under 60 seconds" },
              { icon:"shield",   text:"Risk scoring and clause categorization built-in" },
              { icon:"building", text:"AI chat assistant ready to answer your legal questions" },
            ].map((f,i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:T.grayLight, borderRadius:8, border:`1px solid ${T.grayMed}` }}>
                <div style={{ width:34, height:34, borderRadius:8, background:`${T.navy}12`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Ico n={f.icon} s={16} c={T.navy} stroke={T.navy} />
                </div>
                <span style={{ fontSize:13, color:T.text, lineHeight:1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-full" onClick={go} disabled={loading}>
            {loading ? <><span className="spinner"/>Taking you in…</> : <>Go to my dashboard <Ico n="arrowR" s={14} c="#fff" stroke="#fff" /></>}
          </button>
        </div>
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE: SESSION TIMEOUT
───────────────────────────────────────────────────────────── */
function SessionTimeoutPage() {
  const { navigate } = useRouter();
  const { setSessionExpired } = useAuth();

  const goBack = () => { setSessionExpired(false); navigate("/login"); };

  return (
    <div className="auth-shell">
      <AuthPanelLeft variant="timeout" />
      <AuthPanelRight>
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <div style={{
              width:72, height:72, borderRadius:"50%",
              background:`${T.amber}15`, border:`2px solid ${T.amber}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Ico n="clock" s={32} c={T.amber} stroke={T.amber} />
            </div>
          </div>

          <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, color:T.text, letterSpacing:"-0.02em", marginBottom:8 }}>
            Session expired
          </h1>
          <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.65, marginBottom:24, fontWeight:300 }}>
            For your security, we automatically sign out inactive sessions after 30 minutes. Your work has been saved.
          </p>

          <div style={{ marginBottom:24 }}>
            <Alert type="warning">
              Any unsaved analysis has been preserved. Sign back in to continue where you left off.
            </Alert>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button className="btn btn-primary btn-full" onClick={goBack}>
              Sign back in
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => navigate("/")}>
              Return to homepage
            </button>
          </div>
        </div>
      </AuthPanelRight>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MOCK DASHBOARD (Protected Route destination)
───────────────────────────────────────────────────────────── */
function DashboardMock() {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight:"100vh", background:T.grayLight, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:32 }} className="fade-in">
      <div style={{ width:64, height:64, borderRadius:"50%", background:`${T.emerald}15`, border:`2px solid ${T.emerald}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Ico n="checkCircle" s={28} c={T.emerald} stroke={T.emerald} />
      </div>
      <h2 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, color:T.text, letterSpacing:"-0.02em", textAlign:"center" }}>
        Dashboard — Auth flow complete!
      </h2>
      <p style={{ fontSize:14, color:T.textMuted, textAlign:"center", maxWidth:380, lineHeight:1.6 }}>
        You're signed in as <strong>{user?.email}</strong>. This mock dashboard confirms the protected route system is working correctly.
      </p>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
        <button className="btn btn-primary" onClick={() => navigate("/login")} style={{ fontFamily:"var(--font-body)", cursor:"pointer" }}>
          Back to Login
        </button>
        <button className="btn btn-ghost" onClick={() => { logout(); navigate("/session-timeout"); }} style={{ fontFamily:"var(--font-body)", cursor:"pointer" }}>
          Simulate Session Timeout
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROTECTED ROUTE WRAPPER
───────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => { if (!user) navigate("/login"); }, [user]);
  if (!user) return null;
  return children;
}

/* ─────────────────────────────────────────────────────────────
   PAGE NAV DEMO BAR
───────────────────────────────────────────────────────────── */
function DevNav() {
  const { navigate, route } = useRouter();
  const pages = [
    { path:"/login",           label:"Login" },
    { path:"/register",        label:"Register" },
    { path:"/forgot-password", label:"Forgot Pw" },
    { path:"/reset-password",  label:"Reset Pw" },
    { path:"/verify-email",    label:"Verify Email" },
    { path:"/activated",       label:"Activated" },
    { path:"/session-timeout", label:"Session ⏱" },
    { path:"/dashboard",       label:"Dashboard" },
  ];
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:999,
      background:"rgba(15,28,63,0.97)", backdropFilter:"blur(12px)",
      borderTop:"1px solid rgba(255,255,255,0.1)",
      padding:"8px 16px",
      display:"flex", alignItems:"center", gap:6, flexWrap:"wrap",
    }}>
      <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginRight:4, fontFamily:"var(--font-mono)", letterSpacing:"0.06em" }}>
        PAGES:
      </span>
      {pages.map(p => (
        <button
          key={p.path}
          onClick={() => navigate(p.path)}
          style={{
            padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
            fontFamily:"var(--font-body)", fontSize:12, fontWeight:500,
            background: route === p.path ? T.emerald : "rgba(255,255,255,0.1)",
            color: route === p.path ? "#fff" : "rgba(255,255,255,0.6)",
            transition:"all 0.15s",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { route } = useRouter();
  const { sessionExpired } = useAuth();

  const routes = {
    "/login":           <LoginPage />,
    "/register":        <RegisterPage />,
    "/forgot-password": <ForgotPasswordPage />,
    "/reset-password":  <ResetPasswordPage />,
    "/verify-email":    <VerifyEmailPage />,
    "/activated":       <AccountActivatedPage />,
    "/session-timeout": <SessionTimeoutPage />,
    "/dashboard":       <ProtectedRoute><DashboardMock /></ProtectedRoute>,
  };

  return (
    <div style={{ paddingBottom: 56 }}>
      {routes[route] || <LoginPage />}
      <DevNav />
    </div>
  );
}

export default function LegasistAIAuth() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </>
  );
}
