import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  Apple,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  Utensils,
  Calendar,
  RotateCcw,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { DietPlan, LoggedFoodItem, Profile, DayOfWeek } from '../../types/database';
import { useNutritionTotals } from '../../lib/queries/logs';

interface CoachNutritionMonitoringProps {
  clientId: string;
  clientProfile?: Profile | null;
  dietPlan?: DietPlan | null;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
}

const DAYS_OF_WEEK_NAMES: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const formatDateToISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatFriendlyDate = (dateStr: string, todayIso: string): { label: string; sub: string } => {
  if (dateStr === todayIso) {
    const d = parseDateString(dateStr);
    return {
      label: 'TODAY',
      sub: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    };
  }

  const d = parseDateString(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = formatDateToISO(yesterday);

  if (dateStr === yesterdayIso) {
    return {
      label: 'YESTERDAY',
      sub: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    };
  }

  return {
    label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase(),
    sub: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' }),
  };
};

const formatFoodTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

export const CoachNutritionMonitoring: React.FC<CoachNutritionMonitoringProps> = ({
  clientId,
  clientProfile,
  dietPlan,
  activeDate,
  onSelectDate,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const todayIso = formatDateToISO(new Date());
  const [internalDate, setInternalDate] = useState<string>(activeDate || todayIso);

  const selectedDate = activeDate || internalDate;

  const handleDateChange = (newDate: string) => {
    setInternalDate(newDate);
    if (onSelectDate) {
      onSelectDate(newDate);
    }
  };

  // Queries
  const { totals, loggedFoods, loggedMeals, isLoading } = useNutritionTotals(clientId, selectedDate);
  const completedLoggedMeals = (loggedMeals || []).filter((m) => m.completed);

  // Determine Daily Targets for Selected Date
  let targetCalories = 0;
  let targetProtein = 0;
  let targetCarbs = 0;
  let targetFat = 0;

  if (dietPlan?.plan_type === 'flexible_options') {
    targetCalories = dietPlan.daily_calorie_target || 0;
    targetProtein = dietPlan.protein_grams || 0;
    targetCarbs = dietPlan.carbs_grams || 0;
    targetFat = dietPlan.fat_grams || 0;
  } else if (dietPlan) {
    const parsed = parseDateString(selectedDate);
    const dayName = DAYS_OF_WEEK_NAMES[parsed.getDay()];
    const dayPlan = dietPlan.day_plans?.[dayName];
    targetCalories = dayPlan?.daily_calorie_target || dietPlan.daily_calorie_target || 0;
    targetProtein = dayPlan?.protein_grams || dietPlan.protein_grams || 0;
    targetCarbs = dayPlan?.carbs_grams || dietPlan.carbs_grams || 0;
    targetFat = dayPlan?.fat_grams || dietPlan.fat_grams || 0;
  }

  // Consumed Values
  const consumedCalories = totals.calories;
  const consumedProtein = totals.protein;
  const consumedCarbs = totals.carbs;
  const consumedFat = totals.fat;

  // Remaining / Progress Calculations
  const remainingCalories = targetCalories > 0 ? targetCalories - consumedCalories : 0;
  const caloriesRatio = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;
  const proteinRatio = targetProtein > 0 ? Math.min(1, consumedProtein / targetProtein) : 0;
  const carbsRatio = targetCarbs > 0 ? Math.min(1, consumedCarbs / targetCarbs) : 0;
  const fatRatio = targetFat > 0 ? Math.min(1, consumedFat / targetFat) : 0;

  // Date Navigation Steppers
  const handlePrevDay = () => {
    const current = parseDateString(selectedDate);
    current.setDate(current.getDate() - 1);
    handleDateChange(formatDateToISO(current));
  };

  const handleNextDay = () => {
    const current = parseDateString(selectedDate);
    current.setDate(current.getDate() + 1);
    const nextIso = formatDateToISO(current);
    if (nextIso <= todayIso) {
      handleDateChange(nextIso);
    }
  };

  const handleJumpToToday = () => {
    handleDateChange(todayIso);
  };

  // Recent 7 Days for quick pill switching
  const recentDays = [0, 1, 2, 3, 4, 5, 6].map((daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const iso = formatDateToISO(d);
    let label = '';
    if (daysAgo === 0) label = 'TODAY';
    else if (daysAgo === 1) label = 'YESTERDAY';
    else label = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    return {
      iso,
      label,
      dayNum: d.getDate(),
      isToday: daysAgo === 0,
    };
  });

  const { label: dateLabel, sub: dateSub } = formatFriendlyDate(selectedDate, todayIso);
  const isSelectedDateToday = selectedDate === todayIso;

  return (
    <View style={styles.container}>
      {/* ================= SECTION HEADER ================= */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.kickerRow}>
            <Text style={styles.sectionKicker}>NUTRITION MONITORING</Text>
            <View
              style={[
                styles.planTypeBadge,
                dietPlan?.plan_type === 'flexible_options'
                  ? styles.planTypeBadgeFlexible
                  : styles.planTypeBadgeStructured,
              ]}
            >
              <Text
                style={[
                  styles.planTypeBadgeText,
                  dietPlan?.plan_type === 'flexible_options'
                    ? { color: COLORS.brand }
                    : { color: COLORS.info },
                ]}
              >
                {dietPlan?.plan_type === 'flexible_options' ? 'FLEXIBLE OPTIONS' : 'SCHEDULED PLAN'}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>
            {isSelectedDateToday ? "TODAY'S NUTRITION" : 'NUTRITION LOGS'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            What {clientProfile?.full_name || 'the athlete'} recorded for this date.
          </Text>
        </View>

        {!isSelectedDateToday && (
          <TouchableOpacity
            onPress={handleJumpToToday}
            style={styles.jumpTodayBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <RotateCcw size={12} color={COLORS.brand} />
            <Text style={styles.jumpTodayText}>TODAY</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ================= DATE NAVIGATION ================= */}
      <View style={styles.dateNavWrapper}>
        {/* Quick Recent Day Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentDaysScroll}
        >
          {recentDays.map((item) => {
            const isSelected = item.iso === selectedDate;
            return (
              <TouchableOpacity
                key={item.iso}
                onPress={() => handleDateChange(item.iso)}
                style={[
                  styles.datePill,
                  isSelected ? styles.datePillSelected : styles.datePillUnselected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.datePillText,
                    isSelected ? styles.datePillTextSelected : styles.datePillTextUnselected,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.datePillDayNum,
                    isSelected ? styles.datePillDayNumSelected : styles.datePillDayNumUnselected,
                  ]}
                >
                  {item.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Stepper Navigation Bar */}
        <View style={styles.stepperBar}>
          <TouchableOpacity
            onPress={handlePrevDay}
            style={styles.stepperArrowBtn}
            accessibilityLabel="Previous day"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.stepperCenterInfo}>
            <View style={styles.stepperDateRow}>
              <Calendar size={13} color={COLORS.brand} />
              <Text style={styles.stepperDateLabel}>{dateLabel}</Text>
            </View>
            <Text style={styles.stepperDateSub}>{dateSub}</Text>
          </View>

          <TouchableOpacity
            onPress={handleNextDay}
            disabled={isSelectedDateToday}
            style={[
              styles.stepperArrowBtn,
              isSelectedDateToday && styles.stepperArrowBtnDisabled,
            ]}
            accessibilityLabel="Next day"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight
              size={18}
              color={isSelectedDateToday ? COLORS.textMuted : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= NUTRITION MACRO TARGETS VS CONSUMED ================= */}
      <View style={styles.macroCard}>
        {/* Calories Top Section */}
        <View style={styles.caloriesHeaderRow}>
          <View>
            <Text style={styles.macroCardKicker}>ENERGY INTAKE</Text>
            <View style={styles.caloriesBigRow}>
              <Text style={[styles.caloriesBigVal, { fontSize: width < 360 ? 25 : 30 }]}>
                {consumedCalories.toLocaleString()}
              </Text>
              {targetCalories > 0 ? (
                <Text style={styles.caloriesTargetVal}> / {targetCalories.toLocaleString()} kcal</Text>
              ) : (
                <Text style={styles.caloriesTargetVal}> kcal</Text>
              )}
            </View>
          </View>

          {targetCalories > 0 && (
            <View
              style={[
                styles.remainingPill,
                remainingCalories < 0 && styles.remainingPillOver,
              ]}
            >
              <Text
                style={[
                  styles.remainingPillText,
                  remainingCalories < 0 && styles.remainingPillTextOver,
                ]}
              >
                {remainingCalories >= 0
                  ? `${remainingCalories} kcal left`
                  : `${Math.abs(remainingCalories)} kcal over`}
              </Text>
            </View>
          )}
        </View>

        {/* Calories Progress Track */}
        {targetCalories > 0 && (
          <View style={styles.calorieTrack}>
            <View
              style={[
                styles.calorieFill,
                {
                  width: `${Math.round(caloriesRatio * 100)}%`,
                  backgroundColor: remainingCalories < 0 ? COLORS.warning : COLORS.brand,
                },
              ]}
            />
          </View>
        )}

        {/* 3 Macro Columns: Protein, Carbs, Fat */}
        <View style={styles.macroColumnsRow}>
          {/* Protein */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroColKicker, { color: COLORS.brand }]}>PROTEIN</Text>
            <Text style={styles.macroColValue}>
              {consumedProtein}
              {targetProtein > 0 ? (
                <Text style={styles.macroColTarget}>/{targetProtein}g</Text>
              ) : (
                <Text style={styles.macroColTarget}>g</Text>
              )}
            </Text>
            {targetProtein > 0 && (
              <View style={styles.macroSubTrack}>
                <View
                  style={[
                    styles.macroSubFill,
                    {
                      backgroundColor: COLORS.brand,
                      width: `${Math.round(proteinRatio * 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Carbs */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroColKicker, { color: COLORS.info }]}>CARBS</Text>
            <Text style={styles.macroColValue}>
              {consumedCarbs}
              {targetCarbs > 0 ? (
                <Text style={styles.macroColTarget}>/{targetCarbs}g</Text>
              ) : (
                <Text style={styles.macroColTarget}>g</Text>
              )}
            </Text>
            {targetCarbs > 0 && (
              <View style={styles.macroSubTrack}>
                <View
                  style={[
                    styles.macroSubFill,
                    {
                      backgroundColor: COLORS.info,
                      width: `${Math.round(carbsRatio * 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Fats */}
          <View style={styles.macroCol}>
            <Text style={[styles.macroColKicker, { color: COLORS.warning }]}>FATS</Text>
            <Text style={styles.macroColValue}>
              {consumedFat}
              {targetFat > 0 ? (
                <Text style={styles.macroColTarget}>/{targetFat}g</Text>
              ) : (
                <Text style={styles.macroColTarget}>g</Text>
              )}
            </Text>
            {targetFat > 0 && (
              <View style={styles.macroSubTrack}>
                <View
                  style={[
                    styles.macroSubFill,
                    {
                      backgroundColor: COLORS.warning,
                      width: `${Math.round(fatRatio * 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ================= ACTUAL LOGGED FOODS ================= */}
      <View style={styles.loggedFoodsSection}>
        <View style={styles.loggedFoodsHeaderRow}>
          <View style={styles.loggedHeaderTitleRow}>
            <Text style={styles.loggedSectionTitle}>ACTUAL LOGGED FOODS</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {loggedFoods.length || completedLoggedMeals.length}
              </Text>
            </View>
          </View>

          {loggedFoods.length > 0 && (
            <Text style={styles.loggedSourceSummary}>
              {totals.coachOptionCount} coach • {totals.customFoodCount} custom
            </Text>
          )}
          {loggedFoods.length === 0 && completedLoggedMeals.length > 0 && (
            <Text style={styles.loggedSourceSummary}>
              {completedLoggedMeals.length} scheduled meals logged
            </Text>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>Fetching logged nutrition...</Text>
          </View>
        ) : loggedFoods.length === 0 && completedLoggedMeals.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Utensils size={20} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No foods logged for this date</Text>
            <Text style={styles.emptySub}>
              {clientProfile?.full_name || 'The athlete'} has not recorded any food items on{' '}
              {dateSub}.
            </Text>
          </View>
        ) : loggedFoods.length > 0 ? (
          /* List of Logged Food Cards */
          <View style={styles.foodList}>
            {loggedFoods.map((item: LoggedFoodItem) => {
              const isCustom = item.source === 'custom';
              const logTime = formatFoodTime(item.logged_at);

              return (
                <View key={item.id} style={styles.foodCard}>
                  {/* Card Header: Source Badge & Timestamp */}
                  <View style={styles.foodCardTopRow}>
                    <View
                      style={[
                        styles.sourceBadge,
                        isCustom ? styles.sourceBadgeCustom : styles.sourceBadgeCoach,
                      ]}
                    >
                      {isCustom ? (
                        <Sparkles size={11} color={COLORS.info} />
                      ) : (
                        <Apple size={11} color={COLORS.brand} />
                      )}
                      <Text
                        style={[
                          styles.sourceBadgeText,
                          { color: isCustom ? COLORS.info : COLORS.brand },
                        ]}
                      >
                        {isCustom ? 'CUSTOM FOOD' : 'COACH OPTION'}
                      </Text>
                    </View>

                    {Boolean(logTime) && (
                      <View style={styles.timeBadge}>
                        <Clock size={11} color={COLORS.textMuted} />
                        <Text style={styles.timeBadgeText}>{logTime}</Text>
                      </View>
                    )}
                  </View>

                  {/* Food Name & Serving */}
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodServing}>
                    {item.servings_consumed !== 1 ? `${item.servings_consumed}x ` : ''}
                    {item.serving_size}
                  </Text>

                  {/* Calories & Macro Pill Row */}
                  <View style={styles.macrosPillRow}>
                    <Text style={styles.kcalHighlight}>{item.calories} kcal</Text>
                    <Text style={styles.macroDividerDot}>•</Text>
                    <Text style={[styles.macroItemText, { color: COLORS.brand }]}>
                      {item.protein_g}g protein
                    </Text>
                    <Text style={styles.macroDividerDot}>•</Text>
                    <Text style={[styles.macroItemText, { color: COLORS.info }]}>
                      {item.carbs_g}g carbs
                    </Text>
                    <Text style={styles.macroDividerDot}>•</Text>
                    <Text style={[styles.macroItemText, { color: COLORS.warning }]}>
                      {item.fat_g}g fat
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Fallback: Completed Scheduled Meals */
          <View style={styles.foodList}>
            {completedLoggedMeals.map((meal) => (
              <View key={meal.id} style={styles.foodCard}>
                <View style={styles.foodCardTopRow}>
                  <View style={[styles.sourceBadge, styles.sourceBadgeCoach]}>
                    <Apple size={11} color={COLORS.brand} />
                    <Text style={[styles.sourceBadgeText, { color: COLORS.brand }]}>
                      {meal.type.toUpperCase()} • SCHEDULED MEAL
                    </Text>
                  </View>
                </View>

                <Text style={styles.foodName}>{meal.name}</Text>
                <Text style={styles.foodServing}>{meal.servings || '1 serving'}</Text>

                <View style={styles.macrosPillRow}>
                  <Text style={styles.kcalHighlight}>{meal.calories} kcal</Text>
                  <Text style={styles.macroDividerDot}>•</Text>
                  <Text style={[styles.macroItemText, { color: COLORS.brand }]}>
                    {meal.protein_g || 0}g protein
                  </Text>
                  <Text style={styles.macroDividerDot}>•</Text>
                  <Text style={[styles.macroItemText, { color: COLORS.info }]}>
                    {meal.carbs_g || 0}g carbs
                  </Text>
                  <Text style={styles.macroDividerDot}>•</Text>
                  <Text style={[styles.macroItemText, { color: COLORS.warning }]}>
                    {meal.fat_g || 0}g fat
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  planTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  planTypeBadgeFlexible: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  planTypeBadgeStructured: {
    backgroundColor: 'rgba(85, 185, 232, 0.1)',
    borderColor: 'rgba(85, 185, 232, 0.25)',
  },
  planTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jumpTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.3)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  jumpTodayText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },

  // Date Navigation
  dateNavWrapper: {
    gap: SPACING.sm,
  },
  recentDaysScroll: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  datePillSelected: {
    backgroundColor: COLORS.brand,
  },
  datePillUnselected: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePillText: {
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  datePillTextSelected: {
    fontWeight: '800',
    color: '#080A0C',
  },
  datePillTextUnselected: {
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  datePillDayNum: {
    fontSize: 14,
    marginTop: 2,
  },
  datePillDayNumSelected: {
    fontWeight: '800',
    color: '#080A0C',
  },
  datePillDayNumUnselected: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
  },
  stepperArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperArrowBtnDisabled: {
    opacity: 0.35,
  },
  stepperCenterInfo: {
    alignItems: 'center',
    gap: 2,
  },
  stepperDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperDateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  stepperDateSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },

  // Macro Summary Card
  macroCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  caloriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  macroCardKicker: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  caloriesBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  caloriesBigVal: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  caloriesTargetVal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  remainingPill: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  remainingPillOver: {
    borderColor: 'rgba(245, 165, 36, 0.4)',
    backgroundColor: 'rgba(245, 165, 36, 0.1)',
  },
  remainingPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
  },
  remainingPillTextOver: {
    color: COLORS.warning,
  },
  calorieTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
  },
  calorieFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroColumnsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  macroCol: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    gap: 4,
  },
  macroColKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  macroColValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroColTarget: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  macroSubTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfacePrimary,
    overflow: 'hidden',
    marginTop: 2,
  },
  macroSubFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Actual Logged Foods
  loggedFoodsSection: {
    gap: SPACING.sm,
  },
  loggedFoodsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loggedHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
  loggedSourceSummary: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  loadingBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 360,
  },
  foodList: {
    gap: SPACING.xs,
  },
  foodCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
  },
  foodCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  sourceBadgeCoach: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
  },
  sourceBadgeCustom: {
    backgroundColor: 'rgba(85, 185, 232, 0.1)',
  },
  sourceBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  foodName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  foodServing: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  macrosPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  kcalHighlight: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  macroDividerDot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  macroItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
