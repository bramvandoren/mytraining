import { useParams } from "react-router-dom";
import { useSharedSession } from "@/hooks/useShareSession";
import { Clock, Calendar as Cal, Users } from "lucide-react";

const SharedSession = () => {
  const { token } = useParams();
  const { data, isLoading, error } = useSharedSession(token);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Session not found or no longer shared.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Shared Training</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{data.name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Cal className="w-3.5 h-3.5" /> {data.date}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {data.age_group}</span>
            <span className="flex items-center gap-1 font-mono"><Clock className="w-3.5 h-3.5" /> {data.total_duration}m</span>
          </div>
        </div>
        <div className="space-y-3">
          {(data.exercises ?? []).map((item: any, i: number) => (
            <div key={i} className="bg-card shadow-card rounded-md p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.exercise.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold tracking-tight">{item.exercise.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{item.exercise.duration} min · {item.exercise.players} players</p>
                  <p className="text-sm text-muted-foreground mt-2">{item.exercise.description}</p>
                  {item.notes && (
                    <div className="mt-2 p-2 bg-muted rounded-sm text-xs">
                      <span className="font-medium">Notes:</span> {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SharedSession;
