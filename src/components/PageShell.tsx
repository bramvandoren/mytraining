import { ReactNode } from "react";

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
