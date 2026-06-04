import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Loader2, ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else navigate("/");
    setLoading(false);
  };

  const validateUsername = (v: string) => /^[a-z0-9_]{3,20}$/.test(v);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t("auth.passwordTooShort")); return; }
    const uname = username.trim().toLowerCase();
    if (!validateUsername(uname)) { toast.error(t("auth.usernameInvalid")); return; }
    const chosenName = displayName.trim() || uname;
    if (chosenName.length < 2) { toast.error(t("auth.nameTooShort")); return; }
    setLoading(true);
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .maybeSingle();
    if (existing) {
      toast.error(t("auth.usernameTaken"));
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: chosenName, username: uname },
        emailRedirectTo: `${window.location.origin}/`,
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

  const heading =
    mode === "login" ? t("auth.welcomeBack") : mode === "signup" ? t("auth.joinThePitch") : t("auth.reset");
  const sub =
    mode === "login" ? t("auth.signInSub") : mode === "signup" ? t("auth.signUpSub") : t("auth.resetSub");

  return (
    <AuroraBackground className="min-h-screen w-screen overflow-x-hidden">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
        <ThemeToggle compact />
        <LanguageSwitcher compact />
      </div>

      {/* Gecorrigeerde flex-container die de volledige breedte opeist */}
      <div className="flex flex-col lg:flex-row w-full min-h-screen">
        
        {/* Left brand panel — Neemt nu strak 45% van het scherm in op desktop */}
        <aside className="hidden lg:flex lg:w-[45%] xl:w-[48%] p-12 flex-col justify-between relative z-10 box-border">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-2xl">⚽</span>
            <span className="font-semibold tracking-tight text-foreground">{t("app.name")}</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.1] text-foreground">
              {t("auth.brandHeadline")}
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {t("auth.brandSub")}
            </p>

            <ul className="mt-8 space-y-3.5">
              {[
                { icon: Sparkles, text: t("auth.benefitGenerator") },
                { icon: Trophy, text: t("auth.benefitMatchday") },
                { icon: ShieldCheck, text: t("auth.benefitPrivate") },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="pt-1">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {t("app.name")}</p>
        </aside>

        {/* Form panel — Neemt de overige 55% van het scherm in op desktop */}
        <main className="flex-1 lg:w-[55%] xl:w-[52%] flex items-center justify-center p-6 relative z-10 box-border">
          <div className="w-full max-w-sm">
            <div className="lg:hidden text-center mb-6">
              <span className="text-3xl">⚽</span>
              <h1 className="text-lg font-semibold mt-2">{t("app.name")}</h1>
            </div>

            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 sm:p-8 shadow-card-hover">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h1>
                <p className="text-sm text-muted-foreground mt-1.5">{sub}</p>
              </div>

              <form
                onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
                className="space-y-3"
              >
                {mode === "signup" && (
                  <>
                    <Field
                      label={t("auth.username")}
                      hint={t("auth.usernameHint")}
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      required
                      minLength={3}
                      maxLength={20}
                      placeholder="coach_42"
                    />
                    <Field
                      label={t("auth.displayName")}
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("auth.displayName")}
                    />
                  </>
                )}
                <Field
                  label={t("auth.email")}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@club.com"
                />
                {mode !== "forgot" && (
                  <Field
                    label={t("auth.password")}
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full h-10 mt-1 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? t("auth.signInBtn") : mode === "signup" ? t("auth.createAccount") : t("auth.sendResetLink")}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center space-y-2 text-sm">
                {mode === "login" && (
                  <>
                    <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {t("auth.forgotPassword")}
                    </button>
                    <p className="text-muted-foreground">
                      {t("auth.noAccount")}{" "}
                      <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                        {t("auth.createAccount")}
                      </button>
                    </p>
                  </>
                )}
                {mode === "signup" && (
                  <p className="text-muted-foreground">
                    {t("auth.haveAccount")}{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                      {t("auth.signInBtn")}
                    </button>
                  </p>
                )}
                {mode === "forgot" && (
                  <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                    {t("auth.backToSignIn")}
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              {t("auth.legal")}
            </p>
          </div>
        </main>
      </div>
    </AuroraBackground>
  );
};

function Field({
  label,
  hint,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = inputProps.id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      <input
        id={id}
        {...inputProps}
        className="mt-1 w-full h-10 px-3 text-sm bg-background border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/60 transition-shadow"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export default Auth;
