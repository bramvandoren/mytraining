import { useMemo, useState } from "react";
import { FileText, FileSpreadsheet, FileDown, Download } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub } from "@/hooks/useClubs";
import { useTeams } from "@/hooks/useTeams";
import { useSeasons } from "@/hooks/useSeasons";
import { useMatches } from "@/hooks/useMatches";
import { usePlayers } from "@/hooks/usePlayers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { REPORTS } from "@/lib/export/registry";
import type { ExportFormat, ExportFilters, ReportDef } from "@/lib/export/types";

const FORMAT_META: Record<ExportFormat, { label: string; icon: typeof FileText }> = {
  pdf: { label: "PDF", icon: FileText },
  excel: { label: "Excel", icon: FileSpreadsheet },
  csv: { label: "CSV", icon: FileDown },
};

export default function ExportCenterPage() {
  const { active } = useActiveClub();
  const [activeReport, setActiveReport] = useState<ReportDef | null>(null);

  if (!active) return <PageShell title="Export Center"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Export Center" subtitle="Generate PDF, Excel and CSV reports for this club">
      <Tabs defaultValue="pdf">
        <TabsList>
          {(["pdf", "excel", "csv"] as ExportFormat[]).map((fmt) => (
            <TabsTrigger key={fmt} value={fmt}>{FORMAT_META[fmt].label}</TabsTrigger>
          ))}
        </TabsList>
        {(["pdf", "excel", "csv"] as ExportFormat[]).map((fmt) => (
          <TabsContent key={fmt} value={fmt}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {REPORTS.filter((r) => r.format === fmt).map((report) => (
                <ReportCard key={report.id} report={report} onExport={() => setActiveReport(report)} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {activeReport && (
        <ExportDialog
          clubId={active.id}
          report={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}
    </PageShell>
  );
}

function ReportCard({ report, onExport }: { report: ReportDef; onExport: () => void }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col">
      <h3 className="text-sm font-semibold mb-1">{report.label}</h3>
      <p className="text-xs text-muted-foreground flex-1 mb-3">{report.description}</p>
      <button
        onClick={onExport}
        className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm self-start"
      >
        <Download className="w-4 h-4" /> Export
      </button>
    </div>
  );
}

function ExportDialog({ clubId, report, onClose }: { clubId: string; report: ReportDef; onClose: () => void }) {
  const { data: teams = [] } = useTeams(clubId);
  const { data: seasons = [] } = useSeasons();
  const { data: matches = [] } = useMatches(clubId);
  const { data: players = [] } = usePlayers(clubId);

  const clubSeasons = useMemo(() => seasons.filter((s) => s.club_id === clubId || !s.club_id), [seasons, clubId]);

  const [teamId, setTeamId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [matchId, setMatchId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [running, setRunning] = useState(false);

  function handleSeasonChange(id: string) {
    setSeasonId(id);
    const season = clubSeasons.find((s) => s.id === id);
    if (season) {
      setDateFrom(season.start_date);
      setDateTo(season.end_date);
    }
  }

  const matchOptions = useMemo(
    () =>
      matches
        .filter((m) => !teamId || m.team_id === teamId)
        .filter((m) => !dateFrom || m.match_date >= dateFrom)
        .filter((m) => !dateTo || m.match_date <= dateTo)
        .sort((a, b) => b.match_date.localeCompare(a.match_date)),
    [matches, teamId, dateFrom, dateTo],
  );

  const playerOptions = useMemo(
    () => players.filter((p) => !teamId || p.current_team_id === teamId),
    [players, teamId],
  );

  const needsMatch = report.filters.includes("match");
  const needsPlayer = report.filters.includes("player");
  const canRun = (!needsMatch || !!matchId) && (!needsPlayer || !!playerId);

  async function handleExport() {
    const filters: ExportFilters = {
      teamId: teamId || null,
      seasonId: seasonId || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      matchId: matchId || null,
      playerId: playerId || null,
    };
    setRunning(true);
    try {
      await report.run(clubId, filters);
      toast.success(`${report.label} exported`);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export: {report.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {report.filters.includes("team") && (
            <Field label="Team">
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={selectClass}>
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          )}

          {report.filters.includes("player") && (
            <Field label="Player">
              <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={selectClass}>
                <option value="">Select a player…</option>
                {playerOptions.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </Field>
          )}

          {report.filters.includes("season") && (
            <Field label="Season">
              <select value={seasonId} onChange={(e) => handleSeasonChange(e.target.value)} className={selectClass}>
                <option value="">All seasons</option>
                {clubSeasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}

          {report.filters.includes("dateRange") && (
            <Field label="Date range">
              <div className="flex gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
              </div>
            </Field>
          )}

          {needsMatch && (
            <Field label="Match">
              <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className={selectClass}>
                <option value="">Select a match…</option>
                {matchOptions.map((m) => <option key={m.id} value={m.id}>vs {m.opponent} — {m.match_date}</option>)}
              </select>
            </Field>
          )}
        </div>

        <DialogFooter>
          <button onClick={onClose} className="px-3 h-9 rounded-md border border-border text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={running || !canRun}
            className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Generating…" : "Export"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const selectClass = "w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
