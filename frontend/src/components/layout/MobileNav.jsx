import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List, ChartLineUp } from "@phosphor-icons/react";
import { NAV_ITEMS } from "./navItems";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-nav-trigger">
          <List size={22} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-ink text-slate-100 border-white/10">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <ChartLineUp size={18} weight="bold" className="text-white" />
          </div>
          <span className="font-heading font-extrabold text-lg tracking-tight text-white">Sócio Digital</span>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              data-testid={`mobile-nav-link-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={20} weight="duotone" />
              {label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
