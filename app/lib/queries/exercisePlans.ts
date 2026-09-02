import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { ExercisePlan, ExerciseItem } from '../../types/database';

export function useExercisePlan(clientId?: string) {
  return useQuery<ExercisePlan | null>({
    queryKey: ['exercisePlan', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('exercise_plans')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ExercisePlan | null;
    },
  });
}

export function useAllExercisePlans() {
  return useQuery<ExercisePlan[]>({
    queryKey: ['allExercisePlans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercise_plans').select('*');
      if (error) throw error;
      return data as ExercisePlan[];
    },
  });
}

export function useCreateExercisePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPlan: Omit<ExercisePlan, 'id' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('exercise_plans')
        .insert({ ...newPlan, created_at: now, updated_at: now })
        .select()
        .single();
      if (error) throw error;
      return data as ExercisePlan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercisePlan', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['allExercisePlans'] });
    },
  });
}

export function useUpdateExercisePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExercisePlan> }) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('exercise_plans')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ExercisePlan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exercisePlan', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['allExercisePlans'] });
    },
  });
}

export function useToggleExerciseCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      exercisePlanId,
      exerciseId,
      dayOfWeek,
      clientId,
    }: {
      exercisePlanId: string;
      exerciseId: string;
      dayOfWeek?: string;
      clientId?: string;
    }) => {
      const { data: fetchedPlan, error: fetchErr } = await supabase
        .from('exercise_plans')
        .select('*')
        .eq('id', exercisePlanId)
        .single();
      if (fetchErr) throw fetchErr;

      const currentExercises: ExerciseItem[] = fetchedPlan.exercises || [];
      let updatedDayRoutines = fetchedPlan.day_routines || {};

      let updatedExercises = currentExercises;

      if (dayOfWeek) {
        if (!updatedDayRoutines[dayOfWeek]) {
          updatedDayRoutines[dayOfWeek] = {
            day_of_week: dayOfWeek,
            is_rest_day: Boolean(fetchedPlan.is_rest_day),
            target_muscle: fetchedPlan.target_muscle || 'Workout Routine',
            exercises: currentExercises.map((e) => ({ ...e, completed: false })),
          };
        }
        const dayExs: ExerciseItem[] = updatedDayRoutines[dayOfWeek].exercises || [];
        const updatedDayExs = dayExs.map((ex: ExerciseItem) =>
          ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
        );
        updatedDayRoutines = {
          ...updatedDayRoutines,
          [dayOfWeek]: {
            ...updatedDayRoutines[dayOfWeek],
            exercises: updatedDayExs,
          },
        };
      } else {
        updatedExercises = currentExercises.map((ex: ExerciseItem) =>
          ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
        );
      }

      const { data, error } = await supabase
        .from('exercise_plans')
        .update({
          exercises: updatedExercises,
          day_routines: updatedDayRoutines,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exercisePlanId)
        .select()
        .single();
      if (error) throw error;

      // Also auto-sync to today's logs for client
      const targetClientId = clientId || fetchedPlan.client_id;
      const todayDate = new Date().toISOString().split('T')[0];
      if (targetClientId) {
        try {
          const activeDayExs = (dayOfWeek ? updatedDayRoutines[dayOfWeek]?.exercises : updatedExercises) || [];
          const completedExs = activeDayExs.filter((e: ExerciseItem) => e.completed);
          const hasCompletedWorkout = completedExs.length > 0;

          await supabase.from('logs').upsert(
            {
              client_id: targetClientId,
              date: todayDate,
              completed_workout: hasCompletedWorkout,
              logged_exercises: completedExs,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'client_id,date' }
          );
        } catch (logErr) {
          console.warn('Could not auto-sync log on exercise toggle:', logErr);
        }
      }

      return data as ExercisePlan;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['exercisePlan', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['exercisePlan'] });
        queryClient.invalidateQueries({ queryKey: ['allExercisePlans'] });
        queryClient.invalidateQueries({ queryKey: ['logs', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['logs'] });
        queryClient.invalidateQueries({ queryKey: ['log'] });
        queryClient.invalidateQueries({ queryKey: ['clientStats'] });
      }
    },
  });
}

export function useDeleteExercisePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercise_plans').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allExercisePlans'] });
      queryClient.invalidateQueries({ queryKey: ['exercisePlan'] });
    },
  });
}
