import { useTranslation } from "react-i18next";
import { Bell, BellOff, Check, CheckCheck, Trash2, X } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  type AppNotification,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  new_training: "bg-emerald-500",
  training_changed: "bg-amber-500",
  match_scheduled: "bg-blue-500",
  match_selection: "bg-violet-500",
  availability_request: "bg-orange-500",
  club_announcement: "bg-primary",
};

function relativeDate(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return format(d, "d MMM");
  return format(d, "d MMM");
}

interface Props {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: Props) {
  const { t } = useTranslation();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const deleteN = useDeleteNotification();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background border-l border-border flex flex-col h-full shadow-xl">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="font-semibold text-sm">{t("notifications.title")}</span>
            {unread > 0 && (
              <span className="text-[10px] font-mono bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                title={t("notifications.markAllRead")}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
              {t("notifications.loading")}
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-3">
              <BellOff className="w-8 h-8 opacity-40" />
              <p className="text-sm">{t("notifications.empty")}</p>
            </div>
          )}
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={() => markRead.mutate(n.id)}
                onDelete={() => deleteN.mutate(n.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification: n,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const typeLabel = t(`notifications.types.${n.type}`, { defaultValue: n.type });

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        !n.read ? "bg-primary/5" : "hover:bg-muted/30",
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
          TYPE_COLORS[n.type] ?? "bg-muted-foreground",
          n.read ? "opacity-0" : "",
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{n.title}</p>
        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">{typeLabel}</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">{relativeDate(n.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!n.read && (
          <button
            onClick={onMarkRead}
            title={t("common.confirm")}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onDelete}
          title={t("common.delete")}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-rose-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}
