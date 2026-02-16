import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useIsOwner } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "Šéf",
  manager: "Prevádzkar",
  head_chef: "Hl. Kuchár",
  staff: "Kuchár",
};

export function MemberManagement() {
  const isOwner = useIsOwner();
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_members")
        .select("id, user_id, role, created_at")
        .eq("restaurant_id", restaurantId!);
      if (error) throw error;

      // Fetch profile names
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      return data.map((m) => ({
        ...m,
        full_name: nameMap.get(m.user_id) || "Neznámy",
      }));
    },
    enabled: !!restaurantId && isOwner,
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("restaurant_members")
        .update({ role: role as any })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Rola aktualizovaná" });
    },
    onError: (err: any) => {
      toast({ title: "Chyba", description: err.message, variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("restaurant_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Člen odstránený" });
    },
    onError: (err: any) => {
      toast({ title: "Chyba", description: err.message, variant: "destructive" });
    },
  });

  if (!isOwner) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Správa členov
        </CardTitle>
        <CardDescription>Členovia reštaurácie a ich oprávnenia</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Načítavam…</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {m.full_name}
                  </span>
                  {m.role === "owner" && (
                    <Badge variant="default" className="text-xs">Šéf</Badge>
                  )}
                </div>
                {m.role !== "owner" ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={m.role}
                      onValueChange={(role) =>
                        updateRole.mutate({ memberId: m.id, role })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Prevádzkar</SelectItem>
                        <SelectItem value="head_chef">Hl. Kuchár</SelectItem>
                        <SelectItem value="staff">Kuchár</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeMember.mutate(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Vlastník</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
