import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const current = (i18n.resolvedLanguage || i18n.language || "nl").slice(0, 2);
  const next = current === "nl" ? "en" : "nl";

  const handleChange = async () => {
    await i18n.changeLanguage(next);
    if (user) {
      // Fire-and-forget persistence to profile
      supabase.from("profiles").update({ locale: next } as any).eq("id", user.id).then(() => {});
    }
  };

  return (
    <button
      onClick={handleChange}
      title={`Switch to ${next.toUpperCase()}`}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Languages className="w-3.5 h-3.5" />
      {!compact && <span className="uppercase">{current}</span>}
      {compact && <span className="uppercase font-mono">{current}</span>}
    </button>
  );
}
