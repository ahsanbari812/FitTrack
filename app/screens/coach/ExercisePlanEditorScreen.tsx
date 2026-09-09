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
  Dumbbell,
  Moon,
  Copy,
  Check,
  X,
  Search,
  BookOpen,
} from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import {
  useCreateExercisePlan,
  useUpdateExercisePlan,
  useExercisePlan,
} from '../../lib/queries/exercisePlans';
import { useProfile } from '../../lib/queries/profiles';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
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

interface LibraryExercise {
  name: string;
  muscle: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  defaultRest: number;
}

const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { name: 'Barbell Bench Press', muscle: 'Chest', defaultSets: 4, defaultReps: 8, defaultWeight: 135, defaultRest: 90 },
  { name: 'Incline Dumbbell Press', muscle: 'Chest', defaultSets: 3, defaultReps: 10, defaultWeight: 50, defaultRest: 75 },
  { name: 'Cable Chest Fly', muscle: 'Chest', defaultSets: 3, defaultReps: 12, defaultWeight: 30, defaultRest: 60 },
  { name: 'Dips (Weighted/Bodyweight)', muscle: 'Chest & Triceps', defaultSets: 3, defaultReps: 10, defaultWeight: 0, defaultRest: 75 },
  { name: 'Push-Ups', muscle: 'Chest', defaultSets: 3, defaultReps: 15, defaultWeight: 0, defaultRest: 60 },

  // Back
  { name: 'Barbell Deadlift', muscle: 'Back & Hamstrings', defaultSets: 4, defaultReps: 6, defaultWeight: 185, defaultRest: 120 },
  { name: 'Pull-Ups / Chin-Ups', muscle: 'Back & Biceps', defaultSets: 3, defaultReps: 8, defaultWeight: 0, defaultRest: 90 },
  { name: 'Barbell Bent-Over Row', muscle: 'Back', defaultSets: 4, defaultReps: 8, defaultWeight: 115, defaultRest: 90 },
  { name: 'Lat Pulldown', muscle: 'Back', defaultSets: 3, defaultReps: 10, defaultWeight: 120, defaultRest: 60 },
  { name: 'Seated Cable Row', muscle: 'Back', defaultSets: 3, defaultReps: 12, defaultWeight: 100, defaultRest: 60 },

  // Legs
  { name: 'Barbell Back Squat', muscle: 'Legs & Glutes', defaultSets: 4, defaultReps: 8, defaultWeight: 185, defaultRest: 120 },
  { name: 'Romanian Deadlift (RDL)', muscle: 'Hamstrings & Glutes', defaultSets: 3, defaultReps: 10, defaultWeight: 135, defaultRest: 90 },
  { name: 'Leg Press', muscle: 'Quads & Glutes', defaultSets: 3, defaultReps: 12, defaultWeight: 270, defaultRest: 90 },
  { name: 'Walking Dumbbell Lunge', muscle: 'Legs', defaultSets: 3, defaultReps: 12, defaultWeight: 35, defaultRest: 60 },
  { name: 'Standing Calf Raise', muscle: 'Calves', defaultSets: 4, defaultReps: 15, defaultWeight: 90, defaultRest: 45 },

  // Shoulders
  { name: 'Overhead Barbell Press (OHP)', muscle: 'Shoulders', defaultSets: 4, defaultReps: 8, defaultWeight: 95, defaultRest: 90 },
  { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', defaultSets: 4, defaultReps: 15, defaultWeight: 20, defaultRest: 45 },
  { name: 'Face Pulls', muscle: 'Rear Delts & Upper Back', defaultSets: 3, defaultReps: 15, defaultWeight: 40, defaultRest: 60 },
  { name: 'Dumbbell Arnold Press', muscle: 'Shoulders', defaultSets: 3, defaultReps: 10, defaultWeight: 40, defaultRest: 60 },

  // Arms
  { name: 'Barbell Bicep Curl', muscle: 'Biceps', defaultSets: 3, defaultReps: 10, defaultWeight: 65, defaultRest: 60 },
  { name: 'Incline Dumbbell Curl', muscle: 'Biceps', defaultSets: 3, defaultReps: 12, defaultWeight: 25, defaultRest: 60 },
  { name: 'Tricep Rope Pushdown', muscle: 'Triceps', defaultSets: 3, defaultReps: 12, defaultWeight: 50, defaultRest: 60 },
  { name: 'Skull Crushers', muscle: 'Triceps', defaultSets: 3, defaultReps: 10, defaultWeight: 55, defaultRest: 60 },
  { name: 'Hammer Curls', muscle: 'Biceps & Forearms', defaultSets: 3, defaultReps: 12, defaultWeight: 30, defaultRest: 60 },

  // Core & Conditioning
  { name: 'Hanging Leg Raise', muscle: 'Core', defaultSets: 3, defaultReps: 15, defaultWeight: 0, defaultRest: 45 },
  { name: 'Cable Woodchoppers', muscle: 'Obliques & Core', defaultSets: 3, defaultReps: 12, defaultWeight: 35, defaultRest: 45 },
  { name: 'Ab Wheel Rollout', muscle: 'Core', defaultSets: 3, defaultReps: 12, defaultWeight: 0, defaultRest: 60 },
];

const createDefaultExercise = (day: string, idx: number): ExerciseItem => ({
  id: `ex-${day.toLowerCase().slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${idx}`,
  name: '',
  target_sets: 3,
  target_reps: 10,
  rest_seconds: 60,
  weight_lbs: 20,
  notes: '',
  video_url: '',
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
  const { selectedClientId, setCoachActiveTab, editingExercisePlanId, user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const { data: clientProfile } = useProfile(selectedClientId);
  const { data: existingPlan } = useExercisePlan(selectedClientId);
  const createExercisePlanMutation = useCreateExercisePlan();
  const updateExercisePlanMutation = useUpdateExercisePlan();

  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [dayRoutines, setDayRoutines] = useState<Record<DayOfWeek, DayWorkoutRoutine>>(
    createInitialDayRoutines()
  );
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Exercise Library Bottom Sheet
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState<number | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');

  // Focused input state for lime border styling
  const [focusedInputKey, setFocusedInputKey] = useState<string | null>(null);

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

  const athleteName = clientProfile?.full_name?.trim() || 'Athlete';

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

  const handleOpenLibraryForIndex = (index: number) => {
    setLibraryTargetIndex(index);
    setLibrarySearch('');
    setIsLibraryOpen(true);
  };

  const handleSelectLibraryItem = (item: LibraryExercise) => {
    if (libraryTargetIndex !== null && libraryTargetIndex < activeDayRoutine.exercises.length) {
      const updated = [...activeDayRoutine.exercises];
      updated[libraryTargetIndex] = {
        ...updated[libraryTargetIndex],
        name: item.name,
        target_sets: item.defaultSets,
        target_reps: item.defaultReps,
        weight_lbs: item.defaultWeight,
        rest_seconds: item.defaultRest,
      };
      setDayRoutines((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          exercises: updated,
        },
      }));
    } else {
      const newEx: ExerciseItem = {
        id: `ex-${selectedDay.toLowerCase().slice(0, 3)}-${Date.now()}`,
        name: item.name,
        target_sets: item.defaultSets,
        target_reps: item.defaultReps,
        weight_lbs: item.defaultWeight,
        rest_seconds: item.defaultRest,
        notes: '',
        video_url: '',
        completed: false,
      };
      setDayRoutines((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          exercises: [...prev[selectedDay].exercises, newEx],
        },
      }));
    }
    setIsLibraryOpen(false);
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

  const filteredLibrary = EXERCISE_LIBRARY.filter((item) => {
    const query = librarySearch.toLowerCase().trim();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.muscle.toLowerCase().includes(query)
    );
  });

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
                  onPress={handleSavePlan}
                  style={styles.desktopSaveBtn}
                  activeOpacity={0.85}
                >
                  <Save size={15} color="#080A0C" strokeWidth={2.4} />
                  <Text style={styles.desktopSaveBtnText}>SAVE WORKOUT PLAN</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.headerTitlesCol}>
              <Text style={styles.headerKicker}>EDIT WORKOUT PLAN</Text>
              <Text style={styles.athleteNameText}>{athleteName}</Text>
            </View>

            {/* Plan Title Input */}
            <View style={styles.titleBox}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Program Title (e.g. 7-Day Hypertrophy & Strength Split)"
                placeholderTextColor={COLORS.textMuted}
                style={styles.titleInput}
              />
            </View>
          </View>

          {/* ================= DAY SELECTOR ================= */}
          <View style={styles.daySelectorRow}>
            {/* 7-Day Horizontal Selector */}
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
                        styles.dayPillName,
                        isSelected ? { color: '#080A0C' } : { color: COLORS.textSecondary },
                      ]}
                    >
                      {shortName}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillTag,
                        isSelected
                          ? { color: '#080A0C' }
                          : isRest
                          ? { color: COLORS.textMuted }
                          : { color: COLORS.brand },
                      ]}
                      numberOfLines={1}
                    >
                      {isRest ? 'REST' : routine?.target_muscle?.split(' ')[0] || 'WORK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Copy Routine Action */}
            <TouchableOpacity
              onPress={handleCopyRoutineToWeekdays}
              style={styles.copyDayBtn}
              activeOpacity={0.8}
            >
              <Copy size={13} color={COLORS.textPrimary} />
              <Text style={styles.copyDayBtnText}>Copy Weekdays</Text>
            </TouchableOpacity>
          </View>

          {copiedNotification && (
            <View style={styles.copiedBanner}>
              <Check size={14} color={COLORS.brand} />
              <Text style={styles.copiedBannerText}>{copiedNotification}</Text>
            </View>
          )}

          {/* ================= DAY SETTINGS (TARGET MUSCLE & REST DAY) ================= */}
          <View style={styles.daySettingsSurface}>
            <View style={styles.daySettingsTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.surfaceMicroLabel}>DAY SETTINGS</Text>
                <Text style={styles.surfaceDayTitle}>{selectedDay.toUpperCase()} PROTOCOL</Text>
              </View>

              {/* REST DAY TOGGLE */}
              <View style={styles.restToggleGroup}>
                <TouchableOpacity
                  onPress={() => handleToggleRestDay(false)}
                  style={[
                    styles.toggleOptionBtn,
                    !activeDayRoutine.is_rest_day && styles.toggleOptionActiveWorkout,
                  ]}
                  activeOpacity={0.8}
                >
                  <Dumbbell
                    size={13}
                    color={!activeDayRoutine.is_rest_day ? '#080A0C' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleOptionText,
                      !activeDayRoutine.is_rest_day && styles.toggleOptionTextActive,
                    ]}
                  >
                    WORKOUT
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleRestDay(true)}
                  style={[
                    styles.toggleOptionBtn,
                    activeDayRoutine.is_rest_day && styles.toggleOptionActiveRest,
                  ]}
                  activeOpacity={0.8}
                >
                  <Moon
                    size={13}
                    color={activeDayRoutine.is_rest_day ? '#080A0C' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleOptionText,
                      activeDayRoutine.is_rest_day && styles.toggleOptionTextActive,
                    ]}
                  >
                    REST DAY
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TARGET MUSCLE INPUT & QUICK PRESETS */}
            {!activeDayRoutine.is_rest_day && (
              <View style={styles.targetMuscleContainer}>
                <Text style={styles.fieldLabel}>TARGET MUSCLE</Text>
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
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.targetMuscleInput}
                />

                {/* Quick Presets */}
                <View style={styles.presetsWrap}>
                  {MUSCLE_GROUP_PRESETS.map((preset) => {
                    const isSelected = activeDayRoutine.target_muscle === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => handleSelectMusclePreset(preset)}
                        style={[
                          styles.presetChip,
                          isSelected && styles.presetChipActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            isSelected && styles.presetChipTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* ================= IF REST DAY ================= */}
          {activeDayRoutine.is_rest_day ? (
            <View style={styles.restDayNoticeCard}>
              <View style={styles.restIconCircle}>
                <Moon size={28} color={COLORS.warning} />
              </View>
              <Text style={styles.restNoticeTitle}>
                {selectedDay} is a Scheduled Rest Day
              </Text>
              <Text style={styles.restNoticeSub}>
                Athlete is scheduled for active recovery, mobility drills, and hydration check-ins without heavy resistance lifting.
              </Text>
              <TouchableOpacity
                onPress={() => handleToggleRestDay(false)}
                style={styles.changeToWorkoutBtn}
                activeOpacity={0.8}
              >
                <Dumbbell size={14} color={COLORS.brand} />
                <Text style={styles.changeToWorkoutText}>Switch to Workout Day</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= EXERCISES SECTION ================= */
            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeaderRow}>
                <Text style={styles.sectionHeading}>EXERCISES</Text>
                <Text style={styles.exercisesCountSub}>
                  {activeDayRoutine.exercises.length} Scheduled Movements
                </Text>
              </View>

              {/* Exercise Items */}
              <View style={styles.exercisesList}>
                {activeDayRoutine.exercises.map((ex, index) => {
                  const numFormatted = String(index + 1).padStart(2, '0');

                  return (
                    <View key={ex.id || index} style={styles.exerciseSurface}>
                      {/* Top Row: Index + Exercise Name + Library Trigger + Delete */}
                      <View style={styles.exerciseTopRow}>
                        <Text style={styles.exerciseNumText}>{numFormatted}</Text>

                        <View style={styles.nameInputWrap}>
                          <TextInput
                            value={ex.name}
                            onChangeText={(val) => handleUpdateExercise(index, 'name', val)}
                            placeholder="EXERCISE NAME"
                            placeholderTextColor={COLORS.textMuted}
                            style={styles.exerciseNameInput}
                          />
                        </View>

                        {/* Open Library Button */}
                        <TouchableOpacity
                          onPress={() => handleOpenLibraryForIndex(index)}
                          style={styles.libraryIconBtn}
                          activeOpacity={0.7}
                        >
                          <BookOpen size={15} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* Delete Action (Subtle Red #FF5C5C) */}
                        <TouchableOpacity
                          onPress={() => handleRemoveExercise(index)}
                          style={styles.deleteExBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color="#FF5C5C" />
                        </TouchableOpacity>
                      </View>

                      {/* Numeric Fields (SETS, REPS, WEIGHT, REST) */}
                      <View style={styles.numericFieldsRow}>
                        {/* SETS */}
                        <View style={styles.numericFieldCol}>
                          <Text style={styles.numericFieldLabel}>SETS</Text>
                          <TextInput
                            value={ex.target_sets ? String(ex.target_sets) : ''}
                            onChangeText={(val) =>
                              handleUpdateExercise(index, 'target_sets', parseInt(val, 10) || 0)
                            }
                            placeholder="3"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            onFocus={() => setFocusedInputKey(`sets-${index}`)}
                            onBlur={() => setFocusedInputKey(null)}
                            style={[
                              styles.numericInput,
                              focusedInputKey === `sets-${index}` && styles.numericInputFocused,
                            ]}
                          />
                        </View>

                        {/* REPS */}
                        <View style={styles.numericFieldCol}>
                          <Text style={styles.numericFieldLabel}>REPS</Text>
                          <TextInput
                            value={ex.target_reps ? String(ex.target_reps) : ''}
                            onChangeText={(val) =>
                              handleUpdateExercise(index, 'target_reps', parseInt(val, 10) || 0)
                            }
                            placeholder="10"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            onFocus={() => setFocusedInputKey(`reps-${index}`)}
                            onBlur={() => setFocusedInputKey(null)}
                            style={[
                              styles.numericInput,
                              focusedInputKey === `reps-${index}` && styles.numericInputFocused,
                            ]}
                          />
                        </View>

                        {/* WEIGHT (LB) */}
                        <View style={styles.numericFieldCol}>
                          <Text style={[styles.numericFieldLabel, { color: COLORS.brand }]}>
                            WEIGHT
                          </Text>
                          <View
                            style={[
                              styles.unitInputBox,
                              focusedInputKey === `weight-${index}` && styles.numericInputFocused,
                            ]}
                          >
                            <TextInput
                              value={ex.weight_lbs ? String(ex.weight_lbs) : ''}
                              onChangeText={(val) =>
                                handleUpdateExercise(index, 'weight_lbs', parseFloat(val) || 0)
                              }
                              placeholder="20"
                              placeholderTextColor={COLORS.textMuted}
                              keyboardType="numeric"
                              onFocus={() => setFocusedInputKey(`weight-${index}`)}
                              onBlur={() => setFocusedInputKey(null)}
                              style={[styles.unitTextInput, { color: COLORS.brand }]}
                            />
                            <Text style={styles.unitSuffix}>LB</Text>
                          </View>
                        </View>

                        {/* REST (SEC) */}
                        <View style={styles.numericFieldCol}>
                          <Text style={[styles.numericFieldLabel, { color: COLORS.info }]}>
                            REST
                          </Text>
                          <View
                            style={[
                              styles.unitInputBox,
                              focusedInputKey === `rest-${index}` && styles.numericInputFocused,
                            ]}
                          >
                            <TextInput
                              value={ex.rest_seconds ? String(ex.rest_seconds) : ''}
                              onChangeText={(val) =>
                                handleUpdateExercise(index, 'rest_seconds', parseInt(val, 10) || 0)
                              }
                              placeholder="60"
                              placeholderTextColor={COLORS.textMuted}
                              keyboardType="numeric"
                              onFocus={() => setFocusedInputKey(`rest-${index}`)}
                              onBlur={() => setFocusedInputKey(null)}
                              style={[styles.unitTextInput, { color: COLORS.info }]}
                            />
                            <Text style={styles.unitSuffix}>SEC</Text>
                          </View>
                        </View>
                      </View>

                      {/* NOTES & VIDEO */}
                      <View style={styles.notesVideoRow}>
                        <View style={styles.formGroupCol}>
                          <Text style={styles.fieldLabel}>NOTES / CUES</Text>
                          <TextInput
                            value={ex.notes || ''}
                            onChangeText={(val) => handleUpdateExercise(index, 'notes', val)}
                            placeholder="e.g. 3s eccentric, full stretch at bottom, pause 1s"
                            placeholderTextColor={COLORS.textMuted}
                            onFocus={() => setFocusedInputKey(`notes-${index}`)}
                            onBlur={() => setFocusedInputKey(null)}
                            style={[
                              styles.standardInput,
                              focusedInputKey === `notes-${index}` && styles.numericInputFocused,
                            ]}
                          />
                        </View>

                        <View style={styles.formGroupCol}>
                          <Text style={styles.fieldLabel}>VIDEO URL</Text>
                          <TextInput
                            value={ex.video_url || ''}
                            onChangeText={(val) => handleUpdateExercise(index, 'video_url', val)}
                            placeholder="https://..."
                            placeholderTextColor={COLORS.textMuted}
                            onFocus={() => setFocusedInputKey(`video-${index}`)}
                            onBlur={() => setFocusedInputKey(null)}
                            style={[
                              styles.standardInput,
                              focusedInputKey === `video-${index}` && styles.numericInputFocused,
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* ADD EXERCISE (Secondary Button) */}
              <TouchableOpacity
                onPress={handleAddExercise}
                style={styles.addExerciseBtn}
                activeOpacity={0.8}
              >
                <Plus size={16} color={COLORS.textPrimary} />
                <Text style={styles.addExerciseBtnText}>ADD EXERCISE</Text>
              </TouchableOpacity>
            </View>
          )}
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
            onPress={handleSavePlan}
            style={styles.mobileSaveBtn}
            activeOpacity={0.85}
          >
            <Save size={18} color="#080A0C" strokeWidth={2.4} />
            <Text style={styles.mobileSaveBtnText}>SAVE WORKOUT PLAN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= EXERCISE LIBRARY BOTTOM SHEET ================= */}
      <Modal
        visible={isLibraryOpen}
        transparent={true}
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsLibraryOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsLibraryOpen(false)}>
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

                {/* Library Header */}
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalHeading}>EXERCISE LIBRARY</Text>
                    <Text style={styles.modalSubheading}>
                      Select an exercise to populate targets and execution standards.
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsLibraryOpen(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Search Field */}
                <View style={styles.librarySearchBox}>
                  <Search size={15} color={COLORS.textMuted} />
                  <TextInput
                    value={librarySearch}
                    onChangeText={setLibrarySearch}
                    placeholder="Search movement or muscle..."
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.librarySearchInput}
                  />
                </View>

                {/* Results List */}
                <ScrollView
                  style={styles.libraryScrollList}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredLibrary.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleSelectLibraryItem(item)}
                      style={styles.libraryResultRow}
                      activeOpacity={0.75}
                    >
                      <View style={styles.libraryIconWrap}>
                        <Dumbbell size={16} color={COLORS.brand} />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.libraryItemName}>{item.name}</Text>
                        <Text style={styles.libraryItemMuscle}>{item.muscle}</Text>
                      </View>

                      <Text style={styles.libraryItemDefaults}>
                        {item.defaultSets}×{item.defaultReps} • {item.defaultWeight} LB
                      </Text>
                    </TouchableOpacity>
                  ))}
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

  // Day Selector
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
  dayPillTag: {
    fontSize: 9,
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

  // Day Settings Surface
  daySettingsSurface: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: SPACING.md,
  },
  daySettingsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  surfaceMicroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  surfaceDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  restToggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    gap: 4,
  },
  toggleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  toggleOptionActiveWorkout: {
    backgroundColor: COLORS.brand,
  },
  toggleOptionActiveRest: {
    backgroundColor: COLORS.warning,
  },
  toggleOptionText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  toggleOptionTextActive: {
    color: '#080A0C',
  },

  // Target Muscle
  targetMuscleContainer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  targetMuscleInput: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderColor: COLORS.brand,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetChipTextActive: {
    color: COLORS.brand,
    fontWeight: '700',
  },

  // Rest Day Card
  restDayNoticeCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  restIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 165, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 165, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restNoticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  restNoticeSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 420,
  },
  changeToWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
  },
  changeToWorkoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },

  // Exercises Section
  exercisesSection: {
    gap: SPACING.md,
  },
  exercisesHeaderRow: {
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
  exercisesCountSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  exercisesList: {
    gap: 12,
  },
  exerciseSurface: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  nameInputWrap: {
    flex: 1,
  },
  exerciseNameInput: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  libraryIconBtn: {
    width: 44,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteExBtn: {
    width: 44,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 92, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Numeric Fields
  numericFieldsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numericFieldCol: {
    flex: 1,
    gap: 4,
  },
  numericFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  numericInput: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  numericInputFocused: {
    borderColor: COLORS.brand,
  },
  unitInputBox: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unitTextInput: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 28,
  },
  unitSuffix: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginLeft: 2,
  },

  // Notes & Video
  notesVideoRow: {
    gap: 10,
    paddingTop: 4,
  },
  formGroupCol: {
    gap: 4,
  },
  standardInput: {
    height: 48,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 13,
    color: COLORS.textPrimary,
  },

  // Add Exercise Button
  addExerciseBtn: {
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
  addExerciseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },

  // Mobile Sticky Save Bottom
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

  // Library Modal / Bottom Sheet
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
    maxWidth: 620,
    maxHeight: '85%',
    borderRadius: RADIUS.xl,
    padding: 24,
  },
  mobileSheetContentCard: {
    width: '100%',
    maxHeight: '85%',
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
  librarySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    marginBottom: SPACING.md,
  },
  librarySearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  libraryScrollList: {
    maxHeight: 400,
  },
  libraryResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  libraryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  libraryItemMuscle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  libraryItemDefaults: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
});
