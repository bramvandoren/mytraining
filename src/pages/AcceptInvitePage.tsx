import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Building2, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useInvitationByToken, useAcceptInvitation } from "@/hooks/useInvitations";
import { AuroraBackground } from "@/components/AuroraBackground";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: inv, isLoading, error } = useInvitationByToken(token ?? null);
  const accept = useAcceptInvitation();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && token) {
      navigate(`/auth?next=${encodeURIComponent(`/invite/${token}`)}`);
    }
  }, [authLoading, user, token, navigate]);

  const emailMismatch = user && inv && user.email?.toLowerCase() !== inv.email.toLowerCase();
  const expired = inv && new Date(inv.expires_at) < new Date();
  const alreadyAccepted = inv?.accepted_at;

  const handleAccept = async () => {
    if (!token) return;
    try {
      await accept.mutateAsync(token);
      setAccepted(true);
      toast.success("Joined club!");
      setTimeout(() => navigate("/club"), 1200);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <AuroraBackground />
      <div className="relative w-full max-w-md bg-card/80 backdrop-blur border border-border rounded-xl shadow-glow p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight mb-1">Club invitation</h1>

        {isLoading || authLoading ? (
          <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : error || !inv ? (
          <div className="py-4 text-sm text-muted-foreground flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <p>This invitation link is invalid.</p>
            <Link to="/" className="text-primary hover:underline">Go home</Link>
          </div>
        ) : accepted ? (
          <div className="py-4 flex flex-col items-center gap-2">
            <Check className="w-8 h-8 text-primary" />
            <p className="text-sm">You've joined the club. Redirecting…</p>
          </div>
        ) : alreadyAccepted ? (
          <p className="text-sm text-muted-foreground py-3">This invitation has already been accepted.</p>
        ) : expired ? (
          <p className="text-sm text-destructive py-3">This invitation has expired.</p>
        ) : emailMismatch ? (
          <div className="py-3 text-sm text-muted-foreground space-y-2">
            <p>This invitation was sent to <strong>{inv.email}</strong>, but you're signed in as <strong>{user!.email}</strong>.</p>
            <p>Please sign out and sign in with the invited email.</p>
          </div>
        ) : (
          <div className="py-3">
            <p className="text-sm text-muted-foreground mb-4">
              You've been invited to join <strong className="text-foreground">{inv.clubs?.name ?? "this club"}</strong> as <strong className="text-foreground capitalize">{inv.role}</strong>.
            </p>
            <button onClick={handleAccept} disabled={accept.isPending}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {accept.isPending ? "Joining…" : "Accept invitation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
