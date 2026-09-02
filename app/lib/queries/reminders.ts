import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Reminder } from '../../types/database';

export function useReminders(clientId?: string) {
  return useQuery<Reminder[]>({
    queryKey: ['reminders', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('client_id', clientId)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data as Reminder[];
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newReminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('reminders')
        .insert({ ...newReminder, created_at: now, updated_at: now })
        .select()
        .single();
      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', variables.client_id] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reminder> }) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('reminders')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', data.client_id] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      return { id, clientId };
    },
    onSuccess: ({ clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', clientId] });
    },
  });
}
