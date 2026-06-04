import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const calcStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPwStrength(score);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else navigate("/");
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t("auth.passwordTooShort")); return; }
    const chosenName = displayName.trim() || email.split("@")[0];
    if (chosenName.length < 2) { toast.error(t("auth.nameTooShort")); return; }
    setLoading(true);
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", chosenName)
      .maybeSingle();
    if (existing) {
      toast.error(t("auth.nameTaken"));
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: chosenName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) toast.error(error.message);
    else toast.success(t("auth.checkEmailConfirm"));
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(t("auth.checkEmailReset"));
    setLoading(false);
  };

  const strengthColors = ["#e24b4a", "#ef9f27", "#639922", "#639922"];
  const strengthLabels = ["", "Zwak", "Matig", "Sterk", "Zeer sterk"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .auth-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .auth-bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(24,95,165,0.12) 0%, transparent 70%);
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .lang-corner {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 10;
        }

        .auth-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.035);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: fadeUp 0.4s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .auth-logo-ring {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(24,95,165,0.15);
          border: 0.5px solid rgba(55,138,221,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          font-size: 24px;
        }

        .auth-title {
          font-size: 20px;
          font-weight: 500;
          color: #f0f0f0;
          text-align: center;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .auth-badge {
          display: inline-block;
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          padding: 2px 7px;
          border-radius: 20px;
          background: rgba(24,95,165,0.25);
          border: 0.5px solid rgba(55,138,221,0.35);
          color: #85B7EB;
          vertical-align: middle;
          margin-left: 7px;
          letter-spacing: 0.04em;
        }

        .auth-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .tab-row {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 3px;
          gap: 3px;
          margin-bottom: 1.75rem;
        }

        .tab-btn {
          flex: 1;
          padding: 7px;
          text-align: center;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,0.4);
          border-radius: 8px;
          cursor: pointer;
          border: none;
          background: transparent;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .tab-btn.active {
          background: rgba(255,255,255,0.08);
          color: #f0f0f0;
          font-weight: 500;
          border: 0.5px solid rgba(255,255,255,0.12);
        }

        .tab-btn:hover:not(.active) {
          color: rgba(255,255,255,0.65);
        }

        .field {
          margin-bottom: 12px;
        }

        .field label {
          display: block;
          font-size: 11.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          margin-bottom: 5px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .field-inner {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 15px;
          color: rgba(255,255,255,0.25);
          pointer-events: none;
          line-height: 1;
        }

        .field input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          font-size: 14px;
          background: rgba(255,255,255,0.05);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          color: #f0f0f0;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s, background 0.15s;
        }

        .field input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .field input:focus {
          border-color: rgba(55,138,221,0.6);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(24,95,165,0.2);
        }

        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }

        .strength-seg {
          flex: 1;
          height: 2px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
        }

        .strength-label {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
          height: 14px;
          transition: color 0.3s;
        }

        .btn-primary {
          width: 100%;
          padding: 11px;
          background: #185FA5;
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          transition: opacity 0.15s, transform 0.1s;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.88;
        }

        .btn-primary:active:not(:disabled) {
          transform: scale(0.99);
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1.25rem 0;
        }

        .divider span {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          white-space: nowrap;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 0.5px;
          background: rgba(255,255,255,0.1);
        }

        .social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
        }

        .btn-social:hover {
          background: rgba(255,255,255,0.08);
          color: #f0f0f0;
        }

        .btn-social i {
          font-size: 16px;
        }

        .forgot-link {
          display: block;
          text-align: right;
          font-size: 12px;
          color: rgba(55,138,221,0.8);
          margin-top: -6px;
          margin-bottom: 12px;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }

        .forgot-link:hover {
          color: #85B7EB;
          text-decoration: underline;
        }

        .footer-links {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        .footer-links button {
          color: #378ADD;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .footer-links button:hover {
          color: #85B7EB;
          text-decoration: underline;
        }

        .forgot-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 1.25rem;
          line-height: 1.65;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow" />

        <div className="lang-corner">
          <LanguageSwitcher />
        </div>

        <div className="auth-card">
          <div className="auth-logo-ring">⚽</div>

          <h1 className="auth-title">
            {t("app.name")}
            <span className="auth-badge">2026</span>
          </h1>
          <p className="auth-sub">
            {mode === "login"
              ? t("auth.signIn")
              : mode === "signup"
              ? t("auth.signUp")
              : t("auth.reset")}
          </p>

          {/* Tab switcher — alleen voor login / signup */}
          {mode !== "forgot" && (
            <div className="tab-row">
              <button
                className={`tab-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => setMode("login")}
                type="button"
              >
                {t("auth.signInBtn")}
              </button>
              <button
                className={`tab-btn ${mode === "signup" ? "active" : ""}`}
                onClick={() => setMode("signup")}
                type="button"
              >
                {t("auth.createAccount")}
              </button>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>{t("auth.email")}</label>
                <div className="field-inner">
                  <i className="ti ti-mail field-icon" aria-hidden="true" />
                  <input
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>{t("auth.password")}</label>
                <div className="field-inner">
                  <i className="ti ti-lock field-icon" aria-hidden="true" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <button
                type="button"
                className="forgot-link"
                onClick={() => setMode("forgot")}
              >
                {t("auth.forgotPassword")}
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "..." : t("auth.signInBtn")}
              </button>
              <div className="divider"><span>of ga verder met</span></div>
              <div className="social-row">
                <button type="button" className="btn-social">
                  <i className="ti ti-brand-google" aria-hidden="true" />
                  Google
                </button>
                <button type="button" className="btn-social">
                  <i className="ti ti-brand-apple" aria-hidden="true" />
                  Apple
                </button>
              </div>
            </form>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup}>
              <div className="field">
                <label>{t("auth.displayName")}</label>
                <div className="field-inner">
                  <i className="ti ti-user field-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Kies een naam"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>{t("auth.email")}</label>
                <div className="field-inner">
                  <i className="ti ti-mail field-icon" aria-hidden="true" />
                  <input
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>{t("auth.password")}</label>
                <div className="field-inner">
                  <i className="ti ti-lock field-icon" aria-hidden="true" />
                  <input
                    type="password"
                    placeholder="Minimaal 6 tekens"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      calcStrength(e.target.value);
                    }}
                    required
                    minLength={6}
                  />
                </div>
                {password.length > 0 && (
                  <>
                    <div className="strength-bar">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="strength-seg"
                          style={{
                            background: i < pwStrength
                              ? strengthColors[pwStrength - 1]
                              : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="strength-label"
                      style={{ color: pwStrength > 0 ? strengthColors[pwStrength - 1] : undefined }}
                    >
                      {strengthLabels[pwStrength]}
                    </div>
                  </>
                )}
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
                {loading ? "..." : t("auth.createAccount")}
              </button>
            </form>
          )}

          {/* ── FORGOT ── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgot}>
              <p className="forgot-desc">
                Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
              </p>
              <div className="field">
                <label>{t("auth.email")}</label>
                <div className="field-inner">
                  <i className="ti ti-mail field-icon" aria-hidden="true" />
                  <input
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "..." : t("auth.sendResetLink")}
              </button>
              <div className="footer-links" style={{ marginTop: "1rem" }}>
                <button type="button" onClick={() => setMode("login")}>
                  ← {t("auth.backToSignIn")}
                </button>
              </div>
            </form>
          )}

          {/* Footer navigatie */}
          {mode === "login" && (
            <div className="footer-links">
              {t("auth.noAccount")}{" "}
              <button type="button" onClick={() => setMode("signup")}>
                {t("auth.createAccount")}
              </button>
            </div>
          )}
          {mode === "signup" && (
            <div className="footer-links">
              {t("auth.haveAccount")}{" "}
              <button type="button" onClick={() => setMode("login")}>
                {t("auth.signInBtn")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Auth;
