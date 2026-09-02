import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { DailyLog } from '../../types/database';

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
