import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Pin } from "lucide-react";
import { useCreateAnnouncement, useUpdateAnnouncement, type Announcement } from "@/hooks/useAnnouncements";
import { useTeams } from "@/hooks/useTeams";
import { toast } from "sonner";

interface Props {
  clubId: string;
  existing?: Announcement;
  onClose: () => void;
}

export function AnnouncementForm({ clubId, existing, onClose }: Props) {
  const { t } = useTranslation();
  const { data: teams = [] } = useTeams(clubId);
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [teamId, setTeamId] = useState(existing?.team_id ?? "");
  const [pinned, setPinned] = useState(existing?.pinned ?? false);

  const isEdit = !!existing;
  const isPending = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: existing.id,
          title: title.trim(),
          body: body.trim(),
          team_id: teamId || null,
          pinned,
        });
        toast.success(t("announcements.updated"));
      } else {
        await create.mutateAsync({
          club_id: clubId,
          title: title.trim(),
          body: body.trim(),
          team_id: teamId || null,
          pinned,
        });
        toast.success(t("announcements.posted"));
      }
      onClose();
    } catch {
      toast.error(t("announcements.saveFailed"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-lg mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{isEdit ? t("announcements.editTitle") : t("announcements.postTitle")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("announcements.titleLabel")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("announcements.titlePlaceholder")}
              required
              className="w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("announcements.messageLabel")}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("announcements.messagePlaceholder")}
              required
              rows={4}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {teams.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("announcements.audienceLabel")}
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("announcements.entireClub")}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded border-border"
            />
            <Pin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm">{t("announcements.pinLabel")}</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 h-9 rounded-md border border-border text-sm hover:bg-muted"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !body.trim()}
              className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? t("announcements.saving") : isEdit ? t("announcements.update") : t("announcements.post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
