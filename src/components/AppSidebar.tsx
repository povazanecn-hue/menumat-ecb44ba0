import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  Carrot,
  BookOpen,
  FileOutput,
  Palette,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Denne menu", url: "/daily-menu", icon: CalendarDays },
  { title: "Jedla", url: "/dishes", icon: UtensilsCrossed },
  { title: "Ingrediencie", url: "/ingredients", icon: Carrot },
  { title: "Recepty", url: "/recipes", icon: BookOpen },
  { title: "Export centrum", url: "/exports", icon: FileOutput },
  { title: "Sablony", url: "/templates", icon: Palette },
  { title: "Nastavenia", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-serif font-bold text-lg">
            M
          </div>
          <div>
            <p className="font-serif font-bold text-sm text-sidebar-foreground tracking-wide">MENUMAT</p>
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest">Správa reštaurácie</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors rounded-lg px-3 py-2.5"
                      activeClassName="text-sidebar-foreground bg-sidebar-accent border border-sidebar-border font-medium"
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

      <SidebarFooter className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/25 tracking-wide">MENUMAT v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
