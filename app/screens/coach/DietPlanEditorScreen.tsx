import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Pencil,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useCreateDietPlan, useUpdateDietPlan, useDietPlan } from '../../lib/queries/dietPlans';
import { useProfile } from '../../lib/queries/profiles';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { DayOfWeek, DayDietPlan, MealItem, MealType } from '../../types/database';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface MealSuggestion {
  label: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const MEAL_SUGGESTIONS: Record<string, MealSuggestion[]> = {
  breakfast: [
    { label: '🍳 Eggs & Oats', name: '3 Whole Eggs & 60g Oatmeal with Berries', calories: 500, protein_g: 35, carbs_g: 50, fat_g: 16 },
    { label: '🥣 Greek Yogurt Bowl', name: 'Greek Yogurt (200g), Honey & Granola', calories: 380, protein_g: 28, carbs_g: 45, fat_g: 8 },
    { label: '🥑 Avocado Toast', name: 'Sourdough Toast with 2 Eggs & Avocado', calories: 460, protein_g: 24, carbs_g: 42, fat_g: 22 },
    { label: '🥞 Protein Pancakes', name: 'Oat Flour Protein Pancakes with Syrup', calories: 520, protein_g: 40, carbs_g: 58, fat_g: 10 },
  ],
  lunch: [
    { label: '🍗 Chicken & Rice', name: '200g Grilled Chicken, 150g Rice & Broccoli', calories: 620, protein_g: 48, carbs_g: 65, fat_g: 12 },
    { label: '🥩 Beef & Sweet Potato', name: '180g Lean Ground Beef, Sweet Potato & Greens', calories: 650, protein_g: 45, carbs_g: 55, fat_g: 22 },
    { label: '🥗 Tuna Salad Bowl', name: 'Canned Tuna, Quinoa, Mixed Greens & Olive Oil', calories: 480, protein_g: 42, carbs_g: 38, fat_g: 14 },
    { label: '🌯 Turkey Wrap', name: 'Whole Wheat Wrap with Turkey Breast & Avocado', calories: 540, protein_g: 38, carbs_g: 48, fat_g: 16 },
  ],
  dinner: [
    { label: '🐟 Salmon & Asparagus', name: '200g Grilled Salmon, Roasted Potato & Asparagus', calories: 580, protein_g: 42, carbs_g: 40, fat_g: 24 },
    { label: '🥩 Sirloin Steak', name: '200g Sirloin Steak, Baked Potato & Green Beans', calories: 680, protein_g: 52, carbs_g: 45, fat_g: 26 },
    { label: '🍗 Chicken Stir-Fry', name: 'Chicken Breast Stir-Fry with Mixed Veggies & Rice', calories: 560, protein_g: 46, carbs_g: 55, fat_g: 12 },
    { label: '🍲 Lean Beef Bowl', name: 'Lean Minced Beef, Jasmine Rice & Avocado', calories: 640, protein_g: 44, carbs_g: 60, fat_g: 20 },
  ],
  snack: [
    { label: '🥤 Whey & Banana', name: 'Whey Protein Shake (1 Scoop) & 1 Banana', calories: 260, protein_g: 27, carbs_g: 30, fat_g: 3 },
    { label: '🥜 Almonds & Apple', name: '30g Raw Almonds with Fresh Apple Slices', calories: 220, protein_g: 6, carbs_g: 24, fat_g: 14 },
    { label: '🧀 Cottage Cheese', name: '150g Low-Fat Cottage Cheese with Blueberries', calories: 180, protein_g: 22, carbs_g: 15, fat_g: 3 },
    { label: '🍫 Protein Bar', name: 'High-Protein Low-Sugar Snack Bar', calories: 210, protein_g: 20, carbs_g: 22, fat_g: 7 },
  ],
};

const createDayDefaultMeals = (prefix: string): MealItem[] => [
  {
    id: `${prefix}-breakfast`,
    name: '3 Whole Eggs & 60g Oatmeal with Berries',
    type: 'breakfast',
    calories: 500,
    protein_g: 35,
    carbs_g: 50,
    fat_g: 16,
    servings: '1 serving',
    completed: false,
  },
  {
    id: `${prefix}-lunch`,
    name: '200g Grilled Chicken, 150g Rice & Broccoli',
    type: 'lunch',
    calories: 620,
    protein_g: 48,
    carbs_g: 65,
    fat_g: 12,
    servings: '1 bowl',
    completed: false,
  },
  {
    id: `${prefix}-dinner`,
    name: '200g Grilled Salmon, Roasted Potato & Asparagus',
    type: 'dinner',
    calories: 580,
    protein_g: 42,
    carbs_g: 40,
    fat_g: 24,
    servings: '1 plate',
    completed: false,
  },
];

const createEmptyWeekPlan = (): Record<DayOfWeek, DayDietPlan> => {
  const result: Partial<Record<DayOfWeek, DayDietPlan>> = {};
  for (const day of DAYS_OF_WEEK) {
    const defaultMeals = createDayDefaultMeals(day.toLowerCase().slice(0, 3));
    result[day] = {
      daily_calorie_target: 1700,
      protein_grams: 125,
      carbs_grams: 155,
      fat_grams: 52,
      meals: defaultMeals,
    };
  }
  return result as Record<DayOfWeek, DayDietPlan>;
};

export const DietPlanEditorScreen: React.FC = () => {
  const { selectedClientId, setCoachActiveTab, editingDietPlanId, user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const { data: clientProfile } = useProfile(selectedClientId);
  const { data: existingPlan } = useDietPlan(selectedClientId);
  const createDietPlanMutation = useCreateDietPlan();
  const updateDietPlanMutation = useUpdateDietPlan();

  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [dayPlans, setDayPlans] = useState<Record<DayOfWeek, DayDietPlan>>(createEmptyWeekPlan());
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);

  // Meal Modal State
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'suggestions' | 'custom'>('suggestions');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  // Custom Meal Form State
  const [formType, setFormType] = useState<MealType>('snack');
  const [formName, setFormName] = useState('');
  const [formServings, setFormServings] = useState('1 serving');
  const [formCalories, setFormCalories] = useState('250');
  const [formProtein, setFormProtein] = useState('20');
  const [formCarbs, setFormCarbs] = useState('25');
  const [formFat, setFormFat] = useState('8');

  // Initialize form with existing plan if available
  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title || '');
      const weekData = createEmptyWeekPlan();

      if (existingPlan.day_plans && Object.keys(existingPlan.day_plans).length > 0) {
        for (const day of DAYS_OF_WEEK) {
          const savedDay = existingPlan.day_plans[day];
          if (savedDay && savedDay.meals && savedDay.meals.length > 0) {
            weekData[day] = {
              daily_calorie_target: savedDay.daily_calorie_target || 1700,
              protein_grams: savedDay.protein_grams || 125,
              carbs_grams: savedDay.carbs_grams || 155,
              fat_grams: savedDay.fat_grams || 52,
              meals: [...savedDay.meals],
            };
          }
        }
        setDayPlans(weekData);
      } else if (existingPlan.meals && existingPlan.meals.length > 0) {
        for (const day of DAYS_OF_WEEK) {
          weekData[day] = {
            daily_calorie_target: existingPlan.daily_calorie_target || 1700,
            protein_grams: existingPlan.protein_grams || 125,
            carbs_grams: existingPlan.carbs_grams || 155,
            fat_grams: existingPlan.fat_grams || 52,
            meals: existingPlan.meals.map((m, idx) => ({
              ...m,
              id: `${day.toLowerCase().slice(0, 3)}-${m.type}-${idx}`,
            })),
          };
        }
        setDayPlans(weekData);
      }
    }
  }, [existingPlan]);

  const activeDayPlan = dayPlans[selectedDay] || {
    daily_calorie_target: 1700,
    protein_grams: 125,
    carbs_grams: 155,
    fat_grams: 52,
    meals: createDayDefaultMeals(selectedDay.toLowerCase().slice(0, 3)),
  };

  const athleteName = clientProfile?.full_name?.trim() || 'Athlete';

  // Open modal for adding a new meal
  const handleOpenAddMeal = () => {
    setEditingMealId(null);
    setFormType('snack');
    setFormName('');
    setFormServings('1 serving');
    setFormCalories('250');
    setFormProtein('20');
    setFormCarbs('25');
    setFormFat('8');
    setModalMode('suggestions');
    setIsMealModalOpen(true);
  };

  // Open modal for editing an existing meal
  const handleOpenEditMeal = (meal: MealItem) => {
    setEditingMealId(meal.id);
    setFormType(meal.type);
    setFormName(meal.name);
    setFormServings(meal.servings || '1 serving');
    setFormCalories(String(meal.calories || 0));
    setFormProtein(String(meal.protein_g || 0));
    setFormCarbs(String(meal.carbs_g || 0));
    setFormFat(String(meal.fat_g || 0));
    setModalMode('custom');
    setIsMealModalOpen(true);
  };

  const handleSaveCustomMeal = () => {
    const mealName = formName.trim() || `${formType.toUpperCase()} Meal`;
    const kcal = parseInt(formCalories, 10) || 0;
    const prot = parseInt(formProtein, 10) || 0;
    const carbs = parseInt(formCarbs, 10) || 0;
    const fat = parseInt(formFat, 10) || 0;

    let updatedMeals: MealItem[];

    if (editingMealId) {
      updatedMeals = activeDayPlan.meals.map((m) =>
        m.id === editingMealId
          ? {
            ...m,
            name: mealName,
            type: formType,
            servings: formServings,
            calories: kcal,
            protein_g: prot,
            carbs_g: carbs,
            fat_g: fat,
          }
          : m
      );
    } else {
      const newMeal: MealItem = {
        id: `${selectedDay.toLowerCase().slice(0, 3)}-${formType}-${Date.now()}`,
        name: mealName,
        type: formType,
        servings: formServings,
        calories: kcal,
        protein_g: prot,
        carbs_g: carbs,
        fat_g: fat,
        completed: false,
      };
      updatedMeals = [...activeDayPlan.meals, newMeal];
    }

    const totalKcal = updatedMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
    const totalProt = updatedMeals.reduce((acc, m) => acc + (Number(m.protein_g) || 0), 0);
    const totalCarb = updatedMeals.reduce((acc, m) => acc + (Number(m.carbs_g) || 0), 0);
    const totalFat = updatedMeals.reduce((acc, m) => acc + (Number(m.fat_g) || 0), 0);

    setDayPlans((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        daily_calorie_target: totalKcal,
        protein_grams: totalProt,
        carbs_grams: totalCarb,
        fat_grams: totalFat,
        meals: updatedMeals,
      },
    }));

    setIsMealModalOpen(false);
  };

  const handleApplySuggestion = (sug: MealSuggestion, mealType: MealType) => {
    let updatedMeals: MealItem[];

    if (editingMealId) {
      updatedMeals = activeDayPlan.meals.map((m) =>
        m.id === editingMealId
          ? {
            ...m,
            name: sug.name,
            type: mealType,
            servings: '1 serving',
            calories: sug.calories,
            protein_g: sug.protein_g,
            carbs_g: sug.carbs_g,
            fat_g: sug.fat_g,
          }
          : m
      );
    } else {
      const newMeal: MealItem = {
        id: `${selectedDay.toLowerCase().slice(0, 3)}-${mealType}-${Date.now()}`,
        name: sug.name,
        type: mealType,
        servings: '1 serving',
        calories: sug.calories,
        protein_g: sug.protein_g,
        carbs_g: sug.carbs_g,
        fat_g: sug.fat_g,
        completed: false,
      };
      updatedMeals = [...activeDayPlan.meals, newMeal];
    }

    const totalKcal = updatedMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
    const totalProt = updatedMeals.reduce((acc, m) => acc + (Number(m.protein_g) || 0), 0);
    const totalCarb = updatedMeals.reduce((acc, m) => acc + (Number(m.carbs_g) || 0), 0);
    const totalFat = updatedMeals.reduce((acc, m) => acc + (Number(m.fat_g) || 0), 0);

    setDayPlans((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        daily_calorie_target: totalKcal,
        protein_grams: totalProt,
        carbs_grams: totalCarb,
        fat_grams: totalFat,
        meals: updatedMeals,
      },
    }));

    setIsMealModalOpen(false);
  };

  const handleRemoveMeal = (mealId: string) => {
    const updatedMeals = activeDayPlan.meals.filter((m) => m.id !== mealId);
    const totalKcal = updatedMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
    const totalProt = updatedMeals.reduce((acc, m) => acc + (Number(m.protein_g) || 0), 0);
    const totalCarb = updatedMeals.reduce((acc, m) => acc + (Number(m.carbs_g) || 0), 0);
    const totalFat = updatedMeals.reduce((acc, m) => acc + (Number(m.fat_g) || 0), 0);

    setDayPlans((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        daily_calorie_target: totalKcal,
        protein_grams: totalProt,
        carbs_grams: totalCarb,
        fat_grams: totalFat,
        meals: updatedMeals,
      },
    }));
  };

  const handleCopyDayToAllDays = () => {
    const sourcePlan = activeDayPlan;
    const updatedAll = { ...dayPlans };
    for (const day of DAYS_OF_WEEK) {
      updatedAll[day] = {
        daily_calorie_target: sourcePlan.daily_calorie_target,
        protein_grams: sourcePlan.protein_grams,
        carbs_grams: sourcePlan.carbs_grams,
        fat_grams: sourcePlan.fat_grams,
        meals: sourcePlan.meals.map((m, idx) => ({
          ...m,
          id: `${day.toLowerCase().slice(0, 3)}-${m.type}-${Date.now()}-${idx}`,
          completed: false,
        })),
      };
    }
    setDayPlans(updatedAll);
    setCopiedBanner(`Applied ${selectedDay}'s diet to all 7 days!`);
    setTimeout(() => setCopiedBanner(null), 3000);
  };

  const handleSave = () => {
    const planTitle = title.trim() || '7-Day Nutrition Protocol';
    const mondayPlan = dayPlans['Monday'] || activeDayPlan;

    // Sanitize empty names with standard defaults
    const sanitizedDayPlans = { ...dayPlans };
    for (const day of DAYS_OF_WEEK) {
      sanitizedDayPlans[day].meals = sanitizedDayPlans[day].meals.map((m) => ({
        ...m,
        name:
          m.name.trim() ||
          (m.type === 'breakfast'
            ? 'Nutritious Breakfast'
            : m.type === 'lunch'
              ? 'High-Protein Lunch'
              : m.type === 'dinner'
                ? 'Balanced Dinner'
                : 'Healthy Snack'),
      }));
    }

    if (editingDietPlanId) {
      updateDietPlanMutation.mutate({
        id: editingDietPlanId,
        updates: {
          title: planTitle,
          daily_calorie_target: mondayPlan.daily_calorie_target,
          protein_grams: mondayPlan.protein_grams,
          carbs_grams: mondayPlan.carbs_grams,
          fat_grams: mondayPlan.fat_grams,
          meals: sanitizedDayPlans[selectedDay].meals,
          day_plans: sanitizedDayPlans,
        },
      });
    } else {
      createDietPlanMutation.mutate({
        client_id: selectedClientId,
        coach_id: user?.id || 'coach-id-001',
        title: planTitle,
        daily_calorie_target: mondayPlan.daily_calorie_target,
        protein_grams: mondayPlan.protein_grams,
        carbs_grams: mondayPlan.carbs_grams,
        fat_grams: mondayPlan.fat_grams,
        meals: sanitizedDayPlans[selectedDay].meals,
        day_plans: sanitizedDayPlans,
      });
    }
    setCoachActiveTab('client-detail');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: isDesktop ? LAYOUT.paddingDesktop : LAYOUT.paddingMobile,
            paddingBottom: isDesktop ? SPACING.xxl : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={[styles.innerWrapper, isDesktop && styles.desktopInnerWrapper]}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => setCoachActiveTab('client-detail')}
                style={styles.backBtn}
                activeOpacity={0.75}
              >
                <ArrowLeft size={16} color={COLORS.brand} />
                <Text style={styles.backBtnText}>ATHLETE</Text>
              </TouchableOpacity>

              {/* Desktop Save CTA */}
              {isDesktop && (
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.desktopSaveBtn}
                  activeOpacity={0.85}
                >
                  <Save size={15} color="#080A0C" strokeWidth={2.4} />
                  <Text style={styles.desktopSaveBtnText}>SAVE NUTRITION PLAN</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.headerTitlesCol}>
              <Text style={styles.headerKicker}>EDIT NUTRITION PLAN</Text>
              <Text style={styles.athleteNameText}>{athleteName}</Text>
            </View>

            {/* Plan Title Input */}
            <View style={styles.titleBox}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Plan Title (e.g. 2,400 kcal Hypertrophy Nutrition Protocol)"
                placeholderTextColor={COLORS.textMuted}
                style={styles.titleInput}
              />
            </View>
          </View>

          {/* ================= DAY SELECTOR & COPY DAY ================= */}
          <View style={styles.daySelectorRow}>
            {/* 7-Day Horizontal Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStrip}
            >
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDay === day;
                const shortName = day.slice(0, 3).toUpperCase();
                const kcal = dayPlans[day]?.daily_calorie_target || 0;

                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayPill,
                      isSelected ? styles.dayPillActive : styles.dayPillInactive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayPillName,
                        isSelected ? { color: '#080A0C' } : { color: COLORS.textSecondary },
                      ]}
                    >
                      {shortName}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillKcal,
                        isSelected ? { color: '#080A0C' } : { color: COLORS.brand },
                      ]}
                    >
                      {kcal > 0 ? `${kcal}` : '--'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Compact Copy Day Action */}
            <TouchableOpacity
              onPress={handleCopyDayToAllDays}
              style={styles.copyDayBtn}
              activeOpacity={0.8}
            >
              <Copy size={13} color={COLORS.textPrimary} />
              <Text style={styles.copyDayBtnText}>Copy Day</Text>
            </TouchableOpacity>
          </View>

          {copiedBanner && (
            <View style={styles.copiedBanner}>
              <Check size={14} color={COLORS.brand} />
              <Text style={styles.copiedBannerText}>{copiedBanner}</Text>
            </View>
          )}

          {/* ================= MACRO SUMMARY ================= */}
          <View style={styles.macroSummarySurface}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>CALORIES</Text>
              <Text style={styles.macroValue}>
                {activeDayPlan.daily_calorie_target}{' '}
                <Text style={styles.macroUnit}>kcal</Text>
              </Text>
            </View>

            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroLabel, { color: COLORS.brand }]}>PROTEIN</Text>
              <Text style={[styles.macroValue, { color: COLORS.brand }]}>
                {activeDayPlan.protein_grams}
                <Text style={styles.macroUnit}>g</Text>
              </Text>
            </View>

            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroLabel, { color: COLORS.info }]}>CARBS</Text>
              <Text style={[styles.macroValue, { color: COLORS.info }]}>
                {activeDayPlan.carbs_grams}
                <Text style={styles.macroUnit}>g</Text>
              </Text>
            </View>

            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroLabel, { color: COLORS.warning }]}>FATS</Text>
              <Text style={[styles.macroValue, { color: COLORS.warning }]}>
                {activeDayPlan.fat_grams}
                <Text style={styles.macroUnit}>g</Text>
              </Text>
            </View>
          </View>

          {/* ================= MEALS SECTION ================= */}
          <View style={styles.mealsSection}>
            <View style={styles.mealsHeaderRow}>
              <Text style={styles.sectionHeading}>MEALS</Text>
              <Text style={styles.mealsCountSub}>
                {activeDayPlan.meals.length} Scheduled Meals
              </Text>
            </View>

            {/* Editable Meal Rows (No huge rounded cards) */}
            <View style={styles.mealsTable}>
              {activeDayPlan.meals.length === 0 ? (
                <View style={styles.emptyMealsBox}>
                  <Text style={styles.emptyMealsText}>No meals scheduled for {selectedDay}.</Text>
                </View>
              ) : (
                activeDayPlan.meals.map((meal, index) => {
                  const isLast = index === activeDayPlan.meals.length - 1;

                  return (
                    <View
                      key={meal.id}
                      style={[styles.mealRow, !isLast && styles.mealRowBorder]}
                    >
                      {/* Left: Type Badge & Name & Servings */}
                      <View style={styles.mealMainCol}>
                        <View style={styles.mealTypeRow}>
                          <View style={styles.mealTypeBadge}>
                            <Text style={styles.mealTypeBadgeText}>
                              {meal.type.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.mealServingsText}>
                            {meal.servings || '1 serving'}
                          </Text>
                        </View>

                        <Text style={styles.mealNameText} numberOfLines={1}>
                          {meal.name || 'Unnamed Meal'}
                        </Text>
                      </View>

                      {/* Middle: Calories & Macros */}
                      <View style={styles.mealNutritionCol}>
                        <Text style={styles.mealCaloriesText}>
                          {meal.calories}{' '}
                          <Text style={styles.mealCalUnit}>kcal</Text>
                        </Text>
                        <Text style={styles.mealMacrosText}>
                          {meal.protein_g}g P • {meal.carbs_g}g C • {meal.fat_g}g F
                        </Text>
                      </View>

                      {/* Right: Actions (Edit & Delete) */}
                      <View style={styles.mealActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditMeal(meal)}
                          style={styles.actionIconBtn}
                          activeOpacity={0.7}
                        >
                          <Pencil size={15} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemoveMeal(meal.id)}
                          style={styles.actionIconBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={15} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* ADD MEAL Button (Primary Secondary Action) */}
            <TouchableOpacity
              onPress={handleOpenAddMeal}
              style={styles.addMealBtn}
              activeOpacity={0.8}
            >
              <Plus size={16} color={COLORS.textPrimary} />
              <Text style={styles.addMealBtnText}>ADD MEAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ================= MOBILE STICKY SAVE BUTTON ================= */}
      {!isDesktop && (
        <View
          style={[
            styles.mobileStickyBottom,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) },
          ]}
        >
          <TouchableOpacity
            onPress={handleSave}
            style={styles.mobileSaveBtn}
            activeOpacity={0.85}
          >
            <Save size={18} color="#080A0C" strokeWidth={2.4} />
            <Text style={styles.mobileSaveBtnText}>SAVE NUTRITION PLAN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= MEAL PICKER / MODAL (SHEET ON MOBILE, MODAL ON DESKTOP) ================= */}
      <Modal
        visible={isMealModalOpen}
        transparent={true}
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsMealModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMealModalOpen(false)}>
          <View
            style={[
              styles.modalOverlay,
              isDesktop ? styles.desktopModalOverlay : styles.mobileSheetOverlay,
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContentCard,
                  isDesktop
                    ? styles.desktopModalContentCard
                    : styles.mobileSheetContentCard,
                ]}
              >
                {!isDesktop && <View style={styles.mobileSheetHandle} />}

                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalHeading}>
                      {editingMealId ? 'EDIT MEAL' : 'ADD MEAL'}
                    </Text>
                    <Text style={styles.modalSubheading}>
                      Select from curated suggestions or configure custom macros.
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsMealModalOpen(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Mode Selector: Quick Suggestions vs Custom Meal */}
                <View style={styles.modeTabBar}>
                  <TouchableOpacity
                    onPress={() => setModalMode('suggestions')}
                    style={[
                      styles.modeTabBtn,
                      modalMode === 'suggestions' && styles.modeTabBtnActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Sparkles
                      size={13}
                      color={
                        modalMode === 'suggestions' ? COLORS.brand : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        modalMode === 'suggestions' && styles.modeTabTextActive,
                      ]}
                    >
                      QUICK SUGGESTIONS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setModalMode('custom')}
                    style={[
                      styles.modeTabBtn,
                      modalMode === 'custom' && styles.modeTabBtnActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Pencil
                      size={13}
                      color={modalMode === 'custom' ? COLORS.brand : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        modalMode === 'custom' && styles.modeTabTextActive,
                      ]}
                    >
                      CUSTOM MEAL
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Modal Body */}
                <ScrollView
                  style={styles.modalScrollBody}
                  showsVerticalScrollIndicator={false}
                >
                  {/* MODE 1: QUICK SUGGESTIONS (COMPACT ROWS) */}
                  {modalMode === 'suggestions' && (
                    <View style={styles.suggestionsContainer}>
                      {/* Meal Type Quick Filter Tabs */}
                      <View style={styles.typeFilterRow}>
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
                          const isActive = formType === type;
                          return (
                            <TouchableOpacity
                              key={type}
                              onPress={() => setFormType(type)}
                              style={[
                                styles.typeFilterPill,
                                isActive && styles.typeFilterPillActive,
                              ]}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.typeFilterText,
                                  isActive && styles.typeFilterTextActive,
                                ]}
                              >
                                {type.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Suggestions List */}
                      <View style={styles.suggestionsList}>
                        {(MEAL_SUGGESTIONS[formType] || []).map((sug, i) => (
                          <View key={i} style={styles.suggestionRow}>
                            <View style={styles.suggestionInfoCol}>
                              <Text style={styles.suggestionTitle}>{sug.label}</Text>
                              <Text style={styles.suggestionName} numberOfLines={1}>
                                {sug.name}
                              </Text>
                              <Text style={styles.suggestionMacros}>
                                {sug.calories} kcal • {sug.protein_g}g P • {sug.carbs_g}g C • {sug.fat_g}g F
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => handleApplySuggestion(sug, formType)}
                              style={styles.applySugBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.applySugBtnText}>APPLY</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* MODE 2: CUSTOM MEAL FORM (TWO-COLUMN ON DESKTOP, SINGLE ON MOBILE) */}
                  {modalMode === 'custom' && (
                    <View style={styles.customFormContainer}>
                      {/* Meal Type Selection */}
                      <View style={styles.formGroupFull}>
                        <Text style={styles.fieldLabel}>MEAL TYPE</Text>
                        <View style={styles.typeButtonsRow}>
                          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
                            const isSelected = formType === type;
                            return (
                              <TouchableOpacity
                                key={type}
                                onPress={() => setFormType(type)}
                                style={[
                                  styles.typeSelectBtn,
                                  isSelected && styles.typeSelectBtnActive,
                                ]}
                                activeOpacity={0.75}
                              >
                                <Text
                                  style={[
                                    styles.typeSelectBtnText,
                                    isSelected && styles.typeSelectBtnTextActive,
                                  ]}
                                >
                                  {type.toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Two-Column Form for Desktop */}
                      <View style={[styles.formGrid, isDesktop && styles.desktopFormGrid]}>
                        <View style={styles.formFieldCol}>
                          <Text style={styles.fieldLabel}>MEAL NAME</Text>
                          <TextInput
                            value={formName}
                            onChangeText={setFormName}
                            placeholder="e.g. Grilled Chicken & Jasmine Rice"
                            placeholderTextColor={COLORS.textMuted}
                            style={styles.fieldInput}
                          />
                        </View>

                        <View style={styles.formFieldCol}>
                          <Text style={styles.fieldLabel}>SERVINGS</Text>
                          <TextInput
                            value={formServings}
                            onChangeText={setFormServings}
                            placeholder="e.g. 1 plate or 250g"
                            placeholderTextColor={COLORS.textMuted}
                            style={styles.fieldInput}
                          />
                        </View>

                        <View style={styles.formFieldCol}>
                          <Text style={styles.fieldLabel}>CALORIES (KCAL)</Text>
                          <TextInput
                            value={formCalories}
                            onChangeText={setFormCalories}
                            placeholder="500"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            style={styles.fieldInput}
                          />
                        </View>

                        <View style={styles.formFieldCol}>
                          <Text style={[styles.fieldLabel, { color: COLORS.brand }]}>
                            PROTEIN (G)
                          </Text>
                          <TextInput
                            value={formProtein}
                            onChangeText={setFormProtein}
                            placeholder="35"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            style={styles.fieldInput}
                          />
                        </View>

                        <View style={styles.formFieldCol}>
                          <Text style={[styles.fieldLabel, { color: COLORS.info }]}>
                            CARBS (G)
                          </Text>
                          <TextInput
                            value={formCarbs}
                            onChangeText={setFormCarbs}
                            placeholder="45"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            style={styles.fieldInput}
                          />
                        </View>

                        <View style={styles.formFieldCol}>
                          <Text style={[styles.fieldLabel, { color: COLORS.warning }]}>
                            FAT (G)
                          </Text>
                          <TextInput
                            value={formFat}
                            onChangeText={setFormFat}
                            placeholder="15"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            style={styles.fieldInput}
                          />
                        </View>
                      </View>

                      {/* Modal Save Meal CTA */}
                      <TouchableOpacity
                        onPress={handleSaveCustomMeal}
                        style={styles.modalSaveCustomBtn}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.modalSaveCustomBtnText}>
                          {editingMealId ? 'UPDATE MEAL' : 'ADD TO DAY'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  innerWrapper: {
    width: '100%',
    gap: SPACING.lg,
  },
  desktopInnerWrapper: {
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },

  // Header
  header: {
    gap: SPACING.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.2,
  },
  desktopSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  desktopSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
  headerTitlesCol: {
    gap: 2,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  athleteNameText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  titleBox: {
    marginTop: 4,
  },
  titleInput: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Day Selector Row
  daySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayStrip: {
    gap: 6,
    paddingVertical: 2,
  },
  dayPill: {
    width: 60,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayPillActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  dayPillInactive: {
    backgroundColor: COLORS.surfacePrimary,
    borderColor: COLORS.border,
  },
  dayPillName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dayPillKcal: {
    fontSize: 10,
    fontWeight: '700',
  },
  copyDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyDayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  copiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copiedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
  },

  // Macro Summary Surface
  macroSummarySurface: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  macroCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  macroDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  macroUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Meals Section
  mealsSection: {
    gap: SPACING.md,
  },
  mealsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mealsCountSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Meals Table (Editable Rows)
  mealsTable: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  mealRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealMainCol: {
    flex: 1.4,
    gap: 4,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  mealServingsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  mealNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mealNutritionCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  mealCaloriesText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mealCalUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  mealMacrosText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  mealActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyMealsBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMealsText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Add Meal Action
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  addMealBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },

  // Mobile Sticky Bottom Save
  mobileStickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    paddingHorizontal: LAYOUT.paddingMobile,
  },
  mobileSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
  },
  mobileSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },

  // Modal / Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  desktopModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mobileSheetOverlay: {
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desktopModalContentCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '88%',
    borderRadius: RADIUS.xl,
    padding: 24,
  },
  mobileSheetContentCard: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 20,
    paddingBottom: 36,
  },
  mobileSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubheading: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    gap: 4,
    marginBottom: SPACING.md,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modeTabBtnActive: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  modeTabTextActive: {
    color: COLORS.brand,
  },
  modalScrollBody: {
    maxHeight: 460,
  },

  // Suggestions List
  suggestionsContainer: {
    gap: SPACING.md,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeFilterPillActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderColor: COLORS.brand,
  },
  typeFilterText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  typeFilterTextActive: {
    color: COLORS.brand,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 12,
  },
  suggestionInfoCol: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  suggestionName: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  suggestionMacros: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  applySugBtn: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applySugBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },

  // Custom Form
  customFormContainer: {
    gap: SPACING.md,
  },
  formGroupFull: {
    gap: 6,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeSelectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeSelectBtnActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderColor: COLORS.brand,
  },
  typeSelectBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  typeSelectBtnTextActive: {
    color: COLORS.brand,
  },
  formGrid: {
    gap: 12,
  },
  desktopFormGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formFieldCol: {
    width: '100%',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fieldInput: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalSaveCustomBtn: {
    height: 48,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveCustomBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
});
