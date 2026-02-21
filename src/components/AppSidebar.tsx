import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  Carrot,
  BookOpen,
  ShoppingCart,
  FileOutput,
  Palette,
  Settings,
  ClipboardList,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Denné menu", url: "/daily-menu", icon: CalendarDays },
  { title: "Jedlá", url: "/dishes", icon: UtensilsCrossed },
  { title: "Ingrediencie", url: "/ingredients", icon: Carrot },
  { title: "Recepty", url: "/recipes", icon: BookOpen },
  { title: "Jedálny lístok", url: "/permanent-menu", icon: ClipboardList },
  { title: "Nástenka", url: "/nastenka", icon: ClipboardCheck },
];

const toolsNav = [
  { title: "Nákupný zoznam", url: "/shopping-list", icon: ShoppingCart },
  { title: "Export centrum", url: "/exports", icon: FileOutput },
  { title: "Šablóny", url: "/templates", icon: Palette },
  { title: "Nastavenia", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <LogoBrand size="sm" showSubtitle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest font-semibold">
            Hlavné
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest font-semibold">
            Nástroje
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border space-y-2">
        {user && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-sidebar-foreground/60 truncate" title={user.email}>
              {user.email}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
              onClick={handleLogout}
              title="Odhlásiť sa"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <p className="text-[10px] text-sidebar-foreground/30 tracking-wide">MENU MASTER v1.0</p>
        <p className="text-[9px] text-sidebar-foreground/40 leading-tight">
          Powered by <span className="font-semibold text-sidebar-primary/70">N-[vision]</span> | <span className="font-semibold text-sidebar-primary/70">N-oLiMiT gastro</span>
          <br />Pre gastro s budúcnosťou!
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
