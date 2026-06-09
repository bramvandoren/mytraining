import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useTeams, useDeleteTeam, type Team } from "@/hooks/useTeams";
import { TeamForm } from "@/components/club/TeamForm";

export default function TeamsPage() {
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: teams = [] } = useTeams(active?.id ?? null);
  const del = useDeleteTeam();
  const [editing, setEditing] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);

  if (!active) return <PageShell title="Teams"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Teams" subtitle={`Teams in ${active.name}`}>
      {perms.canEdit && (
        <button onClick={() => setCreating(true)}
          className="mb-4 inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New team
        </button>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No teams yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-lg p-4 relative group">
              <Link to={`/club/teams/${t.id}`} className="block">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: t.color ?? "#16a34a" }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{t.name}</h3>
                    {t.age_category && <p className="text-[11px] text-muted-foreground">{t.age_category}</p>}
                  </div>
                </div>
                {t.notes && <p className="text-xs text-muted-foreground line-clamp-2">{t.notes}</p>}
              </Link>
              {perms.canEdit && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => setEditing(t)} aria-label="Edit"
                    className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={async () => {
                    if (!confirm(`Delete team "${t.name}"?`)) return;
                    try { await del.mutateAsync({ id: t.id, clubId: t.club_id }); toast.success("Deleted"); }
                    catch (e: any) { toast.error(e.message); }
                  }} aria-label="Delete"
                    className="w-7 h-7 rounded-md bg-muted hover:bg-destructive/20 hover:text-destructive flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {creating && <TeamForm clubId={active.id} onClose={() => setCreating(false)} />}
      {editing && <TeamForm clubId={active.id} team={editing} onClose={() => setEditing(null)} />}
    </PageShell>
  );
}
