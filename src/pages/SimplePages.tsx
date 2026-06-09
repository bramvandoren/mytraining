import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { SavedSessions } from "@/components/SavedSessions";
import { Templates } from "@/components/Templates";
import { Calendar } from "@/components/Calendar";
import { SeasonPlanner } from "@/components/SeasonPlanner";
import { Marketplace } from "@/components/Marketplace";


export function SessionsPage() {
  const { t } = useTranslation();
  return <PageShell title={t("trainings.title")} subtitle={t("trainings.subtitle")}><SavedSessions /></PageShell>;
}
export function TemplatesPage() {
  const { t } = useTranslation();
  return <PageShell title={t("nav.templates")} subtitle={t("dashboard.openTemplatesDesc")}><Templates /></PageShell>;
}
export function CalendarPage() {
  const { t } = useTranslation();
  return <PageShell title={t("nav.calendar")} subtitle=""><Calendar /></PageShell>;
}
export function SeasonPage() {
  const { t } = useTranslation();
  return <PageShell title={t("nav.season")} subtitle=""><SeasonPlanner /></PageShell>;
}
export function CommunityPage() {
  const { t } = useTranslation();
  return <PageShell title={t("nav.community")} subtitle=""><Marketplace /></PageShell>;
}
