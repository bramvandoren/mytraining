import { ReactNode } from "react";
import { AlertCircle, Inbox, RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ count = 4, height = "h-20" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${height}`} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="w-full h-44" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: Error | unknown;
  onRetry?: () => void;
}) {
  const msg = error instanceof Error ? error.message : "Failed to load data";
  return (
    <div className="text-center py-10 px-4">
      <div className="w-10 h-10 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-foreground">Couldn't load this</p>
      <p className="text-xs text-muted-foreground mt-1 break-words max-w-sm mx-auto">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/70"
        >
          <RotateCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
