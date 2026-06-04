import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AuroraBackground } from "@/components/AuroraBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ArrowRight, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t("auth.passwordTooShort")); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success(t("auth.passwordUpdated"));
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <AuroraBackground className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 z-20 flex gap-1">
        <ThemeToggle compact />
        <LanguageSwitcher compact />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <span className="text-2xl">⚽</span>
          <span className="font-semibold tracking-tight">{t("app.name")}</span>
        </Link>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 sm:p-8 shadow-card-hover">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.setNewPassword")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.setNewPasswordSub")}</p>

          <form onSubmit={handleSubmit} className="space-y-3 mt-5">
            <label htmlFor="new-pw" className="block">
              <span className="text-xs font-medium text-foreground/80">{t("auth.newPassword")}</span>
              <input
                id="new-pw"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full h-10 px-3 text-sm bg-background border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/60"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-95 disabled:opacity-50 shadow-glow flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>{t("auth.updatePassword")} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default ResetPassword;
