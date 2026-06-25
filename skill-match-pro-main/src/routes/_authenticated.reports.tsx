import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { exportToExcel } from "@/lib/excel-template";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports · Allocate" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell title="Reports">
      <Tabs defaultValue="shift">
        <TabsList><TabsTrigger value="shift">Shift summary</TabsTrigger><TabsTrigger value="training">Training due</TabsTrigger></TabsList>
        <TabsContent value="shift"><ShiftSummary /></TabsContent>
        <TabsContent value="training"><TrainingDue /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ShiftSummary() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftId, setShiftId] = useState<string>("");
  const shifts = useQuery({
    queryKey: ["shifts-all"],
    queryFn: async () => (await supabase.from("shifts").select("*").order("shift_id")).data ?? [],
  });
  const data = useQuery({
    queryKey: ["report-shift", date, shiftId],
    enabled: !!shiftId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_allocations")
        .select("allocation_id, status, override_reason, machines(machine_code, machine_name, production_lines(line_name)), associates(employee_code, full_name, category)")
        .eq("allocation_date", date)
        .eq("shift_id", Number(shiftId))
        .neq("status", "CANCELLED")
        .order("allocation_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = data.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-3 items-end">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="min-w-40"><Label>Shift</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger><SelectValue placeholder="Pick a shift" /></SelectTrigger>
              <SelectContent>
                {shifts.data?.map((s) => <SelectItem key={s.shift_id} value={s.shift_id.toString()}>{s.shift_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {rows.length > 0 && (
            <Button variant="outline" className="ml-auto" onClick={() => exportToExcel(
              rows.map((r) => ({
                line: r.machines?.production_lines?.line_name,
                machine: r.machines?.machine_name,
                code: r.machines?.machine_code,
                associate: r.associates?.full_name,
                emp_code: r.associates?.employee_code,
                category: r.associates?.category,
                status: r.status,
                override_reason: r.override_reason ?? "",
              })),
              "Shift Summary",
              `shift-summary-${date}.xlsx`,
            )}><Download className="size-4" /> Export</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Line</TableHead><TableHead>Machine</TableHead><TableHead>Associate</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.allocation_id}>
                <TableCell>{r.machines?.production_lines?.line_name}</TableCell>
                <TableCell>{r.machines?.machine_name} <span className="text-xs text-muted-foreground">{r.machines?.machine_code}</span></TableCell>
                <TableCell>{r.associates?.full_name} <span className="text-xs text-muted-foreground">{r.associates?.employee_code}</span></TableCell>
                <TableCell>{r.associates?.category}</TableCell>
                <TableCell><Badge variant={r.status === "OVERRIDE" ? "destructive" : "outline"}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground">No allocations for this shift.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TrainingDue() {
  const [days, setDays] = useState(30);
  const data = useQuery({
    queryKey: ["training-due", days],
    queryFn: async () => {
      const today = new Date();
      const future = new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("associate_skills")
        .select("assoc_skill_id, expires_on, skill_level, associates(employee_code, full_name), skill_categories(skill_code, skill_name)")
        .not("expires_on", "is", null)
        .lte("expires_on", future)
        .order("expires_on");
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = data.data ?? [];
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-3 items-end">
          <div><Label>Window (days)</Label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[30, 60, 90].map((d) => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {rows.length > 0 && (
            <Button variant="outline" className="ml-auto" onClick={() => exportToExcel(
              rows.map((r) => ({
                emp_code: r.associates?.employee_code,
                associate: r.associates?.full_name,
                skill: r.skill_categories?.skill_name,
                level: r.skill_level,
                expires_on: r.expires_on,
              })),
              "Training Due",
              `training-due-${days}d.xlsx`,
            )}><Download className="size-4" /> Export</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Associate</TableHead><TableHead>Skill</TableHead><TableHead>Level</TableHead><TableHead>Expires</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.assoc_skill_id}>
                <TableCell>{r.associates?.full_name} <span className="text-xs text-muted-foreground">{r.associates?.employee_code}</span></TableCell>
                <TableCell>{r.skill_categories?.skill_name}</TableCell>
                <TableCell><Badge>{r.skill_level}</Badge></TableCell>
                <TableCell>{r.expires_on}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground">No certifications expiring in window.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}