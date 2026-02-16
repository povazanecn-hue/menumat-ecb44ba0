import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useAuth } from "@/hooks/useAuth";

export interface Proposal {
  id: string;
  restaurant_id: string;
  proposed_by: string;
  dish_id: string | null;
  dish_name: string;
  category: string;
  target_week_start: string;
  note: string | null;
  status: string;
  created_at: string;
}

export interface ProposalAssignment {
  id: string;
  proposal_id: string;
  menu_date: string;
  assigned_by: string;
  created_at: string;
}

export function useProposals(weekStart?: string) {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["proposals", restaurantId, weekStart],
    queryFn: async () => {
      let q = supabase
        .from("menu_proposals")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false });

      if (weekStart) {
        q = q.eq("target_week_start", weekStart);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!restaurantId,
  });
}

export function useProposalAssignments(proposalIds: string[]) {
  return useQuery({
    queryKey: ["proposal-assignments", proposalIds],
    queryFn: async () => {
      if (!proposalIds.length) return [];
      const { data, error } = await supabase
        .from("menu_proposal_assignments")
        .select("*")
        .in("proposal_id", proposalIds);
      if (error) throw error;
      return data as ProposalAssignment[];
    },
    enabled: proposalIds.length > 0,
  });
}

export function useAddProposal() {
  const qc = useQueryClient();
  const { restaurantId } = useRestaurant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      dish_id?: string;
      dish_name: string;
      category: string;
      target_week_start: string;
      note?: string;
    }) => {
      const { error } = await supabase.from("menu_proposals").insert({
        restaurant_id: restaurantId!,
        proposed_by: user!.id,
        dish_id: input.dish_id || null,
        dish_name: input.dish_name,
        category: input.category as any,
        target_week_start: input.target_week_start,
        note: input.note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

export function useAssignProposal() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { proposal_id: string; dates: string[] }) => {
      // Insert assignments
      const rows = input.dates.map((d) => ({
        proposal_id: input.proposal_id,
        menu_date: d,
        assigned_by: user!.id,
      }));
      const { error: aErr } = await supabase
        .from("menu_proposal_assignments")
        .insert(rows);
      if (aErr) throw aErr;

      // Update status to planned
      const { error: uErr } = await supabase
        .from("menu_proposals")
        .update({ status: "planned" })
        .eq("id", input.proposal_id);
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals"] });
      qc.invalidateQueries({ queryKey: ["proposal-assignments"] });
    },
  });
}

export function useMarkProposalUsed() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from("menu_proposals")
        .update({ status: "used" })
        .eq("id", proposalId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}
