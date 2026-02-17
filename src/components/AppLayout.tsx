import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopActionBar } from "@/components/TopActionBar";
import { CommandPalette } from "@/components/CommandPalette";
import { OliviaAssistant } from "@/components/OliviaAssistant";
import { Outlet } from "react-router-dom";
import woodBg from "@/assets/textures/wood-bg.jpg";
import woodPlanks from "@/assets/textures/wood-planks.jpg";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* Wood texture background for dashboard — matching dark wood mockup style */}
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: `url(${woodBg})` }}
        />
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url(${woodPlanks})`,
            backgroundSize: '600px',
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
          }}
        />
        <AppSidebar />
        <div className="flex flex-1 flex-col relative z-[1]">
          <TopActionBar />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <OliviaAssistant />
      </div>
    </SidebarProvider>
  );
}
