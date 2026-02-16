import { CalendarDays, FileOutput, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

export function TopActionBar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger />

      <div className="h-5 w-px bg-border" />

      <h1 className="font-serif text-lg font-semibold text-foreground mr-auto">
        MenuGen
      </h1>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/daily-menu")}
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Dnešné menu</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/exports")}
        >
          <FileOutput className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Export</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-8 w-8">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-accent text-accent-foreground">
            0
          </Badge>
        </Button>
      </div>
    </header>
  );
}
