import type { ReportDef } from "./types";
import { exportTrainingsPdf } from "./reports/trainings";
import { exportMatchPreparationPdf } from "./reports/matchPreparation";
import { exportMatchReportPdf } from "./reports/matchReport";
import { exportAttendancePdf, exportAttendanceExcel, exportAttendanceCsv } from "./reports/attendance";
import { exportPlayerEvaluationsPdf } from "./reports/playerEvaluations";
import { exportTeamRosterPdf, exportTeamPlayerListExcel } from "./reports/teamRoster";
import { exportMatchStatisticsExcel } from "./reports/matchStatistics";
import { exportTrainingStatisticsExcel } from "./reports/trainingStatistics";
import { exportClubReportExcel } from "./reports/clubReport";
import { exportPlayerDataCsv } from "./reports/playerData";
import { exportStatisticsCsv } from "./reports/statisticsCsv";

export const REPORTS: ReportDef[] = [
  // PDF
  {
    id: "trainings",
    label: "Trainings",
    description: "Session plans with exercises, one section per training.",
    format: "pdf",
    filters: ["team", "season", "dateRange"],
    run: exportTrainingsPdf,
  },
  {
    id: "match-preparation",
    label: "Match Preparation",
    description: "Objectives, tactical notes and opponent analysis for one match.",
    format: "pdf",
    filters: ["team", "season", "dateRange", "match"],
    run: exportMatchPreparationPdf,
  },
  {
    id: "match-reports",
    label: "Match Reports",
    description: "Result, squad, events and post-match review for one match.",
    format: "pdf",
    filters: ["team", "season", "dateRange", "match"],
    run: exportMatchReportPdf,
  },
  {
    id: "attendance-reports-pdf",
    label: "Attendance Reports",
    description: "Per-player attendance rate plus the full session log.",
    format: "pdf",
    filters: ["team", "season", "dateRange"],
    run: exportAttendancePdf,
  },
  {
    id: "player-evaluations",
    label: "Player Evaluations",
    description: "Ratings, strengths and notes for one player.",
    format: "pdf",
    filters: ["player", "season", "dateRange"],
    run: exportPlayerEvaluationsPdf,
  },
  {
    id: "team-rosters",
    label: "Team Rosters",
    description: "Squad list for one team, sorted by shirt number.",
    format: "pdf",
    filters: ["team"],
    run: exportTeamRosterPdf,
  },
  // Excel
  {
    id: "team-player-lists",
    label: "Team Player Lists",
    description: "Full player details for one team.",
    format: "excel",
    filters: ["team"],
    run: exportTeamPlayerListExcel,
  },
  {
    id: "attendance-reports-excel",
    label: "Attendance Reports",
    description: "Attendance summary and session log as a workbook.",
    format: "excel",
    filters: ["team", "season", "dateRange"],
    run: exportAttendanceExcel,
  },
  {
    id: "match-statistics",
    label: "Match Statistics",
    description: "Results, goals and cards, one row per match.",
    format: "excel",
    filters: ["team", "season", "dateRange"],
    run: exportMatchStatisticsExcel,
  },
  {
    id: "training-statistics",
    label: "Training Statistics",
    description: "Session counts, duration and attendance rate per training.",
    format: "excel",
    filters: ["team", "season", "dateRange"],
    run: exportTrainingStatisticsExcel,
  },
  {
    id: "club-reports",
    label: "Club Reports",
    description: "Overview, attendance and activity log across the club.",
    format: "excel",
    filters: ["season", "dateRange"],
    run: exportClubReportExcel,
  },
  // CSV
  {
    id: "player-data",
    label: "Player Data",
    description: "Flat player list for spreadsheets.",
    format: "csv",
    filters: ["team"],
    run: exportPlayerDataCsv,
  },
  {
    id: "attendance-data",
    label: "Attendance Data",
    description: "Flat attendance records for spreadsheets.",
    format: "csv",
    filters: ["team", "season", "dateRange"],
    run: exportAttendanceCsv,
  },
  {
    id: "statistics",
    label: "Statistics",
    description: "Per-team training/match counts and attendance rate.",
    format: "csv",
    filters: ["season", "dateRange"],
    run: exportStatisticsCsv,
  },
];
