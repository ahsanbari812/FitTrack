import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useDietPlan, useToggleMealCompletion } from '../../lib/queries/dietPlans';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { DayOfWeek, MealItem } from '../../types/database';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_ABBREVIATIONS: Record<DayOfWeek, string> = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN',
};

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

export const ClientDietPlanScreen: React.FC = () => {
  const { user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const clientId = user?.id || '';
  const { data: dietPlan } = useDietPlan(clientId);
  const toggleMealMutation = useToggleMealCompletion();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localCompletedMap, setLocalCompletedMap] = useState<Record<string, boolean>>({});

  const getMealKey = (day: DayOfWeek, id: string) => `${day}:${id}`;

  const activeDayPlan =
    dietPlan?.day_plans?.[selectedDay] || {
      daily_calorie_target: dietPlan?.daily_calorie_target || 0,
      protein_grams: dietPlan?.protein_grams || 0,
      carbs_grams: dietPlan?.carbs_grams || 0,
      fat_grams: dietPlan?.fat_grams || 0,
      meals: dietPlan?.meals || [],
    };

  const rawMeals = activeDayPlan.meals || [];
  const meals: MealItem[] = rawMeals.map((m) => {
    const key = getMealKey(selectedDay, m.id);
    return {
      ...m,
      completed:
        localCompletedMap[key] !== undefined
          ? localCompletedMap[key]
          : Boolean(m.completed),
    };
  });

  const consumedCalories = meals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.calories) || 0) : acc),
    0
  );
  const targetCalories = activeDayPlan.daily_calorie_target || 0;

  const consumedProtein = meals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.protein_g) || 0) : acc),
    0
  );
  const targetProtein = activeDayPlan.protein_grams || 0;

  const consumedCarbs = meals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.carbs_g) || 0) : acc),
    0
  );
  const targetCarbs = activeDayPlan.carbs_grams || 0;

  const consumedFat = meals.reduce(
    (acc, m) => (m.completed ? acc + (Number(m.fat_g) || 0) : acc),
    0
  );
  const targetFat = activeDayPlan.fat_grams || 0;

  const handleToggleMeal = (mealId: string) => {
    if (dietPlan) {
      const meal = meals.find((m) => m.id === mealId);
      const willBeCompleted = !meal?.completed;
      const key = getMealKey(selectedDay, mealId);

      setLocalCompletedMap((prev) => ({ ...prev, [key]: willBeCompleted }));

      toggleMealMutation.mutate({
        dietPlanId: dietPlan.id,
        mealId,
        dayOfWeek: selectedDay,
        clientId: dietPlan.client_id || clientId,
      });

      if (willBeCompleted) {
        setToastMessage(`Logged ${formatTitleCase(meal?.name || 'Meal')}`);
      } else {
        setToastMessage(`Meal unchecked`);
      }
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const proteinRatio =
    targetProtein > 0 ? Math.min(1, consumedProtein / targetProtein) : 0;
  const carbsRatio =
    targetCarbs > 0 ? Math.min(1, consumedCarbs / targetCarbs) : 0;
  const fatRatio =
    targetFat > 0 ? Math.min(1, consumedFat / targetFat) : 0;

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
      {/* Toast Feedback */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Sparkles size={14} color={COLORS.brand} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.headerKicker}>NUTRITION</Text>
        <Text style={styles.headerTitle}>
          {dietPlan?.title || 'Daily Nutrition Protocol'}
        </Text>
        <Text style={styles.headerSecondary}>7-DAY MEAL PLAN</Text>
      </View>

      {/* ================= DAY SELECTOR ================= */}
      <View style={styles.daySelectorWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorRow}
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const label = DAY_ABBREVIATIONS[day];
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayPill,
                  isSelected ? styles.dayPillSelected : styles.dayPillUnselected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    isSelected
                      ? styles.dayPillTextSelected
                      : styles.dayPillTextUnselected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ================= MACRO SUMMARY ================= */}
      <View style={styles.macroCard}>
        {/* Top: Calories */}
        <View style={styles.caloriesTopRow}>
          <Text style={styles.caloriesKicker}>CALORIES</Text>
          <Text style={styles.caloriesValue}>
            {targetCalories}{' '}
            <Text style={styles.caloriesUnit}>kcal</Text>
          </Text>
          <Text style={styles.caloriesSub}>
            {consumedCalories} kcal logged today
          </Text>
        </View>

        {/* Three Macro Columns */}
        <View style={styles.macroColumns}>
          {/* Protein */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroKicker, { color: COLORS.brand }]}>
              PROTEIN
            </Text>
            <Text style={styles.macroAmount}>
              {consumedProtein}
              <Text style={styles.macroTarget}>/{targetProtein}g</Text>
            </Text>
            <View style={styles.subtleTrack}>
              <View
                style={[
                  styles.subtleProgress,
                  {
                    backgroundColor: COLORS.brand,
                    width: `${Math.round(proteinRatio * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroKicker, { color: COLORS.info }]}>
              CARBS
            </Text>
            <Text style={styles.macroAmount}>
              {consumedCarbs}
              <Text style={styles.macroTarget}>/{targetCarbs}g</Text>
            </Text>
            <View style={styles.subtleTrack}>
              <View
                style={[
                  styles.subtleProgress,
                  {
                    backgroundColor: COLORS.info,
                    width: `${Math.round(carbsRatio * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Fats */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroKicker, { color: COLORS.warning }]}>
              FATS
            </Text>
            <Text style={styles.macroAmount}>
              {consumedFat}
              <Text style={styles.macroTarget}>/{targetFat}g</Text>
            </Text>
            <View style={styles.subtleTrack}>
              <View
                style={[
                  styles.subtleProgress,
                  {
                    backgroundColor: COLORS.warning,
                    width: `${Math.round(fatRatio * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ================= MEAL TIMELINE ================= */}
      <View style={styles.timelineSection}>
        <Text style={styles.timelineHeader}>
          {selectedDay.toUpperCase()} PROTOCOL
        </Text>

        {meals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No meals scheduled for {selectedDay}
            </Text>
            <Text style={styles.emptySub}>
              Your coach will configure your nutrition protocol for this day.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {meals.map((meal, index) => {
              const isDone = meal.completed;
              const isLast = index === meals.length - 1;

              return (
                <View
                  key={meal.id}
                  style={[
                    styles.timelineItem,
                    isDone && styles.timelineItemCompleted,
                  ]}
                >
                  {/* Left: Timeline Axis */}
                  <View style={styles.timelineAxis}>
                    <View
                      style={[
                        styles.timelineDot,
                        isDone && styles.timelineDotCompleted,
                      ]}
                    />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  {/* Center/Right: Meal Content */}
                  <View style={styles.timelineContent}>
                    <View style={styles.mealInfoCol}>
                      <Text style={styles.mealTypeLabel}>
                        {meal.type.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          styles.mealTitle,
                          isDone
                            ? styles.mealTitleCompleted
                            : styles.mealTitleActive,
                        ]}
                      >
                        {formatTitleCase(meal.name)}
                      </Text>
                      <Text style={styles.mealMeta}>
                        {meal.calories} kcal
                        {meal.servings ? ` • ${meal.servings}` : ''} •{' '}
                        {meal.protein_g || 0}P • {meal.carbs_g || 0}C •{' '}
                        {meal.fat_g || 0}F
                      </Text>
                    </View>

                    {/* Completion Checkbox */}
                    <TouchableOpacity
                      onPress={() => handleToggleMeal(meal.id)}
                      style={[
                        styles.checkbox,
                        isDone ? styles.checkboxChecked : styles.checkboxUnchecked,
                      ]}
                      activeOpacity={0.8}
                    >
                      {isDone && <Check size={14} color="#080A0C" strokeWidth={3} />}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },

  // Toast
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  // Day Selector
  daySelectorWrapper: {
    marginTop: 2,
  },
  daySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dayPill: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: COLORS.brand,
  },
  dayPillUnselected: {
    backgroundColor: COLORS.surfaceElevated,
  },
  dayPillText: {
    fontSize: 13,
    letterSpacing: 0.6,
  },
  dayPillTextSelected: {
    fontWeight: '700',
    color: '#080A0C',
  },
  dayPillTextUnselected: {
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Macro Summary Card
  macroCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.lg,
  },
  caloriesTopRow: {
    gap: 4,
  },
  caloriesKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  caloriesUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  caloriesSub: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  macroColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  macroCol: {
    flex: 1,
    gap: 4,
  },
  macroKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  macroAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroTarget: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  subtleTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  subtleProgress: {
    height: '100%',
    borderRadius: 2,
  },

  // Timeline Section
  timelineSection: {
    gap: SPACING.md,
  },
  timelineHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineItemCompleted: {
    opacity: 0.55,
  },
  timelineAxis: {
    width: 22,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginTop: 5,
    zIndex: 2,
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.brand,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingLeft: SPACING.md,
    paddingBottom: 24,
    gap: SPACING.md,
  },
  mealInfoCol: {
    flex: 1,
    gap: 3,
  },
  mealTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  mealTitleActive: {
    color: COLORS.textPrimary,
  },
  mealTitleCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  mealMeta: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '400',
    marginTop: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.brand,
  },
  checkboxUnchecked: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
