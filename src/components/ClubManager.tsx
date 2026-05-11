import { useState } from "react";
import { useClubs, useActiveClub, useClubMembers, useCreateClub, useAddMember, useRemoveMember } from "@/hooks/useClubs";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { Plus, Users, Shield, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

export function ClubManager() {
  const { user } = useAuth();
  const { data: clubs = [] } = useClubs();
  const { active, activeId, setActiveId } = useActiveClub();
  const { data: members = [] } = useClubMembers(activeId);
  const memberIds = members.map((m) => m.user_id);
  const { data: profiles = {} } = useProfiles(memberIds);

  const createClub = useCreateClub();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const [newClubName, setNewClubName] = useState("");
  const [newMember, setNewMember] = useState("");

  const isAdmin = active && members.some((m) => m.user_id === user?.id && m.role === "admin");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg tracking-tight flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5" /> Your Clubs
        </h2>
        <div className="flex flex-wrap gap-2">
          {clubs.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`px-3 py-1.5 rounded-sm text-sm transition-all ${
                activeId === c.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              {c.name} {c.is_personal && <span className="text-[10px] opacity-60 ml-1">personal</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={newClubName} onChange={(e) => setNewClubName(e.target.value)}
            placeholder="New club name..." className="flex-1 px-3 py-2 text-sm bg-muted rounded-md outline-none" />
          <button onClick={async () => {
            if (!newClubName.trim()) return;
            try { await createClub.mutateAsync(newClubName.trim()); setNewClubName(""); toast.success("Club created"); }
            catch (e: any) { toast.error(e.message); }
          }} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>

      {active && (
        <div>
          <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" /> Members of {active.name}
          </h3>
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between bg-card shadow-card rounded-md px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  {m.role === "admin" && <Shield className="w-3.5 h-3.5 text-primary" />}
                  <span className="text-foreground">{profiles[m.user_id]?.display_name ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
                </div>
                {isAdmin && m.user_id !== user?.id && (
                  <button onClick={() => removeMember.mutate({ clubId: active.id, userId: m.user_id })}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isAdmin && !active.is_personal && (
            <div className="flex gap-2 mt-3">
              <input value={newMember} onChange={(e) => setNewMember(e.target.value)}
                placeholder="Add by display name..." className="flex-1 px-3 py-2 text-sm bg-muted rounded-md outline-none" />
              <button onClick={async () => {
                if (!newMember.trim()) return;
                try { await addMember.mutateAsync({ clubId: active.id, displayName: newMember.trim(), role: "coach" }); setNewMember(""); toast.success("Member added"); }
                catch (e: any) { toast.error(e.message); }
              }} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
