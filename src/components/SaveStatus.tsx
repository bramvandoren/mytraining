import { Check, CloudOff, Loader2 } from "lucide-react";

interface Props {
  status: "idle" | "saving" | "saved" | "error";
  className?: string;
}

export function SaveStatus({ status, className = "" }: Props) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className}`}>
        <Check className="w-3 h-3 text-primary" /> Draft saved
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-destructive ${className}`}>
      <CloudOff className="w-3 h-3" /> Save failed
    </span>
  );
}
