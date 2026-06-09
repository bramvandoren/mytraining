import { useState } from "react";
import { Shield, Crown, Trash2, UserPlus, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import {
  useActiveClub, useClubMembers, useClubPermissions,
  useRemoveMember, useUpdateMemberRole, type ClubRole,
} from "@/hooks/useClubs";
import { useProfiles } from "@/hooks/useProfiles";
import { useInvitations, useDeleteInvitation } from "@/hooks/useInvitations";
import { InviteDialog } from "@/components/club/InviteDialog";

const ROLE_LABELS: Record<ClubRole, string> = {
  owner: "Owner", admin: "Admin", coach: "Coach", assistant: "Assistant",
};

export default function CoachesPage() {
  const { user } = useAuth();
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: members = [] } = useClubMembers(active?.id ?? null);
  const { data: profiles = {} } = useProfiles(members.map((m) => m.user_id));
  const { data: invitations = [] } = useInvitations(active?.id ?? null);
  const pending = invitations.filter((i) => !i.accepted_at);
  const remove = useRemoveMember();
  const updateRole = useUpdateMemberRole();
  const delInv = useDeleteInvitation();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!active) return <PageShell title="Coaches"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Coaches" subtitle={`Members of ${active.name}`}>
      {perms.canInvite && (
        <button onClick={() => setInviteOpen(true)}
          className="mb-4 inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <UserPlus className="w-4 h-4" /> Invite coach
        </button>
      )}

      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Members</h2>
        <ul className="space-y-1.5">
          {members.map((m) => {
            const p = profiles[m.user_id];
            const isMe = m.user_id === user?.id;
            const isOwnerRow = m.role === "owner";
            return (
              <li key={m.user_id} className="bg-card border border-border rounded-md px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                  {p?.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span>{(p?.display_name ?? "?").slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5">
                    {p?.display_name ?? "Unknown"}
                    {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
                    {isOwnerRow && <Crown className="w-3 h-3 text-amber-500" aria-label="Owner" />}
                  </p>
                  {p?.username && <p className="text-[11px] text-muted-foreground truncate">@{p.username}</p>}
                </div>
                {perms.isOwner && !isOwnerRow ? (
                  <select value={m.role}
                    onChange={async (e) => {
                      try { await updateRole.mutateAsync({ clubId: active.id, userId: m.user_id, role: e.target.value as ClubRole }); toast.success("Role updated"); }
                      catch (err: any) { toast.error(err.message); }
                    }}
                    className="text-xs bg-muted rounded-md px-2 py-1 outline-none">
                    <option value="admin">Admin</option>
                    <option value="coach">Coach</option>
                    <option value="assistant">Assistant</option>
                  </select>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                    <Shield className="w-3 h-3" /> {ROLE_LABELS[m.role]}
                  </span>
                )}
                {perms.canEdit && !isOwnerRow && !isMe && (
                  <button onClick={async () => {
                    if (!confirm("Remove this coach from the club?")) return;
                    try { await remove.mutateAsync({ clubId: active.id, userId: m.user_id }); toast.success("Removed"); }
                    catch (e: any) { toast.error(e.message); }
                  }} aria-label="Remove"
                    className="w-8 h-8 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {perms.canInvite && pending.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pending invitations</h2>
          <ul className="space-y-1.5">
            {pending.map((inv) => (
              <li key={inv.id} className="bg-card border border-border rounded-md px-3 py-2.5 flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">Invited as {ROLE_LABELS[inv.role]} · expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                </div>
                <button onClick={async () => {
                  try { await navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`); toast.success("Link copied"); }
                  catch { toast.error("Could not copy"); }
                }}
                  className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70">Copy link</button>
                <button onClick={async () => {
                  try { await delInv.mutateAsync({ id: inv.id, clubId: active.id }); toast.success("Cancelled"); }
                  catch (e: any) { toast.error(e.message); }
                }} aria-label="Cancel invitation"
                  className="w-8 h-8 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {inviteOpen && <InviteDialog clubId={active.id} onClose={() => setInviteOpen(false)} />}
    </PageShell>
  );
}
