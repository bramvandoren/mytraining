import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard.tsx";
import LibraryPage from "./pages/LibraryPage.tsx";
import { SessionsPage, TemplatesPage, CalendarPage, SeasonPage, CommunityPage, ClubPage } from "./pages/SimplePages.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import SharedSession from "./pages/SharedSession.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/share/:token" element={<SharedSession />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/favorites" element={<LibraryPage defaultFavoritesOnly />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/season" element={<SeasonPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/club" element={<ClubPage />} />
              <Route path="/workspace" element={<Navigate to="/library" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
