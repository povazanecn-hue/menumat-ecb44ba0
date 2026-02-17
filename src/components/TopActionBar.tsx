import { CalendarDays, FileOutput, Bell, CheckCheck, Command } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { sk } from "date-fns/locale";

export function TopActionBar() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/50 backdrop-blur-md px-4">
      <SidebarTrigger />

      <div className="h-5 w-px bg-border" />

      <div className="mr-auto cursor-pointer" onClick={() => navigate("/dashboard")}>
        <LogoBrand size="md" />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2.5 border-border/50"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
        >
          <Command className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Hľadať</span>
          <kbd className="hidden sm:inline-flex pointer-events-none ml-1 h-5 items-center rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-primary"
          onClick={() => navigate("/daily-menu")}
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Dnešné menu</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-primary"
          onClick={() => navigate("/exports")}
        >
          <FileOutput className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Export</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h4 className="text-sm font-semibold">Notifikácie</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => markAllAsRead.mutate()}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Označiť všetky
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Žiadne notifikácie</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.is_read) markAsRead.mutate(n.id);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <p className={`text-sm ${!n.is_read ? "font-medium" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: sk })}
                    </p>
                  </button>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
