// src/pages/AuthPage.jsx
// Wraps Phase_5.jsx (the auth screens).
// After login/register success, navigates to the dashboard.
//
// IMPORTANT: You must make 2 small edits to Phase_5.jsx (see comments below).
//
// ─── EDIT 1 in Phase_5.jsx ─────────────────────────────────────────────────
// Find LoginPage's handleSubmit function (~line 762).
// REPLACE the last line of handleSubmit:
//
//   setServerError("Incorrect email or password. Please try again.");
//
// WITH:
//
//   if (window.__legasistNavigate) {
//     window.__legasistNavigate('dashboard');
//   } else {
//     setServerError("Incorrect email or password. Please try again.");
//   }
//
// ─── EDIT 2 in Phase_5.jsx ─────────────────────────────────────────────────
// Find ProfileSetupPage's handleSubmit function (~line 1217).
// REPLACE:
//
//   setLoading(false);
//   onNavigate("login");
//
// WITH:
//
//   setLoading(false);
//   if (window.__legasistNavigate) {
//     window.__legasistNavigate('dashboard');
//   } else {
//     onNavigate("login");
//   }
// ───────────────────────────────────────────────────────────────────────────

import Phase5App from '../Phase_5'

export default function AuthPage({ onNavigate }) {
  // __legasistNavigate is already set by App.jsx, so Phase_5 edits above
  // will call it automatically on successful login.
  return <Phase5App />
}
