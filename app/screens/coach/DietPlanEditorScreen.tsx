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
} from 'react-native';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Egg,
  Salad,
  UtensilsCrossed,
  Sparkles,
  Flame,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useCreateDietPlan, useUpdateDietPlan, useDietPlan } from '../../lib/queries/dietPlans';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
import { DayOfWeek, DayDietPlan, MealItem } from '../../types/database';

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
    name: '',
    type: 'breakfast',
    calories: 500,
    protein_g: 35,
    carbs_g: 50,
    fat_g: 15,
    completed: false,
  },
  {
    id: `${prefix}-lunch`,
    name: '',
    type: 'lunch',
    calories: 650,
    protein_g: 45,
    carbs_g: 65,
    fat_g: 20,
    completed: false,
  },
  {
    id: `${prefix}-dinner`,
    name: '',
    type: 'dinner',
    calories: 600,
    protein_g: 40,
    carbs_g: 55,
    fat_g: 18,
    completed: false,
  },
];

const createEmptyWeekPlan = (): Record<DayOfWeek, DayDietPlan> => {
  const result: Partial<Record<DayOfWeek, DayDietPlan>> = {};
  for (const day of DAYS_OF_WEEK) {
    const defaultMeals = createDayDefaultMeals(day.toLowerCase().slice(0, 3));
    result[day] = {
      daily_calorie_target: 1750,
      protein_grams: 120,
      carbs_grams: 170,
      fat_grams: 53,
      meals: defaultMeals,
    };
  }
  return result as Record<DayOfWeek, DayDietPlan>;
};

export const DietPlanEditorScreen: React.FC = () => {
  const { themeMode, selectedClientId, setCoachActiveTab, editingDietPlanId, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const { data: existingPlan } = useDietPlan(selectedClientId);
  const createDietPlanMutation = useCreateDietPlan();
  const updateDietPlanMutation = useUpdateDietPlan();

  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [dayPlans, setDayPlans] = useState<Record<DayOfWeek, DayDietPlan>>(createEmptyWeekPlan());
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);

  // Initialize form with existing plan if available
  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title || '');
      const weekData = createEmptyWeekPlan();

      if (existingPlan.day_plans && Object.keys(existingPlan.day_plans).length > 0) {
        for (const day of DAYS_OF_WEEK) {
          const savedDay = existingPlan.day_plans[day];
          if (savedDay && savedDay.meals && savedDay.meals.length > 0) {
            const meals = [...savedDay.meals];
            const hasBreakfast = meals.some((m) => m.type === 'breakfast');
            const hasLunch = meals.some((m) => m.type === 'lunch');
            const hasDinner = meals.some((m) => m.type === 'dinner');

            if (!hasBreakfast) {
              meals.unshift({
                id: `${day.toLowerCase().slice(0, 3)}-breakfast`,
                name: '',
                type: 'breakfast',
                calories: 500,
                protein_g: 35,
                carbs_g: 50,
                fat_g: 15,
                completed: false,
              });
            }
            if (!hasLunch) {
              meals.splice(1, 0, {
                id: `${day.toLowerCase().slice(0, 3)}-lunch`,
                name: '',
                type: 'lunch',
                calories: 650,
                protein_g: 45,
                carbs_g: 65,
                fat_g: 20,
                completed: false,
              });
            }
            if (!hasDinner) {
              meals.push({
                id: `${day.toLowerCase().slice(0, 3)}-dinner`,
                name: '',
                type: 'dinner',
                calories: 600,
                protein_g: 40,
                carbs_g: 55,
                fat_g: 18,
                completed: false,
              });
            }

            weekData[day] = {
              daily_calorie_target: savedDay.daily_calorie_target || 1750,
              protein_grams: savedDay.protein_grams || 120,
              carbs_grams: savedDay.carbs_grams || 170,
              fat_grams: savedDay.fat_grams || 53,
              meals,
            };
          }
        }
        setDayPlans(weekData);
      } else if (existingPlan.meals && existingPlan.meals.length > 0) {
        for (const day of DAYS_OF_WEEK) {
          weekData[day] = {
            daily_calorie_target: existingPlan.daily_calorie_target || 1750,
            protein_grams: existingPlan.protein_grams || 120,
            carbs_grams: existingPlan.carbs_grams || 170,
            fat_grams: existingPlan.fat_grams || 53,
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
    daily_calorie_target: 1750,
    protein_grams: 120,
    carbs_grams: 170,
    fat_grams: 53,
    meals: createDayDefaultMeals(selectedDay.toLowerCase().slice(0, 3)),
  };

  const handleUpdateMeal = (mealId: string, field: keyof MealItem, value: any) => {
    const updatedMeals = activeDayPlan.meals.map((m) =>
      m.id === mealId ? { ...m, [field]: value } : m
    );

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

  const handleApplySuggestion = (mealId: string, sug: MealSuggestion) => {
    const updatedMeals = activeDayPlan.meals.map((m) =>
      m.id === mealId
        ? {
            ...m,
            name: sug.name,
            calories: sug.calories,
            protein_g: sug.protein_g,
            carbs_g: sug.carbs_g,
            fat_g: sug.fat_g,
          }
        : m
    );

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

  const handleAddExtraMeal = () => {
    const extraMeal: MealItem = {
      id: `${selectedDay.toLowerCase().slice(0, 3)}-snack-${Date.now()}`,
      name: '',
      type: 'snack',
      calories: 250,
      protein_g: 20,
      carbs_g: 25,
      fat_g: 8,
      completed: false,
    };

    const updatedMeals = [...activeDayPlan.meals, extraMeal];
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

  const handleRemoveExtraMeal = (mealId: string) => {
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

  // Separate preset meals and extra meals for clean sectioning
  const breakfastMeal = activeDayPlan.meals.find((m) => m.type === 'breakfast');
  const lunchMeal = activeDayPlan.meals.find((m) => m.type === 'lunch');
  const dinnerMeal = activeDayPlan.meals.find((m) => m.type === 'dinner');
  const extraMeals = activeDayPlan.meals.filter((m) => m.type === 'snack');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setCoachActiveTab('client-detail')}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#94A3B8" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Diet Builder</Text>

          <TouchableOpacity onPress={handleSave} style={styles.saveTopBtn} activeOpacity={0.85}>
            <Save size={14} color="#0F172A" />
            <Text style={styles.saveTopBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Title */}
        <View style={styles.titleContainer}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Plan Title (e.g. 2,000 kcal Lean Bulk Protocol)"
            placeholderTextColor="#64748B"
            style={[styles.titleInput, { color: theme.textPrimary }]}
          />
        </View>

        {/* 7-Day Day Selector Strip */}
        <View style={styles.daySelectorWrapper}>
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
                      styles.dayPillText,
                      isSelected ? { color: '#0F172A' } : { color: '#94A3B8' },
                    ]}
                  >
                    {shortName}
                  </Text>
                  <Text
                    style={[
                      styles.dayPillKcal,
                      isSelected ? { color: '#0F172A' } : { color: '#CCFF00' },
                    ]}
                  >
                    {kcal > 0 ? `${kcal}` : '--'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Day Header + Quick Copy Button */}
        <View style={styles.dayActionRow}>
          <View>
            <Text style={[styles.activeDayHeading, { color: theme.textPrimary }]}>
              {selectedDay.toUpperCase()} MEALS
            </Text>
            <Text style={styles.activeDaySubheading}>Breakfast, Lunch, Dinner & Extras</Text>
          </View>

          <TouchableOpacity
            onPress={handleCopyDayToAllDays}
            style={styles.copyPillBtn}
            activeOpacity={0.8}
          >
            <Copy size={12} color="#CCFF00" />
            <Text style={styles.copyPillText}>Copy to 7 Days</Text>
          </TouchableOpacity>
        </View>

        {copiedBanner && (
          <View style={styles.successBanner}>
            <Check size={14} color="#34D399" />
            <Text style={styles.successBannerText}>{copiedBanner}</Text>
          </View>
        )}

        {/* Compact Day Macro Bar */}
        <View style={styles.dailyMacroBar}>
          <View style={styles.macroBarCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Flame size={12} color="#CCFF00" />
              <Text style={styles.macroBarLabel}>TOTAL KCAL</Text>
            </View>
            <Text style={[styles.macroBarValue, { color: '#FFFFFF' }]}>
              {activeDayPlan.daily_calorie_target} kcal
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroBarCol}>
            <Text style={[styles.macroBarLabel, { color: '#CCFF00' }]}>PROTEIN</Text>
            <Text style={[styles.macroBarValue, { color: '#CCFF00' }]}>
              {activeDayPlan.protein_grams}g
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroBarCol}>
            <Text style={[styles.macroBarLabel, { color: '#38BDF8' }]}>CARBS</Text>
            <Text style={[styles.macroBarValue, { color: '#38BDF8' }]}>
              {activeDayPlan.carbs_grams}g
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroBarCol}>
            <Text style={[styles.macroBarLabel, { color: '#FB923C' }]}>FAT</Text>
            <Text style={[styles.macroBarValue, { color: '#FB923C' }]}>
              {activeDayPlan.fat_grams}g
            </Text>
          </View>
        </View>

        {/* MEAL CARDS (CLEAN & CLEAR WITH PLACEHOLDERS AND SUGGESTIONS) */}
        <View style={styles.mealsContainer}>
          {/* 1. BREAKFAST */}
          {breakfastMeal && (
            <CleanMealCard
              badge="BREAKFAST"
              icon={<Egg size={15} color="#CCFF00" />}
              meal={breakfastMeal}
              placeholder="e.g. 3 Eggs, 1 Avocado & 60g Oatmeal"
              defaultKcal="500"
              defaultProtein="35"
              defaultCarbs="50"
              defaultFat="15"
              suggestions={MEAL_SUGGESTIONS.breakfast}
              onUpdate={(field, val) => handleUpdateMeal(breakfastMeal.id, field, val)}
              onApplySuggestion={(sug) => handleApplySuggestion(breakfastMeal.id, sug)}
            />
          )}

          {/* 2. LUNCH */}
          {lunchMeal && (
            <CleanMealCard
              badge="LUNCH"
              icon={<Salad size={15} color="#38BDF8" />}
              meal={lunchMeal}
              placeholder="e.g. 200g Chicken Breast, Rice & Mixed Salad"
              defaultKcal="650"
              defaultProtein="45"
              defaultCarbs="65"
              defaultFat="20"
              suggestions={MEAL_SUGGESTIONS.lunch}
              onUpdate={(field, val) => handleUpdateMeal(lunchMeal.id, field, val)}
              onApplySuggestion={(sug) => handleApplySuggestion(lunchMeal.id, sug)}
            />
          )}

          {/* 3. DINNER */}
          {dinnerMeal && (
            <CleanMealCard
              badge="DINNER"
              icon={<UtensilsCrossed size={15} color="#FB923C" />}
              meal={dinnerMeal}
              placeholder="e.g. Grilled Salmon, Sweet Potato & Asparagus"
              defaultKcal="600"
              defaultProtein="40"
              defaultCarbs="55"
              defaultFat="18"
              suggestions={MEAL_SUGGESTIONS.dinner}
              onUpdate={(field, val) => handleUpdateMeal(dinnerMeal.id, field, val)}
              onApplySuggestion={(sug) => handleApplySuggestion(dinnerMeal.id, sug)}
            />
          )}

          {/* 4. EXTRA MEALS / SNACKS */}
          {extraMeals.map((snack, sIdx) => (
            <CleanMealCard
              key={snack.id}
              badge={`EXTRA MEAL / SNACK ${extraMeals.length > 1 ? `#${sIdx + 1}` : ''}`}
              icon={<Sparkles size={15} color="#A78BFA" />}
              meal={snack}
              placeholder="e.g. Whey Protein Shake & 30g Almonds"
              defaultKcal="250"
              defaultProtein="20"
              defaultCarbs="25"
              defaultFat="8"
              suggestions={MEAL_SUGGESTIONS.snack}
              onUpdate={(field, val) => handleUpdateMeal(snack.id, field, val)}
              onApplySuggestion={(sug) => handleApplySuggestion(snack.id, sug)}
              onRemove={() => handleRemoveExtraMeal(snack.id)}
            />
          ))}

          {/* Add Extra Meal Button */}
          <TouchableOpacity
            onPress={handleAddExtraMeal}
            style={styles.addExtraBtn}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#CCFF00" />
            <Text style={styles.addExtraBtnText}>Add Extra Meal / Snack</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Save Button */}
        <TouchableOpacity onPress={handleSave} style={styles.saveBottomBtn} activeOpacity={0.85}>
          <Save size={18} color="#0F172A" />
          <Text style={styles.saveBottomBtnText}>Save 7-Day Diet Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

interface CleanMealCardProps {
  badge: string;
  icon: React.ReactNode;
  meal: MealItem;
  placeholder: string;
  defaultKcal: string;
  defaultProtein: string;
  defaultCarbs: string;
  defaultFat: string;
  suggestions: MealSuggestion[];
  onUpdate: (field: keyof MealItem, value: any) => void;
  onApplySuggestion: (sug: MealSuggestion) => void;
  onRemove?: () => void;
}

const CleanMealCard: React.FC<CleanMealCardProps> = ({
  badge,
  icon,
  meal,
  placeholder,
  defaultKcal,
  defaultProtein,
  defaultCarbs,
  defaultFat,
  suggestions,
  onUpdate,
  onApplySuggestion,
  onRemove,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <View style={styles.mealBox}>
      {/* Meal Header */}
      <View style={styles.mealBoxHeader}>
        <View style={styles.mealBadgeGroup}>
          <View style={styles.mealIconCircle}>{icon}</View>
          <Text style={styles.mealBadgeTitle}>{badge}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowSuggestions((prev) => !prev)}
            style={styles.ideasPill}
            activeOpacity={0.75}
          >
            <Sparkles size={11} color="#CCFF00" />
            <Text style={styles.ideasPillText}>{showSuggestions ? 'Hide Ideas' : 'Quick Ideas'}</Text>
          </TouchableOpacity>

          {onRemove && (
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.7}>
              <Trash2 size={13} color="#FB7185" />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Suggestions Strip if toggled */}
      {showSuggestions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsStrip}
        >
          {suggestions.map((sug, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                onApplySuggestion(sug);
                setShowSuggestions(false);
              }}
              style={styles.suggestionChip}
              activeOpacity={0.75}
            >
              <Text style={styles.suggestionChipTitle}>{sug.label}</Text>
              <Text style={styles.suggestionChipSub}>
                {sug.calories}k • {sug.protein_g}g P
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Meal Name Input with clear placeholder */}
      <TextInput
        value={meal.name}
        onChangeText={(text) => onUpdate('name', text)}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        style={styles.mealDescInput}
      />

      {/* Inline Macros Row with clear placeholders */}
      <View style={styles.macrosRow}>
        <View style={styles.macroCell}>
          <Text style={styles.cellLabel}>Calories</Text>
          <View style={styles.cellInputWrap}>
            <TextInput
              value={meal.calories ? String(meal.calories) : ''}
              onChangeText={(val) => onUpdate('calories', parseInt(val) || 0)}
              placeholder={defaultKcal}
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              style={[styles.cellInput, { color: '#FFFFFF' }]}
            />
            <Text style={styles.cellUnit}>kcal</Text>
          </View>
        </View>

        <View style={styles.macroCell}>
          <Text style={[styles.cellLabel, { color: '#CCFF00' }]}>Protein</Text>
          <View style={styles.cellInputWrap}>
            <TextInput
              value={meal.protein_g ? String(meal.protein_g) : ''}
              onChangeText={(val) => onUpdate('protein_g', parseInt(val) || 0)}
              placeholder={defaultProtein}
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              style={[styles.cellInput, { color: '#CCFF00' }]}
            />
            <Text style={styles.cellUnit}>g</Text>
          </View>
        </View>

        <View style={styles.macroCell}>
          <Text style={[styles.cellLabel, { color: '#38BDF8' }]}>Carbs</Text>
          <View style={styles.cellInputWrap}>
            <TextInput
              value={meal.carbs_g ? String(meal.carbs_g) : ''}
              onChangeText={(val) => onUpdate('carbs_g', parseInt(val) || 0)}
              placeholder={defaultCarbs}
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              style={[styles.cellInput, { color: '#38BDF8' }]}
            />
            <Text style={styles.cellUnit}>g</Text>
          </View>
        </View>

        <View style={styles.macroCell}>
          <Text style={[styles.cellLabel, { color: '#FB923C' }]}>Fat</Text>
          <View style={styles.cellInputWrap}>
            <TextInput
              value={meal.fat_g ? String(meal.fat_g) : ''}
              onChangeText={(val) => onUpdate('fat_g', parseInt(val) || 0)}
              placeholder={defaultFat}
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              style={[styles.cellInput, { color: '#FB923C' }]}
            />
            <Text style={styles.cellUnit}>g</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 140,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  saveTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
  },
  saveTopBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  titleContainer: {
    marginTop: 2,
  },
  titleInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  daySelectorWrapper: {
    marginTop: 2,
  },
  dayStrip: {
    gap: 6,
    paddingVertical: 2,
  },
  dayPill: {
    width: 60,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dayPillActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  dayPillInactive: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  dayPillKcal: {
    fontSize: 9,
    fontWeight: '800',
  },
  dayActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  activeDayHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeDaySubheading: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  copyPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CCFF00',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 12,
    padding: 8,
  },
  successBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  dailyMacroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  macroBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  macroDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#1E293B',
  },
  macroBarLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  macroBarValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  mealsContainer: {
    gap: 12,
  },
  mealBox: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  mealBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealBadgeTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  ideasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  ideasPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCFF00',
  },
  suggestionsStrip: {
    gap: 6,
    paddingVertical: 2,
  },
  suggestionChip: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 1,
  },
  suggestionChipTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  suggestionChipSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#CCFF00',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FB7185',
  },
  mealDescInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroCell: {
    flex: 1,
    gap: 3,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  cellInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cellInput: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 0,
    minWidth: 26,
  },
  cellUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 1,
  },
  addExtraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    borderStyle: 'dashed',
    marginTop: 2,
  },
  addExtraBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CCFF00',
  },
  saveBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 4,
  },
  saveBottomBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
});
