import { useState } from "react";
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
        toast.success("Announcement updated");
      } else {
        await create.mutateAsync({
          club_id: clubId,
          title: title.trim(),
          body: body.trim(),
          team_id: teamId || null,
          pinned,
        });
        toast.success("Announcement posted");
      }
      onClose();
    } catch {
      toast.error("Failed to save announcement");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-lg mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{isEdit ? "Edit Announcement" : "New Announcement"}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title…"
              required
              className="w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement…"
              required
              rows={4}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {teams.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Audience (optional)
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Entire club</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
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
            <span className="text-sm">Pin this announcement</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 h-9 rounded-md border border-border text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !body.trim()}
              className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : isEdit ? "Update" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
