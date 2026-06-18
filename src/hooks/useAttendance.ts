import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AttendanceStatus = "present" | "absent" | "injured" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  scheduled_training_id: string;
  player_id: string;
  status: AttendanceStatus;
  note: string | null;
  marked_by: string;
  created_at: string;
  updated_at: string;
}

export function useAttendance(scheduledId: string | null) {
  return useQuery({
    queryKey: ["attendance", scheduledId],
    enabled: !!scheduledId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records" as any)
        .select("*")
        .eq("scheduled_training_id", scheduledId!);
      if (error) throw error;
      return (data ?? []) as unknown as AttendanceRecord[];
    },
  });
}

export function useUpsertAttendance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      scheduledId: string;
      playerId: string;
      status: AttendanceStatus;
      note?: string | null;
    }) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("attendance_records" as any)
        .upsert(
          {
            scheduled_training_id: input.scheduledId,
            player_id: input.playerId,
            status: input.status,
            note: input.note ?? null,
            marked_by: user.id,
          } as any,
          { onConflict: "scheduled_training_id,player_id" } as any,
        );
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["attendance", v.scheduledId] }),
  });
}

export function usePlayerAttendance(playerId: string | null) {
  return useQuery({
    queryKey: ["player_attendance", playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records" as any)
        .select("*, scheduled_trainings!inner(scheduled_date, session_id)")
        .eq("player_id", playerId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export interface ClubAttendanceRow {
  id: string;
  player_id: string;
  player_name: string;
  team_id: string | null;
  status: AttendanceStatus;
  note: string | null;
  scheduled_date: string | null;
  session_name: string | null;
}

export async function fetchClubAttendance(clubId: string, opts?: { dateFrom?: string; dateTo?: string }) {
  const { data: players, error: pErr } = await supabase
    .from("players_view" as any)
    .select("id, first_name, last_name, current_team_id")
    .eq("club_id", clubId);
  if (pErr) throw pErr;
  const playerMap = new Map((players ?? []).map((p: any) => [p.id, p]));
  const ids = (players ?? []).map((p: any) => p.id);
  if (ids.length === 0) return [] as ClubAttendanceRow[];

  let q = supabase
    .from("attendance_records" as any)
    .select("id, player_id, status, note, scheduled_trainings!inner(scheduled_date, training_sessions(name))")
    .in("player_id", ids);
  if (opts?.dateFrom) q = q.gte("scheduled_trainings.scheduled_date", opts.dateFrom);
  if (opts?.dateTo) q = q.lte("scheduled_trainings.scheduled_date", opts.dateTo);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any): ClubAttendanceRow => {
    const p = playerMap.get(r.player_id);
    return {
      id: r.id,
      player_id: r.player_id,
      player_name: p ? `${p.first_name} ${p.last_name}` : "Unknown",
      team_id: p?.current_team_id ?? null,
      status: r.status,
      note: r.note,
      scheduled_date: r.scheduled_trainings?.scheduled_date ?? null,
      session_name: r.scheduled_trainings?.training_sessions?.name ?? null,
    };
  });
}

export const STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; ring: string }
> = {
  present: { label: "Present", color: "bg-emerald-500 text-white", ring: "ring-emerald-500" },
  absent: { label: "Absent", color: "bg-rose-500 text-white", ring: "ring-rose-500" },
  injured: { label: "Injured", color: "bg-amber-500 text-white", ring: "ring-amber-500" },
  late: { label: "Late", color: "bg-sky-500 text-white", ring: "ring-sky-500" },
  excused: { label: "Excused", color: "bg-violet-500 text-white", ring: "ring-violet-500" },
};
