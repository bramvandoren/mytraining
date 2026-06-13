import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useActiveClub } from "@/hooks/useClubs";
import { useClubAnalytics } from "@/hooks/useClubAnalytics";
import { useProfiles } from "@/hooks/useProfiles";
import { AttendanceStats } from "@/components/club/AttendanceStats";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#0ea5e9", "#8b5cf6"];

type Tab = "overview" | "attendance";

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { active } = useActiveClub();
  const { data, isLoading } = useClubAnalytics(active?.id ?? null);
  const { data: profiles = {} } = useProfiles((data?.topCoaches ?? []).map((c) => c.user_id));

  if (!active) return <PageShell title="Analytics"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;
  if (isLoading || !data) return <PageShell title="Analytics"><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;

  return (
    <PageShell title="Analytics" subtitle={`${active.name} insights`}>
      <div className="border-b border-border mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {(["overview", "attendance"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 h-10 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "overview" ? "Overview" : "Player Attendance"}
            </button>
          ))}
        </div>
      </div>

      {tab === "attendance" && <AttendanceStats clubId={active.id} />}
      {tab === "overview" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Tile label="Attendance rate" value={`${data.attendanceRate}%`} />
            <Tile label="Records" value={data.totalAttendanceRecords} />
            <Tile label="Teams tracked" value={data.trainingsPerTeam.length} />
            <Tile label="Top exercises" value={data.topExercises.length} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Trainings per team">
              {data.trainingsPerTeam.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.trainingsPerTeam}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="team" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Attendance breakdown">
              {data.attendanceBreakdown.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.attendanceBreakdown} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(e) => e.status}>
                      {data.attendanceBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Attendance trend (8 weeks)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Most active coaches">
              {data.topCoaches.length === 0 ? <Empty /> : (
                <ul className="space-y-1.5">
                  {data.topCoaches.map((c) => (
                    <li key={c.user_id} className="flex items-center justify-between text-sm">
                      <span>{profiles[c.user_id]?.display_name ?? "Coach"}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">{c.count} actions</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Most used exercises">
              {data.topExercises.length === 0 ? <Empty /> : (
                <ul className="space-y-1.5">
                  {data.topExercises.map((e) => (
                    <li key={e.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{e.title}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">{e.count}×</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Templates">
              {data.topTemplates.length === 0 ? <Empty /> : (
                <ul className="space-y-1.5">
                  {data.topTemplates.map((t) => (
                    <li key={t.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{t.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Empty() {
  return <p className="text-xs text-muted-foreground py-6 text-center">No data yet.</p>;
}
