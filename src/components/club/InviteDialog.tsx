import { useState } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { useCreateInvitation } from "@/hooks/useInvitations";
import type { ClubRole } from "@/hooks/useClubs";

export function InviteDialog({ clubId, onClose }: { clubId: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClubRole>("coach");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useCreateInvitation();

  const inviteUrl = createdToken ? `${window.location.origin}/invite/${createdToken}` : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email");
      return;
    }
    try {
      const inv = await create.mutateAsync({ clubId, email, role });
      setCreatedToken(inv.token);
      toast.success("Invitation created");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base flex items-center gap-2"><Mail className="w-4 h-4" /> Invite coach</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!createdToken ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground" htmlFor="inv-email">Email</label>
              <input id="inv-email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@example.com"
                className="mt-1 w-full px-3 py-2 text-sm bg-muted rounded-md outline-none focus:ring-2 ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground" htmlFor="inv-role">Role</label>
              <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as ClubRole)}
                className="mt-1 w-full px-3 py-2 text-sm bg-muted rounded-md outline-none focus:ring-2 ring-primary">
                <option value="admin">Admin — manage club content & invites</option>
                <option value="coach">Coach — create trainings & exercises</option>
                <option value="assistant">Assistant — view & limited editing</option>
              </select>
            </div>
            <button type="submit" disabled={create.isPending}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {create.isPending ? "Creating…" : "Create invitation"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Share this link with the coach. The invite expires in 14 days.</p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <code className="text-xs flex-1 truncate">{inviteUrl}</code>
              <button onClick={copy} className="w-8 h-8 rounded-md hover:bg-background flex items-center justify-center" aria-label="Copy link">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={onClose}
              className="w-full h-10 rounded-md bg-foreground text-background text-sm font-medium">Done</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
