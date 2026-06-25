import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buildSkillTemplate, parseSkillFile, type SkillUploadRow } from "@/lib/excel-template";
import { toast } from "sonner";
import { useAuth, hasAnyRole } from "@/lib/auth";
import { Download, Loader2, Upload as UploadIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Bulk Skill Upload · Allocate" }] }),
  component: UploadPage,
});

type Validated = SkillUploadRow & { ok: boolean; errors: string[]; associate_id?: number; skill_id?: number };

const VALID_LEVELS = ["TRAINEE", "OPERATOR", "CERTIFIED", "EXPERT"];

function UploadPage() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, ["PLANT_ADMIN", "HR_COORDINATOR"]);
  const [rows, setRows] = useState<Validated[] | null>(null);
  const [busy, setBusy] = useState(false);

  const skillsQ = useQuery({
    queryKey: ["skill-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skill_categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const associatesQ = useQuery({
    queryKey: ["associates-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("associates").select("associate_id, employee_code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const downloadTemplate = () => {
    const codes = (skillsQ.data ?? []).map((s) => s.skill_code);
    const blob = buildSkillTemplate(codes);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill-upload-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    const parsed = await parseSkillFile(file);
    const assocMap = new Map((associatesQ.data ?? []).map((a) => [a.employee_code, a.associate_id]));
    const skillMap = new Map((skillsQ.data ?? []).map((s) => [s.skill_code, s.skill_id]));
    const validated: Validated[] = parsed.map((r) => {
      const errors: string[] = [];
      if (!r.employee_code) errors.push("employee_code required");
      else if (!assocMap.has(r.employee_code)) errors.push(`unknown employee_code ${r.employee_code}`);
      if (!r.skill_code) errors.push("skill_code required");
      else if (!skillMap.has(r.skill_code)) errors.push(`unknown skill_code ${r.skill_code}`);
      if (!VALID_LEVELS.includes(r.skill_level)) errors.push(`skill_level must be one of ${VALID_LEVELS.join("/")}`);
      if (r.certified_on && isNaN(Date.parse(r.certified_on))) errors.push("certified_on must be YYYY-MM-DD");
      if (r.expires_on && isNaN(Date.parse(r.expires_on))) errors.push("expires_on must be YYYY-MM-DD");
      return {
        ...r,
        ok: errors.length === 0,
        errors,
        associate_id: assocMap.get(r.employee_code),
        skill_id: skillMap.get(r.skill_code),
      };
    });
    setRows(validated);
  };

  const commit = async () => {
    if (!rows || rows.some((r) => !r.ok)) {
      toast.error("Fix errors before committing — all rows must validate.");
      return;
    }
    setBusy(true);
    const payload = rows.map((r) => ({
      associate_id: r.associate_id!,
      skill_id: r.skill_id!,
      skill_level: r.skill_level as "TRAINEE" | "OPERATOR" | "CERTIFIED" | "EXPERT",
      certified_on: r.certified_on || null,
      expires_on: r.expires_on || null,
      certified_by: r.certified_by || null,
      is_valid: true,
    }));
    const { error } = await supabase.from("associate_skills").upsert(payload, { onConflict: "associate_id,skill_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Imported ${payload.length} skill records.`);
    setRows(null);
  };

  return (
    <AppShell title="Bulk Skill Upload">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Step 1 — Download the template</CardTitle>
          <CardDescription>The template lists every active skill code. Fill rows and upload — partial uploads are not committed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" disabled={!skillsQ.data}>
            <Download className="size-4" /> Download template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Upload completed file</CardTitle>
          <CardDescription>Each row will be validated. Commit only happens when every row passes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".xlsx" disabled={!canWrite} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="min-h-11" />
          {rows && (
            <>
              <div className="text-sm">
                {rows.filter((r) => r.ok).length} valid · {rows.filter((r) => !r.ok).length} errors
              </div>
              <div className="overflow-auto max-h-[400px] border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead><TableHead>Employee</TableHead><TableHead>Skill</TableHead><TableHead>Level</TableHead>
                      <TableHead>Cert/Exp</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{r.employee_code}</TableCell>
                        <TableCell>{r.skill_code}</TableCell>
                        <TableCell>{r.skill_level}</TableCell>
                        <TableCell>{r.certified_on} / {r.expires_on}</TableCell>
                        <TableCell>
                          {r.ok ? <Badge>OK</Badge> : <Badge variant="destructive">{r.errors.join("; ")}</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={commit} disabled={busy || !canWrite || rows.some((r) => !r.ok)}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
                Commit {rows.length} rows
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}