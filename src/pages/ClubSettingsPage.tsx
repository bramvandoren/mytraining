import { useEffect, useRef, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions, useUpdateClub, useUpdateClubLogo } from "@/hooks/useClubs";
import { getMediaSignedUrl } from "@/hooks/useClubMedia";

export default function ClubSettingsPage() {
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const updateClub = useUpdateClub();
  const updateLogo = useUpdateClubLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(active?.name ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    setName(active?.name ?? "");
  }, [active?.id, active?.name]);

  useEffect(() => {
    let cancelled = false;
    if (active?.logo_storage_path) {
      getMediaSignedUrl(active.logo_storage_path)
        .then((url) => { if (!cancelled) setLogoUrl(url); })
        .catch(() => { if (!cancelled) setLogoUrl(null); });
    } else {
      setLogoUrl(null);
    }
    return () => { cancelled = true; };
  }, [active?.logo_storage_path]);

  if (!active) return <PageShell title="Club Settings"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  if (!perms.isOwner) {
    return (
      <PageShell title="Club Settings">
        <p className="text-sm text-muted-foreground">Only the club owner can change these settings.</p>
      </PageShell>
    );
  }

  async function handleSaveName() {
    if (!name.trim() || name.trim() === active!.name) return;
    try {
      await updateClub.mutateAsync({ id: active!.id, name: name.trim() });
      toast.success("Club name updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update club name");
    }
  }

  async function handleLogoFile(file: File) {
    try {
      await updateLogo.mutateAsync({ clubId: active!.id, file });
      toast.success("Logo updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to upload logo");
    }
  }

  async function handleRemoveLogo() {
    try {
      await updateLogo.mutateAsync({ clubId: active!.id, file: null });
      toast.success("Logo removed");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to remove logo");
    }
  }

  return (
    <PageShell title="Club Settings" subtitle="Branding used across the club, including exports">
      <div className="max-w-lg space-y-6">
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Club name</h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSaveName}
              disabled={updateClub.isPending || !name.trim() || name.trim() === active.name}
              className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Club logo</h2>
          <p className="text-xs text-muted-foreground mb-3">Shown on PDF and Excel exports from the Export Center.</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Club logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoFile(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={updateLogo.isPending}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> {logoUrl ? "Replace logo" : "Upload logo"}
              </button>
              {logoUrl && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={updateLogo.isPending}
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm text-rose-500 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Remove logo
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
