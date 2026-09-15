import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { MealOption } from '../../types/database';

/**
 * Fetch all flexible meal options for a specific client.
 * Ordered by sort_order ascending, then created_at ascending.
 */
export function useMealOptions(clientId?: string) {
  return useQuery<MealOption[]>({
    queryKey: ['mealOptions', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('meal_options')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MealOption[];
    },
  });
}

/**
 * Coach mutation to create a new flexible meal option.
 */
export function useCreateMealOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      newOption: Omit<MealOption, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('meal_options')
        .insert({
          ...newOption,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MealOption;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mealOptions', data.client_id] });
    },
  });
}

/**
 * Coach mutation to update an existing flexible meal option.
 */
export function useUpdateMealOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<MealOption, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('meal_options')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as MealOption;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mealOptions', data.client_id] });
    },
  });
}

/**
 * Coach mutation to delete a meal option.
 * Note: Historical client logs remain untouched because logs store point-in-time snapshots.
 */
export function useDeleteMealOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('meal_options').delete().eq('id', id);
      if (error) throw error;
      return { id, clientId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['mealOptions', result.clientId] });
    },
  });
}

/**
 * Coach mutation to duplicate an existing meal option.
 */
export function useDuplicateMealOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      optionId,
      clientId,
    }: {
      optionId: string;
      clientId: string;
    }) => {
      // 1. Fetch source option
      const { data: source, error: fetchErr } = await supabase
        .from('meal_options')
        .select('*')
        .eq('id', optionId)
        .single();
      if (fetchErr) throw fetchErr;

      const now = new Date().toISOString();
      const duplicatePayload = {
        client_id: source.client_id,
        coach_id: source.coach_id,
        diet_plan_id: source.diet_plan_id,
        name: `${source.name} (Copy)`,
        serving_size: source.serving_size,
        calories: source.calories,
        protein_g: source.protein_g,
        carbs_g: source.carbs_g,
        fat_g: source.fat_g,
        description: source.description,
        image_url: source.image_url,
        coach_notes: source.coach_notes,
        sort_order: (source.sort_order || 0) + 1,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('meal_options')
        .insert(duplicatePayload)
        .select()
        .single();
      if (error) throw error;
      return data as MealOption;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mealOptions', data.client_id] });
    },
  });
}
