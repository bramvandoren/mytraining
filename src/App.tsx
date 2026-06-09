import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard.tsx";
import LibraryPage from "./pages/LibraryPage.tsx";
import { SessionsPage, TemplatesPage, CalendarPage, SeasonPage, CommunityPage } from "./pages/SimplePages.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import SharedSession from "./pages/SharedSession.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ClubDashboard from "./pages/ClubDashboard.tsx";
import TeamsPage from "./pages/TeamsPage.tsx";
import CoachesPage from "./pages/CoachesPage.tsx";
import SharedLibraryPage from "./pages/SharedLibraryPage.tsx";
import ActivityPage from "./pages/ActivityPage.tsx";
import MediaPage from "./pages/MediaPage.tsx";
import AcceptInvitePage from "./pages/AcceptInvitePage.tsx";
import PlayersPage from "./pages/PlayersPage.tsx";
import PlayerDetailPage from "./pages/PlayerDetailPage.tsx";
import TeamDetailPage from "./pages/TeamDetailPage.tsx";
import AttendancePage from "./pages/AttendancePage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/share/:token" element={<SharedSession />} />
              <Route path="/invite/:token" element={<AcceptInvitePage />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/favorites" element={<LibraryPage defaultFavoritesOnly />} />
                <Route path="/trainings" element={<SessionsPage />} />
                <Route path="/sessions" element={<Navigate to="/trainings" replace />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/season" element={<SeasonPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/club" element={<ClubDashboard />} />
                <Route path="/club/teams" element={<TeamsPage />} />
                <Route path="/club/teams/:id" element={<TeamDetailPage />} />
                <Route path="/club/coaches" element={<CoachesPage />} />
                <Route path="/club/players" element={<PlayersPage />} />
                <Route path="/club/players/:id" element={<PlayerDetailPage />} />
                <Route path="/club/library" element={<SharedLibraryPage />} />
                <Route path="/club/activity" element={<ActivityPage />} />
                <Route path="/club/media" element={<MediaPage />} />
                <Route path="/club/analytics" element={<AnalyticsPage />} />
                <Route path="/calendar/:id/attendance" element={<AttendancePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/workspace" element={<Navigate to="/library" replace />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
