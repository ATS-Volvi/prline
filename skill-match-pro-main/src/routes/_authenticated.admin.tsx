import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, hasRole, ROLE_LABELS, type AppRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Allocate" }] }),
  component: AdminPage,
});

const ROLES: AppRole[] = ["PLANT_ADMIN", "HR_COORDINATOR", "SUPERVISOR", "PLANT_MANAGER"];

function AdminPage() {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !hasRole(roles, "PLANT_ADMIN")) navigate({ to: "/", replace: true }); }, [roles, loading, navigate]);

  if (loading) return <AppShell><Loader2 className="size-6 animate-spin" /></AppShell>;

  return (
    <AppShell title="Admin">
      <Tabs defaultValue="users">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="users">Users & roles</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="lines">Lines</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="machine-skills">Machine skills</TabsTrigger>
          <TabsTrigger value="associates">Associates</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="departments"><SimpleAdmin table="departments" pkey="department_id" fields={[{ name: "name", label: "Name", required: true }]} display={(r) => String(r.name)} /></TabsContent>
        <TabsContent value="lines"><LinesAdmin /></TabsContent>
        <TabsContent value="machines"><MachinesAdmin /></TabsContent>
        <TabsContent value="skills"><SimpleAdmin table="skill_categories" pkey="skill_id" fields={[
          { name: "skill_code", label: "Code", required: true },
          { name: "skill_name", label: "Name", required: true },
          { name: "description", label: "Description" },
        ]} display={(r) => `${String(r.skill_code)} — ${String(r.skill_name)}`} /></TabsContent>
        <TabsContent value="machine-skills"><MachineSkillsAdmin /></TabsContent>
        <TabsContent value="associates"><AssociatesAdmin /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function UsersAdmin() {
  const qc = useQueryClient();
  const profilesQ = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, username, full_name")).data ?? [],
  });
  const rolesQ = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, role")).data ?? [],
  });
  const grant = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role granted"); qc.invalidateQueries({ queryKey: ["admin-user-roles"] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role revoked"); qc.invalidateQueries({ queryKey: ["admin-user-roles"] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const rolesByUser = new Map<string, AppRole[]>();
  (rolesQ.data ?? []).forEach((r) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role as AppRole);
    rolesByUser.set(r.user_id, arr);
  });

  const [pendingRole, setPendingRole] = useState<Record<string, AppRole>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users & roles</CardTitle>
        <CardDescription>Grant or revoke plant roles. New users have no role until granted here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Roles</TableHead><TableHead>Grant</TableHead></TableRow></TableHeader>
          <TableBody>
            {profilesQ.data?.map((p) => (
              <TableRow key={p.user_id}>
                <TableCell>{p.full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.username}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(rolesByUser.get(p.user_id) ?? []).map((r) => (
                      <Badge key={r} variant="outline" className="gap-1">
                        {ROLE_LABELS[r]}
                        <button onClick={() => revoke.mutate({ user_id: p.user_id, role: r })}><X className="size-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Select value={pendingRole[p.user_id] ?? ""} onValueChange={(v) => setPendingRole((s) => ({ ...s, [p.user_id]: v as AppRole }))}>
                      <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => !(rolesByUser.get(p.user_id) ?? []).includes(r)).map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!pendingRole[p.user_id]} onClick={() => {
                      grant.mutate({ user_id: p.user_id, role: pendingRole[p.user_id]! });
                      setPendingRole((s) => { const c = { ...s }; delete c[p.user_id]; return c; });
                    }}>Grant</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type FieldDef = { name: string; label: string; required?: boolean };

function SimpleAdmin({ table, pkey, fields, display }: { table: "departments" | "skill_categories"; pkey: string; fields: FieldDef[]; display: (r: Record<string, unknown>) => string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => (await supabase.from(table).select("*").order(pkey)).data ?? [],
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).insert(form as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Added"); setForm({}); qc.invalidateQueries({ queryKey: ["admin", table] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from(table).update({ is_active } as never).eq(pkey, id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", table] }),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Add new</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          {fields.map((f) => (
            <div key={f.name}>
              <Label>{f.label}</Label>
              <Input value={form[f.name] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
            </div>
          ))}
          <Button onClick={() => add.mutate()} disabled={fields.some((f) => f.required && !form[f.name])}><Plus className="size-4" /> Add</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
          <TableBody>
            {q.data?.map((row) => {
              const r = row as unknown as Record<string, unknown>;
              return (
                <TableRow key={String(r[pkey])}>
                  <TableCell>{display(r)}</TableCell>
                  <TableCell><Switch checked={Boolean(r.is_active)} onCheckedChange={(v) => toggle.mutate({ id: Number(r[pkey]), is_active: v })} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LinesAdmin() {
  const qc = useQueryClient();
  const linesQ = useQuery({
    queryKey: ["admin-lines"],
    queryFn: async () => (await supabase.from("production_lines").select("*, departments(name)").order("line_name")).data ?? [],
  });
  const depsQ = useQuery({ queryKey: ["admin-deps-list"], queryFn: async () => (await supabase.from("departments").select("*")).data ?? [] });
  const [form, setForm] = useState<{ line_name: string; area: string; department_id: string }>({ line_name: "", area: "", department_id: "" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("production_lines").insert({
        line_name: form.line_name, area: form.area || null, department_id: form.department_id ? Number(form.department_id) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Line added"); setForm({ line_name: "", area: "", department_id: "" }); qc.invalidateQueries({ queryKey: ["admin-lines"] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Production lines</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div><Label>Name</Label><Input value={form.line_name} onChange={(e) => setForm((s) => ({ ...s, line_name: e.target.value }))} /></div>
          <div><Label>Area</Label><Input value={form.area} onChange={(e) => setForm((s) => ({ ...s, area: e.target.value }))} /></div>
          <div><Label>Department</Label>
            <Select value={form.department_id} onValueChange={(v) => setForm((s) => ({ ...s, department_id: v }))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Pick…" /></SelectTrigger>
              <SelectContent>
                {depsQ.data?.map((d) => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => add.mutate()} disabled={!form.line_name}><Plus className="size-4" /> Add</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Line</TableHead><TableHead>Area</TableHead><TableHead>Department</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
          <TableBody>
            {linesQ.data?.map((l) => (
              <TableRow key={l.line_id}>
                <TableCell>{l.line_name}</TableCell>
                <TableCell>{l.area}</TableCell>
                <TableCell>{l.departments?.name}</TableCell>
                <TableCell><Switch checked={l.is_active} onCheckedChange={async (v) => {
                  await supabase.from("production_lines").update({ is_active: v }).eq("line_id", l.line_id);
                  qc.invalidateQueries({ queryKey: ["admin-lines"] });
                }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MachinesAdmin() {
  const qc = useQueryClient();
  const machinesQ = useQuery({
    queryKey: ["admin-machines"],
    queryFn: async () => (await supabase.from("machines").select("*, production_lines(line_name)").order("machine_code")).data ?? [],
  });
  const linesQ = useQuery({ queryKey: ["admin-lines-pick"], queryFn: async () => (await supabase.from("production_lines").select("*")).data ?? [] });
  const [form, setForm] = useState({ machine_code: "", machine_name: "", line_id: "", min_skill_level: "OPERATOR" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("machines").insert({
        machine_code: form.machine_code, machine_name: form.machine_name,
        line_id: Number(form.line_id), min_skill_level: form.min_skill_level as "OPERATOR",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Machine added"); setForm({ machine_code: "", machine_name: "", line_id: "", min_skill_level: "OPERATOR" }); qc.invalidateQueries({ queryKey: ["admin-machines"] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Machines</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div><Label>Code</Label><Input value={form.machine_code} onChange={(e) => setForm((s) => ({ ...s, machine_code: e.target.value }))} /></div>
          <div><Label>Name</Label><Input value={form.machine_name} onChange={(e) => setForm((s) => ({ ...s, machine_name: e.target.value }))} /></div>
          <div><Label>Line</Label>
            <Select value={form.line_id} onValueChange={(v) => setForm((s) => ({ ...s, line_id: v }))}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Pick line" /></SelectTrigger>
              <SelectContent>{linesQ.data?.map((l) => <SelectItem key={l.line_id} value={String(l.line_id)}>{l.line_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Min level</Label>
            <Select value={form.min_skill_level} onValueChange={(v) => setForm((s) => ({ ...s, min_skill_level: v }))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{["TRAINEE", "OPERATOR", "CERTIFIED", "EXPERT"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={() => add.mutate()} disabled={!form.machine_code || !form.machine_name || !form.line_id}><Plus className="size-4" /> Add</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Line</TableHead><TableHead>Min level</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
          <TableBody>
            {machinesQ.data?.map((m) => (
              <TableRow key={m.machine_id}>
                <TableCell>{m.machine_code}</TableCell>
                <TableCell>{m.machine_name}</TableCell>
                <TableCell>{m.production_lines?.line_name}</TableCell>
                <TableCell>{m.min_skill_level}</TableCell>
                <TableCell><Switch checked={m.is_active} onCheckedChange={async (v) => {
                  await supabase.from("machines").update({ is_active: v }).eq("machine_id", m.machine_id);
                  qc.invalidateQueries({ queryKey: ["admin-machines"] });
                }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MachineSkillsAdmin() {
  const qc = useQueryClient();
  const machinesQ = useQuery({ queryKey: ["msr-machines"], queryFn: async () => (await supabase.from("machines").select("*").order("machine_code")).data ?? [] });
  const skillsQ = useQuery({ queryKey: ["msr-skills"], queryFn: async () => (await supabase.from("skill_categories").select("*").order("skill_code")).data ?? [] });
  const [machineId, setMachineId] = useState<string>("");
  const reqsQ = useQuery({
    queryKey: ["msr", machineId],
    enabled: !!machineId,
    queryFn: async () => (await supabase.from("machine_skill_requirements").select("*, skill_categories(skill_code, skill_name)").eq("machine_id", Number(machineId))).data ?? [],
  });
  const [form, setForm] = useState({ skill_id: "", min_level: "OPERATOR" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("machine_skill_requirements").insert({
        machine_id: Number(machineId), skill_id: Number(form.skill_id), min_level: form.min_level as "OPERATOR",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Requirement added"); qc.invalidateQueries({ queryKey: ["msr", machineId] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async ({ skill_id }: { skill_id: number }) => {
      const { error } = await supabase.from("machine_skill_requirements").delete().eq("machine_id", Number(machineId)).eq("skill_id", skill_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["msr", machineId] }),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Machine skill requirements</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Machine</Label>
          <Select value={machineId} onValueChange={setMachineId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Pick machine" /></SelectTrigger>
            <SelectContent>{machinesQ.data?.map((m) => <SelectItem key={m.machine_id} value={String(m.machine_id)}>{m.machine_code} — {m.machine_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {machineId && (
          <>
            <div className="flex flex-wrap gap-2 items-end">
              <div><Label>Skill</Label>
                <Select value={form.skill_id} onValueChange={(v) => setForm((s) => ({ ...s, skill_id: v }))}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Pick skill" /></SelectTrigger>
                  <SelectContent>{skillsQ.data?.map((s) => <SelectItem key={s.skill_id} value={String(s.skill_id)}>{s.skill_code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Min level</Label>
                <Select value={form.min_level} onValueChange={(v) => setForm((s) => ({ ...s, min_level: v }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{["TRAINEE", "OPERATOR", "CERTIFIED", "EXPERT"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={() => add.mutate()} disabled={!form.skill_id}><Plus className="size-4" /> Add</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Skill</TableHead><TableHead>Min level</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {reqsQ.data?.map((r) => (
                  <TableRow key={r.skill_id}>
                    <TableCell>{r.skill_categories?.skill_code} — {r.skill_categories?.skill_name}</TableCell>
                    <TableCell>{r.min_level}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate({ skill_id: r.skill_id })}><X className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AssociatesAdmin() {
  const qc = useQueryClient();
  const associatesQ = useQuery({ queryKey: ["admin-associates"], queryFn: async () => (await supabase.from("associates").select("*").order("full_name")).data ?? [] });
  const depsQ = useQuery({ queryKey: ["admin-deps-pick2"], queryFn: async () => (await supabase.from("departments").select("*")).data ?? [] });
  const [form, setForm] = useState({ employee_code: "", full_name: "", category: "CONTRACT", department_id: "", contact_number: "", joining_date: "" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("associates").insert({
        employee_code: form.employee_code, full_name: form.full_name, category: form.category as "CONTRACT",
        department_id: form.department_id ? Number(form.department_id) : null,
        contact_number: form.contact_number || null, joining_date: form.joining_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Associate added"); setForm({ employee_code: "", full_name: "", category: "CONTRACT", department_id: "", contact_number: "", joining_date: "" }); qc.invalidateQueries({ queryKey: ["admin-associates"] }); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Associates</CardTitle><CardDescription>Add associates here, then assign skills via Bulk Upload or per-profile.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div><Label>Code</Label><Input value={form.employee_code} onChange={(e) => setForm((s) => ({ ...s, employee_code: e.target.value }))} /></div>
          <div className="col-span-2"><Label>Name</Label><Input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} /></div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["CONTRACT", "COMPANY_OPERATIVE", "SUPERVISOR", "NTCI"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Department</Label>
            <Select value={form.department_id} onValueChange={(v) => setForm((s) => ({ ...s, department_id: v }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{depsQ.data?.map((d) => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Joining</Label><Input type="date" value={form.joining_date} onChange={(e) => setForm((s) => ({ ...s, joining_date: e.target.value }))} /></div>
        </div>
        <Button onClick={() => add.mutate()} disabled={!form.employee_code || !form.full_name}><Plus className="size-4" /> Add associate</Button>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {associatesQ.data?.map((a) => (
              <TableRow key={a.associate_id}>
                <TableCell>{a.employee_code}</TableCell>
                <TableCell>{a.full_name}</TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell>
                  <Select value={a.status} onValueChange={async (v) => {
                    await supabase.from("associates").update({ status: v as "ACTIVE" }).eq("associate_id", a.associate_id);
                    qc.invalidateQueries({ queryKey: ["admin-associates"] });
                  }}>
                    <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{["ACTIVE", "INACTIVE", "SEPARATED"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}