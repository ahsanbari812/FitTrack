import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { DailyLog, LoggedFoodItem, MealOption, MealItem } from '../../types/database';

export function useLogs(clientId?: string) {
  return useQuery<DailyLog[]>({
    queryKey: ['logs', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as DailyLog[];
    },
  });
}

export function useLog(clientId?: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  return useQuery<DailyLog | null>({
    queryKey: ['log', clientId, targetDate],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', targetDate)
        .maybeSingle();
      if (error) throw error;
      return data as DailyLog | null;
    },
  });
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodCount: number;
  coachOptionCount: number;
  customFoodCount: number;
}

export function computeNutritionTotals(
  loggedFoods?: LoggedFoodItem[],
  loggedMeals?: MealItem[]
): NutritionTotals {
  if (loggedFoods && loggedFoods.length > 0) {
    return loggedFoods.reduce(
      (acc, food) => {
        const isCustom = food.source === 'custom';
        return {
          calories: acc.calories + (Number(food.calories) || 0),
          protein: acc.protein + (Number(food.protein_g) || 0),
          carbs: acc.carbs + (Number(food.carbs_g) || 0),
          fat: acc.fat + (Number(food.fat_g) || 0),
          foodCount: acc.foodCount + 1,
          coachOptionCount: acc.coachOptionCount + (isCustom ? 0 : 1),
          customFoodCount: acc.customFoodCount + (isCustom ? 1 : 0),
        };
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        foodCount: 0,
        coachOptionCount: 0,
        customFoodCount: 0,
      }
    );
  }

  // Fallback to legacy structured logged_meals if present
  if (loggedMeals && loggedMeals.length > 0) {
    const completed = loggedMeals.filter((m) => m.completed);
    return completed.reduce(
      (acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein_g) || 0),
        carbs: acc.carbs + (Number(m.carbs_g) || 0),
        fat: acc.fat + (Number(m.fat_g) || 0),
        foodCount: acc.foodCount + 1,
        coachOptionCount: acc.coachOptionCount + 1,
        customFoodCount: acc.customFoodCount,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        foodCount: 0,
        coachOptionCount: 0,
        customFoodCount: 0,
      }
    );
  }

  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    foodCount: 0,
    coachOptionCount: 0,
    customFoodCount: 0,
  };
}

/**
 * Hook to fetch calculated nutrition totals for a specific client and date.
 * Available to both Client and Coach.
 */
export function useNutritionTotals(clientId?: string, date?: string) {
  const queryResult = useLog(clientId, date);
  const totals = computeNutritionTotals(
    queryResult.data?.logged_foods,
    queryResult.data?.logged_meals
  );
  return {
    ...queryResult,
    totals,
    loggedFoods: queryResult.data?.logged_foods || [],
    loggedMeals: queryResult.data?.logged_meals || [],
  };
}

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLog: Omit<DailyLog, 'id' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('logs')
        .upsert({ ...newLog, updated_at: now }, { onConflict: 'client_id,date' })
        .select()
        .single();
      if (error) throw error;
      return data as DailyLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id, data.date] });
    },
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DailyLog> }) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('logs')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DailyLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id, data.date] });
    },
  });
}

/**
 * Client mutation to log a coach-created meal option with serving multiplier.
 * Preserves a complete nutrition snapshot in logs.logged_foods so that historical
 * data remains permanently accurate even if the coach later edits or deletes the option.
 */
export function useLogCoachOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId,
      date,
      mealOption,
      servings = 1,
    }: {
      clientId: string;
      date?: string;
      mealOption: MealOption;
      servings?: number;
    }) => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const quantity = Math.max(0.1, Number(servings) || 1);

      const snapshot: LoggedFoodItem = {
        id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: mealOption.name,
        serving_size: mealOption.serving_size,
        servings_consumed: quantity,
        calories: Math.round((Number(mealOption.calories) || 0) * quantity),
        protein_g: Math.round((Number(mealOption.protein_g) || 0) * quantity),
        carbs_g: Math.round((Number(mealOption.carbs_g) || 0) * quantity),
        fat_g: Math.round((Number(mealOption.fat_g) || 0) * quantity),
        base_calories: Number(mealOption.calories) || 0,
        base_protein_g: Number(mealOption.protein_g) || 0,
        base_carbs_g: Number(mealOption.carbs_g) || 0,
        base_fat_g: Number(mealOption.fat_g) || 0,
        source: 'coach_option',
        meal_option_id: mealOption.id,
        logged_at: now,
      };

      // 1. Fetch current log for date
      const { data: existingLog } = await supabase
        .from('logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', targetDate)
        .maybeSingle();

      let result: DailyLog;

      if (existingLog) {
        const currentFoods: LoggedFoodItem[] = existingLog.logged_foods || [];
        const updatedFoods = [...currentFoods, snapshot];

        const { data, error } = await supabase
          .from('logs')
          .update({
            logged_foods: updatedFoods,
            completed_diet: true,
            updated_at: now,
          })
          .eq('id', existingLog.id)
          .select()
          .single();
        if (error) throw error;
        result = data as DailyLog;
      } else {
        const { data, error } = await supabase
          .from('logs')
          .insert({
            client_id: clientId,
            date: targetDate,
            logged_foods: [snapshot],
            completed_diet: true,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        if (error) throw error;
        result = data as DailyLog;
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id, data.date] });
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['clientStats', data.client_id] });
    },
  });
}

/**
 * Client mutation to log a custom food item with nutrition snapshot.
 * Marked as source: 'custom' and does NOT alter the coach's meal options.
 */
export function useLogCustomFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId,
      date,
      food,
    }: {
      clientId: string;
      date?: string;
      food: {
        name: string;
        serving_size?: string;
        servings?: number;
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
      };
    }) => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const quantity = Math.max(0.1, Number(food.servings) || 1);

      const snapshot: LoggedFoodItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: food.name.trim(),
        serving_size: (food.serving_size || '').trim() || '1 serving',
        servings_consumed: quantity,
        calories: Math.round((Number(food.calories) || 0) * quantity),
        protein_g: Math.round((Number(food.protein_g) || 0) * quantity),
        carbs_g: Math.round((Number(food.carbs_g) || 0) * quantity),
        fat_g: Math.round((Number(food.fat_g) || 0) * quantity),
        base_calories: Number(food.calories) || 0,
        base_protein_g: Number(food.protein_g) || 0,
        base_carbs_g: Number(food.carbs_g) || 0,
        base_fat_g: Number(food.fat_g) || 0,
        source: 'custom',
        meal_option_id: null,
        logged_at: now,
      };

      const { data: existingLog } = await supabase
        .from('logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', targetDate)
        .maybeSingle();

      let result: DailyLog;

      if (existingLog) {
        const currentFoods: LoggedFoodItem[] = existingLog.logged_foods || [];
        const updatedFoods = [...currentFoods, snapshot];

        const { data, error } = await supabase
          .from('logs')
          .update({
            logged_foods: updatedFoods,
            completed_diet: true,
            updated_at: now,
          })
          .eq('id', existingLog.id)
          .select()
          .single();
        if (error) throw error;
        result = data as DailyLog;
      } else {
        const { data, error } = await supabase
          .from('logs')
          .insert({
            client_id: clientId,
            date: targetDate,
            logged_foods: [snapshot],
            completed_diet: true,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        if (error) throw error;
        result = data as DailyLog;
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id, data.date] });
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['clientStats', data.client_id] });
    },
  });
}

/**
 * Mutation to remove a logged food item from today's log.
 * Can be called by client or coach.
 */
export function useDeleteLoggedFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId,
      date,
      foodLogId,
    }: {
      clientId: string;
      date?: string;
      foodLogId: string;
    }) => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      const { data: existingLog, error: fetchErr } = await supabase
        .from('logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', targetDate)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!existingLog) return null;

      const currentFoods: LoggedFoodItem[] = existingLog.logged_foods || [];
      const updatedFoods = currentFoods.filter((f) => f.id !== foodLogId);

      const { data, error } = await supabase
        .from('logs')
        .update({
          logged_foods: updatedFoods,
          completed_diet: updatedFoods.length > 0,
          updated_at: now,
        })
        .eq('id', existingLog.id)
        .select()
        .single();
      if (error) throw error;
      return data as DailyLog;
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id, data.date] });
      queryClient.invalidateQueries({ queryKey: ['log', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['clientStats', data.client_id] });
    },
  });
}
