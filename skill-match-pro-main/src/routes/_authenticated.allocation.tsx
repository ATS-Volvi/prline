import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasAnyRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/allocation")({
  head: () => ({ meta: [{ title: "Shift Allocation · Allocate" }] }),
  component: AllocationBoard,
});

type EligibleRow = {
  associate_id: number;
  employee_code: string;
  full_name: string;
  category: string;
  highest_relevant_level: string | null;
  deployment_count_on_machine: number;
  expiring_skills: { skill_name: string; expires_on: string }[];
  eligibility_status: "ELIGIBLE" | "ELIGIBLE_EXPIRING_SOON";
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function AllocationBoard() {
  const { roles, user } = useAuth();
  const canAllocate = hasAnyRole(roles, ["PLANT_ADMIN", "SUPERVISOR"]);
  const qc = useQueryClient();

  const [date, setDate] = useState(todayISO());
  const [shiftId, setShiftId] = useState<number | null>(null);
  const [openMachine, setOpenMachine] = useState<{ id: number; name: string } | null>(null);
  const [overrideOpen, setOverrideOpen] = useState<{ machine_id: number; machine_name: string } | null>(null);
  const [overrideAssoc, setOverrideAssoc] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const shiftsQ = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shifts").select("*").eq("is_active", true).order("shift_id");
      if (error) throw error;
      return data;
    },
  });

  useMemo(() => {
    if (shiftId === null && shiftsQ.data?.length) setShiftId(shiftsQ.data[0].shift_id);
  }, [shiftsQ.data, shiftId]);

  const linesQ = useQuery({
    queryKey: ["lines+machines"],
    queryFn: async () => {
      const { data: lines, error: le } = await supabase.from("production_lines").select("*").eq("is_active", true).order("line_name");
      if (le) throw le;
      const { data: machines, error: me } = await supabase.from("machines").select("*").eq("is_active", true).order("machine_code");
      if (me) throw me;
      return { lines: lines ?? [], machines: machines ?? [] };
    },
  });

  const allocsQ = useQuery({
    queryKey: ["allocations", date, shiftId],
    enabled: !!date && shiftId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_allocations")
        .select("allocation_id, machine_id, associate_id, status, override_reason, associates(full_name, employee_code)")
        .eq("allocation_date", date)
        .eq("shift_id", shiftId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const eligibleQ = useQuery<EligibleRow[]>({
    queryKey: ["eligible", date, shiftId, openMachine?.id],
    enabled: !!openMachine && shiftId !== null,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_eligible_associates", {
        _date: date,
        _shift_id: shiftId!,
        _machine_id: openMachine!.id,
      });
      if (error) throw error;
      return (data as EligibleRow[]) ?? [];
    },
  });

  const confirm = useMutation({
    mutationFn: async (args: { machine_id: number; associate_id: number; status: "CONFIRMED" | "OVERRIDE"; override_reason?: string }) => {
      const { error } = await supabase.from("shift_allocations").insert({
        allocation_date: date,
        shift_id: shiftId!,
        machine_id: args.machine_id,
        associate_id: args.associate_id,
        status: args.status,
        override_reason: args.override_reason ?? null,
        allocated_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Allocation confirmed");
      qc.invalidateQueries({ queryKey: ["allocations", date, shiftId] });
      setOpenMachine(null);
      setOverrideOpen(null);
      setOverrideAssoc(null);
      setOverrideReason("");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("shift_allocations").update({ status: "CANCELLED" }).eq("allocation_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Allocation cancelled");
      qc.invalidateQueries({ queryKey: ["allocations", date, shiftId] });
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const machinesByLine = useMemo(() => {
    if (!linesQ.data) return [];
    return linesQ.data.lines.map((l) => ({
      ...l,
      machines: linesQ.data!.machines.filter((m) => m.line_id === l.line_id),
    }));
  }, [linesQ.data]);

  const allocByMachine = useMemo(() => {
    const map = new Map<number, NonNullable<typeof allocsQ.data>[number]>();
    (allocsQ.data ?? []).filter((a) => a.status !== "CANCELLED").forEach((a) => map.set(a.machine_id, a));
    return map;
  }, [allocsQ.data]);

  return (
    <AppShell title="Shift Allocation Board">
      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11" />
          </div>
          <div className="min-w-40">
            <Label>Shift</Label>
            <Select value={shiftId?.toString() ?? ""} onValueChange={(v) => setShiftId(Number(v))}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Select shift" /></SelectTrigger>
              <SelectContent>
                {shiftsQ.data?.map((s) => (
                  <SelectItem key={s.shift_id} value={s.shift_id.toString()}>
                    {s.shift_name} ({s.start_time}–{s.end_time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Legend color="bg-status-confirmed" label="Confirmed" />
            <Legend color="bg-status-override" label="Override" />
            <Legend color="bg-status-unallocated" label="Unallocated" />
          </div>
        </CardContent>
      </Card>

      {linesQ.isLoading || allocsQ.isLoading ? (
        <div className="grid place-items-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {machinesByLine.map((line) => (
            <div key={line.line_id}>
              <h2 className="text-lg font-semibold mb-2">{line.line_name} <span className="text-sm text-muted-foreground font-normal">· {line.area}</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {line.machines.map((m) => {
                  const a = allocByMachine.get(m.machine_id);
                  const status = a?.status ?? "UNALLOCATED";
                  const ring =
                    status === "CONFIRMED" ? "border-l-status-confirmed" :
                    status === "OVERRIDE" ? "border-l-status-override" :
                    "border-l-status-unallocated";
                  return (
                    <Card key={m.machine_id} className={cn("border-l-4 cursor-pointer hover:shadow-md transition", ring)}
                          onClick={() => canAllocate && !a && setOpenMachine({ id: m.machine_id, name: m.machine_name })}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{m.machine_name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">{m.machine_code} · min {m.min_skill_level}</p>
                          </div>
                          <Badge variant="outline" className={cn(
                            status === "CONFIRMED" && "bg-status-confirmed text-status-confirmed-foreground border-transparent",
                            status === "OVERRIDE" && "bg-status-override text-status-override-foreground border-transparent",
                            status === "UNALLOCATED" && "bg-status-unallocated text-status-unallocated-foreground border-transparent",
                          )}>{status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm">
                        {a ? (
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="font-medium">{a.associates?.full_name}</div>
                              <div className="text-xs text-muted-foreground">{a.associates?.employee_code}</div>
                              {a.status === "OVERRIDE" && a.override_reason && (
                                <div className="mt-2 text-xs flex gap-1 items-start"><AlertCircle className="size-3 mt-0.5" /><span>{a.override_reason}</span></div>
                              )}
                            </div>
                            {canAllocate && (
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); cancel.mutate(a.allocation_id); }}>
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">{canAllocate ? "Click to allocate" : "Unallocated"}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!openMachine} onOpenChange={(o) => !o && setOpenMachine(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{openMachine?.name}</SheetTitle>
            <SheetDescription>Eligible associates for {date} · shift {shiftsQ.data?.find((s) => s.shift_id === shiftId)?.shift_name}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {eligibleQ.isLoading && <Loader2 className="size-4 animate-spin" />}
            {eligibleQ.data?.length === 0 && (
              <div className="text-sm text-muted-foreground p-4 border border-dashed rounded">
                No eligible associates. Use override below if needed.
              </div>
            )}
            {eligibleQ.data?.map((row) => (
              <Card key={row.associate_id} className="cursor-pointer hover:border-primary" onClick={() => openMachine && confirm.mutate({ machine_id: openMachine.id, associate_id: row.associate_id, status: "CONFIRMED" })}>
                <CardContent className="pt-4 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{row.full_name}</div>
                    <div className="text-xs text-muted-foreground">{row.employee_code} · {row.category}</div>
                    <div className="text-xs mt-1">Level: <span className="font-medium">{row.highest_relevant_level}</span> · Prior deployments: {row.deployment_count_on_machine}</div>
                    {row.eligibility_status === "ELIGIBLE_EXPIRING_SOON" && (
                      <Badge variant="outline" className="mt-1 bg-status-override text-status-override-foreground border-transparent">Expiring soon</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {openMachine && (
              <Button variant="outline" className="w-full mt-4" onClick={() => setOverrideOpen({ machine_id: openMachine.id, machine_name: openMachine.name })}>
                Override allocation…
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!overrideOpen} onOpenChange={(o) => !o && setOverrideOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override allocation</DialogTitle>
            <DialogDescription>
              Override allocations bypass skill and availability checks. They are flagged in reports and require a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Associate ID (employee code lookup)</Label>
              <Input placeholder="EMP-0001" onBlur={async (e) => {
                const code = e.target.value.trim();
                if (!code) return;
                const { data } = await supabase.from("associates").select("associate_id").eq("employee_code", code).maybeSingle();
                if (!data) { toast.error("Associate not found"); return; }
                setOverrideAssoc(data.associate_id);
              }} className="min-h-11" />
              {overrideAssoc && <p className="text-xs text-muted-foreground mt-1">Selected associate #{overrideAssoc}</p>}
            </div>
            <div>
              <Label>Override reason (required)</Label>
              <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(null)}>Cancel</Button>
            <Button disabled={!overrideAssoc || overrideReason.trim().length === 0} onClick={() => {
              if (!overrideOpen || !overrideAssoc) return;
              confirm.mutate({ machine_id: overrideOpen.machine_id, associate_id: overrideAssoc, status: "OVERRIDE", override_reason: overrideReason.trim() });
            }}>Confirm override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("size-3 rounded", color)} /> {label}
    </span>
  );
}