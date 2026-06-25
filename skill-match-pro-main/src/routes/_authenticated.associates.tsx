import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/associates")({
  head: () => ({ meta: [{ title: "Associates · Allocate" }] }),
  component: AssociatesList,
});

function AssociatesList() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["associates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("associates").select("*, departments(name)").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((a) =>
    !q || a.full_name.toLowerCase().includes(q.toLowerCase()) || a.employee_code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell title="Associates" actions={<Input placeholder="Search name or code" value={q} onChange={(e) => setQ(e.target.value)} className="w-64 min-h-11" />}>
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((a) => (
            <Link key={a.associate_id} to="/associates/$id" params={{ id: a.associate_id.toString() }}>
              <Card className="hover:border-primary transition h-full">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.employee_code} · {a.category}</div>
                      <div className="text-xs text-muted-foreground">{a.departments?.name}</div>
                    </div>
                    <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No associates found.</p>}
        </div>
      )}
    </AppShell>
  );
}