import { PageShell } from "@/components/PageShell";
import { SavedSessions } from "@/components/SavedSessions";
import { Templates } from "@/components/Templates";
import { Calendar } from "@/components/Calendar";
import { SeasonPlanner } from "@/components/SeasonPlanner";
import { Marketplace } from "@/components/Marketplace";
import { ClubManager } from "@/components/ClubManager";

export function SessionsPage() {
  return <PageShell title="Sessions" subtitle="Your saved trainings"><SavedSessions /></PageShell>;
}
export function TemplatesPage() {
  return <PageShell title="Templates" subtitle="Reusable training plans"><Templates /></PageShell>;
}
export function CalendarPage() {
  return <PageShell title="Calendar" subtitle="Schedule and plan trainings"><Calendar /></PageShell>;
}
export function SeasonPage() {
  return <PageShell title="Season planner" subtitle="Long-term goals and weekly plans"><SeasonPlanner /></PageShell>;
}
export function CommunityPage() {
  return <PageShell title="Community" subtitle="Public exercises shared by other coaches"><Marketplace /></PageShell>;
}
export function ClubPage() {
  return <PageShell title="Club" subtitle="Manage your club and members"><ClubManager /></PageShell>;
}
