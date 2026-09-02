import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { DietPlan, MealItem } from '../../types/database';

export function useDietPlan(clientId?: string) {
  return useQuery<DietPlan | null>({
    queryKey: ['dietPlan', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as DietPlan | null;
    },
  });
}

export function useAllDietPlans() {
  return useQuery<DietPlan[]>({
    queryKey: ['allDietPlans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('diet_plans').select('*');
      if (error) throw error;
      return data as DietPlan[];
    },
  });
}

export function useCreateDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPlan: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('diet_plans')
        .insert({ ...newPlan, created_at: now, updated_at: now })
        .select()
        .single();
      if (error) throw error;
      return data as DietPlan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dietPlan', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['allDietPlans'] });
    },
  });
}

export function useUpdateDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DietPlan> }) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('diet_plans')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DietPlan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dietPlan', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['allDietPlans'] });
    },
  });
}

export function useToggleMealCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dietPlanId,
      mealId,
      dayOfWeek,
      clientId,
    }: {
      dietPlanId: string;
      mealId: string;
      dayOfWeek?: string;
      clientId?: string;
    }) => {
      const { data: fetchedPlan, error: fetchErr } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('id', dietPlanId)
        .single();
      if (fetchErr) throw fetchErr;

      const currentMeals: MealItem[] = fetchedPlan.meals || [];
      let updatedDayPlans = fetchedPlan.day_plans || {};
      let updatedMeals = currentMeals;

      if (dayOfWeek) {
        if (!updatedDayPlans[dayOfWeek]) {
          updatedDayPlans[dayOfWeek] = {
            daily_calorie_target: fetchedPlan.daily_calorie_target || 0,
            protein_grams: fetchedPlan.protein_grams || 0,
            carbs_grams: fetchedPlan.carbs_grams || 0,
            fat_grams: fetchedPlan.fat_grams || 0,
            meals: currentMeals.map((m) => ({ ...m, completed: false })),
          };
        }
        const dayMeals: MealItem[] = updatedDayPlans[dayOfWeek].meals || [];
        const updatedDayMeals = dayMeals.map((m: MealItem) =>
          m.id === mealId ? { ...m, completed: !m.completed } : m
        );
        updatedDayPlans = {
          ...updatedDayPlans,
          [dayOfWeek]: {
            ...updatedDayPlans[dayOfWeek],
            meals: updatedDayMeals,
          },
        };
      } else {
        updatedMeals = currentMeals.map((m: MealItem) =>
          m.id === mealId ? { ...m, completed: !m.completed } : m
        );
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .update({
          meals: updatedMeals,
          day_plans: updatedDayPlans,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dietPlanId)
        .select()
        .single();
      if (error) throw error;

      // Also auto-sync to today's logs for client
      const targetClientId = clientId || fetchedPlan.client_id;
      const todayDate = new Date().toISOString().split('T')[0];
      if (targetClientId) {
        try {
          const activeDayMeals = (dayOfWeek ? updatedDayPlans[dayOfWeek]?.meals : updatedMeals) || [];
          const completedMeals = activeDayMeals.filter((m: MealItem) => m.completed);
          const hasCompletedDiet = completedMeals.length > 0;

          await supabase.from('logs').upsert(
            {
              client_id: targetClientId,
              date: todayDate,
              completed_diet: hasCompletedDiet,
              logged_meals: completedMeals,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'client_id,date' }
          );
        } catch (logErr) {
          console.warn('Could not auto-sync log on meal toggle:', logErr);
        }
      }

      return data as DietPlan;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['dietPlan', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['dietPlan'] });
        queryClient.invalidateQueries({ queryKey: ['allDietPlans'] });
        queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['logs'] });
        queryClient.invalidateQueries({ queryKey: ['log'] });
        queryClient.invalidateQueries({ queryKey: ['clientStats'] });
      }
    },
  });
}

export function useDeleteDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('diet_plans').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDietPlans'] });
      queryClient.invalidateQueries({ queryKey: ['dietPlan'] });
    },
  });
}
