import { useState, useEffect, useRef, Fragment } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy: "#1E3A8A",
  navyDark: "#162D6E",
  navyLight: "#2B4FA6",
  emerald: "#10B981",
  emeraldDark: "#059669",
  amber: "#F59E0B",
  danger: "#EF4444",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  grayBorder: "#E5E7EB",
  white: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'DM Sans', sans-serif; background: #F0F4FF; }

  .auth-root {
    min-height: 100vh;
    display: flex;
    background: #F0F4FF;
    position: relative;
    overflow: hidden;
  }

  /* Left decorative panel */
  .auth-panel-left {
    width: 420px;
    flex-shrink: 0;
    background: ${T.navy};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 44px;
    position: relative;
    overflow: hidden;
  }

  .auth-panel-left::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(16,185,129,0.12);
  }

  .auth-panel-left::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }

  .panel-logo {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 1;
  }

  .panel-logo-mark {
    width: 38px; height: 38px;
    background: ${T.emerald};
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }

  .panel-logo-text {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: white;
    letter-spacing: -0.3px;
  }

  .panel-tagline {
    position: relative; z-index: 1;
  }

  .panel-tagline h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 36px;
    line-height: 1.2;
    color: white;
    margin-bottom: 16px;
    font-weight: 400;
  }

  .panel-tagline h2 em {
    font-style: italic;
    color: ${T.emerald};
  }

  .panel-tagline p {
    font-size: 15px;
    color: rgba(255,255,255,0.65);
    line-height: 1.6;
    font-weight: 300;
  }

  .panel-features {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 14px;
  }

  .panel-feature {
    display: flex; align-items: center; gap: 12px;
  }

  .panel-feature-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: ${T.emerald};
    flex-shrink: 0;
  }

  .panel-feature span {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    font-weight: 400;
    letter-spacing: 0.1px;
  }

  /* Right form area */
  .auth-form-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    overflow-y: auto;
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: white;
    border-radius: 20px;
    padding: 44px 44px;
    box-shadow: 0 4px 32px rgba(30,58,138,0.08), 0 1px 4px rgba(0,0,0,0.04);
    animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .auth-card-header {
    margin-bottom: 32px;
  }

  .auth-card-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: ${T.emerald};
    margin-bottom: 8px;
  }

  .auth-card-title {
    font-family: 'DM Serif Display', serif;
    font-size: 30px;
    font-weight: 400;
    color: ${T.text};
    line-height: 1.2;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .auth-card-subtitle {
    font-size: 14px;
    color: ${T.textMuted};
    line-height: 1.5;
  }

  /* Form fields */
  .field-group {
    margin-bottom: 20px;
  }

  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: ${T.text};
    margin-bottom: 7px;
  }

  .field-input-wrap {
    position: relative;
  }

  .field-input {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: ${T.text};
    background: ${T.grayLight};
    border: 1.5px solid ${T.grayBorder};
    border-radius: 10px;
    outline: none;
    transition: all 0.15s;
  }

  .field-input:focus {
    background: white;
    border-color: ${T.navy};
    box-shadow: 0 0 0 3px rgba(30,58,138,0.1);
  }

  .field-input.error {
    border-color: ${T.danger};
    background: #FFF5F5;
  }

  .field-input.has-icon { padding-right: 44px; }

  .field-icon-btn {
    position: absolute;
    right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; padding: 4px;
    color: ${T.gray};
    display: flex; align-items: center;
    transition: color 0.15s;
  }

  .field-icon-btn:hover { color: ${T.navy}; }

  .field-error {
    font-size: 12px;
    color: ${T.danger};
    margin-top: 5px;
    display: flex; align-items: center; gap: 4px;
  }

  /* Password strength */
  .strength-bar {
    display: flex; gap: 3px; margin-top: 8px;
  }

  .strength-seg {
    height: 3px;
    flex: 1;
    border-radius: 2px;
    background: ${T.grayBorder};
    transition: background 0.3s;
  }

  .strength-label {
    font-size: 11px;
    margin-top: 4px;
    font-weight: 500;
  }

  /* Social buttons */
  .social-row {
    display: flex; gap: 10px;
    margin-bottom: 24px;
  }

  .social-btn {
    flex: 1;
    height: 44px;
    border: 1.5px solid ${T.grayBorder};
    border-radius: 10px;
    background: white;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    color: ${T.text};
    cursor: pointer;
    transition: all 0.15s;
  }

  .social-btn:hover {
    border-color: ${T.navy};
    background: ${T.grayLight};
  }

  .divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 24px;
  }

  .divider-line { flex: 1; height: 1px; background: ${T.grayBorder}; }

  .divider-text {
    font-size: 12px;
    color: ${T.textLight};
    font-weight: 500;
    white-space: nowrap;
  }

  /* Checkbox */
  .checkbox-row {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 20px;
  }

  .checkbox-custom {
    width: 18px; height: 18px;
    border: 1.5px solid ${T.grayBorder};
    border-radius: 5px;
    flex-shrink: 0;
    margin-top: 1px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    background: white;
  }

  .checkbox-custom.checked {
    background: ${T.navy};
    border-color: ${T.navy};
  }

  .checkbox-label {
    font-size: 13px;
    color: ${T.textMuted};
    line-height: 1.4;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-label a {
    color: ${T.navy};
    text-decoration: none;
    font-weight: 500;
  }

  /* Primary button */
  .btn-primary {
    width: 100%;
    height: 48px;
    background: ${T.navy};
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.1px;
  }

  .btn-primary:hover { background: ${T.navyLight}; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(30,58,138,0.3); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-primary.loading::after {
    content: '';
    position: absolute;
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .btn-ghost {
    background: none;
    border: none;
    color: ${T.navy};
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    text-decoration: none;
  }

  .btn-ghost:hover { text-decoration: underline; }

  /* Footer link */
  .auth-footer-link {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: ${T.textMuted};
  }

  .auth-footer-link a, .auth-footer-link button {
    color: ${T.navy};
    font-weight: 600;
    text-decoration: none;
    background: none; border: none;
    cursor: pointer; font-size: 13px;
    font-family: 'DM Sans', sans-serif;
  }

  .auth-footer-link a:hover, .auth-footer-link button:hover { text-decoration: underline; }

  /* Alert */
  .alert {
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 10px;
    line-height: 1.4;
  }

  .alert-danger { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
  .alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #065F46; }
  .alert-info { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; }
  .alert-warning { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }

  /* Success state card */
  .success-icon-wrap {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    animation: popIn 0.5s cubic-bezier(0.16,1,0.3,1);
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }

  /* Nav tabs */
  .screen-nav {
    display: flex; gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    padding: 8px;
    background: rgba(30,58,138,0.06);
    border-radius: 12px;
  }

  .screen-nav-btn {
    padding: 6px 12px;
    border-radius: 8px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    color: ${T.textMuted};
    background: transparent;
    white-space: nowrap;
  }

  .screen-nav-btn.active {
    background: ${T.navy};
    color: white;
    box-shadow: 0 2px 8px rgba(30,58,138,0.3);
  }

  .screen-nav-btn:hover:not(.active) {
    background: rgba(30,58,138,0.08);
    color: ${T.navy};
  }

  /* Forgot password link row */
  .field-row-meta {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 7px;
  }

  /* OTP Input */
  .otp-row {
    display: flex; gap: 10px; margin-bottom: 8px;
  }

  .otp-input {
    width: 52px; height: 56px;
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: ${T.navy};
    background: ${T.grayLight};
    border: 1.5px solid ${T.grayBorder};
    border-radius: 12px;
    outline: none;
    transition: all 0.15s;
  }

  .otp-input:focus {
    border-color: ${T.navy};
    background: white;
    box-shadow: 0 0 0 3px rgba(30,58,138,0.1);
  }

  /* Profile avatar section */
  .avatar-upload-area {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; margin-bottom: 28px;
  }

  .avatar-circle {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${T.navy}, ${T.navyLight});
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    color: white;
    position: relative;
    cursor: pointer;
    overflow: hidden;
  }

  .avatar-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    border-radius: 50%;
  }

  .avatar-circle:hover .avatar-overlay { opacity: 1; }

  /* Back button */
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none;
    color: ${T.textMuted}; font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; margin-bottom: 28px;
    padding: 0; transition: color 0.15s;
  }

  .back-btn:hover { color: ${T.navy}; }

  /* Responsive */
  @media (max-width: 768px) {
    .auth-panel-left { display: none; }
    .auth-card { padding: 32px 28px; }
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CheckIcon = ({ size = 16, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const MailIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.emerald} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.emerald} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LogoMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4 10h4M12 10h4M10 4v4M10 12v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
  </svg>
);

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

// ─── Password Strength Meter ──────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const getStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  };
  const score = getStrength(password);
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#E5E7EB", "#EF4444", "#F59E0B", "#10B981", "#10B981"];
  if (!password) return null;
  return (
    <div>
      <div className="strength-bar">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="strength-seg" style={{ background: i <= score ? colors[score] : "#E5E7EB" }} />
        ))}
      </div>
      <div className="strength-label" style={{ color: colors[score] }}>{labels[score]}</div>
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel({ mode }) {
  const content = {
    login: {
      eyebrow: "Welcome back",
      headline: <>Your legal clarity<br /><em>awaits you</em></>,
      sub: "Sign in to access your document library, ongoing analyses, and AI chat history.",
    },
    register: {
      eyebrow: "Get started free",
      headline: <>Legal documents,<br /><em>finally clear</em></>,
      sub: "Join thousands of small business owners and individuals who understand their contracts.",
    },
    forgot: {
      eyebrow: "No worries",
      headline: <>Back in minutes,<br /><em>we promise</em></>,
      sub: "Enter your email and we'll send you a secure link to reset your password right away.",
    },
    reset: {
      eyebrow: "Almost there",
      headline: <>Create your<br /><em>new password</em></>,
      sub: "Choose something strong and memorable. You'll use it every time you sign in.",
    },
    verify: {
      eyebrow: "One last step",
      headline: <>Check your<br /><em>inbox</em></>,
      sub: "We sent a confirmation link to verify your email address and activate your account.",
    },
    profile: {
      eyebrow: "You're in",
      headline: <>Set up your<br /><em>workspace</em></>,
      sub: "A few details help us personalize your LegasistAI experience from day one.",
    },
  };
  const c = content[mode] || content.login;

  return (
    <div className="auth-panel-left">
      <div className="panel-logo">
        <div className="panel-logo-mark"><LogoMark /></div>
        <span className="panel-logo-text">LegasistAI</span>
      </div>
      <div className="panel-tagline">
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: T.emerald, marginBottom: 12 }}>{c.eyebrow}</div>
        <h2>{c.headline}</h2>
        <p>{c.sub}</p>
      </div>
      <div className="panel-features">
        {["AI-powered plain English explanations", "Automated risk scoring & alerts", "Smart Q&A on any document", "Bank-grade document security"].map((f) => (
          <div key={f} className="panel-feature">
            <div className="panel-feature-dot" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setServerError("");
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    if (window.__legasistNavigate) {
  window.__legasistNavigate('dashboard');
} else {
  setServerError("Incorrect email or password. Please try again.");
};

  return (
    <div className="auth-root">
      <LeftPanel mode="login" />
      <div className="auth-form-area">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-eyebrow">Sign in</div>
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-subtitle">Enter your credentials to access your account.</p>
          </div>

          <div className="social-row">
            <button className="social-btn"><GoogleIcon /> Google</button>
            <button className="social-btn"><MicrosoftIcon /> Microsoft</button>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or continue with email</span>
            <div className="divider-line" />
          </div>

          {serverError && (
            <div className="alert alert-danger">
              <span>⚠</span> {serverError}
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Email address</label>
            <input
              className={`field-input${errors.email ? " error" : ""}`}
              type="email" placeholder="you@company.com"
              value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ""})); }}
            />
            {errors.email && <div className="field-error">✕ {errors.email}</div>}
          </div>

          <div className="field-group">
            <div className="field-row-meta">
              <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
              <button className="btn-ghost" onClick={() => onNavigate("forgot")}>Forgot password?</button>
            </div>
            <div className="field-input-wrap">
              <input
                className={`field-input has-icon${errors.password ? " error" : ""}`}
                type={showPw ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: ""})); }}
              />
              <button className="field-icon-btn" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {errors.password && <div className="field-error">✕ {errors.password}</div>}
          </div>

          <button className={`btn-primary${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
            {!loading && "Sign in to LegasistAI"}
          </button>

          <div className="auth-footer-link">
            Don't have an account? <button onClick={() => onNavigate("register")}>Create one free</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
function RegisterPage({ onNavigate }) {
  const [fields, setFields] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [accepted, setAccepted] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => { setFields(p => ({...p, [k]: e.target.value})); setErrors(p => ({...p, [k]: ""})); };

  const validate = () => {
    const e = {};
    if (!fields.fullName.trim()) e.fullName = "Full name is required";
    if (!fields.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = "Enter a valid email";
    if (!fields.password) e.password = "Password is required";
    else if (fields.password.length < 8) e.password = "Must be at least 8 characters";
    if (!fields.confirm) e.confirm = "Please confirm your password";
    else if (fields.password !== fields.confirm) e.confirm = "Passwords do not match";
    if (!accepted) e.terms = "You must accept the terms to continue";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setLoading(false);
if (window.__legasistNavigate) {
  window.__legasistNavigate('dashboard');
} else {
  onNavigate("login");
};

  return (
    <div className="auth-root">
      <LeftPanel mode="register" />
      <div className="auth-form-area">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-eyebrow">Create account</div>
            <h1 className="auth-card-title">Get started free</h1>
            <p className="auth-card-subtitle">No credit card required. Up and running in 60 seconds.</p>
          </div>

          <div className="social-row">
            <button className="social-btn"><GoogleIcon /> Google</button>
            <button className="social-btn"><MicrosoftIcon /> Microsoft</button>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or register with email</span>
            <div className="divider-line" />
          </div>

          <div className="field-group">
            <label className="field-label">Full name</label>
            <input className={`field-input${errors.fullName ? " error" : ""}`} type="text" placeholder="Jane Smith" value={fields.fullName} onChange={set("fullName")} />
            {errors.fullName && <div className="field-error">✕ {errors.fullName}</div>}
          </div>

          <div className="field-group">
            <label className="field-label">Email address</label>
            <input className={`field-input${errors.email ? " error" : ""}`} type="email" placeholder="you@company.com" value={fields.email} onChange={set("email")} />
            {errors.email && <div className="field-error">✕ {errors.email}</div>}
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="field-input-wrap">
              <input className={`field-input has-icon${errors.password ? " error" : ""}`} type={showPw ? "text" : "password"} placeholder="Min 8 characters" value={fields.password} onChange={set("password")} />
              <button className="field-icon-btn" onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff /> : <EyeOpen />}</button>
            </div>
            <PasswordStrength password={fields.password} />
            {errors.password && <div className="field-error">✕ {errors.password}</div>}
          </div>

          <div className="field-group">
            <label className="field-label">Confirm password</label>
            <div className="field-input-wrap">
              <input className={`field-input has-icon${errors.confirm ? " error" : ""}`} type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={fields.confirm} onChange={set("confirm")} />
              <button className="field-icon-btn" onClick={() => setShowConfirm(v => !v)}>{showConfirm ? <EyeOff /> : <EyeOpen />}</button>
            </div>
            {fields.confirm && fields.password === fields.confirm && !errors.confirm && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, color: T.emerald, fontSize: 12, fontWeight: 500 }}>
                <CheckIcon size={12} color={T.emerald} /> Passwords match
              </div>
            )}
            {errors.confirm && <div className="field-error">✕ {errors.confirm}</div>}
          </div>

          <div className="checkbox-row" onClick={() => { setAccepted(v => !v); setErrors(p => ({...p, terms: ""})); }}>
            <div className={`checkbox-custom${accepted ? " checked" : ""}`}>
              {accepted && <CheckIcon size={11} />}
            </div>
            <span className="checkbox-label">
              I agree to the <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
            </span>
          </div>
          {errors.terms && <div className="field-error" style={{ marginTop: -12, marginBottom: 12 }}>✕ {errors.terms}</div>}

          <button className={`btn-primary${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
            {!loading && "Create my free account"}
          </button>

          <div className="auth-footer-link">
            Already have an account? <button onClick={() => onNavigate("login")}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-root">
      <LeftPanel mode="forgot" />
      <div className="auth-form-area">
        <div className="auth-card">
          <button className="back-btn" onClick={() => onNavigate("login")}>
            <ArrowLeft /> Back to sign in
          </button>

          {!sent ? (
            <>
              <div className="auth-card-header">
                <div className="auth-card-eyebrow">Password reset</div>
                <h1 className="auth-card-title">Forgot your password?</h1>
                <p className="auth-card-subtitle">Enter the email address associated with your account and we'll send you a reset link.</p>
              </div>

              <div className="field-group">
                <label className="field-label">Email address</label>
                <input
                  className={`field-input${error ? " error" : ""}`}
                  type="email" placeholder="you@company.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                />
                {error && <div className="field-error">✕ {error}</div>}
              </div>

              <button className={`btn-primary${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
                {!loading && "Send reset link"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <div className="success-icon-wrap"><MailIcon /></div>
              <h1 className="auth-card-title" style={{ textAlign: "center" }}>Check your inbox</h1>
              <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 28, marginTop: 8 }}>
                We've sent a password reset link to <strong style={{ color: T.navy }}>{email}</strong>.
                It expires in 30 minutes.
              </p>
              <div className="alert alert-info" style={{ textAlign: "left" }}>
                <span>ℹ</span>
                <span>Didn't receive it? Check your spam folder, or <button className="btn-ghost" onClick={() => setSent(false)}>try again</button>.</span>
              </div>
              <button className="btn-primary" onClick={() => onNavigate("login")}>
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
function ResetPasswordPage({ onNavigate }) {
  const [fields, setFields] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState({ pw: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => { setFields(p => ({...p, [k]: e.target.value})); setErrors(p => ({...p, [k]: ""})); };

  const handleSubmit = async () => {
    const e = {};
    if (!fields.password) e.password = "Password is required";
    else if (fields.password.length < 8) e.password = "Must be at least 8 characters";
    if (!fields.confirm) e.confirm = "Please confirm your password";
    else if (fields.password !== fields.confirm) e.confirm = "Passwords do not match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="auth-root">
      <LeftPanel mode="reset" />
      <div className="auth-form-area">
        <div className="auth-card">
          {!done ? (
            <>
              <div className="auth-card-header">
                <div className="auth-card-eyebrow">New password</div>
                <h1 className="auth-card-title">Reset your password</h1>
                <p className="auth-card-subtitle">Choose a new secure password for your account.</p>
              </div>

              <div className="field-group">
                <label className="field-label">New password</label>
                <div className="field-input-wrap">
                  <input className={`field-input has-icon${errors.password ? " error" : ""}`} type={show.pw ? "text" : "password"} placeholder="Min 8 characters" value={fields.password} onChange={set("password")} />
                  <button className="field-icon-btn" onClick={() => setShow(s => ({...s, pw: !s.pw}))}>{show.pw ? <EyeOff /> : <EyeOpen />}</button>
                </div>
                <PasswordStrength password={fields.password} />
                {errors.password && <div className="field-error">✕ {errors.password}</div>}
              </div>

              <div className="field-group">
                <label className="field-label">Confirm new password</label>
                <div className="field-input-wrap">
                  <input className={`field-input has-icon${errors.confirm ? " error" : ""}`} type={show.confirm ? "text" : "password"} placeholder="Re-enter new password" value={fields.confirm} onChange={set("confirm")} />
                  <button className="field-icon-btn" onClick={() => setShow(s => ({...s, confirm: !s.confirm}))}>{show.confirm ? <EyeOff /> : <EyeOpen />}</button>
                </div>
                {errors.confirm && <div className="field-error">✕ {errors.confirm}</div>}
              </div>

              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                <span>⚠</span>
                <span>For security, all other sessions will be signed out after reset.</span>
              </div>

              <button className={`btn-primary${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
                {!loading && "Set new password"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <div className="success-icon-wrap"><ShieldIcon /></div>
              <h1 className="auth-card-title" style={{ textAlign: "center" }}>Password updated</h1>
              <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 28, marginTop: 8 }}>
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
              <button className="btn-primary" onClick={() => onNavigate("login")}>Sign in now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
function VerifyEmailPage({ onNavigate }) {
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleResend = () => {
    setResent(true);
    setCountdown(60);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="auth-root">
      <LeftPanel mode="verify" />
      <div className="auth-form-area">
        <div className="auth-card">
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 80, height: 80,
              background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
              borderRadius: "50%", margin: "0 auto 24px",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "popIn 0.5s cubic-bezier(0.16,1,0.3,1)"
            }}>
              <MailIcon />
            </div>

            <div className="auth-card-eyebrow" style={{ textAlign: "center" }}>Almost there</div>
            <h1 className="auth-card-title" style={{ textAlign: "center" }}>Verify your email</h1>
            <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 28, marginTop: 8 }}>
              We've sent a verification link to your email address. Click the link to activate your account.
            </p>
          </div>

          {resent && (
            <div className="alert alert-success">
              <CheckIcon size={14} color={T.emerald} />
              <span>Verification email resent! Check your inbox.</span>
            </div>
          )}

          <div style={{
            background: T.grayLight,
            borderRadius: 12, padding: "16px 20px",
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>What to do</div>
            {[
              "Check your email inbox",
              "Click the verification link",
              "You'll be redirected to your dashboard",
            ].map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: T.navy, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: T.text }}>{step}</span>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={handleResend}
            disabled={countdown > 0}
            style={{ background: countdown > 0 ? T.gray : T.navy }}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend verification email"}
          </button>

          <div className="auth-footer-link" style={{ marginTop: 16 }}>
            Wrong email? <button onClick={() => onNavigate("register")}>Go back and correct it</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE SETUP (post-register) ───────────────────────────────────────────
function ProfileSetupPage({ onNavigate }) {
  const [name, setName] = useState("Jane Smith");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = ["Small business owner", "Freelancer / Consultant", "Student", "Non-profit", "Legal professional", "Other"];

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onNavigate("login");
  };

  return (
    <div className="auth-root">
      <LeftPanel mode="profile" />
      <div className="auth-form-area">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-eyebrow">Account setup</div>
            <h1 className="auth-card-title">Personalize your account</h1>
            <p className="auth-card-subtitle">Quick profile setup to tailor LegasistAI to your needs.</p>
          </div>

          <div className="avatar-upload-area">
            <div className="avatar-circle">
              {name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase() || "?"}
              <div className="avatar-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <span style={{ fontSize: 12, color: T.textMuted }}>Click to upload a photo (optional)</span>
          </div>

          <div className="field-group">
            <label className="field-label">Display name</label>
            <input className="field-input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="field-label">How do you primarily use legal documents?</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${role === r ? T.navy : T.grayBorder}`,
                    background: role === r ? T.navy : "white",
                    color: role === r ? "white" : T.textMuted,
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer", transition: "all 0.15s",
                    fontWeight: role === r ? 500 : 400,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button className={`btn-primary${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {!loading && "Take me to my dashboard →"}
          </button>

          <div className="auth-footer-link">
            <button onClick={() => onNavigate("login")} style={{ color: T.textLight, fontWeight: 400 }}>Skip for now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT: Screen Switcher ────────────────────────────────────────────────────
const SCREENS = [
  { key: "login", label: "Login" },
  { key: "register", label: "Register" },
  { key: "forgot", label: "Forgot Password" },
  { key: "reset", label: "Reset Password" },
  { key: "verify", label: "Verify Email" },
  { key: "profile", label: "Profile Setup" },
];

const App = () => {
  const [screen, setScreen] = useState("login");

  // Screen routing
  const renderScreen = () => {
    switch (screen) {
      case "login": return <LoginPage onNavigate={setScreen} />;
      case "register": return <RegisterPage onNavigate={setScreen} />;
      case "forgot": return <ForgotPasswordPage onNavigate={setScreen} />;
      case "reset": return <ResetPasswordPage onNavigate={setScreen} />;
      case "verify": return <VerifyEmailPage onNavigate={setScreen} />;
      case "profile": return <ProfileSetupPage onNavigate={setScreen} />;
      default: return <LoginPage onNavigate={setScreen} />;
    }
  };

  return (
    <Fragment>
      <style>{styles}</style>
      <div style={{ background: "#1E3A8A", padding: "10px 16px" }}>
        <div className="screen-nav" style={{ margin: 0, maxWidth: 900, marginLeft: "auto", marginRight: "auto", background: "rgba(255,255,255,0.1)" }}>
          {SCREENS.map((s) => (
            <button
              key={s.key}
              className={`screen-nav-btn${screen === s.key ? " active" : ""}`}
              onClick={() => setScreen(s.key)}
              style={screen !== s.key ? { color: "rgba(255,255,255,0.7)" } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {renderScreen()}
    </Fragment>
  );
}}}