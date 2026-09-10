export type UserRole = 'coach' | 'client';
export type ClientStatus = 'active' | 'inactive' | 'pending';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  assigned_coach_id?: string | null;
  target_weight?: number | null;
  target_weight_lbs?: number | null;
  status: ClientStatus;
  // Coach profile fields
  coach_title?: string | null;
  coach_bio?: string | null;
  coach_philosophy?: string | null;
  certifications?: string[] | null;
  achievements?: string[] | null;
  specialties?: string[] | null;
  experience_years?: number | null;
  instagram_handle?: string | null;
  has_set_coach_profile?: boolean;
  has_set_name?: boolean;
  phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  name: string;
  type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  servings?: string;
  completed: boolean;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DayDietPlan {
  daily_calorie_target: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  meals: MealItem[];
}

export interface DietPlan {
  id: string;
  client_id: string;
  coach_id: string;
  title: string;
  daily_calorie_target: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  meals: MealItem[];
  day_plans?: Partial<Record<DayOfWeek, DayDietPlan>>;
  created_at: string;
  updated_at: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
  weight_lbs: number;
  notes?: string;
  video_url?: string;
  completed_sets?: number[]; // reps per set completed
  completed: boolean;
}

export interface DayWorkoutRoutine {
  day_of_week: DayOfWeek;
  is_rest_day: boolean;
  target_muscle: string; // e.g. "Chest & Triceps" or "Rest Day"
  exercises: ExerciseItem[];
}

export interface ExercisePlan {
  id: string;
  client_id: string;
  coach_id: string;
  title: string;
  day_of_week: DayOfWeek;
  target_muscle?: string;
  is_rest_day?: boolean;
  exercises: ExerciseItem[];
  day_routines?: Partial<Record<DayOfWeek, DayWorkoutRoutine>>;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  client_id: string;
  coach_id: string;
  title: string;
  message: string;
  scheduled_time: string; // e.g. "08:30 AM"
  recurring_days: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  client_id: string;
  date: string; // YYYY-MM-DD
  weight_lbs?: number | null;
  water_intake_oz: number;
  sleep_hours: number;
  energy_rating: number; // 1-5
  completed_diet: boolean;
  completed_workout: boolean;
  logged_meals?: MealItem[];
  logged_exercises?: ExerciseItem[];
  coach_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientStats {
  client_id: string;
  client_name: string;
  avatar_url?: string;
  streak_days: number;
  workout_completion_rate: number; // 0 - 100
  diet_compliance_rate: number; // 0 - 100
  last_logged_date: string;
  current_weight?: number;
  target_weight?: number;
  status: ClientStatus;
}

export interface CoachTransformation {
  id: string;
  coach_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
