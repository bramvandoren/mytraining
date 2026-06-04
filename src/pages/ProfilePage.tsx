import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { uploadAvatar } from "@/lib/avatarUpload";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Camera, Loader2, Lock, LogOut, Mail, Trash2, User as UserIcon } from "lucide-react";

interface ProfileRow {
  display_name: string;
  username: string;
  avatar_url: string | null;
  locale: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url, locale")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data as any);
        setDisplayName((data as any).display_name ?? "");
      }
      setEmail(user.email ?? "");
      setLoading(false);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <PageShell title={t("profile.title")}>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </PageShell>
    );
  }

  const initials = (profile?.display_name || profile?.username || user.email || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const handleAvatarPick = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarBusy(true);
    try {
      const url = await uploadAvatar(user.id, file);
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      toast.success(t("profile.avatarUpdated"));
    } catch (err: any) {
      toast.error(err?.message || t("profile.avatarFailed"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url) return;
    setAvatarBusy(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      setProfile({ ...profile, avatar_url: null });
      toast.success(t("profile.avatarRemoved"));
    }
    setAvatarBusy(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = displayName.trim();
    if (v.length < 2) { toast.error(t("auth.nameTooShort")); return; }
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ display_name: v }).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      setProfile((p) => (p ? { ...p, display_name: v } : p));
      toast.success(t("profile.saved"));
    }
    setSavingName(false);
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || email === user.email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast.error(error.message);
    else toast.success(t("profile.emailConfirmSent"));
    setSavingEmail(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error(t("auth.passwordTooShort")); return; }
    if (newPw !== confirmPw) { toast.error(t("profile.passwordsDontMatch")); return; }
    setSavingPw(true);
    // Re-authenticate with current password before changing
    const { error: reAuthErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPw,
    });
    if (reAuthErr) {
      toast.error(t("profile.currentPasswordWrong"));
      setSavingPw(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else {
      toast.success(t("profile.passwordChanged"));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
    setSavingPw(false);
  };

  return (
    <PageShell title={t("profile.title")} subtitle={t("profile.subtitle")}>
      <div className="space-y-6">
        {/* Identity card */}
        <Section>
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold overflow-hidden shadow-glow">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarPick}
                disabled={avatarBusy}
                aria-label={t("profile.changeAvatar")}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 disabled:opacity-50"
              >
                {avatarBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate">{profile?.display_name}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">@{profile?.username}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarBusy}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  {t("profile.removeAvatar")}
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Username (read-only) + Display name */}
        <Section title={t("profile.identity")} icon={UserIcon}>
          <div className="space-y-4">
            <FieldRow label={t("auth.username")} hint={t("profile.usernameLocked")}>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.username ?? ""}
                  disabled
                  readOnly
                  className="w-full h-10 px-3 pr-9 text-sm bg-muted/60 border border-border rounded-lg text-muted-foreground cursor-not-allowed font-mono"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </FieldRow>

            <form onSubmit={handleSaveName} className="space-y-2">
              <FieldRow label={t("auth.displayName")}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  minLength={2}
                  maxLength={60}
                  className="w-full h-10 px-3 text-sm bg-background border border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </FieldRow>
              <div className="flex justify-end">
                <PrimaryButton type="submit" loading={savingName} disabled={!displayName.trim() || displayName.trim() === profile?.display_name}>
                  {t("common.save")}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </Section>

        {/* Email */}
        <Section title={t("profile.emailSection")} icon={Mail}>
          <form onSubmit={handleSaveEmail} className="space-y-3">
            <FieldRow label={t("auth.email")} hint={t("profile.emailHint")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </FieldRow>
            <div className="flex justify-end">
              <PrimaryButton type="submit" loading={savingEmail} disabled={!email || email === user.email}>
                {t("profile.updateEmail")}
              </PrimaryButton>
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section title={t("profile.passwordSection")} icon={Lock}>
          <form onSubmit={handleSavePassword} className="space-y-3">
            <FieldRow label={t("profile.currentPassword")}>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </FieldRow>
            <FieldRow label={t("auth.newPassword")}>
              <input
                type="password"
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={6}
                required
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </FieldRow>
            <FieldRow label={t("profile.confirmPassword")}>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                minLength={6}
                required
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </FieldRow>
            <div className="flex justify-end">
              <PrimaryButton type="submit" loading={savingPw}>
                {t("profile.changePassword")}
              </PrimaryButton>
            </div>
          </form>
        </Section>

        {/* Danger / Sign out */}
        <Section>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("profile.signOutHere")}</p>
              <p className="text-xs text-muted-foreground">{t("profile.signOutHint")}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
            >
              <LogOut className="w-4 h-4" />
              {t("common.signOut")}
            </button>
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ title, icon: Icon, children }: { title?: string; icon?: any; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-card">
      {title && (
        <header className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </header>
      )}
      {children}
    </section>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="text-xs font-medium text-foreground/80">{label}</span>
        <div className="mt-1">{children}</div>
      </label>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PrimaryButton({
  loading, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className="h-9 px-4 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-glow"
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
