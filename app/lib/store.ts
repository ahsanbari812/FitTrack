import { create } from 'zustand';
import { supabase } from './supabase';

export type ActiveTabCoach = 'dashboard' | 'client-detail' | 'diet-editor' | 'exercise-editor' | 'reminder-editor' | 'coach-profile';
export type ActiveTabClient = 'home' | 'diet' | 'workout' | 'log' | 'progress';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  suggestedName?: string;
  avatar?: string;
  hasSetName?: boolean;
  hasSetCoachProfile?: boolean;
  phone?: string;
  hasSetPhone?: boolean;
}

interface UIStore {
  // Auth state
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;


  // Active navigation selection
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;

  coachActiveTab: ActiveTabCoach;
  setCoachActiveTab: (tab: ActiveTabCoach) => void;

  clientActiveTab: ActiveTabClient;
  setClientActiveTab: (tab: ActiveTabClient) => void;

  // Active editor states
  editingDietPlanId?: string;
  setEditingDietPlanId: (id?: string) => void;
  editingExercisePlanId?: string;
  setEditingExercisePlanId: (id?: string) => void;
  editingReminderId?: string;
  setEditingReminderId: (id?: string) => void;

  // Modals & UI triggers
  isRestTimerActive: boolean;
  restTimerSeconds: number;
  setRestTimer: (active: boolean, seconds?: number) => void;

  // Coach Profile Modal (Client view)
  isCoachProfileModalOpen: boolean;
  setCoachProfileModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    supabase.auth.signOut().catch(() => {});
    set({ user: null });
  },


  selectedClientId: '',
  setSelectedClientId: (selectedClientId) => set({ selectedClientId }),

  coachActiveTab: 'dashboard',
  setCoachActiveTab: (coachActiveTab) => set({ coachActiveTab }),

  clientActiveTab: 'home',
  setClientActiveTab: (clientActiveTab) => set({ clientActiveTab }),

  editingDietPlanId: undefined,
  setEditingDietPlanId: (editingDietPlanId) => set({ editingDietPlanId }),
  editingExercisePlanId: undefined,
  setEditingExercisePlanId: (editingExercisePlanId) => set({ editingExercisePlanId }),
  editingReminderId: undefined,
  setEditingReminderId: (editingReminderId) => set({ editingReminderId }),

  isRestTimerActive: false,
  restTimerSeconds: 60,
  setRestTimer: (isRestTimerActive, seconds = 60) =>
    set({ isRestTimerActive, restTimerSeconds: seconds }),

  isCoachProfileModalOpen: false,
  setCoachProfileModalOpen: (isCoachProfileModalOpen) => set({ isCoachProfileModalOpen }),
}));
