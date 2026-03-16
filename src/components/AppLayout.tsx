import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopActionBar } from "@/components/TopActionBar";
import { OliviaAssistant } from "@/components/OliviaAssistant";
import { OliviaGreeting } from "@/components/OliviaGreeting";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CommandPalette, useCommandPalette } from "@/components/CommandPalette";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  const [oliviaOpen, setOliviaOpen] = useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopActionBar
            onOliviaToggle={() => setOliviaOpen(true)}
            onCommandPalette={() => setCmdOpen(true)}
          />
          <main className="flex-1 p-4 md:p-6 pb-20 sm:pb-6">
            <Outlet />
          </main>
        </div>
        <MobileBottomNav />
        <OliviaAssistant open={oliviaOpen} onOpenChange={setOliviaOpen} />
        <OliviaGreeting />
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </SidebarProvider>
  );
}
