import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Player, PlayerFoot, PlayerPosition, POSITION_LABEL,
  useCreatePlayer, useUpdatePlayer,
} from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { useClubPermissions } from "@/hooks/useClubs";

const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(60),
  last_name: z.string().trim().min(1, "Required").max(60),
  birth_date: z.string().optional().nullable(),
  nationality: z.string().max(50).optional().nullable(),
  jersey_number: z.number().int().min(0).max(999).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  emergency_contact: z.string().max(200).optional().nullable(),
  parent_contact: z.string().max(200).optional().nullable(),
  medical_notes: z.string().max(2000).optional().nullable(),
});

export function PlayerForm({
  clubId,
  player,
  defaultTeamId,
  onClose,
}: {
  clubId: string;
  player?: Player;
  defaultTeamId?: string;
  onClose: () => void;
}) {
  const create = useCreatePlayer();
  const update = useUpdatePlayer();
  const { data: teams = [] } = useTeams(clubId);
  const perms = useClubPermissions(clubId);
  const canSeeSensitive = perms.isAdmin;

  const [form, setForm] = useState({
    first_name: player?.first_name ?? "",
    last_name: player?.last_name ?? "",
    birth_date: player?.birth_date ?? "",
    nationality: player?.nationality ?? "",
    preferred_foot: (player?.preferred_foot ?? "") as PlayerFoot | "",
    position: (player?.position ?? "") as PlayerPosition | "",
    jersey_number: player?.jersey_number?.toString() ?? "",
    notes: player?.notes ?? "",
    emergency_contact: player?.emergency_contact ?? "",
    parent_contact: player?.parent_contact ?? "",
    medical_notes: player?.medical_notes ?? "",
    team_id: player?.current_team_id ?? defaultTeamId ?? "",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      first_name: form.first_name,
      last_name: form.last_name,
      birth_date: form.birth_date || null,
      nationality: form.nationality || null,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      notes: form.notes || null,
      emergency_contact: form.emergency_contact || null,
      parent_contact: form.parent_contact || null,
      medical_notes: form.medical_notes || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const payload = {
      ...parsed.data,
      preferred_foot: (form.preferred_foot || null) as PlayerFoot | null,
      position: (form.position || null) as PlayerPosition | null,
    };
    try {
      if (player) {
        await update.mutateAsync({ id: player.id, ...payload });
        toast.success("Player updated");
      } else {
        await create.mutateAsync({
          ...payload,
          first_name: form.first_name,
          last_name: form.last_name,
          club_id: clubId,
          team_id: form.team_id || null,
        } as any);
        toast.success("Player added");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-background border border-border rounded-t-xl sm:rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold">{player ? "Edit player" : "Add player"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *">
              <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" />
            </Field>
            <Field label="Last name *">
              <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" />
            </Field>
            <Field label="Birth date">
              <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="input" />
            </Field>
            <Field label="Nationality">
              <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="input" />
            </Field>
            <Field label="Position">
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as PlayerPosition })} className="input">
                <option value="">—</option>
                {(["gk", "def", "mid", "fwd"] as PlayerPosition[]).map((p) => (
                  <option key={p} value={p}>{POSITION_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="Preferred foot">
              <select value={form.preferred_foot} onChange={(e) => setForm({ ...form, preferred_foot: e.target.value as PlayerFoot })} className="input">
                <option value="">—</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </Field>
            <Field label="Jersey number">
              <input type="number" min={0} max={999} value={form.jersey_number} onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} className="input" />
            </Field>
            {!player && (
              <Field label="Team">
                <select value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })} className="input">
                  <option value="">— No team —</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[60px]" />
          </Field>

          {canSeeSensitive ? (
            <div className="space-y-3 rounded-md border border-dashed border-border p-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Restricted info · admins &amp; head coach only
              </p>
              <Field label="Emergency contact">
                <input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} className="input" />
              </Field>
              <Field label="Parent contact">
                <input value={form.parent_contact} onChange={(e) => setForm({ ...form, parent_contact: e.target.value })} className="input" />
              </Field>
              <Field label="Medical notes">
                <textarea value={form.medical_notes} onChange={(e) => setForm({ ...form, medical_notes: e.target.value })} className="input min-h-[60px]" />
              </Field>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Emergency, parent and medical info can only be edited by club admins.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 h-9 rounded-md text-sm border border-border hover:bg-muted">Cancel</button>
            <button type="submit" disabled={create.isPending || update.isPending}
              className="px-4 h-9 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
              {player ? "Save" : "Add player"}
            </button>
          </div>
        </form>
      </motion.div>

      <style>{`
        .input { width: 100%; padding: 0.5rem 0.625rem; border-radius: 0.375rem; background: hsl(var(--background)); border: 1px solid hsl(var(--border)); font-size: 0.875rem; outline: none; }
        .input:focus { border-color: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
