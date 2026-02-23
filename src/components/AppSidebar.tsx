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
  ChefHat,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <ChefHat className="h-7 w-7 text-sidebar-primary" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm tracking-wider text-sidebar-primary">MENUMAT</span>
            <span className="text-[10px] text-sidebar-foreground/50">Správa reštaurácie</span>
          </div>
        </div>
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

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/30 tracking-wide">MENUMAT v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
