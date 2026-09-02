import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Check, Timer, Calendar, Dumbbell, Moon, Sparkles, CircleCheck } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useExercisePlan, useToggleExerciseCompletion } from '../../lib/queries/exercisePlans';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
import { RestTimerModal } from '../../components/RestTimerModal';
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

export const ClientExercisePlanScreen: React.FC = () => {
  const { themeMode, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const clientId = user?.id || '';
  const { data: exercisePlan } = useExercisePlan(clientId);
  const toggleExerciseMutation = useToggleExerciseCompletion();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localCompletedMap, setLocalCompletedMap] = useState<Record<string, boolean>>({});

  const today = getTodayDayOfWeek();

  const getExKey = (day: DayOfWeek, id: string) => `${day}:${id}`;

  // Resolve active routine for selected day
  const activeRoutine =
    exercisePlan?.day_routines?.[selectedDay] || {
      day_of_week: selectedDay,
      is_rest_day: selectedDay === 'Thursday' || selectedDay === 'Sunday',
      target_muscle:
        exercisePlan?.target_muscle ||
        (selectedDay === 'Thursday' || selectedDay === 'Sunday' ? 'Rest Day' : 'Workout Routine'),
      exercises: exercisePlan?.exercises || [],
    };

  const rawExercises = activeRoutine.exercises || [];
  const exercises: ExerciseItem[] = rawExercises.map((e) => {
    const key = getExKey(selectedDay, e.id);
    return {
      ...e,
      completed: localCompletedMap[key] !== undefined ? localCompletedMap[key] : Boolean(e.completed),
    };
  });

  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent = Math.round((completedCount / Math.max(1, exercises.length)) * 100);

  const handleToggleExercise = (exerciseId: string) => {
    if (!exercisePlan) return;
    const targetEx = exercises.find((e) => e.id === exerciseId);
    const willBeCompleted = !targetEx?.completed;
    const key = getExKey(selectedDay, exerciseId);

    // Optimistic day-scoped instant UI update
    setLocalCompletedMap((prev) => ({ ...prev, [key]: willBeCompleted }));

    toggleExerciseMutation.mutate({
      exercisePlanId: exercisePlan.id,
      exerciseId,
      dayOfWeek: selectedDay,
      clientId: exercisePlan.client_id || clientId,
    });

    if (willBeCompleted) {
      if (completedCount + 1 === exercises.length && exercises.length > 0) {
        setToastMessage(`🎉 Full Workout Completed! Outstanding job today.`);
      } else {
        setToastMessage(`💪 Completed ${formatTitleCase(targetEx?.name || 'Exercise')}!`);
      }
    } else {
      setToastMessage(`Exercise unchecked`);
    }
    setTimeout(() => setToastMessage(null), 3000);
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
          <Text style={styles.daysLabel}>SELECT TRAINING DAY</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const isCurrentToday = today === day;
            const dayRoutine = exercisePlan?.day_routines?.[day];
            const isRest = dayRoutine
              ? dayRoutine.is_rest_day
              : day === 'Thursday' || day === 'Sunday';
            const shortName = day.slice(0, 3).toUpperCase();
            const dayExs = dayRoutine?.exercises || [];
            const dayDoneCount = dayExs.filter((e) => {
              const k = getExKey(day, e.id);
              return localCompletedMap[k] !== undefined ? localCompletedMap[k] : Boolean(e.completed);
            }).length;
            const isAllDone = dayDoneCount === dayExs.length && dayExs.length > 0;

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
                      : isRest
                      ? { color: '#64748B' }
                      : isAllDone
                      ? { color: '#34D399' }
                      : dayDoneCount > 0
                      ? { color: '#CCFF00' }
                      : { color: '#94A3B8' },
                  ]}
                  numberOfLines={1}
                >
                  {isRest ? 'REST' : dayDoneCount > 0 ? `${dayDoneCount}/${dayExs.length}` : 'WORK'}
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

      {/* Routine Banner Card */}
      <View style={styles.card}>
        <View style={styles.bannerHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.dayTag}>
              {selectedDay.toUpperCase()} {selectedDay === today ? '• TODAY' : ''}
            </Text>
            <Text style={[styles.routineTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {activeRoutine.is_rest_day
                ? 'Active Rest & Recovery Day'
                : formatTitleCase(activeRoutine.target_muscle || 'Workout Routine')}
            </Text>
          </View>

          {!activeRoutine.is_rest_day && exercises.length > 0 && (
            <View style={[styles.doneBadge, progressPercent === 100 && styles.doneBadgeFull]}>
              <Text style={[styles.doneText, progressPercent === 100 && { color: '#34D399' }]}>
                {completedCount}/{exercises.length} Done ({progressPercent}%)
              </Text>
            </View>
          )}
        </View>

        {!activeRoutine.is_rest_day && exercises.length > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
      </View>

      {/* IF REST DAY */}
      {activeRoutine.is_rest_day ? (
        <View style={styles.restCard}>
          <View style={styles.restIconPill}>
            <Moon size={28} color="#F97316" />
          </View>
          <Text style={[styles.restTitle, { color: theme.textPrimary }]}>Rest & Recovery Day</Text>
          <Text style={styles.restSubtitle}>
            No resistance lifting scheduled today. Allow muscles to recover, prioritize 8+ hours of sleep, and hit your hydration goal.
          </Text>
          <View style={styles.restTipsBox}>
            <Text style={styles.restTipsHeader}>RECOVERY PROTOCOL:</Text>
            <Text style={styles.restTipItem}>• Light 15-20 min walk or mobility stretching</Text>
            <Text style={styles.restTipItem}>• Maintain daily protein goal for muscle repair</Text>
            <Text style={styles.restTipItem}>• Drink at least 80-100 oz of water</Text>
          </View>
        </View>
      ) : (
        /* IF WORKOUT DAY: Exercises List */
        <View style={{ gap: 8 }}>
          {exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Dumbbell size={24} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No Exercises Scheduled
              </Text>
              <Text style={styles.emptySub}>Your coach will assign exercises for {selectedDay}.</Text>
            </View>
          ) : (
            exercises.map((ex, idx) => (
              <View
                key={ex.id || idx}
                style={[
                  styles.exCard,
                  ex.completed ? styles.exCompleted : styles.exPending,
                ]}
              >
                <View style={styles.exHeader}>
                  <View style={[styles.idxBadge, ex.completed && styles.idxBadgeCompleted]}>
                    <Text style={[styles.idxText, ex.completed && { color: '#0F172A' }]}>
                      {idx + 1}
                    </Text>
                  </View>

                  <View style={{ flex: 1, gap: 1 }}>
                    <Text
                      style={[
                        styles.exName,
                        ex.completed ? styles.completedText : { color: '#FFFFFF' },
                      ]}
                    >
                      {formatTitleCase(ex.name)}
                    </Text>
                    {ex.notes ? <Text style={styles.exNotes}>"{ex.notes}"</Text> : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleToggleExercise(ex.id)}
                    style={[styles.toggleBtn, ex.completed ? styles.toggleActive : styles.toggleInactive]}
                    activeOpacity={0.8}
                  >
                    <Check size={12} color={ex.completed ? '#0F172A' : '#CCFF00'} />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: ex.completed ? '#0F172A' : '#CCFF00' },
                      ]}
                    >
                      {ex.completed ? 'Done' : 'Check'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Metrics Chips Row */}
                <View style={styles.exFooterRow}>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      {ex.target_sets} sets × {ex.target_reps} reps
                    </Text>
                  </View>
                  <View style={[styles.metricChip, { borderColor: 'rgba(204, 255, 0, 0.25)' }]}>
                    <Text style={[styles.metricChipText, { color: '#CCFF00' }]}>{ex.weight_lbs} kg</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setActiveRestSeconds(ex.rest_seconds || 60)}
                    style={styles.timerBtn}
                  >
                    <Timer size={11} color="#38BDF8" />
                    <Text style={styles.timerText}>{ex.rest_seconds || 60}s rest</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={Boolean(activeRestSeconds)}
        initialSeconds={activeRestSeconds || 60}
        onClose={() => setActiveRestSeconds(null)}
      />
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
  bannerHeader: {
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
  routineTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  doneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  doneBadgeFull: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  doneText: {
    fontSize: 10,
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
  restCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 10,
  },
  restIconPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  restSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  restTipsBox: {
    width: '100%',
    backgroundColor: '#090D16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    gap: 5,
    marginTop: 2,
  },
  restTipsHeader: {
    fontSize: 8,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 0.8,
  },
  restTipItem: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  exCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  exCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.28)',
  },
  exPending: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderColor: '#1E293B',
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idxBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idxBadgeCompleted: {
    backgroundColor: '#34D399',
  },
  idxText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CCFF00',
  },
  exName: {
    fontSize: 13,
    fontWeight: '800',
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  exNotes: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  toggleInactive: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  exFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090D16',
    padding: 6,
    borderRadius: 10,
    gap: 6,
  },
  metricChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  timerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
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
