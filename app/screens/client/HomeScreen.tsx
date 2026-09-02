import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { Flame, Dumbbell, CircleCheck as CheckCircle2, Moon, Sparkles, Check, Award, ShieldCheck } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useDietPlan, useToggleMealCompletion } from '../../lib/queries/dietPlans';
import { useExercisePlan } from '../../lib/queries/exercisePlans';
import { useLog, useLogs } from '../../lib/queries/logs';
import { useHeadCoachProfile } from '../../lib/queries/profiles';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
import { DayOfWeek, MealItem } from '../../types/database';

const getTodayDayOfWeek = (): DayOfWeek => {
  const dayIndex = new Date().getDay();
  const mapping: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

export const ClientHomeScreen: React.FC = () => {
  const { themeMode, user, setClientActiveTab, setCoachProfileModalOpen } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const clientId = user?.id || '';
  const todayDay = getTodayDayOfWeek();

  const { data: dietPlan } = useDietPlan(clientId);
  const { data: exercisePlan } = useExercisePlan(clientId);
  const { data: todayLog } = useLog(clientId);
  const { data: allLogs } = useLogs(clientId);
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
    completed: localCompletedMap[m.id] !== undefined ? localCompletedMap[m.id] : Boolean(m.completed),
  }));

  const todayWorkoutRoutine =
    exercisePlan?.day_routines?.[todayDay] || {
      day_of_week: todayDay,
      is_rest_day: Boolean(exercisePlan?.is_rest_day),
      target_muscle: exercisePlan?.target_muscle || 'Workout Routine',
      exercises: exercisePlan?.exercises || [],
    };

  const completedMealsCount = todayMeals.filter((m) => m.completed).length;
  const totalMealsCount = todayMeals.length;
  const dietPercentage =
    totalMealsCount > 0 ? Math.round((completedMealsCount / totalMealsCount) * 100) : 0;

  const completedExercisesCount = (todayWorkoutRoutine.exercises || []).filter((e) => e.completed).length;
  const totalExercisesCount = todayWorkoutRoutine.exercises?.length || 0;
  const workoutPercentage =
    totalExercisesCount > 0 ? Math.round((completedExercisesCount / totalExercisesCount) * 100) : 0;

  const totalOverallCompletion =
    totalMealsCount > 0 || totalExercisesCount > 0
      ? Math.round(
          ((totalMealsCount > 0 ? dietPercentage : 100) +
            (todayWorkoutRoutine.is_rest_day ? 100 : totalExercisesCount > 0 ? workoutPercentage : 100)) /
            2
        )
      : 0;

  const activeStreak = (allLogs || []).filter((l) => l.completed_workout || l.completed_diet).length;
  const displayStreak = Math.max(activeStreak, completedMealsCount > 0 || completedExercisesCount > 0 ? 1 : 0);

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

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Date Header & Greeting */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{todayDateString.toUpperCase()}</Text>
        <Text style={[styles.greeting, { color: theme.textPrimary }]}>
          Hey, {user?.name?.split(' ')[0] || 'there'}.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          You're at <Text style={styles.highlightText}>{totalOverallCompletion}%</Text> of your daily goal.
        </Text>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{displayStreak}</Text>
          <View style={styles.streakLabelRow}>
            <Flame size={16} color="#0F172A" fill="#0F172A" />
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={[styles.calorieCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={styles.calorieNumber}>{todayDietPlan.daily_calorie_target || 0}</Text>
          <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>Calories Target</Text>
        </View>
      </View>

      {/* Active Workout Plan for Today */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>TODAY'S TRAINING ({todayDay.toUpperCase()})</Text>
          {!todayWorkoutRoutine.is_rest_day && totalExercisesCount > 0 && (
            <Text style={styles.sectionProgressText}>
              {completedExercisesCount}/{totalExercisesCount} Done ({workoutPercentage}%)
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setClientActiveTab('workout')}
          style={[styles.workoutCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          activeOpacity={0.85}
        >
          <View style={styles.workoutRow}>
            <View style={styles.workoutIconBox}>
              {todayWorkoutRoutine.is_rest_day ? (
                <Moon size={22} color="#F97316" />
              ) : (
                <Dumbbell size={22} color="#CCFF00" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.workoutTag}>
                {todayWorkoutRoutine.is_rest_day ? 'RECOVERY PROTOCOL' : 'TRAINING FOCUS'}
              </Text>
              <Text style={[styles.workoutTitle, { color: theme.textPrimary }]}>
                {todayWorkoutRoutine.is_rest_day
                  ? 'Scheduled Rest & Recovery Day'
                  : formatTitleCase(todayWorkoutRoutine.target_muscle || exercisePlan?.title || 'Workout Routine')}
              </Text>
            </View>

            <View
              style={[
                styles.startBtn,
                todayWorkoutRoutine.is_rest_day
                  ? styles.restBtn
                  : workoutPercentage === 100
                  ? styles.doneBtn
                  : styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.startBtnText,
                  todayWorkoutRoutine.is_rest_day
                    ? { color: '#F97316' }
                    : workoutPercentage === 100
                    ? { color: '#34D399' }
                    : { color: '#0F172A' },
                ]}
              >
                {todayWorkoutRoutine.is_rest_day ? 'Rest' : workoutPercentage === 100 ? 'Done' : 'Open'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Nutrition Plan for Today */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>TODAY'S MEALS ({todayDay.toUpperCase()})</Text>
          {totalMealsCount > 0 && (
            <Text style={styles.sectionProgressText}>
              {completedMealsCount}/{totalMealsCount} Logged ({dietPercentage}%)
            </Text>
          )}
        </View>

        <View style={{ gap: 8 }}>
          {todayMeals.length === 0 ? (
            <View style={[styles.emptyMealCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Text style={styles.emptyMealText}>No meals scheduled for today yet.</Text>
            </View>
          ) : (
            todayMeals.map((meal) => (
              <View
                key={meal.id}
                style={[
                  styles.mealCard,
                  { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                  meal.completed && styles.mealCardCompleted,
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleToggleHomeMeal(meal.id)}
                  style={[
                    styles.homeCheckBox,
                    meal.completed ? styles.homeCheckActive : styles.homeCheckInactive,
                  ]}
                  activeOpacity={0.8}
                >
                  {meal.completed && <Check size={12} color="#0F172A" />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setClientActiveTab('diet')}
                  style={{ flex: 1 }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mealName, { color: theme.textPrimary }]}>{formatTitleCase(meal.name)}</Text>
                  <Text style={styles.mealSub}>
                    {meal.calories} kcal • {meal.type.toUpperCase()}
                  </Text>
                </TouchableOpacity>

                {meal.completed ? (
                  <View style={styles.loggedPill}>
                    <Text style={styles.loggedPillText}>Logged</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleToggleHomeMeal(meal.id)}>
                    <Text style={styles.tapLogHomeText}>Tap to Log</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Coach Feedback Box */}
      {todayLog?.coach_notes && (
        <View style={styles.coachNoteCard}>
          <Text style={styles.coachNoteHeader}>NOTE FROM COACH:</Text>
          <Text style={styles.coachNoteContent}>"{todayLog.coach_notes}"</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  highlightText: {
    color: '#CCFF00',
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    height: 110,
    borderRadius: 24,
    backgroundColor: '#CCFF00',
    padding: 16,
    justifyContent: 'space-between',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  streakLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  calorieCard: {
    flex: 1,
    height: 110,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  calorieNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#CCFF00',
  },
  calorieLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  sectionProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  workoutCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutIconBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  workoutTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  startBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  activeBtn: {
    backgroundColor: '#CCFF00',
  },
  doneBtn: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  restBtn: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  mealCardCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  homeCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  homeCheckActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  homeCheckInactive: {
    backgroundColor: '#090D16',
    borderColor: '#334155',
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  loggedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  loggedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
  },
  tapLogHomeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyMealCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  coachNoteCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    gap: 4,
  },
  coachNoteHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCFF00',
  },
  coachNoteContent: {
    fontSize: 12,
    color: '#E2E8F0',
    fontStyle: 'italic',
  },
});
