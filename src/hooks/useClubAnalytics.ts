import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export interface ClubAnalytics {
  trainingsPerTeam: { team: string; count: number }[];
  attendanceBreakdown: { status: string; value: number }[];
  attendanceTrend: { week: string; rate: number }[];
  topCoaches: { user_id: string; count: number }[];
  topExercises: { id: string; title: string; count: number }[];
  topTemplates: { id: string; name: string; count: number }[];
  attendanceRate: number;
  totalAttendanceRecords: number;
}

export function useClubAnalytics(clubId: string | null) {
  return useQuery({
    queryKey: ["club_analytics", clubId],
    enabled: !!clubId,
    queryFn: async (): Promise<ClubAnalytics> => {
      // Trainings per team
      const { data: teams } = await supabase.from("teams" as any).select("id,name").eq("club_id", clubId!);
      const teamRows = (teams ?? []) as unknown as { id: string; name: string }[];
      const trainingsPerTeam: { team: string; count: number }[] = [];
      for (const t of teamRows) {
        const { count } = await supabase
          .from("training_sessions" as any)
          .select("id", { count: "exact", head: true })
          .eq("team_id", t.id);
        trainingsPerTeam.push({ team: t.name, count: count ?? 0 });
      }

      // Attendance breakdown
      const { data: attRows } = await supabase
        .from("attendance_records" as any)
        .select("status, player_id, players!inner(club_id)")
        .eq("players.club_id", clubId!);
      const breakdownMap: Record<string, number> = {};
      let presentCount = 0;
      (attRows ?? []).forEach((r: any) => {
        breakdownMap[r.status] = (breakdownMap[r.status] ?? 0) + 1;
        if (r.status === "present" || r.status === "late") presentCount++;
      });
      const totalAttendanceRecords = (attRows ?? []).length;
      const attendanceBreakdown = Object.entries(breakdownMap).map(([status, value]) => ({ status, value }));
      const attendanceRate = totalAttendanceRecords ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

      // Attendance trend (last 8 weeks)
      const trend: { week: string; rate: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const end = subDays(new Date(), i * 7);
        const start = subDays(end, 7);
        const { data: weekRows } = await supabase
          .from("attendance_records" as any)
          .select("status, players!inner(club_id)")
          .eq("players.club_id", clubId!)
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString());
        const total = (weekRows ?? []).length;
        const pres = (weekRows ?? []).filter((r: any) => r.status === "present" || r.status === "late").length;
        trend.push({
          week: format(end, "MMM d"),
          rate: total ? Math.round((pres / total) * 100) : 0,
        });
      }

      // Top coaches by activity
      const { data: actRows } = await supabase
        .from("club_activity" as any)
        .select("actor_id")
        .eq("club_id", clubId!)
        .not("actor_id", "is", null);
      const coachMap: Record<string, number> = {};
      (actRows ?? []).forEach((r: any) => {
        if (r.actor_id) coachMap[r.actor_id] = (coachMap[r.actor_id] ?? 0) + 1;
      });
      const topCoaches = Object.entries(coachMap)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top exercises (most used in sessions)
      const { data: sessions } = await supabase
        .from("training_sessions" as any)
        .select("exercises")
        .eq("club_id", clubId!);
      const exerciseMap: Record<string, { title: string; count: number }> = {};
      (sessions ?? []).forEach((s: any) => {
        (s.exercises ?? []).forEach((se: any) => {
          const ex = se.exercise;
          if (!ex?.id) return;
          if (!exerciseMap[ex.id]) exerciseMap[ex.id] = { title: ex.title ?? "Unknown", count: 0 };
          exerciseMap[ex.id].count++;
        });
      });
      const topExercises = Object.entries(exerciseMap)
        .map(([id, v]) => ({ id, title: v.title, count: v.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top templates
      const { data: tpls } = await supabase
        .from("training_templates" as any)
        .select("id,name")
        .eq("club_id", clubId!);
      const topTemplates = ((tpls ?? []) as any[])
        .map((t) => ({ id: t.id as string, name: t.name as string, count: 0 }))
        .slice(0, 5);

      return {
        trainingsPerTeam,
        attendanceBreakdown,
        attendanceTrend: trend,
        topCoaches,
        topExercises,
        topTemplates,
        attendanceRate,
        totalAttendanceRecords,
      };
    },
  });
}
