import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AvailabilityStatus = "available" | "unavailable" | "unsure" | "injured";

export interface AvailabilityRecord {
  id: string;
  club_id: string;
  event_type: string;
  event_id: string;
  player_id: string;
  status: AvailabilityStatus;
  note: string | null;
  requested_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export const AVAILABILITY_STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: "Available",
  unavailable: "Unavailable",
  unsure: "Unsure",
  injured: "Injured",
};

export const AVAILABILITY_STATUS_COLOR: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-500 text-white",
  unavailable: "bg-rose-500 text-white",
  unsure: "bg-amber-500 text-white",
  injured: "bg-orange-500 text-white",
};

export const AVAILABILITY_STATUS_ICON: Record<AvailabilityStatus, string> = {
  available: "✓",
  unavailable: "✗",
  unsure: "?",
  injured: "⚕",
};

export function useAvailability(eventType: string, eventId: string | null) {
  return useQuery({
    queryKey: ["availability", eventType, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_records" as any)
        .select("*")
        .eq("event_type", eventType)
        .eq("event_id", eventId!);
      if (error) throw error;
      return (data ?? []) as unknown as AvailabilityRecord[];
    },
  });
}

export function useUpsertAvailability() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      club_id: string;
      event_type: string;
      event_id: string;
      player_id: string;
      status: AvailabilityStatus;
      note?: string;
    }) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("availability_records" as any)
        .upsert(
          { ...input, responded_at: new Date().toISOString() } as any,
          { onConflict: "event_type,event_id,player_id" } as any,
        );
      if (error) throw error;
    },
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ["availability", v.event_type, v.event_id] }),
  });
}

export function useRequestAvailability() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      club_id: string;
      event_type: string;
      event_id: string;
      player_ids: string[];
    }) => {
      if (!user) throw new Error("Not authed");
      const records = input.player_ids.map((pid) => ({
        club_id: input.club_id,
        event_type: input.event_type,
        event_id: input.event_id,
        player_id: pid,
        status: "unsure" as AvailabilityStatus,
        requested_by: user.id,
      }));
      const { error } = await supabase
        .from("availability_records" as any)
        .upsert(records as any, { onConflict: "event_type,event_id,player_id", ignoreDuplicates: true } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ["availability", v.event_type, v.event_id] }),
  });
}

export function useDeleteAvailabilityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventType, eventId }: { id: string; eventType: string; eventId: string }) => {
      const { error } = await supabase
        .from("availability_records" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ["availability", v.eventType, v.eventId] }),
  });
}
