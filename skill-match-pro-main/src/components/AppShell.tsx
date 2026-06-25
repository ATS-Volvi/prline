import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, LayoutGrid, Users, Upload, BarChart3, Settings, Calendar, TrendingUp } from "lucide-react";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: typeof LayoutGrid; roles?: AppRole[] };

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/allocation", label: "Allocation", icon: Calendar, roles: ["PLANT_ADMIN", "SUPERVISOR", "PLANT_MANAGER"] },
  { to: "/associates", label: "Associates", icon: Users },
  { to: "/upload", label: "Bulk Upload", icon: Upload, roles: ["PLANT_ADMIN", "HR_COORDINATOR"] },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/skill-gap", label: "Skill gap", icon: TrendingUp },
  { to: "/admin", label: "Admin", icon: Settings, roles: ["PLANT_ADMIN"] },
];

export function AppShell({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const { user, roles, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visibleNav = NAV.filter((n) => !n.roles || n.roles.some((r) => roles.includes(r)));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-primary text-primary-foreground sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="size-8 rounded bg-accent text-accent-foreground grid place-items-center font-black">A</div>
            <span className="hidden sm:inline">Allocate · Kolkata</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="font-medium">{profile?.full_name ?? user?.email}</span>
              <span className="text-xs opacity-80">
                {roles.length ? roles.map((r) => ROLE_LABELS[r]).join(" · ") : "No role assigned"}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
              className="min-h-11"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline ml-1">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 sm:px-4 gap-1 border-t border-primary-foreground/10">
          {visibleNav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 min-h-11 whitespace-nowrap transition",
                  active
                    ? "border-accent text-primary-foreground"
                    : "border-transparent text-primary-foreground/70 hover:text-primary-foreground"
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
        {(title || actions) && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
            {actions}
          </div>
        )}
        {!roles.length && (
          <Badge variant="destructive" className="mb-4">
            Your account has no role assigned. Ask a Plant Admin to grant a role.
          </Badge>
        )}
        {children}
      </main>
    </div>
  );
}