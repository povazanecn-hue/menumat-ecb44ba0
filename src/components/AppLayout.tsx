import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopActionBar } from "@/components/TopActionBar";
import { OliviaAssistant } from "@/components/OliviaAssistant";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
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
