import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  useMatchLineup, useSaveLineup, useMatchSquad,
  FORMATIONS, type PitchPosition,
} from "@/hooks/useMatches";
import { usePlayers, useTeamRoster, type Player } from "@/hooks/usePlayers";

const FORMATION_NAMES = Object.keys(FORMATIONS);

export function LineupEditor({ matchId, clubId, teamId, canEdit }: { matchId: string; clubId: string; teamId: string | null; canEdit: boolean }) {
  const { data: lineup } = useMatchLineup(matchId);
  const { data: squad = [] } = useMatchSquad(matchId);
  const { data: roster = [] } = useTeamRoster(teamId);
  const { data: all = [] } = usePlayers(clubId);
  const save = useSaveLineup();
  const svgRef = useRef<SVGSVGElement>(null);

  const players: Player[] = teamId ? roster : all;
  const playerById = useMemo(() => {
    const m = new Map<string, Player>();
    players.forEach((p) => m.set(p.id, p));
    return m;
  }, [players]);

  // squad → eligible for the pitch (selected); rest go to a "available" pool
  const selectedIds = useMemo(() => new Set(squad.filter((s) => s.status === "selected").map((s) => s.player_id)), [squad]);

  const [formation, setFormation] = useState<string>(lineup?.formation ?? "4-3-3");
  const [positions, setPositions] = useState<PitchPosition[]>(lineup?.positions ?? []);
  const [bench, setBench] = useState<string[]>(lineup?.bench ?? []);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (lineup) {
      setFormation(lineup.formation);
      setPositions(lineup.positions ?? []);
      setBench(lineup.bench ?? []);
      setDirty(false);
    }
  }, [lineup]);

  const onPitchIds = new Set(positions.map((p) => p.player_id));
  const benchSet = new Set(bench);
  const available = Array.from(selectedIds).filter((id) => !onPitchIds.has(id) && !benchSet.has(id));

  const applyFormation = (name: string) => {
    setFormation(name);
    const slots = FORMATIONS[name];
    const next: PitchPosition[] = [];
    // preserve existing players in order
    const existing = positions.slice(0, slots.length);
    slots.forEach((slot, i) => {
      const cur = existing[i];
      next.push({ x: slot.x, y: slot.y, player_id: cur?.player_id ?? "", role: cur?.role });
    });
    setPositions(next);
    setDirty(true);
  };

  // initialize slots if none yet
  useEffect(() => {
    if (positions.length === 0 && !lineup) {
      const slots = FORMATIONS[formation];
      setPositions(slots.map((s) => ({ x: s.x, y: s.y, player_id: "" })));
    }
  }, []); // eslint-disable-line

  /* ===== drag state ===== */
  type Drag =
    | { kind: "available"; playerId: string }
    | { kind: "bench"; playerId: string }
    | { kind: "pitch"; slotIndex: number };
  const [drag, setDrag] = useState<Drag | null>(null);

  const startDrag = (d: Drag) => (e: React.PointerEvent) => {
    if (!canEdit) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag(d);
  };

  const findSlotAt = (clientX: number, clientY: number): number | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    let best = -1; let bestDist = Infinity;
    positions.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return bestDist < 64 ? best : null; // ~8% radius
  };

  const isOverBench = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    return !!el?.closest("[data-drop='bench']");
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const overBench = isOverBench(e.clientX, e.clientY);
    const slot = findSlotAt(e.clientX, e.clientY);

    if (drag.kind === "available") {
      if (slot != null) {
        const next = positions.slice();
        // bump existing occupant back to available pool (no-op needed; available re-derives)
        next[slot] = { ...next[slot], player_id: drag.playerId };
        setPositions(next);
        setDirty(true);
      } else if (overBench) {
        setBench([...bench, drag.playerId]);
        setDirty(true);
      }
    } else if (drag.kind === "bench") {
      if (slot != null) {
        const next = positions.slice();
        next[slot] = { ...next[slot], player_id: drag.playerId };
        setPositions(next);
        setBench(bench.filter((id) => id !== drag.playerId));
        setDirty(true);
      }
    } else if (drag.kind === "pitch") {
      const moving = positions[drag.slotIndex];
      if (slot != null && slot !== drag.slotIndex) {
        const next = positions.slice();
        const other = next[slot];
        next[slot] = { ...next[slot], player_id: moving.player_id };
        next[drag.slotIndex] = { ...next[drag.slotIndex], player_id: other.player_id };
        setPositions(next);
        setDirty(true);
      } else if (overBench && moving.player_id) {
        setBench([...bench, moving.player_id]);
        const next = positions.slice();
        next[drag.slotIndex] = { ...next[drag.slotIndex], player_id: "" };
        setPositions(next);
        setDirty(true);
      }
    }
    setDrag(null);
  };

  const clearSlot = (i: number) => {
    if (!canEdit) return;
    const next = positions.slice();
    next[i] = { ...next[i], player_id: "" };
    setPositions(next);
    setDirty(true);
  };

  const removeFromBench = (id: string) => {
    if (!canEdit) return;
    setBench(bench.filter((b) => b !== id));
    setDirty(true);
  };

  const onSave = async () => {
    try {
      await save.mutateAsync({ match_id: matchId, formation, positions, bench });
      toast.success("Lineup saved");
      setDirty(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const playerLabel = (id: string) => {
    const p = playerById.get(id);
    if (!p) return "?";
    return `${p.first_name[0]}.${p.last_name}`;
  };

  return (
    <div className="space-y-4" onPointerUp={onPointerUp}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground">Formation</label>
        <select
          value={formation} disabled={!canEdit}
          onChange={(e) => applyFormation(e.target.value)}
          className="h-9 px-3 rounded-md border border-border bg-background text-sm"
        >
          {FORMATION_NAMES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex-1" />
        {canEdit && (
          <button onClick={onSave} disabled={!dirty || save.isPending}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            <Save className="w-4 h-4" /> {dirty ? "Save lineup" : "Saved"}
          </button>
        )}
      </div>

      {/* Pitch */}
      <div className="relative w-full max-w-2xl mx-auto aspect-[2/3] bg-gradient-to-b from-emerald-700 to-emerald-800 rounded-lg overflow-hidden border-2 border-emerald-900 select-none touch-none">
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* pitch lines */}
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.4" />
          <line x1="2" y1="50" x2="98" y2="50" stroke="white" strokeOpacity="0.5" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="9" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.4" />
          <rect x="25" y="2" width="50" height="14" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.4" />
          <rect x="25" y="84" width="50" height="14" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.4" />
        </svg>

        {positions.map((slot, i) => (
          <div
            key={i}
            onPointerDown={slot.player_id ? startDrag({ kind: "pitch", slotIndex: i }) : undefined}
            onDoubleClick={() => slot.player_id && clearSlot(i)}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-[10px] md:text-xs font-semibold text-white shadow-lg ${
              slot.player_id
                ? "bg-primary cursor-grab active:cursor-grabbing ring-2 ring-white/40"
                : "bg-white/10 border-2 border-dashed border-white/40"
            }`}
          >
            {slot.player_id ? (
              <span className="text-center leading-tight px-1 truncate max-w-full">{playerLabel(slot.player_id)}</span>
            ) : (
              <span className="text-white/60 text-lg">+</span>
            )}
          </div>
        ))}
      </div>

      {canEdit && <p className="text-[11px] text-muted-foreground text-center">Drag players from the pools onto the pitch. Double-tap a player to remove.</p>}

      {/* Available pool */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Available (selected for match)</h3>
        {available.length === 0 ? (
          <p className="text-xs text-muted-foreground">All selected players are placed.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((id) => {
              const p = playerById.get(id);
              if (!p) return null;
              return (
                <div
                  key={id}
                  onPointerDown={startDrag({ kind: "available", playerId: id })}
                  className="px-3 h-9 rounded-full bg-card border border-border text-xs font-medium flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none touch-none"
                >
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                    {p.first_name[0]}{p.last_name[0]}
                  </span>
                  {p.first_name} {p.last_name}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bench */}
      <section data-drop="bench" className="border border-dashed border-border rounded-lg p-3 min-h-[80px]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Bench ({bench.length})</h3>
        {bench.length === 0 ? (
          <p className="text-xs text-muted-foreground">Drag players here to set as substitutes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bench.map((id) => {
              const p = playerById.get(id);
              if (!p) return null;
              return (
                <div
                  key={id}
                  onPointerDown={startDrag({ kind: "bench", playerId: id })}
                  onDoubleClick={() => removeFromBench(id)}
                  className="px-3 h-9 rounded-full bg-card border border-border text-xs font-medium flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none touch-none"
                >
                  <span className="w-5 h-5 rounded-full bg-muted-foreground/30 flex items-center justify-center text-[10px]">
                    {p.first_name[0]}{p.last_name[0]}
                  </span>
                  {p.first_name} {p.last_name}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
