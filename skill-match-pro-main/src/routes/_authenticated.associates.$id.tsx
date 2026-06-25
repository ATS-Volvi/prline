import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/associates/$id")({
  head: () => ({ meta: [{ title: "Associate profile · Allocate" }] }),
  component: AssociateDetail,
});

function AssociateDetail() {
  const { id } = Route.useParams();
  const aid = Number(id);

  const profile = useQuery({
    queryKey: ["associate", aid],
    queryFn: async () => {
      const { data, error } = await supabase.from("associates").select("*, departments(name)").eq("associate_id", aid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const skills = useQuery({
    queryKey: ["associate-skills", aid],
    queryFn: async () => {
      const { data, error } = await supabase.from("associate_skills").select("*, skill_categories(skill_code, skill_name)").eq("associate_id", aid);
      if (error) throw error;
      return data ?? [];
    },
  });

  const history = useQuery({
    queryKey: ["associate-history", aid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_allocations")
        .select("allocation_id, allocation_date, status, machines(machine_name, machine_code), shifts(shift_name)")
        .eq("associate_id", aid)
        .order("allocation_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (profile.isLoading) return <AppShell><Loader2 className="size-6 animate-spin" /></AppShell>;
  if (!profile.data) return <AppShell><p>Associate not found.</p></AppShell>;

  const a = profile.data;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell
      actions={<Button asChild variant="outline"><Link to="/associates"><ChevronLeft className="size-4" /> Back</Link></Button>}
      title={a.full_name}
    >
      <Card className="mb-4">
        <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Field label="Employee code" value={a.employee_code} />
          <Field label="Category" value={a.category} />
          <Field label="Status" value={a.status} />
          <Field label="Department" value={a.departments?.name ?? "—"} />
          <Field label="Contact" value={a.contact_number ?? "—"} />
          <Field label="Joining date" value={a.joining_date ?? "—"} />
        </CardContent>
      </Card>
      <Tabs defaultValue="skills">
        <TabsList><TabsTrigger value="skills">Skill matrix</TabsTrigger><TabsTrigger value="history">Deployment history</TabsTrigger></TabsList>
        <TabsContent value="skills">
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Code</TableHead><TableHead>Skill</TableHead><TableHead>Level</TableHead><TableHead>Certified</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {skills.data?.map((s) => {
                    const expired = s.expires_on && s.expires_on < today;
                    return (
                      <TableRow key={s.assoc_skill_id}>
                        <TableCell>{s.skill_categories?.skill_code}</TableCell>
                        <TableCell>{s.skill_categories?.skill_name}</TableCell>
                        <TableCell><Badge>{s.skill_level}</Badge></TableCell>
                        <TableCell>{s.certified_on ?? "—"}</TableCell>
                        <TableCell>{s.expires_on ?? "—"}</TableCell>
                        <TableCell>
                          {!s.is_valid || expired ? <Badge variant="destructive">{expired ? "Expired" : "Invalid"}</Badge> : <Badge variant="outline">Valid</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {skills.data?.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No skills recorded.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Recent deployments</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Shift</TableHead><TableHead>Machine</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {history.data?.map((h) => (
                    <TableRow key={h.allocation_id}>
                      <TableCell>{h.allocation_date}</TableCell>
                      <TableCell>{h.shifts?.shift_name}</TableCell>
                      <TableCell>{h.machines?.machine_name} ({h.machines?.machine_code})</TableCell>
                      <TableCell><Badge variant={h.status === "OVERRIDE" ? "destructive" : "outline"}>{h.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {history.data?.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground">No deployments yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (<div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>);
}