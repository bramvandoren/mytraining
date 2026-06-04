import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pitch Aurora background — deep navy ink wash with drifting green/teal orbs.
 * Use as a full-screen wrapper on Auth, Reset password and marketing screens.
 */
export function AuroraBackground({
  children,
  className,
  variant = "full",
}: {
  children?: ReactNode;
  className?: string;
  variant?: "full" | "subtle";
}) {
  return (
    <div className={cn("relative overflow-hidden bg-aurora", className)}>
      {/* Aurora orbs */}
      <div
        className="aurora-orb"
        style={{
          width: variant === "full" ? "60vw" : "30vw",
          height: variant === "full" ? "60vw" : "30vw",
          background: "hsl(var(--primary) / 0.6)",
          top: "-10%",
          left: "-10%",
          animationDelay: "0s",
        }}
        aria-hidden="true"
      />
      <div
        className="aurora-orb"
        style={{
          width: variant === "full" ? "50vw" : "25vw",
          height: variant === "full" ? "50vw" : "25vw",
          background: "hsl(180 90% 55% / 0.45)",
          top: "20%",
          right: "-15%",
          animationDelay: "-6s",
        }}
        aria-hidden="true"
      />
      <div
        className="aurora-orb"
        style={{
          width: variant === "full" ? "55vw" : "28vw",
          height: variant === "full" ? "55vw" : "28vw",
          background: "hsl(142 100% 50% / 0.35)",
          bottom: "-20%",
          left: "30%",
          animationDelay: "-12s",
        }}
        aria-hidden="true"
      />

      {/* Subtle pitch grid overlay (very faint) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
