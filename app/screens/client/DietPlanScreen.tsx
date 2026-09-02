import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Check, Calendar, Utensils, Flame, Sparkles, CircleCheck } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useDietPlan, useToggleMealCompletion } from '../../lib/queries/dietPlans';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
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

export const ClientDietPlanScreen: React.FC = () => {
  const { themeMode, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const clientId = user?.id || '';
  const { data: dietPlan } = useDietPlan(clientId);
  const toggleMealMutation = useToggleMealCompletion();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localCompletedMap, setLocalCompletedMap] = useState<Record<string, boolean>>({});
  const today = getTodayDayOfWeek();

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
      completed: localCompletedMap[key] !== undefined ? localCompletedMap[key] : Boolean(m.completed),
    };
  });

  const breakfastMeals = meals.filter((m) => m.type === 'breakfast');
  const lunchMeals = meals.filter((m) => m.type === 'lunch');
  const dinnerMeals = meals.filter((m) => m.type === 'dinner');
  const snackMeals = meals.filter((m) => m.type === 'snack');

  const consumedCalories = meals.reduce((acc, m) => (m.completed ? acc + (Number(m.calories) || 0) : acc), 0);
  const targetCalories = activeDayPlan.daily_calorie_target || 0;
  const consumedProtein = meals.reduce((acc, m) => (m.completed ? acc + (Number(m.protein_g) || 0) : acc), 0);
  const consumedCarbs = meals.reduce((acc, m) => (m.completed ? acc + (Number(m.carbs_g) || 0) : acc), 0);
  const consumedFat = meals.reduce((acc, m) => (m.completed ? acc + (Number(m.fat_g) || 0) : acc), 0);

  const completedMealsCount = meals.filter((m) => m.completed).length;
  const caloriePercent =
    targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0;

  const handleToggleMeal = (mealId: string) => {
    if (dietPlan) {
      const meal = meals.find((m) => m.id === mealId);
      const willBeCompleted = !meal?.completed;
      const key = getMealKey(selectedDay, mealId);

      // Optimistic day-scoped instant UI update
      setLocalCompletedMap((prev) => ({ ...prev, [key]: willBeCompleted }));

      toggleMealMutation.mutate({
        dietPlanId: dietPlan.id,
        mealId,
        dayOfWeek: selectedDay,
        clientId: dietPlan.client_id || clientId,
      });

      if (willBeCompleted) {
        setToastMessage(`🍳 Logged ${formatTitleCase(meal?.name || 'Meal')}! +${meal?.calories || 0} kcal`);
      } else {
        setToastMessage(`Meal unchecked`);
      }
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Sparkles size={14} color="#CCFF00" />
          <Text style={styles.toastBannerText}>{toastMessage}</Text>
        </View>
      )}

      {/* 7-Day Day Selector Strip */}
      <View style={styles.daysHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Calendar size={12} color="#CCFF00" />
          <Text style={styles.daysLabel}>SELECT DAY</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const isCurrentToday = today === day;
            const shortName = day.slice(0, 3).toUpperCase();
            const dayPlan = dietPlan?.day_plans?.[day];
            const dayMeals = dayPlan?.meals || [];
            const dayDoneCount = dayMeals.filter((m) => {
              const k = getMealKey(day, m.id);
              return localCompletedMap[k] !== undefined ? localCompletedMap[k] : Boolean(m.completed);
            }).length;
            const isDayAllDone = dayDoneCount === dayMeals.length && dayMeals.length > 0;

            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayTab,
                  isSelected ? styles.dayTabActive : styles.dayTabInactive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dayTabShort,
                    isSelected ? { color: '#0F172A' } : { color: '#94A3B8' },
                  ]}
                >
                  {shortName}
                </Text>
                <Text
                  style={[
                    styles.dayTabSub,
                    isSelected
                      ? { color: '#0F172A' }
                      : isDayAllDone
                      ? { color: '#34D399' }
                      : dayDoneCount > 0
                      ? { color: '#CCFF00' }
                      : { color: '#64748B' },
                  ]}
                >
                  {dayDoneCount > 0 ? `${dayDoneCount}/${dayMeals.length}` : `${dayMeals.length}m`}
                </Text>
                {isCurrentToday && (
                  <View
                    style={[
                      styles.todayDot,
                      isSelected ? { backgroundColor: '#0F172A' } : { backgroundColor: '#CCFF00' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Title & Calories Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.dayTag}>
              {selectedDay.toUpperCase()} {selectedDay === today ? '• TODAY' : ''}
            </Text>
            <Text style={[styles.planTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {dietPlan?.title || 'Daily Nutrition Plan'}
            </Text>
            <Text style={[styles.planSub, completedMealsCount > 0 && { color: '#34D399' }]}>
              {completedMealsCount}/{meals.length} Meals Eaten & Logged ({caloriePercent}%)
            </Text>
          </View>
          <View style={[styles.kcalBadge, caloriePercent === 100 && styles.kcalBadgeFull]}>
            <Flame size={12} color={caloriePercent === 100 ? '#34D399' : '#CCFF00'} />
            <Text style={[styles.kcalVal, caloriePercent === 100 && { color: '#34D399' }]}>
              {consumedCalories}/{targetCalories} kcal
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${caloriePercent}%` }]} />
        </View>

        {/* Macros Row (Live Eaten vs Target) */}
        <View style={styles.macroRow}>
          <View style={styles.macroPill}>
            <Text style={[styles.macroTag, { color: '#CCFF00' }]}>PROTEIN</Text>
            <Text style={[styles.macroVal, { color: '#CCFF00' }]}>
              {consumedProtein}/{activeDayPlan.protein_grams || 0}g
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroPill}>
            <Text style={[styles.macroTag, { color: '#38BDF8' }]}>CARBS</Text>
            <Text style={[styles.macroVal, { color: '#38BDF8' }]}>
              {consumedCarbs}/{activeDayPlan.carbs_grams || 0}g
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroPill}>
            <Text style={[styles.macroTag, { color: '#FB923C' }]}>FAT</Text>
            <Text style={[styles.macroVal, { color: '#FB923C' }]}>
              {consumedFat}/{activeDayPlan.fat_grams || 0}g
            </Text>
          </View>
        </View>
      </View>

      {/* Meal Group Sections */}
      {meals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No Meals Scheduled for {selectedDay}
          </Text>
          <Text style={styles.emptySub}>Your coach will assign customized meals for this day.</Text>
        </View>
      ) : (
        [
          { title: 'BREAKFAST', items: breakfastMeals },
          { title: 'LUNCH', items: lunchMeals },
          { title: 'DINNER', items: dinnerMeals },
          { title: 'EXTRA MEALS & SNACKS', items: snackMeals },
        ].map((group) => {
          if (group.items.length === 0) return null;
          return (
            <View key={group.title} style={styles.groupSection}>
              <Text style={styles.groupHeader}>{group.title}</Text>

              {group.items.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  onPress={() => handleToggleMeal(meal.id)}
                  style={[
                    styles.mealCard,
                    meal.completed ? styles.mealCompleted : styles.mealPending,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.mealRow}>
                    <View
                      style={[
                        styles.checkBox,
                        meal.completed ? styles.checkActive : styles.checkInactive,
                      ]}
                    >
                      {meal.completed && <Check size={12} color="#0F172A" />}
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          styles.mealName,
                          meal.completed ? styles.completedText : { color: '#FFFFFF' },
                        ]}
                      >
                        {formatTitleCase(meal.name)}
                      </Text>
                      <Text style={styles.mealMetrics}>
                        {meal.calories} kcal • {meal.protein_g}g P • {meal.carbs_g}g C • {meal.fat_g}g F
                      </Text>
                    </View>

                    {meal.completed ? (
                      <View style={styles.eatenChip}>
                        <CircleCheck size={11} color="#34D399" />
                        <Text style={styles.eatenChipText}>Logged</Text>
                      </View>
                    ) : (
                      <Text style={styles.tapToLogText}>Tap to Log</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toastBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CCFF00',
  },
  daysHeader: {
    gap: 6,
  },
  daysLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  daysRow: {
    gap: 6,
    paddingVertical: 2,
  },
  dayTab: {
    width: 54,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dayTabActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  dayTabInactive: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  dayTabShort: {
    fontSize: 10,
    fontWeight: '900',
  },
  dayTabSub: {
    fontSize: 8,
    fontWeight: '800',
  },
  todayDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  planSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  kcalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kcalBadgeFull: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  kcalVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#CCFF00',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 3,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090D16',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  macroDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#1E293B',
  },
  macroTag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  macroVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  groupSection: {
    gap: 6,
  },
  groupHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  mealCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  mealCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  mealPending: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderColor: '#1E293B',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  checkActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  checkInactive: {
    backgroundColor: '#090D16',
    borderColor: '#334155',
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mealMetrics: {
    fontSize: 10,
    color: '#94A3B8',
  },
  eatenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  eatenChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
  },
  tapToLogText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
