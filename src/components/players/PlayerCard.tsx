import { Link } from "react-router-dom";
import { Player, POSITION_SHORT } from "@/hooks/usePlayers";

export function PlayerCard({ player, teamName }: { player: Player; teamName?: string }) {
  const initials = (player.first_name[0] ?? "") + (player.last_name[0] ?? "");
  return (
    <Link
      to={`/club/players/${player.id}`}
      className="bg-card border border-border rounded-lg p-3 hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-3 group"
    >
      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden font-semibold text-sm">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{initials.toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {player.first_name} {player.last_name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {player.position ? POSITION_SHORT[player.position] : "—"}
          {player.jersey_number != null && ` · #${player.jersey_number}`}
          {teamName && ` · ${teamName}`}
        </p>
      </div>
      {player.archived_at && (
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Archived
        </span>
      )}
    </Link>
  );
}
