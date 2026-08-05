import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { NAV_ITEMS } from "./navItems";

export default function AppLayout() {
  const location = useLocation();
  const current = NAV_ITEMS.find((i) => location.pathname.startsWith(i.to));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-card sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <MobileNav />
            <h1 className="font-heading text-lg font-bold tracking-tight" data-testid="page-title">
              {current?.label || "Sócio Digital"}
            </h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      {location.pathname !== "/chat" && <ChatWidget />}
    </div>
  );
}
