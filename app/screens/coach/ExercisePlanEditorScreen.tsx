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
  Dumbbell,
  Moon,
  Copy,
  Check,
  Timer,
  Sparkles,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useCreateExercisePlan, useUpdateExercisePlan, useExercisePlan } from '../../lib/queries/exercisePlans';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
import { DayOfWeek, DayWorkoutRoutine, ExerciseItem } from '../../types/database';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MUSCLE_GROUP_PRESETS = [
  'Chest & Triceps',
  'Back & Biceps',
  'Legs & Glutes',
  'Shoulders & Arms',
  'Push (Chest/Shoulders/Tri)',
  'Pull (Back/Biceps)',
  'Upper Body Power',
  'Lower Body Hypertrophy',
  'Full Body Conditioning',
  'Core & Cardio',
];

const createDefaultExercise = (day: string, idx: number): ExerciseItem => ({
  id: `ex-${day.toLowerCase().slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${idx}`,
  name: '',
  target_sets: 3,
  target_reps: 10,
  rest_seconds: 60,
  weight_lbs: 20,
  notes: '',
  completed: false,
});

const createInitialDayRoutines = (): Record<DayOfWeek, DayWorkoutRoutine> => {
  const result: Partial<Record<DayOfWeek, DayWorkoutRoutine>> = {};
  for (const day of DAYS_OF_WEEK) {
    const isDefaultRest = day === 'Thursday' || day === 'Sunday';
    result[day] = {
      day_of_week: day,
      is_rest_day: isDefaultRest,
      target_muscle: isDefaultRest
        ? 'Rest Day'
        : day === 'Monday'
          ? 'Chest & Triceps'
          : day === 'Tuesday'
            ? 'Back & Biceps'
            : day === 'Wednesday'
              ? 'Legs & Glutes'
              : day === 'Friday'
                ? 'Shoulders & Arms'
                : 'Full Body Conditioning',
      exercises: isDefaultRest ? [] : [createDefaultExercise(day, 1), createDefaultExercise(day, 2)],
    };
  }
  return result as Record<DayOfWeek, DayWorkoutRoutine>;
};

export const ExercisePlanEditorScreen: React.FC = () => {
  const { themeMode, selectedClientId, setCoachActiveTab, editingExercisePlanId, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const { data: existingPlan } = useExercisePlan(selectedClientId);
  const createExercisePlanMutation = useCreateExercisePlan();
  const updateExercisePlanMutation = useUpdateExercisePlan();

  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [dayRoutines, setDayRoutines] = useState<Record<DayOfWeek, DayWorkoutRoutine>>(createInitialDayRoutines());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title || '');
      if (existingPlan.day_routines && Object.keys(existingPlan.day_routines).length > 0) {
        const merged = createInitialDayRoutines();
        for (const day of DAYS_OF_WEEK) {
          if (existingPlan.day_routines[day]) {
            merged[day] = {
              day_of_week: day,
              is_rest_day: Boolean(existingPlan.day_routines[day]!.is_rest_day),
              target_muscle:
                existingPlan.day_routines[day]!.target_muscle ||
                (existingPlan.day_routines[day]!.is_rest_day ? 'Rest Day' : 'Workout'),
              exercises: existingPlan.day_routines[day]!.exercises || [],
            };
          }
        }
        setDayRoutines(merged);
      } else if (existingPlan.exercises && existingPlan.exercises.length > 0) {
        const merged = createInitialDayRoutines();
        const planDay = existingPlan.day_of_week || 'Monday';
        merged[planDay] = {
          day_of_week: planDay,
          is_rest_day: false,
          target_muscle: existingPlan.target_muscle || 'Full Body Protocol',
          exercises: existingPlan.exercises,
        };
        setDayRoutines(merged);
      }
    }
  }, [existingPlan]);

  const activeDayRoutine = dayRoutines[selectedDay] || {
    day_of_week: selectedDay,
    is_rest_day: false,
    target_muscle: 'Chest & Triceps',
    exercises: [createDefaultExercise(selectedDay, 1)],
  };

  const handleToggleRestDay = (isRest: boolean) => {
    setDayRoutines((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        is_rest_day: isRest,
        target_muscle: isRest
          ? 'Rest Day'
          : prev[selectedDay].target_muscle === 'Rest Day'
            ? 'Chest & Triceps'
            : prev[selectedDay].target_muscle,
        exercises: isRest
          ? []
          : prev[selectedDay].exercises.length > 0
            ? prev[selectedDay].exercises
            : [createDefaultExercise(selectedDay, 1)],
      },
    }));
  };

  const handleSelectMusclePreset = (preset: string) => {
    setDayRoutines((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        target_muscle: preset,
        is_rest_day: false,
        exercises:
          prev[selectedDay].exercises.length > 0
            ? prev[selectedDay].exercises
            : [createDefaultExercise(selectedDay, 1)],
      },
    }));
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseItem, value: any) => {
    const updated = [...activeDayRoutine.exercises];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setDayRoutines((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        exercises: updated,
      },
    }));
  };

  const handleAddExercise = () => {
    const newEx = createDefaultExercise(selectedDay, activeDayRoutine.exercises.length + 1);
    setDayRoutines((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        exercises: [...prev[selectedDay].exercises, newEx],
      },
    }));
  };

  const handleRemoveExercise = (index: number) => {
    const updated = activeDayRoutine.exercises.filter((_, idx) => idx !== index);
    setDayRoutines((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        exercises: updated,
      },
    }));
  };

  const handleCopyRoutineToWeekdays = () => {
    const sourceRoutine = activeDayRoutine;
    const updatedAll = { ...dayRoutines };
    const weekdays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const day of weekdays) {
      if (day !== selectedDay) {
        updatedAll[day] = {
          day_of_week: day,
          is_rest_day: sourceRoutine.is_rest_day,
          target_muscle: sourceRoutine.target_muscle,
          exercises: sourceRoutine.exercises.map((ex, idx) => ({
            ...ex,
            id: `${day.toLowerCase().slice(0, 3)}-ex-${Date.now()}-${idx}`,
            completed: false,
          })),
        };
      }
    }
    setDayRoutines(updatedAll);
    setCopiedNotification(`Copied ${selectedDay}'s routine to Weekdays!`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleSavePlan = () => {
    const planTitle = title.trim() || '7-Day Workout Plan';
    const mondayRoutine = dayRoutines['Monday'] || activeDayRoutine;

    // Sanitize exercise names
    const sanitizedDayRoutines = { ...dayRoutines };
    for (const day of DAYS_OF_WEEK) {
      if (!sanitizedDayRoutines[day].is_rest_day) {
        sanitizedDayRoutines[day].exercises = sanitizedDayRoutines[day].exercises.map((ex, i) => ({
          ...ex,
          name: ex.name.trim() || `Exercise ${i + 1}`,
        }));
      }
    }

    if (editingExercisePlanId) {
      updateExercisePlanMutation.mutate({
        id: editingExercisePlanId,
        updates: {
          title: planTitle,
          day_of_week: selectedDay,
          target_muscle: activeDayRoutine.target_muscle,
          is_rest_day: activeDayRoutine.is_rest_day,
          exercises: sanitizedDayRoutines[selectedDay].exercises,
          day_routines: sanitizedDayRoutines,
        },
      });
    } else {
      createExercisePlanMutation.mutate({
        client_id: selectedClientId,
        coach_id: user?.id || 'coach-id-001',
        title: planTitle,
        day_of_week: selectedDay,
        target_muscle: activeDayRoutine.target_muscle,
        is_rest_day: activeDayRoutine.is_rest_day,
        exercises: sanitizedDayRoutines[selectedDay].exercises,
        day_routines: sanitizedDayRoutines,
      });
    }
    setCoachActiveTab('client-detail');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
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

          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Workout Builder</Text>

          <TouchableOpacity onPress={handleSavePlan} style={styles.saveTopBtn} activeOpacity={0.85}>
            <Save size={14} color="#0F172A" />
            <Text style={styles.saveTopBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Title Card */}
        <View style={styles.titleContainer}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Program Title (e.g. 7-Day Hypertrophy & Strength Split)"
            placeholderTextColor="#64748B"
            style={[styles.titleInput, { color: theme.textPrimary }]}
          />
        </View>

        {/* 7-Day Day Selector Bar */}
        <View style={styles.daySelectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayStrip}
          >
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day;
              const routine = dayRoutines[day];
              const isRest = routine?.is_rest_day;
              const shortName = day.slice(0, 3).toUpperCase();
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
                      styles.dayPillTag,
                      isSelected
                        ? { color: '#0F172A' }
                        : isRest
                          ? { color: '#64748B' }
                          : { color: '#CCFF00' },
                    ]}
                    numberOfLines={1}
                  >
                    {isRest ? 'REST' : routine?.target_muscle?.split(' ')[0] || 'WORK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Day Mode Switcher (Workout vs Rest Day) */}
        <View style={styles.modeCard}>
          <View style={styles.modeHeaderRow}>
            <View>
              <Text style={[styles.activeDayHeading, { color: theme.textPrimary }]}>
                {selectedDay.toUpperCase()}
              </Text>
              <Text style={styles.activeDaySubheading}>
                {activeDayRoutine.is_rest_day ? 'Recovery Day' : 'Workout'}
              </Text>
            </View>

            <View style={styles.restToggleContainer}>
              <TouchableOpacity
                onPress={() => handleToggleRestDay(false)}
                style={[
                  styles.toggleBtn,
                  !activeDayRoutine.is_rest_day ? styles.toggleBtnActiveGreen : styles.toggleBtnInactive,
                ]}
              >
                <Dumbbell size={12} color={!activeDayRoutine.is_rest_day ? '#0F172A' : '#94A3B8'} />
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: !activeDayRoutine.is_rest_day ? '#0F172A' : '#94A3B8' },
                  ]}
                >
                  Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleToggleRestDay(true)}
                style={[
                  styles.toggleBtn,
                  activeDayRoutine.is_rest_day ? styles.toggleBtnActiveOrange : styles.toggleBtnInactive,
                ]}
              >
                <Moon size={12} color={activeDayRoutine.is_rest_day ? '#0F172A' : '#94A3B8'} />
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: activeDayRoutine.is_rest_day ? '#0F172A' : '#94A3B8' },
                  ]}
                >
                  Rest Day
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {copiedNotification && (
          <View style={styles.successBanner}>
            <Check size={14} color="#34D399" />
            <Text style={styles.successBannerText}>{copiedNotification}</Text>
          </View>
        )}

        {/* IF REST DAY */}
        {activeDayRoutine.is_rest_day ? (
          <View style={styles.restDayCard}>
            <View style={styles.restIconCircle}>
              <Moon size={28} color="#F97316" />
            </View>
            <Text style={[styles.restTitle, { color: theme.textPrimary }]}>
              {selectedDay} is a Scheduled Rest Day
            </Text>
            <Text style={styles.restSub}>
              Athlete is scheduled for muscle repair, mobility stretching, and hydration check-ins without required resistance lifting.
            </Text>
            <TouchableOpacity
              onPress={() => handleToggleRestDay(false)}
              style={styles.switchBackBtn}
              activeOpacity={0.85}
            >
              <Dumbbell size={13} color="#0F172A" />
              <Text style={styles.switchBackBtnText}>Change to Workout Day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* IF WORKOUT DAY */
          <>
            {/* Target Muscle Group Selection */}
            <View style={styles.muscleSectionBox}>
              <Text style={styles.inputMicroLabel}>TARGET MUSCLE FOCUS</Text>
              <TextInput
                value={activeDayRoutine.target_muscle}
                onChangeText={(val) =>
                  setDayRoutines((prev) => ({
                    ...prev,
                    [selectedDay]: {
                      ...prev[selectedDay],
                      target_muscle: val,
                    },
                  }))
                }
                placeholder="e.g. Chest & Triceps"
                placeholderTextColor="#64748B"
                style={[styles.muscleInput, { color: theme.textPrimary }]}
              />

              {/* Muscle Preset Chips */}
              <Text style={styles.presetChipsLabel}>QUICK PRESETS:</Text>
              <View style={styles.chipsWrap}>
                {MUSCLE_GROUP_PRESETS.map((preset) => {
                  const isSelected = activeDayRoutine.target_muscle === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => handleSelectMusclePreset(preset)}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipActive : styles.chipInactive,
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected ? styles.chipTextActive : styles.chipTextInactive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Exercises Header */}
            <View style={styles.exercisesHeaderRow}>
              <Text style={styles.sectionMicroHeading}>
                {selectedDay.toUpperCase()} EXERCISES ({activeDayRoutine.exercises.length})
              </Text>

              <TouchableOpacity onPress={handleAddExercise} style={styles.addExPill} activeOpacity={0.8}>
                <Plus size={13} color="#CCFF00" />
                <Text style={styles.addExPillText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {/* Exercises List */}
            <View style={{ gap: 10 }}>
              {activeDayRoutine.exercises.map((ex, index) => (
                <View key={ex.id || index} style={styles.exerciseCard}>
                  <View style={styles.exCardTopRow}>
                    <View style={styles.numBadge}>
                      <Text style={styles.numBadgeText}>{index + 1}</Text>
                    </View>

                    <TextInput
                      value={ex.name}
                      onChangeText={(val) => handleUpdateExercise(index, 'name', val)}
                      placeholder="Exercise Name (e.g. Incline Bench Press)"
                      placeholderTextColor="#64748B"
                      style={styles.exNameInput}
                    />

                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(index)}
                      style={styles.trashBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color="#FB7185" />
                    </TouchableOpacity>
                  </View>

                  {/* Metrics Row */}
                  <View style={styles.exMetricsRow}>
                    <View style={styles.metricInputCell}>
                      <Text style={styles.metricCellLabel}>Sets</Text>
                      <TextInput
                        value={ex.target_sets ? String(ex.target_sets) : ''}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'target_sets', parseInt(val) || 0)
                        }
                        placeholder="3"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        style={styles.metricInputField}
                      />
                    </View>

                    <View style={styles.metricInputCell}>
                      <Text style={styles.metricCellLabel}>Reps</Text>
                      <TextInput
                        value={ex.target_reps ? String(ex.target_reps) : ''}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'target_reps', parseInt(val) || 0)
                        }
                        placeholder="10"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        style={styles.metricInputField}
                      />
                    </View>

                    <View style={styles.metricInputCell}>
                      <Text style={[styles.metricCellLabel, { color: '#CCFF00' }]}>Weight (kg)</Text>
                      <TextInput
                        value={ex.weight_lbs ? String(ex.weight_lbs) : ''}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'weight_lbs', parseFloat(val) || 0)
                        }
                        placeholder="20"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        style={[styles.metricInputField, { color: '#CCFF00' }]}
                      />
                    </View>

                    <View style={styles.metricInputCell}>
                      <Text style={[styles.metricCellLabel, { color: '#38BDF8' }]}>Rest (sec)</Text>
                      <TextInput
                        value={ex.rest_seconds ? String(ex.rest_seconds) : ''}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'rest_seconds', parseInt(val) || 0)
                        }
                        placeholder="60"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        style={[styles.metricInputField, { color: '#38BDF8' }]}
                      />
                    </View>
                  </View>

                  {/* Coach Form Execution Cues */}
                  <TextInput
                    value={ex.notes || ''}
                    onChangeText={(val) => handleUpdateExercise(index, 'notes', val)}
                    placeholder="Execution cues (e.g. 3s eccentric, pause at bottom)..."
                    placeholderTextColor="#64748B"
                    style={styles.cuesInput}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Bottom Save Button */}
        <TouchableOpacity onPress={handleSavePlan} style={styles.saveBottomBtn} activeOpacity={0.85}>
          <Save size={18} color="#0F172A" />
          <Text style={styles.saveBottomBtnText}>Save 7-Day Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  dayPillTag: {
    fontSize: 8,
    fontWeight: '800',
  },
  modeCard: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
  },
  modeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  restToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  toggleBtnActiveGreen: {
    backgroundColor: '#CCFF00',
  },
  toggleBtnActiveOrange: {
    backgroundColor: '#F97316',
  },
  toggleBtnInactive: {
    backgroundColor: 'transparent',
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '800',
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
  restDayCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 10,
  },
  restIconCircle: {
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
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  restSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  switchBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  switchBackBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  muscleSectionBox: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  inputMicroLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  muscleInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  presetChipsLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderColor: '#CCFF00',
  },
  chipInactive: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#CCFF00',
    fontWeight: '800',
  },
  chipTextInactive: {
    color: '#94A3B8',
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionMicroHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  addExPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  addExPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CCFF00',
  },
  exerciseCard: {
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  exCardTopRow: {
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
  exNameInput: {
    flex: 1,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trashBtn: {
    padding: 4,
  },
  exMetricsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricInputCell: {
    flex: 1,
    gap: 2,
  },
  metricCellLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  metricInputField: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cuesInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    fontStyle: 'italic',
    color: '#CBD5E1',
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
