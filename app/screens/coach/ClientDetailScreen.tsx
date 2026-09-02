import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Apple,
  Dumbbell,
  TrendingUp,
  BellRing,
  Pencil,
  CircleCheck,
  Calendar,
  Flame,
  Send,
  Scale,
  Moon,
  Timer,
  Utensils,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useProfile, useClientStats, useUpdateTargetWeight } from '../../lib/queries/profiles';
import { useDietPlan } from '../../lib/queries/dietPlans';
import { useExercisePlan } from '../../lib/queries/exercisePlans';
import { useLogs, useUpdateLog } from '../../lib/queries/logs';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
import { DayOfWeek } from '../../types/database';

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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ClientDetailScreen: React.FC = () => {
  const {
    themeMode,
    selectedClientId,
    setCoachActiveTab,
    setEditingDietPlanId,
    setEditingExercisePlanId,
  } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const [activeSubTab, setActiveSubTab] = useState<'diet' | 'workout' | 'progress'>('workout');
  const [selectedDietDay, setSelectedDietDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<DayOfWeek>(getTodayDayOfWeek());

  const [coachNoteInput, setCoachNoteInput] = useState('');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetWeightInput, setTargetWeightInput] = useState('');

  const { data: clientProfile } = useProfile(selectedClientId);
  const { data: clientStats } = useClientStats(selectedClientId);
  const { data: dietPlan } = useDietPlan(selectedClientId);
  const { data: exercisePlan } = useExercisePlan(selectedClientId);
  const { data: clientLogs } = useLogs(selectedClientId);

  const updateLogMutation = useUpdateLog();
  const updateTargetWeightMutation = useUpdateTargetWeight();

  const currentTargetWeight =
    clientProfile?.target_weight !== undefined && clientProfile?.target_weight !== null
      ? clientProfile.target_weight
      : clientStats?.target_weight;

  const currentWeightNum = clientStats?.current_weight;

  const handleOpenTargetWeightModal = () => {
    setTargetWeightInput(
      currentTargetWeight
        ? String(currentTargetWeight)
        : currentWeightNum
          ? String(currentWeightNum)
          : '70'
    );
    setIsTargetModalOpen(true);
  };

  const handleSaveTargetWeight = async () => {
    const val = parseFloat(targetWeightInput);
    if (isNaN(val) || val <= 0 || val > 350) {
      return;
    }
    await updateTargetWeightMutation.mutateAsync({
      clientId: selectedClientId,
      targetWeight: val,
    });
    setIsTargetModalOpen(false);
  };

  const adjustTargetWeight = (delta: number) => {
    const current = parseFloat(targetWeightInput) || currentWeightNum || 70;
    const updated = Math.max(20, Math.min(300, parseFloat((current + delta).toFixed(1))));
    setTargetWeightInput(String(updated));
  };

  const targetNum = parseFloat(targetWeightInput);
  let deltaText = '';
  let deltaColor = '#94A3B8';
  if (!isNaN(targetNum) && currentWeightNum && currentWeightNum > 0) {
    const diff = parseFloat((targetNum - currentWeightNum).toFixed(1));
    if (diff < 0) {
      deltaText = `${Math.abs(diff)} kg Deficit (Cutting Goal)`;
      deltaColor = '#38BDF8';
    } else if (diff > 0) {
      deltaText = `+${diff} kg Surplus (Bulking Goal)`;
      deltaColor = '#CCFF00';
    } else {
      deltaText = 'Maintenance Goal';
      deltaColor = '#34D399';
    }
  }

  const handleSaveCoachNote = (logId: string) => {
    if (!coachNoteInput.trim()) return;
    updateLogMutation.mutate({
      id: logId,
      updates: { coach_notes: coachNoteInput },
    });
    setCoachNoteInput('');
  };

  // Resolve today's date, day of week, and log
  const todayDate = new Date().toISOString().split('T')[0];
  const todayDay = getTodayDayOfWeek();
  const todayLog = (clientLogs || []).find((l) => l.date === todayDate);

  const isMealCompleted = (meal: any) => {
    if (meal.completed) return true;
    if (selectedDietDay === todayDay && todayLog?.logged_meals && Array.isArray(todayLog.logged_meals)) {
      return todayLog.logged_meals.some(
        (m: any) => m.id === meal.id || (m.name && m.name.toLowerCase() === meal.name?.toLowerCase())
      );
    }
    return false;
  };

  const isExerciseCompleted = (ex: any) => {
    if (ex.completed) return true;
    if (selectedWorkoutDay === todayDay && todayLog?.logged_exercises && Array.isArray(todayLog.logged_exercises)) {
      return todayLog.logged_exercises.some(
        (e: any) => e.id === ex.id || (e.name && e.name.toLowerCase() === ex.name?.toLowerCase())
      );
    }
    return false;
  };

  // Resolve diet plan for selected day
  const activeDietDayPlan =
    dietPlan?.day_plans?.[selectedDietDay] || {
      daily_calorie_target: dietPlan?.daily_calorie_target || 0,
      protein_grams: dietPlan?.protein_grams || 0,
      carbs_grams: dietPlan?.carbs_grams || 0,
      fat_grams: dietPlan?.fat_grams || 0,
      meals: dietPlan?.meals || [],
    };

  // Diet progress calculation for selected day
  const rawDietMeals = activeDietDayPlan.meals || [];
  const dietMeals = rawDietMeals.map((m: any) => ({
    ...m,
    completed: isMealCompleted(m),
  }));
  const eatenMealsCount = dietMeals.filter((m: any) => m.completed).length;
  const eatenKcal = dietMeals.reduce((acc: number, m: any) => (m.completed ? acc + (Number(m.calories) || 0) : acc), 0);
  const targetKcal = activeDietDayPlan.daily_calorie_target || 0;
  const eatenProtein = dietMeals.reduce((acc: number, m: any) => (m.completed ? acc + (Number(m.protein_g) || 0) : acc), 0);
  const eatenCarbs = dietMeals.reduce((acc: number, m: any) => (m.completed ? acc + (Number(m.carbs_g) || 0) : acc), 0);
  const eatenFat = dietMeals.reduce((acc: number, m: any) => (m.completed ? acc + (Number(m.fat_g) || 0) : acc), 0);
  const dietCompletionPercent = dietMeals.length > 0 ? Math.round((eatenMealsCount / dietMeals.length) * 100) : 0;

  // Resolve workout routine for selected day
  const activeWorkoutDayRoutine =
    exercisePlan?.day_routines?.[selectedWorkoutDay] || {
      day_of_week: selectedWorkoutDay,
      is_rest_day: selectedWorkoutDay === 'Thursday' || selectedWorkoutDay === 'Sunday',
      target_muscle: exercisePlan?.target_muscle || (selectedWorkoutDay === 'Thursday' || selectedWorkoutDay === 'Sunday' ? 'Rest Day' : 'Full Body Protocol'),
      exercises: exercisePlan?.exercises || [],
    };

  // Workout progress calculation for selected day
  const rawWorkoutExercises = activeWorkoutDayRoutine.exercises || [];
  const workoutExercises = rawWorkoutExercises.map((ex: any) => ({
    ...ex,
    completed: isExerciseCompleted(ex),
  }));
  const completedExCount = workoutExercises.filter((e: any) => e.completed).length;
  const workoutCompletionPercent = workoutExercises.length > 0 ? Math.round((completedExCount / workoutExercises.length) * 100) : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Top Navigation Row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => setCoachActiveTab('dashboard')}
            style={styles.navBtn}
            activeOpacity={0.75}
          >
            <ArrowLeft size={14} color="#94A3B8" />
            <Text style={styles.navBtnText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCoachActiveTab('reminder-editor')}
            style={styles.reminderBtn}
            activeOpacity={0.75}
          >
            <BellRing size={13} color="#FBBF24" />
            <Text style={styles.reminderBtnText}>Reminders</Text>
          </TouchableOpacity>
        </View>

        {/* Client Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {clientProfile?.avatar_url ? (
              <Image
                source={{
                  uri: clientProfile.avatar_url,
                }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(clientProfile?.full_name?.trim() || 'A')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.clientNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {clientProfile?.full_name?.trim() || 'Athlete'}
                </Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {clientProfile?.status?.toUpperCase() || 'ACTIVE'}
                  </Text>
                </View>
              </View>
              <Text style={styles.roleSub}>Athlete</Text>
            </View>
          </View>

          {/* Balanced 3-Column Stats Row */}
          <View style={styles.statsContainer}>
            {/* 1. Streak */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STREAK</Text>
              <View style={styles.statValRow}>
                <Flame size={13} color="#CCFF00" />
                <Text style={[styles.statValue, { color: '#CCFF00' }]}>
                  {clientStats?.streak_days || 0}d
                </Text>
              </View>
              <Text style={styles.statSubText}>Consistency</Text>
            </View>

            <View style={styles.statDivider} />

            {/* 2. Current Weight */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CURRENT</Text>
              <Text style={[styles.statValue, { color: '#FFFFFF' }]}>
                {currentWeightNum ? `${currentWeightNum} kg` : '--'}
              </Text>
              <Text style={styles.statSubText}>Athlete Log</Text>
            </View>

            <View style={styles.statDivider} />

            {/* 3. Target Weight (Clickable to Edit) */}
            <TouchableOpacity
              onPress={handleOpenTargetWeightModal}
              style={styles.statBox}
              activeOpacity={0.75}
            >
              <View style={styles.targetLabelRow}>
                <Text style={styles.statLabel}>TARGET</Text>
                <Pencil size={9} color="#38BDF8" />
              </View>
              <Text style={[styles.statValue, { color: '#38BDF8' }]}>
                {currentTargetWeight ? `${currentTargetWeight} kg` : 'Set Goal'}
              </Text>
              <Text style={[styles.statSubText, { color: '#38BDF8' }]}>Coach Set ✎</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target Weight Adjustment Modal */}
        <Modal
          visible={isTargetModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsTargetModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsTargetModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <View style={styles.modalIconCircle}>
                    <Scale size={22} color="#38BDF8" />
                  </View>

                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Target Weight</Text>
                    <Text style={styles.modalSubtitle}>
                      Assign target weight goal for {clientProfile?.full_name || 'the athlete'}.
                    </Text>
                  </View>

                  {/* Athlete's Current Weight Display */}
                  <View style={styles.currentWeightBanner}>
                    <Text style={styles.bannerLabel}>CURRENT WEIGHT</Text>
                    <Text style={styles.bannerVal}>
                      {currentWeightNum ? `${currentWeightNum} kg (Logged by athlete)` : 'No logs recorded yet'}
                    </Text>
                  </View>

                  {/* Target Weight Input */}
                  <View style={styles.targetInputBox}>
                    <TextInput
                      value={targetWeightInput}
                      onChangeText={setTargetWeightInput}
                      keyboardType="numeric"
                      placeholder="70.0"
                      placeholderTextColor="#64748B"
                      style={styles.targetInput}
                      autoFocus={true}
                    />
                    <Text style={styles.targetUnit}>kg</Text>
                  </View>

                  {/* Steppers */}
                  <View style={styles.steppersRow}>
                    {[-1, -0.5, 0.5, 1].map((step) => (
                      <TouchableOpacity
                        key={step}
                        onPress={() => adjustTargetWeight(step)}
                        style={styles.stepPill}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepPillText}>
                          {step > 0 ? `+${step}` : step} kg
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Delta Badge */}
                  {deltaText ? (
                    <View style={[styles.deltaBadge, { borderColor: deltaColor }]}>
                      <Text style={[styles.deltaBadgeText, { color: deltaColor }]}>{deltaText}</Text>
                    </View>
                  ) : null}

                  {/* Modal Buttons */}
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      onPress={() => setIsTargetModalOpen(false)}
                      style={styles.modalCancelBtn}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveTargetWeight}
                      disabled={updateTargetWeightMutation.isPending}
                      style={styles.modalSaveBtn}
                      activeOpacity={0.85}
                    >
                      {updateTargetWeightMutation.isPending ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <>
                          <CircleCheck size={15} color="#0F172A" />
                          <Text style={styles.modalSaveText}>Save Target</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Sub-Tabs (Clean Segmented Control) */}
        <View style={styles.segmentedBar}>
          <TouchableOpacity
            onPress={() => setActiveSubTab('diet')}
            style={[styles.segmentBtn, activeSubTab === 'diet' && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Apple size={14} color={activeSubTab === 'diet' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.segmentBtnText, activeSubTab === 'diet' ? { color: '#0F172A' } : { color: '#94A3B8' }]}>
              Diet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('workout')}
            style={[styles.segmentBtn, activeSubTab === 'workout' && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Dumbbell size={14} color={activeSubTab === 'workout' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.segmentBtnText, activeSubTab === 'workout' ? { color: '#0F172A' } : { color: '#94A3B8' }]}>
              Workout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('progress')}
            style={[styles.segmentBtn, activeSubTab === 'progress' && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <TrendingUp size={14} color={activeSubTab === 'progress' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.segmentBtnText, activeSubTab === 'progress' ? { color: '#0F172A' } : { color: '#94A3B8' }]}>
              Logs
            </Text>
          </TouchableOpacity>
        </View>

        {/* SUB-TAB 1: DIET */}
        {activeSubTab === 'diet' && (
          <View style={styles.subTabContent}>
            {/* Section Header (Fixed collision) */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleCol}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]} numberOfLines={1}>
                  {dietPlan?.title || 'Nutrition Protocol'}
                </Text>
                <Text style={styles.sectionSubheading}>7-DAY NUTRITION SCHEDULE</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setEditingDietPlanId(dietPlan?.id);
                  setCoachActiveTab('diet-editor');
                }}
                style={styles.editPillBtn}
                activeOpacity={0.85}
              >
                <Pencil size={12} color="#0F172A" />
                <Text style={styles.editPillText}>{dietPlan ? 'Edit Diet' : 'Create'}</Text>
              </TouchableOpacity>
            </View>

            {/* 7-Day Day Selector Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStripContainer}
            >
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDietDay === day;
                const shortName = day.slice(0, 3).toUpperCase();
                const kcal =
                  dietPlan?.day_plans?.[day]?.daily_calorie_target || dietPlan?.daily_calorie_target || 0;
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDietDay(day)}
                    style={[
                      styles.dayPillBox,
                      isSelected ? styles.dayPillActive : styles.dayPillInactive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayPillName,
                        isSelected ? { color: '#0F172A' } : { color: '#94A3B8' },
                      ]}
                    >
                      {shortName}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillTag,
                        isSelected ? { color: '#0F172A' } : { color: '#CCFF00' },
                      ]}
                    >
                      {kcal > 0 ? `${kcal}` : '--'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Day Label & Real-time Check-In Progress */}
            <View style={styles.dayInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dayHeadingText, { color: theme.textPrimary }]}>
                  {selectedDietDay.toUpperCase()} PROTOCOL
                </Text>
                <Text style={[styles.dayMealsCountText, eatenMealsCount > 0 ? { color: '#34D399' } : { color: '#94A3B8' }]}>
                  {eatenMealsCount}/{dietMeals.length} Meals Logged by Athlete ({dietCompletionPercent}%)
                </Text>
              </View>
              <View style={[styles.complianceChip, eatenMealsCount === dietMeals.length && dietMeals.length > 0 ? styles.complianceChipFull : styles.complianceChipPartial]}>
                <Text style={[styles.complianceChipText, eatenMealsCount === dietMeals.length && dietMeals.length > 0 ? { color: '#34D399' } : { color: '#FBBF24' }]}>
                  {eatenMealsCount === dietMeals.length && dietMeals.length > 0 ? '100% COMPLETE' : `${dietCompletionPercent}% LOGGED`}
                </Text>
              </View>
            </View>

            {/* Live Calorie Progress Bar */}
            {dietMeals.length > 0 && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${dietCompletionPercent}%` }]} />
              </View>
            )}

            {/* Macro Summary Row (Live Consumed vs Target) */}
            <View style={styles.macroPillRow}>
              <View style={styles.macroPillCol}>
                <Text style={styles.macroPillLabel}>CALORIES</Text>
                <Text style={[styles.macroPillVal, { color: '#FFFFFF' }]}>
                  {eatenKcal}/{targetKcal} kcal
                </Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroPillCol}>
                <Text style={[styles.macroPillLabel, { color: '#CCFF00' }]}>PROTEIN</Text>
                <Text style={[styles.macroPillVal, { color: '#CCFF00' }]}>
                  {eatenProtein}/{activeDietDayPlan.protein_grams || 0}g
                </Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroPillCol}>
                <Text style={[styles.macroPillLabel, { color: '#38BDF8' }]}>CARBS</Text>
                <Text style={[styles.macroPillVal, { color: '#38BDF8' }]}>
                  {eatenCarbs}/{activeDietDayPlan.carbs_grams || 0}g
                </Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroPillCol}>
                <Text style={[styles.macroPillLabel, { color: '#FB923C' }]}>FAT</Text>
                <Text style={[styles.macroPillVal, { color: '#FB923C' }]}>
                  {eatenFat}/{activeDietDayPlan.fat_grams || 0}g
                </Text>
              </View>
            </View>

            {/* Meals List */}
            <View style={{ gap: 8 }}>
              {dietMeals.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateText}>No meals scheduled for {selectedDietDay}.</Text>
                </View>
              ) : (
                dietMeals.map((meal) => (
                  <View
                    key={meal.id}
                    style={[
                      styles.mealCard,
                      meal.completed ? styles.mealCardCompleted : styles.mealCardPending,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.mealBadge}>{meal.type.toUpperCase()}</Text>
                      <Text style={[styles.mealNameText, meal.completed && { color: '#FFFFFF' }]}>
                        {formatTitleCase(meal.name)}
                      </Text>
                      <Text style={styles.mealMetricsText}>
                        {meal.calories} kcal • {meal.protein_g}g P • {meal.carbs_g}g C • {meal.fat_g}g F
                      </Text>
                    </View>

                    {meal.completed ? (
                      <View style={styles.loggedBadge}>
                        <CircleCheck size={12} color="#34D399" />
                        <Text style={styles.loggedBadgeText}>Logged by Athlete</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Clock size={11} color="#64748B" />
                        <Text style={styles.pendingBadgeText}>Awaiting Log</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* SUB-TAB 2: WORKOUT */}
        {activeSubTab === 'workout' && (
          <View style={styles.subTabContent}>
            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleCol}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]} numberOfLines={1}>
                  {exercisePlan?.title || 'Weekly Workout Plan'}
                </Text>
                <Text style={styles.sectionSubheading}>7-Day Workout Plan</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setEditingExercisePlanId(exercisePlan?.id);
                  setCoachActiveTab('exercise-editor');
                }}
                style={styles.editPillBtn}
                activeOpacity={0.85}
              >
                <Pencil size={12} color="#0F172A" />
                <Text style={styles.editPillText}>{exercisePlan ? 'Edit Routine' : 'Create'}</Text>
              </TouchableOpacity>
            </View>

            {/* 7-Day Day Selector Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStripContainer}
            >
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedWorkoutDay === day;
                const routine = exercisePlan?.day_routines?.[day];
                const isRest = routine
                  ? routine.is_rest_day
                  : day === 'Thursday' || day === 'Sunday';
                const shortName = day.slice(0, 3).toUpperCase();
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedWorkoutDay(day)}
                    style={[
                      styles.dayPillBox,
                      isSelected ? styles.dayPillActive : styles.dayPillInactive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayPillName,
                        isSelected ? { color: '#0F172A' } : { color: '#94A3B8' },
                      ]}
                    >
                      {shortName}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillTag,
                        isSelected
                          ? { color: '#0F172A' }
                          : isRest
                            ? { color: '#64748B' }
                            : { color: '#CCFF00' },
                      ]}
                    >
                      {isRest ? 'REST' : 'WORK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Muscle Focus / Rest Card with Real-Time Athlete Progress */}
            <View style={styles.focusBanner}>
              <View style={styles.focusIconWrap}>
                {activeWorkoutDayRoutine.is_rest_day ? (
                  <Moon size={16} color="#F97316" />
                ) : (
                  <Dumbbell size={16} color="#CCFF00" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.focusBannerLabel}>
                  {selectedWorkoutDay.toUpperCase()} FOCUS
                </Text>
                <Text style={styles.focusBannerTitle}>
                  {activeWorkoutDayRoutine.is_rest_day
                    ? 'Rest & Active Recovery'
                    : formatTitleCase(activeWorkoutDayRoutine.target_muscle || 'Workout Routine')}
                </Text>
              </View>

              {!activeWorkoutDayRoutine.is_rest_day && workoutExercises.length > 0 && (
                <View style={[styles.complianceChip, completedExCount === workoutExercises.length ? styles.complianceChipFull : styles.complianceChipPartial]}>
                  <Text style={[styles.complianceChipText, completedExCount === workoutExercises.length ? { color: '#34D399' } : { color: '#FBBF24' }]}>
                    {completedExCount}/{workoutExercises.length} Done ({workoutCompletionPercent}%)
                  </Text>
                </View>
              )}
            </View>

            {!activeWorkoutDayRoutine.is_rest_day && workoutExercises.length > 0 && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${workoutCompletionPercent}%` }]} />
              </View>
            )}

            {/* If Rest Day */}
            {activeWorkoutDayRoutine.is_rest_day ? (
              <View style={styles.restStateCard}>
                <Moon size={24} color="#F97316" />
                <Text style={[styles.restStateTitle, { color: theme.textPrimary }]}>
                  Designated Rest Day
                </Text>
                <Text style={styles.restStateSub}>
                  Athlete is scheduled for muscle recovery, mobility stretching, and hydration check-ins without required resistance lifting.
                </Text>
              </View>
            ) : (
              /* If Workout Day: List of Exercises */
              <View style={{ gap: 8 }}>
                {workoutExercises.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateText}>
                      No exercises scheduled for {selectedWorkoutDay}.
                    </Text>
                  </View>
                ) : (
                  workoutExercises.map((ex, idx) => (
                    <View
                      key={ex.id || idx}
                      style={[
                        styles.exerciseCard,
                        ex.completed ? styles.exCardCompleted : styles.exCardPending,
                      ]}
                    >
                      <View style={styles.exTopRow}>
                        <View style={[styles.numBadge, ex.completed && styles.numBadgeCompleted]}>
                          <Text style={[styles.numBadgeText, ex.completed && { color: '#0F172A' }]}>
                            {idx + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.exNameText, ex.completed && { color: '#FFFFFF' }]}>
                            {formatTitleCase(ex.name)}
                          </Text>
                          {ex.notes ? (
                            <Text style={styles.exNotesText}>"{ex.notes}"</Text>
                          ) : null}
                        </View>

                        {ex.completed ? (
                          <View style={styles.loggedBadge}>
                            <CircleCheck size={12} color="#34D399" />
                            <Text style={styles.loggedBadgeText}>Completed</Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Clock size={11} color="#64748B" />
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        )}
                      </View>

                      {/* Compact Metrics Chips */}
                      <View style={styles.metricsChipRow}>
                        <View style={styles.metricChip}>
                          <Text style={styles.metricChipText}>
                            {ex.target_sets} sets × {ex.target_reps} reps
                          </Text>
                        </View>
                        <View style={[styles.metricChip, { borderColor: 'rgba(204, 255, 0, 0.25)' }]}>
                          <Text style={[styles.metricChipText, { color: '#CCFF00' }]}>
                            {ex.weight_lbs} kg
                          </Text>
                        </View>
                        <View style={styles.metricChip}>
                          <Timer size={10} color="#38BDF8" />
                          <Text style={[styles.metricChipText, { color: '#38BDF8' }]}>
                            {ex.rest_seconds}s rest
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* SUB-TAB 3: LOGS */}
        {activeSubTab === 'progress' && (
          <View style={styles.subTabContent}>
            <Text style={styles.sectionSubheading}>DAILY LOGS & COACH FEEDBACK</Text>

            {(clientLogs || []).map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} color="#CCFF00" />
                    <Text style={styles.logDateText}>{log.date}</Text>
                  </View>
                  <Text style={styles.logMetricsText}>
                    {log.weight_lbs} kg • {log.water_intake_oz} oz • {log.sleep_hours}h sleep
                  </Text>
                </View>

                {log.coach_notes ? (
                  <View style={styles.coachNoteBox}>
                    <Text style={styles.coachNoteText}>"{log.coach_notes}"</Text>
                  </View>
                ) : (
                  <View style={styles.noteInputRow}>
                    <TextInput
                      value={coachNoteInput}
                      onChangeText={setCoachNoteInput}
                      placeholder="Leave feedback for client..."
                      placeholderTextColor="#64748B"
                      style={styles.noteInput}
                    />
                    <TouchableOpacity
                      onPress={() => handleSaveCoachNote(log.id)}
                      style={styles.sendBtn}
                      activeOpacity={0.8}
                    >
                      <Send size={13} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 120,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  reminderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
  profileCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#34D399',
  },
  roleSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E293B',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  targetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  statSubText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#090D16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#CCFF00',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subTabContent: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitleCol: {
    flex: 1,
    gap: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  sectionSubheading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#CCFF00',
    flexShrink: 0,
  },
  editPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
  },
  dayStripContainer: {
    gap: 6,
    paddingVertical: 2,
  },
  dayPillBox: {
    width: 54,
    paddingVertical: 7,
    borderRadius: 12,
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
  dayPillName: {
    fontSize: 10,
    fontWeight: '900',
  },
  dayPillTag: {
    fontSize: 8,
    fontWeight: '800',
  },
  dayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayHeadingText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  dayMealsCountText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  macroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  macroPillCol: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  macroDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#1E293B',
  },
  macroPillLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  macroPillVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  complianceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  complianceChipFull: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  complianceChipPartial: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  complianceChipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 3,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  mealCardCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  mealCardPending: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderColor: '#1E293B',
  },
  mealBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  mealNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mealMetricsText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  loggedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  exCardCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  exCardPending: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderColor: '#1E293B',
  },
  numBadgeCompleted: {
    backgroundColor: '#34D399',
  },
  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
  },
  focusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusBannerLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  focusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restStateCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 6,
  },
  restStateTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  restStateSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  exerciseCard: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  exTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
  },
  exNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exNotesText: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  metricsChipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptyStateCard: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  logCard: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CCFF00',
  },
  logMetricsText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  coachNoteBox: {
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    padding: 8,
    borderRadius: 10,
  },
  coachNoteText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontStyle: 'italic',
  },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    color: '#FFFFFF',
  },
  sendBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#CCFF00',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  modalIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  currentWeightBanner: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 1,
  },
  bannerLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bannerVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  targetInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#090D16',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  targetInput: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38BDF8',
    textAlign: 'center',
    minWidth: 80,
  },
  targetUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  stepPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  deltaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.8)',
  },
  deltaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 2,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  modalSaveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
});
