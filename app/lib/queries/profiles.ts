import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Profile, ClientStats } from '../../types/database';
import { COACH_EMAIL } from '../../config/auth';

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useClients() {
  return useQuery<Profile[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('email', COACH_EMAIL)
        .order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useProfile(id?: string) {
  return useQuery<Profile | null>({
    queryKey: ['profile', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useProfileByEmail(email?: string) {
  return useQuery<Profile | null>({
    queryKey: ['profileByEmail', email],
    enabled: Boolean(email),
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfileStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Profile['status'] }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateTargetWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, targetWeight }: { clientId: string; targetWeight: number }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ target_weight: targetWeight, updated_at: new Date().toISOString() })
        .eq('id', clientId)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientStats', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useClientStats(clientId: string) {
  return useQuery<ClientStats>({
    queryKey: ['clientStats', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      let clientName = 'Client';
      let avatarUrl: string | undefined = undefined;
      let status: Profile['status'] = 'active';
      let latestWeight = 0;
      let targetWeight: number | undefined = undefined;
      let lastLoggedDate = new Date().toISOString().split('T')[0];
      let streakDays = 0;
      let workoutCompletionRate = 0;
      let dietComplianceRate = 0;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', clientId).single();
      if (prof) {
        clientName = prof.full_name;
        avatarUrl = prof.avatar_url || undefined;
        status = prof.status;
        if (prof.target_weight !== undefined && prof.target_weight !== null) {
          targetWeight = Number(prof.target_weight);
        }
      }

      const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(30);

      if (logs && logs.length > 0) {
        lastLoggedDate = logs[0].date;
        if (logs[0].weight_lbs) {
          latestWeight = Number(logs[0].weight_lbs);
        }

        // Calculate streak from consecutive logged days
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < logs.length; i++) {
          const logDate = new Date(logs[i].date);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);
          if (logDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            streak++;
          } else {
            break;
          }
        }
        streakDays = streak;

        // Calculate compliance rates from last 30 logs
        const workoutDays = logs.filter((l) => l.completed_workout).length;
        const dietDays = logs.filter((l) => l.completed_diet).length;
        workoutCompletionRate = Math.round((workoutDays / logs.length) * 100);
        dietComplianceRate = Math.round((dietDays / logs.length) * 100);
      }

      return {
        client_id: clientId,
        client_name: clientName,
        avatar_url: avatarUrl,
        streak_days: streakDays,
        workout_completion_rate: workoutCompletionRate,
        diet_compliance_rate: dietComplianceRate,
        last_logged_date: lastLoggedDate,
        current_weight: latestWeight,
        target_weight: targetWeight,
        status,
      };
    },
  });
}

export function useHeadCoachProfile() {
  return useQuery<Profile | null>({
    queryKey: ['headCoachProfile'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.${COACH_EMAIL},role.eq.coach`)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (data) return data as Profile;

        const { data: roleData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'coach')
          .limit(1)
          .maybeSingle();

        if (roleData) return roleData as Profile;
      } catch (err) {
        console.warn('Error fetching head coach profile:', err);
      }
      return null;
    },
  });
}

export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      coachId,
      updates,
    }: {
      coachId: string;
      updates: Partial<Profile>;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          has_set_coach_profile: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coachId)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['headCoachProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useUpdateDisplayName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, displayName }: { userId: string; displayName: string }) => {
      // 1. Update the profiles table (source of truth)
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;

      // 2. Sync to auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: displayName, name: displayName, has_set_name: true },
      });

      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['headCoachProfile'] });
      queryClient.invalidateQueries({ queryKey: ['clientStats'] });
    },
  });
}

export function useUpdatePhoneNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, phoneNumber }: { userId: string; phoneNumber: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientStats'] });
      queryClient.invalidateQueries({ queryKey: ['headCoachProfile'] });
    },
  });
}
