import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import {
  Dumbbell,
  Check,
  ChevronRight,
  Moon,
  ShieldCheck,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useDietPlan, useToggleMealCompletion } from '../../lib/queries/dietPlans';
import { useExercisePlan } from '../../lib/queries/exercisePlans';
import { useLog, useLogs } from '../../lib/queries/logs';
import { useHeadCoachProfile } from '../../lib/queries/profiles';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { DayOfWeek, MealItem } from '../../types/database';

const getTodayDayOfWeek = (): DayOfWeek => {
  const dayIndex = new Date().getDay();
  const mapping: DayOfWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return mapping[dayIndex] || 'Monday';
};

const formatTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const ClientHomeScreen: React.FC = () => {
  const { user, setClientActiveTab, setCoachProfileModalOpen } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const clientId = user?.id || '';
  const todayDay = getTodayDayOfWeek();

  const { data: dietPlan } = useDietPlan(clientId);
  const { data: exercisePlan } = useExercisePlan(clientId);
  const { data: todayLog } = useLog(clientId);
  const { data: coachProfile } = useHeadCoachProfile();
  const toggleMealMutation = useToggleMealCompletion();

  const [localCompletedMap, setLocalCompletedMap] = useState<Record<string, boolean>>({});

  const todayDietPlan =
    dietPlan?.day_plans?.[todayDay] || {
      daily_calorie_target: dietPlan?.daily_calorie_target || 0,
      protein_grams: dietPlan?.protein_grams || 0,
      carbs_grams: dietPlan?.carbs_grams || 0,
      fat_grams: dietPlan?.fat_grams || 0,
      meals: dietPlan?.meals || [],
    };

  const rawMeals = todayDietPlan.meals || [];
  const todayMeals: MealItem[] = rawMeals.map((m) => ({
    ...m,
    completed:
      localCompletedMap[m.id] !== undefined
        ? localCompletedMap[m.id]
        : Boolean(m.completed),
  }));

  const todayWorkoutRoutine =
    exercisePlan?.day_routines?.[todayDay] || {
      day_of_week: todayDay,
      is_rest_day: Boolean(exercisePlan?.is_rest_day),
      target_muscle: exercisePlan?.target_muscle || 'Workout Routine',
      exercises: exercisePlan?.exercises || [],
    };

  // Metrics Calculations (Preserved exactly)
  const completedMealsCount = todayMeals.filter((m) => m.completed).length;
  const totalMealsCount = todayMeals.length;
  const dietPercentage =
    totalMealsCount > 0
      ? Math.round((completedMealsCount / totalMealsCount) * 100)
      : 0;

  const completedExercisesCount = (todayWorkoutRoutine.exercises || []).filter(
    (e) => e.completed
  ).length;
  const totalExercisesCount = todayWorkoutRoutine.exercises?.length || 0;
  const workoutPercentage =
    totalExercisesCount > 0
      ? Math.round((completedExercisesCount / totalExercisesCount) * 100)
      : 0;

  const totalOverallCompletion =
    totalMealsCount > 0 || totalExercisesCount > 0
      ? Math.round(
          ((totalMealsCount > 0 ? dietPercentage : 100) +
            (todayWorkoutRoutine.is_rest_day
              ? 100
              : totalExercisesCount > 0
              ? workoutPercentage
              : 100)) /
            2
        )
      : 0;

  // Macros Consumed Calculations
  const consumedCalories = todayMeals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.calories) || 0) : acc),
    0
  );
  const consumedProtein = todayMeals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.protein_g) || 0) : acc),
    0
  );
  const consumedCarbs = todayMeals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.carbs_g) || 0) : acc),
    0
  );
  const consumedFat = todayMeals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.fat_g) || 0) : acc),
    0
  );

  const targetCalories = todayDietPlan.daily_calorie_target || 0;
  const targetProtein = todayDietPlan.protein_grams || 0;
  const targetCarbs = todayDietPlan.carbs_grams || 0;
  const targetFat = todayDietPlan.fat_grams || 0;

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleToggleHomeMeal = (mealId: string) => {
    if (!dietPlan) return;
    const targetMeal = todayMeals.find((m) => m.id === mealId);
    const nextState = !targetMeal?.completed;
    setLocalCompletedMap((prev) => ({ ...prev, [mealId]: nextState }));

    toggleMealMutation.mutate({
      dietPlanId: dietPlan.id,
      mealId,
      dayOfWeek: todayDay,
      clientId: dietPlan.client_id || clientId,
    });
  };

  const coachAvatar =
    coachProfile?.avatar_url ||
    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingHorizontal: isDesktop ? LAYOUT.paddingDesktop : LAYOUT.paddingMobile,
        },
      ]}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.headerKicker}>TODAY</Text>
        <Text style={styles.headerGreeting}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Athlete'}.
        </Text>
        <Text style={styles.headerDate}>{todayDateString}</Text>
      </View>

      {/* ================= HERO: TODAY'S PROGRESS ================= */}
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>TODAY'S PROGRESS</Text>
        <Text style={styles.heroPercentage}>{totalOverallCompletion}%</Text>

        {/* Progress Bar (Track #252B31, Progress #C7F000, 8px) */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(100, Math.max(0, totalOverallCompletion))}%` },
            ]}
          />
        </View>

        <Text style={styles.heroSubtext}>
          {todayWorkoutRoutine.is_rest_day ? (
            <Text>Scheduled Rest Day • {completedMealsCount} of {totalMealsCount} meals logged</Text>
          ) : (
            <Text>
              {completedExercisesCount} of {totalExercisesCount} exercises • {completedMealsCount} of {totalMealsCount} meals logged
            </Text>
          )}
        </Text>
      </View>

      {/* ================= WORKOUT: TODAY'S WORKOUT ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY'S WORKOUT</Text>

        <View style={styles.workoutCard}>
          <View style={styles.workoutTopRow}>
            <View style={styles.workoutInfoCol}>
              <Text style={styles.workoutKicker}>
                {todayWorkoutRoutine.is_rest_day ? 'RECOVERY PROTOCOL' : 'TRAINING FOCUS'}
              </Text>
              <Text style={styles.workoutName}>
                {todayWorkoutRoutine.is_rest_day
                  ? 'Scheduled Rest & Recovery'
                  : formatTitleCase(
                      todayWorkoutRoutine.target_muscle ||
                        exercisePlan?.title ||
                        'Workout Routine'
                    )}
              </Text>
              <Text style={styles.workoutMeta}>
                {todayWorkoutRoutine.is_rest_day
                  ? 'Muscle recovery & hydration priority'
                  : `${todayWorkoutRoutine.target_muscle || 'General Split'} • ${totalExercisesCount} Exercises`}
              </Text>
            </View>

            <View style={styles.workoutIconBox}>
              {todayWorkoutRoutine.is_rest_day ? (
                <Moon size={22} color={COLORS.warning} />
              ) : (
                <Dumbbell size={22} color={COLORS.brand} />
              )}
            </View>
          </View>

          {/* Primary CTA: START WORKOUT */}
          <TouchableOpacity
            onPress={() => setClientActiveTab('workout')}
            style={styles.startWorkoutButton}
            activeOpacity={0.85}
          >
            <Text style={styles.startWorkoutButtonText}>
              {todayWorkoutRoutine.is_rest_day ? 'VIEW REST PROTOCOL' : 'START WORKOUT'}
            </Text>
            <ChevronRight size={18} color="#080A0C" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= NUTRITION: TODAY'S NUTRITION ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY'S NUTRITION</Text>

        <View style={styles.nutritionCard}>
          {/* Top Row: Calories */}
          <View style={styles.caloriesRow}>
            <Text style={styles.caloriesLabel}>CALORIES</Text>
            <Text style={styles.caloriesValue}>
              {consumedCalories}{' '}
              <Text style={styles.caloriesTarget}>/ {targetCalories} kcal</Text>
            </Text>
          </View>

          {/* Three Macro Columns */}
          <View style={styles.macroColumnsRow}>
            {/* Protein - Lime */}
            <View style={styles.macroColumn}>
              <Text style={[styles.macroLabel, { color: COLORS.brand }]}>PROTEIN</Text>
              <Text style={styles.macroValue}>{consumedProtein}g</Text>
              <Text style={styles.macroTarget}>/ {targetProtein}g</Text>
            </View>

            {/* Carbs - Blue #55B9E8 */}
            <View style={styles.macroColumn}>
              <Text style={[styles.macroLabel, { color: COLORS.info }]}>CARBS</Text>
              <Text style={styles.macroValue}>{consumedCarbs}g</Text>
              <Text style={styles.macroTarget}>/ {targetCarbs}g</Text>
            </View>

            {/* Fats - Orange #F5A524 */}
            <View style={styles.macroColumn}>
              <Text style={[styles.macroLabel, { color: COLORS.warning }]}>FATS</Text>
              <Text style={styles.macroValue}>{consumedFat}g</Text>
              <Text style={styles.macroTarget}>/ {targetFat}g</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Meal Checklist */}
          <View style={styles.mealChecklist}>
            {todayMeals.length === 0 ? (
              <View style={styles.emptyMealsBox}>
                <Text style={styles.emptyMealsText}>No meals scheduled for today.</Text>
              </View>
            ) : (
              todayMeals.map((meal) => {
                const isDone = meal.completed;
                return (
                  <TouchableOpacity
                    key={meal.id}
                    onPress={() => handleToggleHomeMeal(meal.id)}
                    style={[styles.mealRow, isDone && styles.mealRowCompleted]}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox */}
                    <View
                      style={[
                        styles.mealCheckbox,
                        isDone ? styles.mealCheckboxChecked : styles.mealCheckboxUnchecked,
                      ]}
                    >
                      {isDone && <Check size={13} color="#080A0C" strokeWidth={3} />}
                    </View>

                    {/* Meal Details */}
                    <View style={styles.mealTextCol}>
                      <Text
                        style={[
                          styles.mealName,
                          isDone ? styles.mealNameCompleted : styles.mealNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {formatTitleCase(meal.name)}
                      </Text>
                      <Text style={styles.mealMeta}>
                        {meal.type.toUpperCase()} • {meal.calories} kcal
                      </Text>
                    </View>

                    <ChevronRight size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </View>

      {/* ================= RECOVERY ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECOVERY</Text>

        <View style={styles.recoveryCard}>
          <View style={styles.recoveryGrid}>
            <View style={styles.recoveryMetric}>
              <Text style={styles.recoveryLabel}>SLEEP</Text>
              <Text style={styles.recoveryValue}>
                {todayLog?.sleep_hours !== undefined && todayLog?.sleep_hours !== null
                  ? `${todayLog.sleep_hours}h`
                  : '--'}
              </Text>
            </View>

            <View style={styles.recoveryMetric}>
              <Text style={styles.recoveryLabel}>WATER</Text>
              <Text style={styles.recoveryValue}>
                {todayLog?.water_intake_oz !== undefined && todayLog?.water_intake_oz !== null
                  ? `${todayLog.water_intake_oz}oz`
                  : '--'}
              </Text>
            </View>

            <View style={styles.recoveryMetric}>
              <Text style={styles.recoveryLabel}>ENERGY</Text>
              <Text style={styles.recoveryValue}>
                {todayLog?.energy_rating ? `${todayLog.energy_rating}/5` : '--'}
              </Text>
            </View>
          </View>

          {/* CHECK IN Button */}
          <TouchableOpacity
            onPress={() => setClientActiveTab('log')}
            style={styles.checkInButton}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInButtonText}>CHECK IN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= COACH ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COACH</Text>

        <TouchableOpacity
          onPress={() => setCoachProfileModalOpen(true)}
          style={styles.coachCard}
          activeOpacity={0.8}
        >
          <View style={styles.coachLeft}>
            <Image source={{ uri: coachAvatar }} style={styles.coachAvatar} />
            <View style={styles.coachTextCol}>
              <View style={styles.coachNameRow}>
                <Text style={styles.coachName}>
                  {coachProfile?.full_name?.trim() || 'Coach Ahsan'}
                </Text>
                <ShieldCheck size={14} color={COLORS.brand} />
              </View>
              <Text style={styles.coachRole} numberOfLines={1}>
                {coachProfile?.coach_title?.trim() || 'Head Coach & Performance Specialist'}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Coach Feedback Note if available */}
        {todayLog?.coach_notes ? (
          <View style={styles.coachNoteCard}>
            <Text style={styles.coachNoteKicker}>NOTE FROM COACH</Text>
            <Text style={styles.coachNoteText}>"{todayLog.coach_notes}"</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },

  // Header
  header: {
    gap: 4,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerGreeting: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.sm,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroPercentage: {
    fontSize: 46,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 4,
  },
  heroSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Sections
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Workout Card
  workoutCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.lg,
  },
  workoutTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  workoutInfoCol: {
    flex: 1,
    gap: 4,
  },
  workoutKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  workoutMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  workoutIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutButton: {
    height: 50,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startWorkoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.3,
  },

  // Nutrition Card
  nutritionCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.md,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  caloriesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  caloriesValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  caloriesTarget: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  macroColumnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  macroColumn: {
    flex: 1,
    gap: 2,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroTarget: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  mealChecklist: {
    gap: SPACING.sm,
  },
  emptyMealsBox: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyMealsText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: SPACING.md,
  },
  mealRowCompleted: {
    opacity: 0.55,
  },
  mealCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCheckboxChecked: {
    backgroundColor: COLORS.brand,
  },
  mealCheckboxUnchecked: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealTextCol: {
    flex: 1,
    gap: 2,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealNameActive: {
    color: COLORS.textPrimary,
  },
  mealNameCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  mealMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Recovery Card
  recoveryCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.lg,
  },
  recoveryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoveryMetric: {
    flex: 1,
    gap: 4,
  },
  recoveryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  recoveryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkInButton: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },

  // Coach Card
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  coachLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coachTextCol: {
    flex: 1,
    gap: 2,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  coachRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  coachNoteCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
    marginTop: 6,
  },
  coachNoteKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.8,
  },
  coachNoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
