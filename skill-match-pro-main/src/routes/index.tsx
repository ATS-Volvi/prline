import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, BadgeCheck, ArrowLeftRight, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plant dashboard · Allocate" },
      { name: "description", content: "Daily allocation dashboard for the Kolkata plant." },
    ],
  }),
  component: Dashboard,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const { session, loading, roles, profile } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const today = todayISO();
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const associatesQ = useQuery({
    queryKey: ["dash-associates"],
    queryFn: async () =>
      (await supabase.from("associates").select("associate_id, status").eq("status", "ACTIVE")).data ?? [],
    enabled: !!session,
  });

  const machinesQ = useQuery({
    queryKey: ["dash-machines"],
    queryFn: async () =>
      (await supabase
        .from("machines")
        .select("machine_id, machine_code, machine_name, line_id, production_lines(line_name)")
        .eq("is_active", true)).data ?? [],
    enabled: !!session,
  });

  const allocationsQ = useQuery({
    queryKey: ["dash-allocations", today],
    queryFn: async () =>
      (await supabase
        .from("shift_allocations")
        .select(
          "allocation_id, allocation_date, status, allocated_at, override_reason, machine_id, machines(machine_code, machine_name, line_id, production_lines(line_name)), associate_id, associates(full_name), shifts(shift_name)"
        )
        .eq("allocation_date", today)
        .order("allocated_at", { ascending: false })).data ?? [],
    enabled: !!session,
  });

  const expiringQ = useQuery({
    queryKey: ["dash-expiring", today, in30],
    queryFn: async () =>
      (await supabase
        .from("associate_skills")
        .select("associate_id, expires_on, skill_categories(skill_name), associates(full_name)")
        .eq("is_valid", true)
        .gte("expires_on", today)
        .lte("expires_on", in30)).data ?? [],
    enabled: !!session,
  });

  const stats = useMemo(() => {
    const machines = machinesQ.data ?? [];
    const allocs = allocationsQ.data ?? [];
    const filled = new Set(allocs.map((a) => a.machine_id)).size;
    const overrides = allocs.filter((a) => a.status === "OVERRIDE");
    const expiring = expiringQ.data ?? [];
    const expAssociates = new Set(expiring.map((e) => e.associate_id)).size;
    return {
      machinesTotal: machines.length,
      filled,
      open: Math.max(0, machines.length - filled),
      fillRate: machines.length ? Math.round((filled / machines.length) * 100) : 0,
      activeAssociates: (associatesQ.data ?? []).length,
      overrideCount: overrides.length,
      certsExpiring: expiring.length,
      expAssociates,
    };
  }, [machinesQ.data, allocationsQ.data, expiringQ.data, associatesQ.data]);

  const coverageByLine = useMemo(() => {
    const machines = machinesQ.data ?? [];
    const allocs = allocationsQ.data ?? [];
    const map = new Map<number, { line: string; total: number; filled: Set<number> }>();
    machines.forEach((m) => {
      const lid = m.line_id as number;
      const name = (m.production_lines as { line_name?: string } | null)?.line_name ?? "Unassigned";
      const e = map.get(lid) ?? { line: name, total: 0, filled: new Set<number>() };
      e.total += 1;
      map.set(lid, e);
    });
    allocs.forEach((a) => {
      const m = a.machines as { line_id?: number } | null;
      const lid = m?.line_id;
      if (lid == null) return;
      const e = map.get(lid);
      if (e) e.filled.add(a.machine_id);
    });
    return Array.from(map.values()).map((e) => ({ line: e.line, total: e.total, filled: e.filled.size }));
  }, [machinesQ.data, allocationsQ.data]);

  const statusBreakdown = useMemo(() => {
    const allocs = allocationsQ.data ?? [];
    const confirmed = allocs.filter((a) => a.status === "CONFIRMED").length;
    const override = allocs.filter((a) => a.status === "OVERRIDE").length;
    const unallocated = Math.max(0, (machinesQ.data?.length ?? 0) - confirmed - override);
    return { confirmed, override, unallocated };
  }, [allocationsQ.data, machinesQ.data]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell
      title={`Welcome, ${profile?.full_name ?? "user"}`}
      actions={
        <div className="text-sm text-muted-foreground">
          {roles.length ? roles.map((r) => ROLE_LABELS[r]).join(" · ") : "No role assigned"} ·{" "}
          <span className="text-foreground font-medium">{new Date().toLocaleDateString()}</span>
        </div>
      }
    >
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiTile
          big={`${stats.fillRate}%`}
          label="Shift fill rate"
          sub={`${stats.open} machine${stats.open === 1 ? "" : "s"} open`}
          tone="confirmed"
        />
        <KpiTile
          big={String(stats.activeAssociates)}
          label="Active associates"
          sub={`${stats.activeAssociates} available today`}
          tone="muted"
        />
        <KpiTile
          big={String(stats.certsExpiring)}
          label="Certs expiring (30d)"
          sub={`${stats.expAssociates} associate${stats.expAssociates === 1 ? "" : "s"} affected`}
          tone="override"
        />
        <KpiTile
          big={String(stats.overrideCount)}
          label="Override allocations"
          sub={stats.overrideCount > 0 ? "Need review" : "All clear"}
          tone={stats.overrideCount > 0 ? "unallocated" : "confirmed"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Shift coverage by line */}
        <Card>
          <CardHeader>
            <CardTitle>Shift coverage by line</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coverageByLine.length === 0 && (
              <p className="text-sm text-muted-foreground">No active production lines yet.</p>
            )}
            {coverageByLine.map((c) => {
              const pct = c.total ? (c.filled / c.total) * 100 : 0;
              return (
                <div key={c.line}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.line}</span>
                    <span className="text-muted-foreground">
                      {c.filled} / {c.total}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Status breakdown */}
            <div className="pt-4 border-t flex items-center gap-4 text-sm">
              <Dot color="var(--status-confirmed)" /> Confirmed {statusBreakdown.confirmed}
              <Dot color="var(--status-override)" /> Override {statusBreakdown.override}
              <Dot color="var(--status-unallocated)" /> Unallocated {statusBreakdown.unallocated}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts requiring attention</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {stats.open > 0 && (
              <AlertRow
                icon={<AlertTriangle className="size-5" />}
                title={`${stats.open} machine${stats.open === 1 ? "" : "s"} unallocated today`}
                body="Open the allocation board to assign eligible associates."
              />
            )}
            {stats.overrideCount > 0 && (
              <AlertRow
                icon={<ArrowLeftRight className="size-5" />}
                title={`${stats.overrideCount} override allocation${stats.overrideCount === 1 ? "" : "s"} active`}
                body="Deployed without full skill match. Review the reasons in Reports."
              />
            )}
            {stats.certsExpiring > 0 && (
              <AlertRow
                icon={<BadgeCheck className="size-5" />}
                title={`${stats.certsExpiring} cert${stats.certsExpiring === 1 ? "" : "s"} expire within 30 days`}
                body={
                  (expiringQ.data ?? [])
                    .slice(0, 3)
                    .map((e) => (e.associates as { full_name?: string } | null)?.full_name)
                    .filter(Boolean)
                    .join(", ") + " — renewal due."
                }
              />
            )}
            {stats.open === 0 && stats.overrideCount === 0 && stats.certsExpiring === 0 && (
              <p className="text-sm text-muted-foreground py-4">Nothing requires attention. Plant is fully covered.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent allocation activity</CardTitle>
          <Link to="/allocation">
            <Button variant="outline" size="sm">
              Open allocation board <ArrowRight className="size-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {(allocationsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No allocations today yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Machine</th>
                    <th className="py-2 pr-4 font-medium">Associate</th>
                    <th className="py-2 pr-4 font-medium">Shift</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(allocationsQ.data ?? []).slice(0, 8).map((a) => {
                    const m = a.machines as { machine_code?: string; machine_name?: string } | null;
                    const assoc = a.associates as { full_name?: string } | null;
                    const sh = a.shifts as { shift_name?: string } | null;
                    const t = a.allocated_at ? new Date(a.allocated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
                    return (
                      <tr key={a.allocation_id}>
                        <td className="py-2 pr-4 tabular-nums">{t}</td>
                        <td className="py-2 pr-4">{m?.machine_code} — {m?.machine_name}</td>
                        <td className="py-2 pr-4">{assoc?.full_name}</td>
                        <td className="py-2 pr-4">{sh?.shift_name}</td>
                        <td className="py-2 pr-4">
                          {a.status === "OVERRIDE" ? (
                            <Badge style={{ background: "var(--status-override)", color: "var(--status-override-foreground)" }}>Override</Badge>
                          ) : (
                            <Badge style={{ background: "var(--status-confirmed)", color: "var(--status-confirmed-foreground)" }}>Confirmed</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin shortcuts */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ShortcutLink to="/allocation" label="Shift allocation" />
        <ShortcutLink to="/skill-gap" label="Skill gap analysis" />
        <ShortcutLink to="/admin" label="Manage users & roles" />
        <ShortcutLink to="/reports" label="Reports & exports" />
      </div>
    </AppShell>
  );
}

function KpiTile({
  big,
  label,
  sub,
  tone,
}: {
  big: string;
  label: string;
  sub: string;
  tone: "confirmed" | "override" | "unallocated" | "muted";
}) {
  const bigColor =
    tone === "confirmed"
      ? "var(--status-confirmed)"
      : tone === "override"
        ? "var(--status-override)"
        : tone === "unallocated"
          ? "var(--status-unallocated)"
          : "var(--foreground)";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-4xl font-bold tracking-tight" style={{ color: bigColor }}>
        {big}
      </div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />;
}

function AlertRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 py-3">
      <div className="size-9 rounded bg-muted grid place-items-center text-muted-foreground shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}

function ShortcutLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block">
      <div className="rounded-lg border bg-card hover:border-primary transition p-3 text-sm font-medium flex items-center justify-between">
        {label} <ArrowRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}