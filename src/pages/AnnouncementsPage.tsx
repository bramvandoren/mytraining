import { useState } from "react";
import { Megaphone, Pin, PinOff, Pencil, Trash2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useAnnouncements, useUpdateAnnouncement, useDeleteAnnouncement, type Announcement } from "@/hooks/useAnnouncements";
import { AnnouncementForm } from "@/components/club/AnnouncementForm";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: announcements = [], isLoading } = useAnnouncements(active?.id ?? null);
  const update = useUpdateAnnouncement();
  const remove = useDeleteAnnouncement();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  if (!active) return <PageShell title="Announcements"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  async function handleTogglePin(a: Announcement) {
    try {
      await update.mutateAsync({ id: a.id, pinned: !a.pinned });
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(a: Announcement) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    try {
      await remove.mutateAsync({ id: a.id, clubId: active!.id });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const pinned = announcements.filter((a) => a.pinned);
  const unpinned = announcements.filter((a) => !a.pinned);

  return (
    <PageShell title="Announcements" subtitle="Club and team communications">
      {perms.canCreate && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <Megaphone className="w-10 h-10 opacity-30" />
          <p className="text-sm">No announcements yet.</p>
          {perms.canCreate && (
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="mt-2 inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm text-foreground"
            >
              <Plus className="w-4 h-4" /> Create first announcement
            </button>
          )}
        </div>
      )}

      {pinned.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
            <Pin className="w-3 h-3" /> Pinned
          </h2>
          <div className="space-y-3">
            {pinned.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                canManage={perms.canCreate}
                onPin={handleTogglePin}
                onEdit={() => { setEditing(a); setFormOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {unpinned.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Recent
            </h2>
          )}
          <div className="space-y-3">
            {unpinned.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                canManage={perms.canCreate}
                onPin={handleTogglePin}
                onEdit={() => { setEditing(a); setFormOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {formOpen && (
        <AnnouncementForm
          clubId={active.id}
          existing={editing ?? undefined}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </PageShell>
  );
}

function AnnouncementCard({
  announcement: a,
  canManage,
  onPin,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  canManage: boolean;
  onPin: (a: Announcement) => void;
  onEdit: () => void;
  onDelete: (a: Announcement) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-sm">{a.title}</h3>
            {a.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{a.body}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(parseISO(a.created_at), "d MMM yyyy · HH:mm")}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onPin(a)}
              title={a.pinned ? "Unpin" : "Pin"}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
            >
              {a.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onEdit}
              title="Edit"
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(a)}
              title="Delete"
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
