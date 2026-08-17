import { IconAlertCircle, IconBellOff, IconCircleCheck, IconX } from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "#Components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "#Components/ui/dropdown-menu";
import { cn } from "#Constants/cn";
import { formatRelativeTime } from "#Constants/relativeTime";
import useNotifications from "#Hooks/useNotifications";

const MAX_BADGE_COUNT = 9;

// The avatar doubles as the notification trigger: a red badge overlays its
// corner (a bare dot at exactly 1, a count above that) instead of a separate
// bell icon next to it. Clicking it opens a scrollable panel of the user's
// current notifications, kept live by useNotifications.
const NotificationBell = ({ user }) => {
  const { notifications, clear, clearAll } = useNotifications(user);
  const count = notifications.length;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={count > 0 ? `Notifications (${count} unread)` : "Notifications"}
      >
        <Avatar className="size-10">
          <AvatarFallback className="bg-muted-foreground text-background">
            {initials}
          </AvatarFallback>
        </Avatar>
        {count > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-600 font-semibold text-white ring-2 ring-background",
              count === 1 ? "size-2.5" : "h-4 min-w-4 px-1 text-[10px]"
            )}
          >
            {count > 1 && (count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count)}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <IconBellOff className="size-6" />
              <span className="text-sm">No notifications</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group relative rounded-lg border border-border px-3 pt-2.5 pb-3.5 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => clear(notification.id)}
                      aria-label="Dismiss notification"
                      className="shrink-0 rounded-md p-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground"
                    >
                      <IconX className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-0.5 flex items-start gap-2 pr-4">
                    {notification.type === "success" && (
                      <IconCircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    )}
                    {notification.type === "error" && (
                      <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
