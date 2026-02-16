import { CalendarDays, FileOutput, Bell } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

export function TopActionBar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/50 backdrop-blur-md px-4">
      <SidebarTrigger />

      <div className="h-5 w-px bg-border" />

      <div className="mr-auto">
        <LogoBrand size="sm" />
      </div>

      <div className="flex items-center gap-1">
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

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary h-8 w-8">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
            0
          </Badge>
        </Button>
      </div>
    </header>
  );
}
