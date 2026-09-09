import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from 'react-native';
import {
  Check,
  Timer,
  Moon,
  Dumbbell,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import {
  useExercisePlan,
  useToggleExerciseCompletion,
} from '../../lib/queries/exercisePlans';
import { RestTimerModal } from '../../components/RestTimerModal';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { DayOfWeek, ExerciseItem } from '../../types/database';

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

export const ClientExercisePlanScreen: React.FC = () => {
  const { user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const clientId = user?.id || '';
  const { data: exercisePlan } = useExercisePlan(clientId);
  const toggleExerciseMutation = useToggleExerciseCompletion();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localCompletedMap, setLocalCompletedMap] = useState<Record<string, boolean>>({});

  // Local set logs: map of "day:exerciseId" -> array of logged reps per set
  const [setLogsMap, setSetLogsMap] = useState<Record<string, number[]>>({});
  // Current active rep input state per exercise
  const [repInputsMap, setRepInputsMap] = useState<Record<string, string>>({});

  const getExKey = (day: DayOfWeek, id: string) => `${day}:${id}`;

  // Resolve routine for selected day
  const activeRoutine =
    exercisePlan?.day_routines?.[selectedDay] || {
      day_of_week: selectedDay,
      is_rest_day: selectedDay === 'Thursday' || selectedDay === 'Sunday',
      target_muscle:
        exercisePlan?.target_muscle ||
        (selectedDay === 'Thursday' || selectedDay === 'Sunday'
          ? 'Rest Day'
          : 'Workout Routine'),
      exercises: exercisePlan?.exercises || [],
    };

  const rawExercises = activeRoutine.exercises || [];
  const exercises: ExerciseItem[] = rawExercises.map((e) => {
    const key = getExKey(selectedDay, e.id);
    return {
      ...e,
      completed:
        localCompletedMap[key] !== undefined
          ? localCompletedMap[key]
          : Boolean(e.completed),
    };
  });

  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent = Math.round(
    (completedCount / Math.max(1, exercises.length)) * 100
  );

  const handleToggleExercise = (exerciseId: string) => {
    if (!exercisePlan) return;
    const targetEx = exercises.find((e) => e.id === exerciseId);
    const willBeCompleted = !targetEx?.completed;
    const key = getExKey(selectedDay, exerciseId);

    setLocalCompletedMap((prev) => ({ ...prev, [key]: willBeCompleted }));

    toggleExerciseMutation.mutate({
      exercisePlanId: exercisePlan.id,
      exerciseId,
      dayOfWeek: selectedDay,
      clientId: exercisePlan.client_id || clientId,
    });

    if (willBeCompleted) {
      if (completedCount + 1 === exercises.length && exercises.length > 0) {
        setToastMessage(`Full workout completed! Exceptional effort.`);
      } else {
        setToastMessage(`Completed ${formatTitleCase(targetEx?.name || 'Exercise')}`);
      }
    } else {
      setToastMessage(`Exercise unchecked`);
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCompleteSet = (ex: ExerciseItem) => {
    const key = getExKey(selectedDay, ex.id);
    const totalSets = ex.target_sets || 3;
    const currentCompleted = setLogsMap[key] || ex.completed_sets || [];
    const activeSetIdx = currentCompleted.length;

    if (activeSetIdx >= totalSets) {
      // All sets already logged; toggle full exercise if not already done
      if (!ex.completed) {
        handleToggleExercise(ex.id);
      }
      return;
    }

    const inputVal = repInputsMap[key];
    const loggedReps =
      inputVal !== undefined && inputVal.trim() !== ''
        ? parseInt(inputVal, 10) || ex.target_reps || 10
        : ex.target_reps || 10;

    const nextCompleted = [...currentCompleted, loggedReps];
    setSetLogsMap((prev) => ({ ...prev, [key]: nextCompleted }));
    setRepInputsMap((prev) => ({ ...prev, [key]: '' }));

    // Trigger Rest Timer
    const restTime = ex.rest_seconds || 90;
    setActiveRestSeconds(restTime);

    // If this was the final set, mark exercise as completed
    if (nextCompleted.length >= totalSets) {
      if (!ex.completed) {
        handleToggleExercise(ex.id);
      }
    }
  };

  const handleOpenVideo = async (url?: string) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Error opening video URL:', err);
    }
  };

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
        <View style={styles.headerLeft}>
          <Text style={styles.headerKicker}>WORKOUT</Text>
          <Text style={styles.headerTitle}>
            {activeRoutine.is_rest_day
              ? 'Scheduled Recovery Day'
              : formatTitleCase(
                  activeRoutine.target_muscle ||
                    exercisePlan?.title ||
                    'Workout Routine'
                )}
          </Text>
          <View style={styles.targetMuscleRow}>
            <Text style={styles.targetMuscleLabel}>TARGET MUSCLE</Text>
            <Text style={styles.targetMuscleValue}>
              {activeRoutine.target_muscle || 'General Split'}
            </Text>
          </View>
        </View>

        {/* Rest Day Indicator on Right */}
        {activeRoutine.is_rest_day && (
          <View style={styles.restDayBadge}>
            <Moon size={14} color={COLORS.warning} />
            <Text style={styles.restDayBadgeText}>REST DAY</Text>
          </View>
        )}
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
            const dayRoutine = exercisePlan?.day_routines?.[day];
            const isDayRest = dayRoutine
              ? dayRoutine.is_rest_day
              : day === 'Thursday' || day === 'Sunday';

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
                <View style={styles.dayPillContent}>
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
                  {isDayRest && (
                    <Moon
                      size={10}
                      color={isSelected ? '#080A0C' : COLORS.warning}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ================= IF REST DAY ================= */}
      {activeRoutine.is_rest_day ? (
        <View style={styles.restCard}>
          <View style={styles.restIconBox}>
            <Moon size={28} color={COLORS.warning} />
          </View>
          <Text style={styles.restCardTitle}>Active Recovery Protocol</Text>
          <Text style={styles.restCardSubtitle}>
            No heavy resistance training scheduled today. Prioritize muscular
            recovery, sleep quality, and macro compliance.
          </Text>
          <View style={styles.restProtocolBox}>
            <Text style={styles.protocolKicker}>RECOVERY CHECKLIST</Text>
            <Text style={styles.protocolItem}>• 15-20 min light walk or joint mobility</Text>
            <Text style={styles.protocolItem}>• Meet daily hydration and protein targets</Text>
            <Text style={styles.protocolItem}>• 8+ hours deep rest for cellular repair</Text>
          </View>
        </View>
      ) : (
        <>
          {/* ================= WORKOUT SUMMARY ================= */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryMuscle}>
                  {formatTitleCase(activeRoutine.target_muscle || 'Full Routine')}
                </Text>
              </View>

              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricLabel}>EXERCISES</Text>
                  <Text style={styles.summaryMetricVal}>{exercises.length}</Text>
                </View>

                <View style={styles.summaryMetricDivider} />

                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricLabel}>COMPLETED</Text>
                  <Text style={[styles.summaryMetricVal, { color: COLORS.brand }]}>
                    {completedCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
                ]}
              />
            </View>
          </View>

          {/* ================= EXERCISE LIST ================= */}
          <View style={styles.exercisesSection}>
            {exercises.length === 0 ? (
              <View style={styles.emptyCard}>
                <Dumbbell size={24} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Exercises Scheduled</Text>
                <Text style={styles.emptySub}>
                  Your coach will prescribe routine movements for {selectedDay}.
                </Text>
              </View>
            ) : (
              exercises.map((ex, idx) => {
                const isExCompleted = ex.completed;
                const key = getExKey(selectedDay, ex.id);
                const totalSets = ex.target_sets || 3;
                const loggedSets = setLogsMap[key] || ex.completed_sets || [];
                const activeSetIdx = isExCompleted
                  ? -1
                  : Math.min(loggedSets.length, totalSets - 1);
                const currentRepInput =
                  repInputsMap[key] !== undefined
                    ? repInputsMap[key]
                    : String(ex.target_reps || 10);

                return (
                  <View
                    key={ex.id || idx}
                    style={[
                      styles.exerciseCard,
                      isExCompleted && styles.exerciseCardCompleted,
                    ]}
                  >
                    {/* Header Structure: 01, EXERCISE NAME, Target & Weight */}
                    <View style={styles.exerciseCardHeader}>
                      <View style={styles.exerciseLeftHead}>
                        <Text style={styles.exerciseIndex}>
                          {String(idx + 1).padStart(2, '0')}
                        </Text>
                        <View style={styles.exerciseTitleCol}>
                          <Text
                            style={[
                              styles.exerciseName,
                              isExCompleted
                                ? styles.exerciseNameCompleted
                                : styles.exerciseNameActive,
                            ]}
                          >
                            {formatTitleCase(ex.name)}
                          </Text>
                          <View style={styles.exerciseParamsRow}>
                            <Text style={styles.exerciseParam}>
                              Target: {ex.target_sets} sets × {ex.target_reps} reps
                            </Text>
                            <Text style={styles.paramBullet}>•</Text>
                            <Text style={styles.exerciseParam}>
                              Weight: {ex.weight_lbs || 0} lbs
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Manual Complete Toggle Checkbox */}
                      <TouchableOpacity
                        onPress={() => handleToggleExercise(ex.id)}
                        style={[
                          styles.toggleCheckbox,
                          isExCompleted
                            ? styles.toggleCheckboxChecked
                            : styles.toggleCheckboxUnchecked,
                        ]}
                        activeOpacity={0.8}
                      >
                        {isExCompleted && (
                          <Check size={14} color="#080A0C" strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* SET TABLE */}
                    <View style={styles.setTable}>
                      {/* Table Header */}
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.thCell, styles.thSet]}>SET</Text>
                        <Text style={[styles.thCell, styles.thTarget]}>TARGET</Text>
                        <Text style={[styles.thCell, styles.thActual]}>ACTUAL</Text>
                        <Text style={[styles.thCell, styles.thStatus]}>STATUS</Text>
                      </View>

                      {/* Set Rows */}
                      {Array.from({ length: totalSets }).map((_, sIdx) => {
                        const setNumberStr = String(sIdx + 1).padStart(2, '0');
                        const isSetLogged =
                          isExCompleted || loggedSets[sIdx] !== undefined;
                        const isActiveSet = !isExCompleted && sIdx === activeSetIdx;
                        const actualVal = isExCompleted
                          ? ex.target_reps
                          : loggedSets[sIdx] !== undefined
                          ? loggedSets[sIdx]
                          : '—';

                        return (
                          <View
                            key={sIdx}
                            style={[
                              styles.tableRow,
                              isActiveSet && styles.tableRowActive,
                              isSetLogged && styles.tableRowLogged,
                            ]}
                          >
                            {/* Set Number */}
                            <Text
                              style={[
                                styles.tdCell,
                                styles.tdSet,
                                isActiveSet && styles.tdSetActive,
                              ]}
                            >
                              {setNumberStr}
                            </Text>

                            {/* Target */}
                            <Text style={[styles.tdCell, styles.tdTarget]}>
                              {ex.target_reps}
                            </Text>

                            {/* Actual */}
                            <View style={[styles.tdCell, styles.tdActual]}>
                              {isActiveSet ? (
                                <TextInput
                                  value={currentRepInput}
                                  onChangeText={(val) =>
                                    setRepInputsMap((prev) => ({
                                      ...prev,
                                      [key]: val,
                                    }))
                                  }
                                  keyboardType="numeric"
                                  style={styles.activeRepInput}
                                  maxLength={3}
                                />
                              ) : (
                                <Text
                                  style={[
                                    styles.tdActualText,
                                    isSetLogged && styles.tdActualTextLogged,
                                  ]}
                                >
                                  {actualVal}
                                </Text>
                              )}
                            </View>

                            {/* Status */}
                            <View style={[styles.tdCell, styles.tdStatus]}>
                              {isSetLogged ? (
                                <View style={styles.statusDoneBox}>
                                  <Check size={13} color={COLORS.brand} strokeWidth={2.8} />
                                </View>
                              ) : isActiveSet ? (
                                <View style={styles.statusActivePill}>
                                  <Text style={styles.statusActiveText}>ACTIVE</Text>
                                </View>
                              ) : (
                                <Text style={styles.statusPendingText}>—</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* ACTIONS: COMPLETE SET & REST TIMER */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        onPress={() => handleCompleteSet(ex)}
                        style={styles.completeSetButton}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.completeSetButtonText}>
                          {isExCompleted
                            ? 'EXERCISE COMPLETED'
                            : loggedSets.length >= totalSets
                            ? 'ALL SETS LOGGED'
                            : `COMPLETE SET ${String(
                                Math.min(totalSets, loggedSets.length + 1)
                              ).padStart(2, '0')}`}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          setActiveRestSeconds(ex.rest_seconds || 90)
                        }
                        style={styles.restTimerButton}
                        activeOpacity={0.8}
                      >
                        <Timer size={15} color={COLORS.textSecondary} />
                        <Text style={styles.restTimerButtonText}>
                          REST {ex.rest_seconds || 90} SEC
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* NOTES & VIDEO DEMO */}
                    {(ex.notes || ex.video_url) && (
                      <View style={styles.exerciseFooter}>
                        {ex.notes ? (
                          <View style={styles.notesBox}>
                            <Text style={styles.notesLabel}>NOTES</Text>
                            <Text style={styles.notesContent}>"{ex.notes}"</Text>
                          </View>
                        ) : null}

                        {ex.video_url ? (
                          <TouchableOpacity
                            onPress={() => handleOpenVideo(ex.video_url)}
                            style={styles.videoLinkButton}
                            activeOpacity={0.75}
                          >
                            <ExternalLink size={13} color={COLORS.textSecondary} />
                            <Text style={styles.videoLinkText}>Video Demo</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </>
      )}

      {/* ================= REST TIMER MODAL ================= */}
      <RestTimerModal
        isOpen={Boolean(activeRestSeconds)}
        initialSeconds={activeRestSeconds || 90}
        onClose={() => setActiveRestSeconds(null)}
      />
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  headerLeft: {
    gap: 4,
    flex: 1,
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
  targetMuscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  targetMuscleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  targetMuscleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  restDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 165, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 165, 36, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  restDayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 0.8,
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
  dayPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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

  // Rest Card
  restCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  restIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245, 165, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  restCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  restCardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 440,
  },
  restProtocolBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 6,
    width: '100%',
    maxWidth: 440,
    marginTop: SPACING.md,
  },
  protocolKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  protocolItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // Workout Summary Card
  summaryCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: SPACING.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  summaryCol: {
    flex: 1,
  },
  summaryMuscle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryMetric: {
    alignItems: 'flex-end',
    gap: 2,
  },
  summaryMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  summaryMetricVal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 3,
  },

  // Exercises Section
  exercisesSection: {
    gap: SPACING.md,
  },
  exerciseCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: SPACING.md,
  },
  exerciseCardCompleted: {
    opacity: 0.55,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  exerciseLeftHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
  },
  exerciseIndex: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  exerciseTitleCol: {
    flex: 1,
    gap: 3,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  exerciseNameActive: {
    color: COLORS.textPrimary,
  },
  exerciseNameCompleted: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  exerciseParamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  exerciseParam: {
    fontSize: 12.5,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  paramBullet: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  toggleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  toggleCheckboxChecked: {
    backgroundColor: COLORS.brand,
  },
  toggleCheckboxUnchecked: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Set Table
  setTable: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 10, 12, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  thCell: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  thSet: {
    width: 44,
  },
  thTarget: {
    width: 65,
  },
  thActual: {
    flex: 1,
  },
  thStatus: {
    width: 65,
    textAlign: 'right',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowActive: {
    borderWidth: 1,
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(199, 240, 0, 0.04)',
  },
  tableRowLogged: {
    opacity: 0.85,
  },
  tdCell: {
    justifyContent: 'center',
  },
  tdSet: {
    width: 44,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tdSetActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  tdTarget: {
    width: 65,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tdActual: {
    flex: 1,
  },
  tdActualText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tdActualTextLogged: {
    color: COLORS.textPrimary,
  },
  activeRepInput: {
    width: 54,
    height: 34,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.brand,
    borderRadius: 6,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0,
  },
  tdStatus: {
    width: 65,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusDoneBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActivePill: {
    backgroundColor: 'rgba(199, 240, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.6,
  },
  statusPendingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  completeSetButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeSetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.4,
  },
  restTimerButton: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    gap: 6,
  },
  restTimerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },

  // Exercise Footer (Notes & Video)
  exerciseFooter: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  notesBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: RADIUS.sm,
    gap: 2,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  notesContent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  videoLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  videoLinkText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
