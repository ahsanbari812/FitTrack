import React, { useState, useEffect } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import {
  ArrowLeft,
  Apple,
  Dumbbell,
  Pencil,
  CircleCheck,
  Calendar,
  Flame,
  Send,
  Scale,
  Moon,
  Phone,
  Plus,
  ChevronRight,
  Check,
  BellRing,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import {
  useProfile,
  useClientStats,
  useUpdateTargetWeight,
} from '../../lib/queries/profiles';
import { useDietPlan } from '../../lib/queries/dietPlans';
import { useExercisePlan } from '../../lib/queries/exercisePlans';
import { useLogs, useUpdateLog } from '../../lib/queries/logs';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatLogDate = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const ClientDetailScreen: React.FC = () => {
  const {
    selectedClientId,
    setCoachActiveTab,
    setEditingDietPlanId,
    setEditingExercisePlanId,
  } = useUIStore();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [coachNoteInput, setCoachNoteInput] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
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

  // Auto-select latest log for notes inspection
  useEffect(() => {
    if (clientLogs && clientLogs.length > 0 && !selectedLogId) {
      setSelectedLogId(clientLogs[0].id);
      setCoachNoteInput(clientLogs[0].coach_notes || '');
    }
  }, [clientLogs, selectedLogId]);

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
  let deltaColor = COLORS.textMuted;
  if (!isNaN(targetNum) && currentWeightNum && currentWeightNum > 0) {
    const diff = parseFloat((targetNum - currentWeightNum).toFixed(1));
    if (diff < 0) {
      deltaText = `${Math.abs(diff)} kg Deficit (Cutting)`;
      deltaColor = COLORS.info;
    } else if (diff > 0) {
      deltaText = `+${diff} kg Surplus (Bulking)`;
      deltaColor = COLORS.brand;
    } else {
      deltaText = 'Maintenance Goal';
      deltaColor = COLORS.brand;
    }
  }

  const handleSelectLog = (logId: string) => {
    setSelectedLogId(logId);
    const targetLog = (clientLogs || []).find((l) => l.id === logId);
    setCoachNoteInput(targetLog?.coach_notes || '');
  };

  const handleSaveCoachNote = (logId: string) => {
    if (!coachNoteInput.trim()) return;
    updateLogMutation.mutate({
      id: logId,
      updates: { coach_notes: coachNoteInput },
    });
  };

  const todayDay = getTodayDayOfWeek();
  const athleteName = clientProfile?.full_name?.trim() || 'Athlete';
  const firstLetter = athleteName[0]?.toUpperCase() || 'A';

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
            {/* Top Row: Back & Subtitle */}
            <TouchableOpacity
              onPress={() => setCoachActiveTab('dashboard')}
              style={styles.backBtn}
              activeOpacity={0.75}
            >
              <ArrowLeft size={16} color={COLORS.brand} />
              <Text style={styles.backBtnText}>ROSTER</Text>
            </TouchableOpacity>

            <Text style={styles.headerKicker}>ATHLETE</Text>

            {/* Athlete Profile Info */}
            <View style={styles.athleteHeaderRow}>
              {clientProfile?.avatar_url ? (
                <Image source={{ uri: clientProfile.avatar_url }} style={styles.athleteAvatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{firstLetter}</Text>
                </View>
              )}

              <View style={styles.athleteMetaCol}>
                <Text style={styles.athleteName} numberOfLines={1}>
                  {athleteName}
                </Text>

                <View style={styles.athleteSubRow}>
                  <View
                    style={[
                      styles.statusPill,
                      clientProfile?.status === 'active'
                        ? styles.statusPillActive
                        : clientProfile?.status === 'pending'
                          ? styles.statusPillPending
                          : styles.statusPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        clientProfile?.status === 'active'
                          ? { color: COLORS.brand }
                          : clientProfile?.status === 'pending'
                            ? { color: COLORS.warning }
                            : { color: COLORS.textMuted },
                      ]}
                    >
                      {(clientProfile?.status || 'active').toUpperCase()}
                    </Text>
                  </View>

                  {clientProfile?.phone_number ? (
                    <View style={styles.phoneWrap}>
                      <Phone size={12} color={COLORS.textMuted} />
                      <Text style={styles.phoneText}>{clientProfile.phone_number}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* ================= PERFORMANCE HERO (1 OVERVIEW SURFACE) ================= */}
          <View style={[styles.overviewSurface, !isDesktop && styles.mobileOverviewSurface]}>
            <Text style={styles.surfaceTitle}>ATHLETE OVERVIEW</Text>

            <View style={styles.metricsGrid}>
              {/* Metric 1: STREAK */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit>
                  STREAK
                </Text>
                <View style={styles.metricValRow}>
                  <Flame size={15} color={COLORS.brand} />
                  <Text
                    style={[styles.metricValue, { color: COLORS.brand }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {clientStats?.streak_days || 0}d
                  </Text>
                </View>
                <Text style={styles.metricSub} numberOfLines={1} adjustsFontSizeToFit>
                  Consistency
                </Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Metric 2: WORKOUT */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit>
                  WORKOUT
                </Text>
                <Text
                  style={[styles.metricValue, { color: COLORS.textPrimary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {clientStats?.workout_completion_rate !== undefined
                    ? `${Math.round(clientStats.workout_completion_rate)}%`
                    : '--'}
                </Text>
                <Text style={styles.metricSub} numberOfLines={1} adjustsFontSizeToFit>
                  Completion
                </Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Metric 3: NUTRITION */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit>
                  NUTRITION
                </Text>
                <Text
                  style={[styles.metricValue, { color: COLORS.info }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {clientStats?.diet_compliance_rate !== undefined
                    ? `${Math.round(clientStats.diet_compliance_rate)}%`
                    : '--'}
                </Text>
                <Text style={styles.metricSub} numberOfLines={1} adjustsFontSizeToFit>
                  Adherence
                </Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Metric 4: TARGET WEIGHT (Clickable to Edit) */}
              <TouchableOpacity
                onPress={handleOpenTargetWeightModal}
                style={[styles.metricItem, styles.metricItemTarget]}
                activeOpacity={0.75}
              >
                <View style={styles.targetHeaderRow}>
                  <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit>
                    TARGET WEIGHT
                  </Text>
                  <Pencil size={10} color={COLORS.brand} />
                </View>
                <Text
                  style={[styles.metricValue, { color: COLORS.brand }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {currentTargetWeight ? `${currentTargetWeight} kg` : 'Set Goal'}
                </Text>
                <Text
                  style={[styles.metricSub, { color: COLORS.brand }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {currentWeightNum ? `Current: ${currentWeightNum} kg` : 'Edit Goal ✎'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= ACTION BAR ================= */}
          <View style={[styles.actionBar, isDesktop ? styles.desktopActionBar : styles.mobileActionBar]}>
            {/* Primary Action: EDIT WORKOUT */}
            <TouchableOpacity
              onPress={() => {
                setEditingExercisePlanId(exercisePlan?.id);
                setCoachActiveTab('exercise-editor');
              }}
              style={[styles.primaryActionBtn, !isDesktop && styles.mobilePrimaryActionBtn]}
              activeOpacity={0.85}
            >
              <Dumbbell size={16} color="#080A0C" strokeWidth={2.4} />
              <Text style={styles.primaryActionText} numberOfLines={1}>
                {exercisePlan ? 'EDIT WORKOUT' : 'CREATE WORKOUT'}
              </Text>
            </TouchableOpacity>

            {/* Secondary Actions Group */}
            <View style={[styles.secondaryActionsGroup, !isDesktop && styles.mobileSecondaryGroup]}>
              {/* Secondary Action: EDIT DIET */}
              <TouchableOpacity
                onPress={() => {
                  setEditingDietPlanId(dietPlan?.id);
                  setCoachActiveTab('diet-editor');
                }}
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
              >
                <Apple size={15} color={COLORS.textPrimary} />
                <Text style={styles.secondaryActionText} numberOfLines={1}>
                  {dietPlan ? 'EDIT DIET' : 'CREATE DIET'}
                </Text>
              </TouchableOpacity>

              {/* Secondary Action: ADD REMINDER */}
              <TouchableOpacity
                onPress={() => setCoachActiveTab('reminder-editor')}
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
              >
                <BellRing size={15} color={COLORS.textPrimary} />
                <Text style={styles.secondaryActionText} numberOfLines={1}>ADD REMINDER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= CURRENT PLANS (2 PLAN SURFACES) ================= */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionHeading}>CURRENT PLANS</Text>

            <View style={[styles.plansRow, isDesktop && styles.desktopPlansRow]}>
              {/* PLAN SURFACE 1: NUTRITION PLAN */}
              <View style={styles.planSurface}>
                <View style={styles.planHeaderRow}>
                  <View style={styles.planIconCircle}>
                    <Apple size={18} color={COLORS.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planKicker}>NUTRITION PLAN</Text>
                    <Text style={styles.planTitle} numberOfLines={1}>
                      {dietPlan?.title || 'Nutrition Protocol'}
                    </Text>
                  </View>
                </View>

                {/* Key Nutrition Info */}
                <View style={styles.planDetailsBox}>
                  <View style={styles.planDetailItem}>
                    <Text style={styles.planDetailLabel}>DAILY TARGET</Text>
                    <Text style={styles.planDetailVal}>
                      {dietPlan?.daily_calorie_target ? `${dietPlan.daily_calorie_target} kcal` : '--'}
                    </Text>
                  </View>
                  <View style={styles.planDetailItem}>
                    <Text style={styles.planDetailLabel}>MACROS</Text>
                    <Text style={styles.planDetailVal}>
                      {dietPlan
                        ? `${dietPlan.protein_grams || 0}g P • ${dietPlan.carbs_grams || 0}g C • ${dietPlan.fat_grams || 0}g F`
                        : 'No plan configured'}
                    </Text>
                  </View>
                </View>

                {/* Clear Action: VIEW / EDIT */}
                <TouchableOpacity
                  onPress={() => {
                    setEditingDietPlanId(dietPlan?.id);
                    setCoachActiveTab('diet-editor');
                  }}
                  style={styles.planActionBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.planActionText}>VIEW / EDIT NUTRITION</Text>
                  <ChevronRight size={15} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* PLAN SURFACE 2: WORKOUT PLAN */}
              <View style={styles.planSurface}>
                <View style={styles.planHeaderRow}>
                  <View style={styles.planIconCircle}>
                    <Dumbbell size={18} color={COLORS.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planKicker}>WORKOUT PLAN</Text>
                    <Text style={styles.planTitle} numberOfLines={1}>
                      {exercisePlan?.title || 'Weekly Workout Plan'}
                    </Text>
                  </View>
                </View>

                {/* Key Workout Info */}
                <View style={styles.planDetailsBox}>
                  <View style={styles.planDetailItem}>
                    <Text style={styles.planDetailLabel}>TRAINING FOCUS</Text>
                    <Text style={styles.planDetailVal}>
                      {formatTitleCase(exercisePlan?.target_muscle || 'Full Body Protocol')}
                    </Text>
                  </View>
                  <View style={styles.planDetailItem}>
                    <Text style={styles.planDetailLabel}>SCHEDULE</Text>
                    <Text style={styles.planDetailVal}>
                      {exercisePlan?.exercises
                        ? `${exercisePlan.exercises.length} Exercises • 7-Day Protocol`
                        : 'No plan configured'}
                    </Text>
                  </View>
                </View>

                {/* Clear Action: VIEW / EDIT */}
                <TouchableOpacity
                  onPress={() => {
                    setEditingExercisePlanId(exercisePlan?.id);
                    setCoachActiveTab('exercise-editor');
                  }}
                  style={styles.planActionBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.planActionText}>VIEW / EDIT WORKOUT</Text>
                  <ChevronRight size={15} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ================= WEEKLY PERFORMANCE ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>WEEKLY PERFORMANCE</Text>

            <View style={styles.weeklyTable}>
              {DAYS_OF_WEEK.map((day, index) => {
                const isToday = day === todayDay;
                const routine = exercisePlan?.day_routines?.[day];
                const isRest = routine
                  ? routine.is_rest_day
                  : day === 'Thursday' || day === 'Sunday';

                const dayExercises = routine?.exercises || exercisePlan?.exercises || [];
                const dayDiet = dietPlan?.day_plans?.[day];
                const dayMeals = dayDiet?.meals || dietPlan?.meals || [];

                // Determine workout completion state from existing data
                const workoutCompleted = isRest
                  ? true
                  : dayExercises.length > 0 && dayExercises.every((e) => e.completed);

                // Determine nutrition completion state from existing data
                const nutritionCompleted =
                  dayMeals.length > 0 && dayMeals.every((m) => m.completed);

                return (
                  <View
                    key={day}
                    style={[
                      styles.weeklyRow,
                      index !== DAYS_OF_WEEK.length - 1 && styles.weeklyRowBorder,
                      isToday && styles.weeklyRowToday,
                    ]}
                  >
                    {/* Day Column */}
                    <View style={styles.dayCol}>
                      <Text style={[styles.dayShortName, isToday && { color: COLORS.brand }]}>
                        {day.slice(0, 3).toUpperCase()}
                      </Text>
                      <Text style={styles.dayFullName}>{day}</Text>
                    </View>

                    {/* Workout Status Column */}
                    <View style={styles.weeklyMetricCol}>
                      <View style={styles.metricHeaderRow}>
                        <Dumbbell
                          size={12}
                          color={
                            isRest
                              ? COLORS.textMuted
                              : workoutCompleted
                                ? COLORS.brand
                                : COLORS.textMuted
                          }
                        />
                        <Text style={styles.metricColumnTitle}>WORKOUT</Text>
                      </View>
                      <Text
                        style={[
                          styles.metricStatusText,
                          isRest
                            ? styles.statusMuted
                            : workoutCompleted
                              ? styles.statusLime
                              : styles.statusMuted,
                        ]}
                      >
                        {isRest ? 'Rest Day' : workoutCompleted ? 'Completed' : 'Scheduled'}
                      </Text>
                    </View>

                    {/* Nutrition Status Column */}
                    <View style={styles.weeklyMetricCol}>
                      <View style={styles.metricHeaderRow}>
                        <Apple
                          size={12}
                          color={nutritionCompleted ? COLORS.brand : COLORS.textMuted}
                        />
                        <Text style={styles.metricColumnTitle}>NUTRITION</Text>
                      </View>
                      <Text
                        style={[
                          styles.metricStatusText,
                          nutritionCompleted ? styles.statusLime : styles.statusMuted,
                        ]}
                      >
                        {nutritionCompleted ? 'Completed' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ================= DAILY LOGS (1 TIMELINE) ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>CHECK-IN HISTORY</Text>

            {clientLogs && clientLogs.length > 0 ? (
              <View style={styles.timelineContainer}>
                {clientLogs.map((log, idx) => {
                  const isSelected = log.id === selectedLogId;
                  const isLast = idx === clientLogs.length - 1;

                  return (
                    <View key={log.id} style={styles.timelineItem}>
                      {/* Vertical Spine */}
                      <View style={styles.spineCol}>
                        <View
                          style={[
                            styles.spineNode,
                            isSelected && styles.spineNodeSelected,
                          ]}
                        >
                          {isSelected ? (
                            <View style={styles.spineInnerDot} />
                          ) : (
                            <Calendar size={11} color={COLORS.textMuted} />
                          )}
                        </View>
                        {!isLast && <View style={styles.spineLine} />}
                      </View>

                      {/* Log Content Card */}
                      <TouchableOpacity
                        onPress={() => handleSelectLog(log.id)}
                        style={[
                          styles.logCard,
                          isSelected && styles.logCardSelected,
                        ]}
                        activeOpacity={0.85}
                      >
                        {/* Log Header Row */}
                        <View style={styles.logCardHeader}>
                          <Text style={[styles.logDateText, isSelected && { color: COLORS.brand }]}>
                            {formatLogDate(log.date)}
                          </Text>

                          {/* Diet & Workout Status Badges */}
                          <View style={styles.logBadgesRow}>
                            <View
                              style={[
                                styles.miniStatusChip,
                                log.completed_workout && styles.miniStatusChipLime,
                              ]}
                            >
                              <Dumbbell
                                size={10}
                                color={log.completed_workout ? COLORS.brand : COLORS.textMuted}
                              />
                              <Text
                                style={[
                                  styles.miniStatusChipText,
                                  log.completed_workout && { color: COLORS.brand },
                                ]}
                              >
                                {log.completed_workout ? 'WORKOUT DONE' : 'WORKOUT INCOMPLETE'}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.miniStatusChip,
                                log.completed_diet && styles.miniStatusChipLime,
                              ]}
                            >
                              <Apple
                                size={10}
                                color={log.completed_diet ? COLORS.brand : COLORS.textMuted}
                              />
                              <Text
                                style={[
                                  styles.miniStatusChipText,
                                  log.completed_diet && { color: COLORS.brand },
                                ]}
                              >
                                {log.completed_diet ? 'DIET DONE' : 'DIET INCOMPLETE'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Biometrics Row */}
                        <View style={styles.biometricsRow}>
                          <View style={styles.bioItem}>
                            <Text style={styles.bioLabel}>WEIGHT</Text>
                            <Text style={styles.bioValue}>
                              {log.weight_lbs ? `${log.weight_lbs} lbs` : '--'}
                            </Text>
                          </View>

                          <View style={styles.bioItem}>
                            <Text style={styles.bioLabel}>WATER</Text>
                            <Text style={styles.bioValue}>
                              {log.water_intake_oz ? `${log.water_intake_oz} oz` : '--'}
                            </Text>
                          </View>

                          <View style={styles.bioItem}>
                            <Text style={styles.bioLabel}>SLEEP</Text>
                            <Text style={styles.bioValue}>
                              {log.sleep_hours !== undefined ? `${log.sleep_hours}h` : '--'}
                            </Text>
                          </View>

                          <View style={styles.bioItem}>
                            <Text style={styles.bioLabel}>ENERGY</Text>
                            <Text style={styles.bioValue}>
                              {log.energy_rating ? `${log.energy_rating}/5` : '--'}
                            </Text>
                          </View>
                        </View>

                        {/* Coach Notes Section (When Selected) */}
                        {isSelected && (
                          <View style={styles.coachNotesSection}>
                            <Text style={styles.coachNotesKicker}>COACH FEEDBACK</Text>

                            {log.coach_notes ? (
                              <View style={styles.existingNoteBox}>
                                <Text style={styles.existingNoteText}>"{log.coach_notes}"</Text>
                              </View>
                            ) : null}

                            {/* Notes Editor */}
                            <View style={styles.noteEditorRow}>
                              <TextInput
                                value={coachNoteInput}
                                onChangeText={setCoachNoteInput}
                                placeholder="Leave guidance or feedback for this check-in..."
                                placeholderTextColor={COLORS.textMuted}
                                style={styles.noteTextInput}
                                multiline={true}
                              />
                              <TouchableOpacity
                                onPress={() => handleSaveCoachNote(log.id)}
                                disabled={updateLogMutation.isPending}
                                style={styles.saveNoteBtn}
                                activeOpacity={0.85}
                              >
                                {updateLogMutation.isPending ? (
                                  <ActivityIndicator size="small" color="#080A0C" />
                                ) : (
                                  <>
                                    <Send size={13} color="#080A0C" />
                                    <Text style={styles.saveNoteBtnText}>SAVE</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyLogsCard}>
                <Calendar size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyLogsTitle}>No Check-In History Yet</Text>
                <Text style={styles.emptyLogsSub}>
                  When {athleteName} submits daily logs, they will appear in this timeline with biometrics and feedback tools.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ================= TARGET WEIGHT MODAL ================= */}
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
                  <Scale size={24} color={COLORS.brand} />
                </View>

                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={styles.modalTitle}>Set Target Weight</Text>
                  <Text style={styles.modalSubtitle}>
                    Assign target weight goal for {athleteName}.
                  </Text>
                </View>

                {/* Athlete's Current Weight */}
                <View style={styles.currentWeightBanner}>
                  <Text style={styles.bannerLabel}>CURRENT WEIGHT</Text>
                  <Text style={styles.bannerVal}>
                    {currentWeightNum ? `${currentWeightNum} kg` : 'No logs recorded yet'}
                  </Text>
                </View>

                {/* Target Weight Input */}
                <View style={styles.targetInputBox}>
                  <TextInput
                    value={targetWeightInput}
                    onChangeText={setTargetWeightInput}
                    keyboardType="numeric"
                    placeholder="70.0"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.targetInput}
                    autoFocus={true}
                  />
                  <Text style={styles.targetUnit}>kg</Text>
                </View>

                {/* Stepper Buttons */}
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
                    <Text style={[styles.deltaBadgeText, { color: deltaColor }]}>
                      {deltaText}
                    </Text>
                  </View>
                ) : null}

                {/* Modal Actions */}
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
                      <ActivityIndicator size="small" color="#080A0C" />
                    ) : (
                      <>
                        <CircleCheck size={16} color="#080A0C" />
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  innerWrapper: {
    width: '100%',
    gap: SPACING.xl,
  },
  desktopInnerWrapper: {
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },

  // Header
  header: {
    gap: SPACING.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1.2,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  athleteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  athleteAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brand,
  },
  athleteMetaCol: {
    flex: 1,
    gap: 4,
  },
  athleteName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  athleteSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  statusPillPending: {
    backgroundColor: 'rgba(245, 165, 36, 0.08)',
    borderColor: 'rgba(245, 165, 36, 0.25)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(161, 169, 176, 0.08)',
    borderColor: 'rgba(161, 169, 176, 0.2)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Overview Surface
  overviewSurface: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.md,
  },
  mobileOverviewSurface: {
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  surfaceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  metricItemTarget: {
    flex: 1.35,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  targetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Action Bar
  actionBar: {
    width: '100%',
  },
  desktopActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileActionBar: {
    flexDirection: 'column',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
  },
  mobilePrimaryActionBtn: {
    width: '100%',
    flex: 0,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },
  secondaryActionsGroup: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileSecondaryGroup: {
    width: '100%',
    flex: 0,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },

  // Current Plans Section (Two Plan Surfaces)
  plansSection: {
    gap: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  plansRow: {
    gap: SPACING.md,
  },
  desktopPlansRow: {
    flexDirection: 'row',
  },
  planSurface: {
    flex: 1,
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: SPACING.md,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  planDetailsBox: {
    gap: 8,
    paddingVertical: 4,
  },
  planDetailItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  planDetailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  planDetailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  planActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  planActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  // Weekly Performance
  section: {
    gap: SPACING.sm,
  },
  weeklyTable: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  weeklyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weeklyRowToday: {
    backgroundColor: 'rgba(199, 240, 0, 0.03)',
  },
  dayCol: {
    width: 80,
    gap: 2,
  },
  dayShortName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dayFullName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  weeklyMetricCol: {
    flex: 1,
    gap: 3,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricColumnTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  metricStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusLime: {
    color: COLORS.brand,
  },
  statusMuted: {
    color: COLORS.textMuted,
  },

  // Check-In History (1 Timeline)
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
  },
  spineCol: {
    width: 24,
    alignItems: 'center',
  },
  spineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  spineNodeSelected: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(199, 240, 0, 0.12)',
  },
  spineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand,
  },
  spineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  logCard: {
    flex: 1,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
    gap: 12,
    marginBottom: SPACING.md,
  },
  logCardSelected: {
    borderColor: 'rgba(199, 240, 0, 0.35)',
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  logDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  miniStatusChipLime: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  miniStatusChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  biometricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bioItem: {
    alignItems: 'center',
    gap: 2,
  },
  bioLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  bioValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Coach Notes in Selected Log
  coachNotesSection: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 43, 49, 0.6)',
  },
  coachNotesKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1,
  },
  existingNoteBox: {
    backgroundColor: 'rgba(199, 240, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.2)',
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  existingNoteText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  noteEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTextInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
    minHeight: 40,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
  },
  saveNoteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#080A0C',
    letterSpacing: 0.5,
  },

  emptyLogsCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyLogsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyLogsSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  currentWeightBanner: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 2,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  bannerVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  targetInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  targetInput: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minWidth: 90,
  },
  targetUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  stepPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  deltaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: COLORS.surfaceElevated,
  },
  deltaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSaveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#080A0C',
  },
});
