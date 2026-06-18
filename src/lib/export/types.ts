export interface ExportFilters {
  teamId?: string | null;
  seasonId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  matchId?: string | null;
  playerId?: string | null;
}

export type ExportFormat = "pdf" | "excel" | "csv";

export type FilterKind = "team" | "season" | "dateRange" | "match" | "player";

export interface ReportDef {
  id: string;
  label: string;
  description: string;
  format: ExportFormat;
  filters: FilterKind[];
  run: (clubId: string, filters: ExportFilters) => Promise<void>;
}

/** Inclusive date-range check; null bounds mean "no limit". */
export function inDateRange(date: string | null | undefined, dateFrom?: string | null, dateTo?: string | null) {
  if (!date) return true;
  if (dateFrom && date < dateFrom) return false;
  if (dateTo && date > dateTo) return false;
  return true;
}
