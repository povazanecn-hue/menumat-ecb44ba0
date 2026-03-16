import { CalendarDays, FileOutput, Bell, Bot, CheckCheck, Search } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface TopActionBarProps {
  onOliviaToggle?: () => void;
}

export function TopActionBar({ onOliviaToggle }: TopActionBarProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-12 sm:h-14 items-center gap-2 sm:gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-2 sm:px-4">
      <SidebarTrigger />

      <div className="h-5 w-px bg-border hidden sm:block" />

      <div className="hidden sm:flex items-center gap-2 mr-auto">
        <LogoBrand size="sm" />
      </div>

      {/* Mobile spacer */}
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 text-muted-foreground hover:text-primary"
          onClick={() => navigate("/daily-menu")}
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Dnešné menu</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 text-muted-foreground hover:text-primary"
          onClick={() => navigate("/exports")}
        >
          <FileOutput className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Export</span>
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary h-9 w-9 sm:h-8 sm:w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifikácie</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-primary gap-1"
                  onClick={() => markAllAsRead.mutate()}
                >
                  <CheckCheck className="h-3 w-3" />
                  Označiť všetky
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-72">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Žiadne notifikácie
                </div>
              ) : (
                notifications.map((n) => (
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
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: sk,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Olivia trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 text-primary hover:bg-primary/10"
          onClick={onOliviaToggle}
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Olivia</span>
        </Button>
      </div>
    </header>
  );
}
