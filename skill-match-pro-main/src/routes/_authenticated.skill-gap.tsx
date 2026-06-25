import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/skill-gap")({
  head: () => ({ meta: [{ title: "Skill gap analysis · Allocate" }] }),
  component: SkillGapPage,
});

type GapRow = {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  line_id: number | null;
  line_name: string | null;
  trainee_count: number;
  operator_count: number;
  certified_count: number;
  expert_count: number;
  total_count: number;
};

function gapClass(n: number, hasReq: boolean) {
  if (!hasReq) return "bg-muted text-muted-foreground";
  if (n === 0) return "bg-[color:var(--status-unallocated)]/15 text-[color:var(--status-unallocated)]";
  if (n <= 2) return "bg-[color:var(--status-override)]/25 text-[color:var(--status-override-foreground)]";
  return "bg-[color:var(--status-confirmed)]/20 text-[color:var(--status-confirmed)]";
}

function SkillGapPage() {
  const [lineId, setLineId] = useState<string>("all");

  const linesQ = useQuery({
    queryKey: ["sg-lines"],
    queryFn: async () =>
      (await supabase.from("production_lines").select("line_id, line_name").eq("is_active", true).order("line_name"))
        .data ?? [],
  });

  const gapQ = useQuery({
    queryKey: ["skill-gap", lineId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_skill_gap" as never, {
        p_line_id: lineId === "all" ? null : Number(lineId),
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as GapRow[];
    },
  });

  const rows = gapQ.data ?? [];

  const summary = useMemo(() => {
    const critical = rows.filter((r) => r.total_count === 0).length;
    const weak = rows.filter((r) => r.total_count > 0 && r.total_count <= 2).length;
    const healthy = rows.filter((r) => r.total_count >= 3).length;
    return { critical, weak, healthy };
  }, [rows]);

  const exportXlsx = () => {
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Line: r.line_name ?? "—",
        Machine: `${r.machine_code} — ${r.machine_name}`,
        Trainee: r.trainee_count,
        Operator: r.operator_count,
        Certified: r.certified_count,
        Expert: r.expert_count,
        Total: r.total_count,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Skill gap");
    XLSX.writeFile(wb, `skill-gap-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <AppShell title="Skill gap analysis">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Qualified associates per machine</CardTitle>
            <CardDescription>
              Counts of active associates who meet every required skill at the given level or higher.
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={lineId} onValueChange={setLineId}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All lines</SelectItem>
                {linesQ.data?.map((l) => (
                  <SelectItem key={l.line_id} value={String(l.line_id)}>
                    {l.line_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportXlsx} disabled={!rows.length}>
              <Download className="size-4 mr-1" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs mb-4">
            <Legend swatch="bg-[color:var(--status-confirmed)]/20" label="≥ 3 associates" />
            <Legend swatch="bg-[color:var(--status-override)]/25" label="1–2 associates" />
            <Legend swatch="bg-[color:var(--status-unallocated)]/15" label="0 — critical gap" />
            <Legend swatch="bg-muted" label="No skill requirement set" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Healthy machines" value={summary.healthy} tone="confirmed" />
            <Stat label="Weak coverage" value={summary.weak} tone="override" />
            <Stat label="Critical gaps" value={summary.critical} tone="unallocated" />
          </div>

          {gapQ.isLoading ? (
            <div className="py-10 grid place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No machines found. Add machines and skill requirements in Admin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-1">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Machine</th>
                    <th className="py-2 px-2 text-center">Trainee</th>
                    <th className="py-2 px-2 text-center">Operator</th>
                    <th className="py-2 px-2 text-center">Certified</th>
                    <th className="py-2 px-2 text-center">Expert</th>
                    <th className="py-2 px-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const hasReq = r.trainee_count + r.operator_count + r.certified_count + r.expert_count + r.total_count >= 0;
                    return (
                      <tr key={r.machine_id}>
                        <td className="py-2 pr-4">
                          <div className="font-medium">{r.machine_code} — {r.machine_name}</div>
                          <div className="text-xs text-muted-foreground">{r.line_name ?? "—"}</div>
                        </td>
                        <Cell n={r.trainee_count} hasReq={hasReq} />
                        <Cell n={r.operator_count} hasReq={hasReq} />
                        <Cell n={r.certified_count} hasReq={hasReq} />
                        <Cell n={r.expert_count} hasReq={hasReq} />
                        <Cell n={r.total_count} hasReq={hasReq} bold />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Cell({ n, hasReq, bold }: { n: number; hasReq: boolean; bold?: boolean }) {
  return (
    <td className="py-1 px-1 text-center">
      <div className={`rounded-md py-2 ${gapClass(n, hasReq)} ${bold ? "font-semibold" : ""}`}>{n}</div>
    </td>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block size-3 rounded ${swatch} border`} />
      {label}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "confirmed" | "override" | "unallocated" }) {
  const color =
    tone === "confirmed"
      ? "var(--status-confirmed)"
      : tone === "override"
        ? "var(--status-override)"
        : "var(--status-unallocated)";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}