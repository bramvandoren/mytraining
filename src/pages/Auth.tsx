import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Auth = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">⚽</span>
          <h1 className="text-xl font-semibold text-foreground tracking-tight mt-3">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? t("auth.signIn") : mode === "signup" ? t("auth.signUp") : t("auth.reset")}
          </p>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder={t("auth.displayName")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
          )}
          <input
            type="email"
            placeholder={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "..." : mode === "login" ? t("auth.signInBtn") : mode === "signup" ? t("auth.createAccount") : t("auth.sendResetLink")}
          </button>
        </form>

        <div className="mt-4 text-center space-y-1">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t("auth.forgotPassword")}
              </button>
              <p className="text-xs text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                  {t("auth.createAccount")}
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">
              {t("auth.haveAccount")}{" "}
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                {t("auth.signInBtn")}
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="text-xs text-primary font-medium hover:underline">
              {t("auth.backToSignIn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
