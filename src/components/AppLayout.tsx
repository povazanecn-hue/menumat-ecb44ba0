import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopActionBar } from "@/components/TopActionBar";
import { OliviaAssistant } from "@/components/OliviaAssistant";
import { Outlet } from "react-router-dom";
import kolieskoKresba from "@/assets/textures/koliesko-bg.jpg";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* Subtle illustrated background at 20% opacity */}
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${kolieskoKresba})` }}
        />
        <AppSidebar />
        <div className="flex flex-1 flex-col relative z-[1]">
          <TopActionBar />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
        <OliviaAssistant />
      </div>
    </SidebarProvider>
  );
}
