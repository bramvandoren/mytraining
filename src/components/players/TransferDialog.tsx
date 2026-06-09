import { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTeams } from "@/hooks/useTeams";
import { useTransferPlayer } from "@/hooks/usePlayers";

export function TransferDialog({
  clubId,
  playerId,
  currentTeamId,
  onClose,
}: {
  clubId: string;
  playerId: string;
  currentTeamId: string | null;
  onClose: () => void;
}) {
  const { data: teams = [] } = useTeams(clubId);
  const [target, setTarget] = useState<string>("");
  const transfer = useTransferPlayer();
  const currentTeam = teams.find((t) => t.id === currentTeamId);

  const handle = async () => {
    try {
      await transfer.mutateAsync({ playerId, toTeamId: target || null });
      toast.success(target ? "Player transferred" : "Player removed from team");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4">
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-background border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold">Transfer player</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded bg-muted">{currentTeam?.name ?? "No team"}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <select value={target} onChange={(e) => setTarget(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-muted border border-border outline-none">
              <option value="">No team</option>
              {teams.filter((t) => t.id !== currentTeamId).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            The current assignment will be ended and a new one created.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 h-9 rounded-md text-sm border border-border hover:bg-muted">Cancel</button>
            <button onClick={handle} disabled={transfer.isPending}
              className="px-4 h-9 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
              Transfer
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
