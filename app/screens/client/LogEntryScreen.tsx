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
  useWindowDimensions,
} from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useLog, useCreateLog, useLogs } from '../../lib/queries/logs';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';

export const ClientLogEntryScreen: React.FC = () => {
  const { user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const clientId = user?.id || '';
  const today = new Date().toISOString().split('T')[0];

  const { data: todayLog } = useLog(clientId, today);
  const { data: pastLogs } = useLogs(clientId);
  const createLogMutation = useCreateLog();

  const [weight, setWeight] = useState<number>(todayLog?.weight_lbs || 0);
  const [waterLiters, setWaterLiters] = useState<number>(todayLog?.water_intake_oz || 0);
  const [sleepHours, setSleepHours] = useState<number>(todayLog?.sleep_hours || 0);
  const [energyRating, setEnergyRating] = useState<number>(todayLog?.energy_rating || 5);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if todayLog updates from query
  useEffect(() => {
    if (todayLog) {
      if (todayLog.weight_lbs !== undefined && todayLog.weight_lbs !== null) {
        setWeight(todayLog.weight_lbs);
      }
      if (todayLog.water_intake_oz !== undefined && todayLog.water_intake_oz !== null) {
        setWaterLiters(todayLog.water_intake_oz);
      }
      if (todayLog.sleep_hours !== undefined && todayLog.sleep_hours !== null) {
        setSleepHours(todayLog.sleep_hours);
      }
      if (todayLog.energy_rating !== undefined && todayLog.energy_rating !== null) {
        setEnergyRating(todayLog.energy_rating);
      }
    }
  }, [todayLog]);

  const handleSaveLog = () => {
    createLogMutation.mutate({
      client_id: clientId,
      date: today,
      weight_lbs: weight,
      water_intake_oz: waterLiters,
      sleep_hours: sleepHours,
      energy_rating: energyRating,
      completed_diet: true,
      completed_workout: true,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'height' : undefined}
      style={styles.keyboardContainer}
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
        <View style={styles.innerContent}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <Text style={styles.title}>DAILY CHECK-IN</Text>
            <Text style={styles.subtitle}>
              Track today's recovery and keep your coach informed.
            </Text>
          </View>

          {/* ================= COACH FEEDBACK (IF PRESENT) ================= */}
          {todayLog?.coach_notes ? (
            <View style={styles.coachFeedbackCard}>
              <Text style={styles.coachFeedbackKicker}>COACH FEEDBACK</Text>
              <Text style={styles.coachFeedbackText}>"{todayLog.coach_notes}"</Text>
            </View>
          ) : null}

          {/* ================= BODY WEIGHT ================= */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>BODY WEIGHT</Text>
            <View style={styles.largeInputRow}>
              <TextInput
                value={weight > 0 ? String(weight) : ''}
                onChangeText={(val) => setWeight(parseFloat(val) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                style={styles.largeNumericInput}
              />
              <Text style={styles.unitText}>KG</Text>
            </View>
          </View>

          {/* ================= WATER INTAKE ================= */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>WATER INTAKE</Text>
            <View style={styles.largeInputRow}>
              <TextInput
                value={waterLiters > 0 ? String(waterLiters) : ''}
                onChangeText={(val) => setWaterLiters(parseFloat(val) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                style={styles.largeNumericInput}
              />
              <Text style={styles.unitText}>L</Text>
            </View>

            {/* Quick Add Buttons */}
            <View style={styles.quickAddRow}>
              <TouchableOpacity
                onPress={() => setWaterLiters((prev) => parseFloat((prev + 0.25).toFixed(2)))}
                style={styles.quickAddBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.quickAddText}>+0.25 L</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWaterLiters((prev) => parseFloat((prev + 0.5).toFixed(2)))}
                style={styles.quickAddBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.quickAddText}>+0.5 L</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWaterLiters((prev) => parseFloat((prev + 1.0).toFixed(2)))}
                style={styles.quickAddBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.quickAddText}>+1.0 L</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SLEEP ================= */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>SLEEP</Text>
            <View style={styles.largeInputRow}>
              <TextInput
                value={sleepHours > 0 ? String(sleepHours) : ''}
                onChangeText={(val) => setSleepHours(parseFloat(val) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                style={styles.largeNumericInput}
              />
              <Text style={styles.unitText}>HOURS</Text>
            </View>
          </View>

          {/* ================= ENERGY ================= */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>ENERGY</Text>
            <View style={styles.energyRow}>
              {[1, 2, 3, 4, 5].map((level) => {
                const isSelected = energyRating === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setEnergyRating(level)}
                    style={[
                      styles.energyPill,
                      isSelected
                        ? styles.energyPillSelected
                        : styles.energyPillUnselected,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.energyPillText,
                        isSelected
                          ? styles.energyPillTextSelected
                          : styles.energyPillTextUnselected,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ================= DOMINANT SAVE BUTTON ================= */}
          <TouchableOpacity
            onPress={handleSaveLog}
            style={styles.saveButton}
            activeOpacity={0.85}
          >
            {isSaved ? (
              <View style={styles.savedRow}>
                <Check size={18} color="#080A0C" strokeWidth={3} />
                <Text style={styles.saveButtonText}>SAVED</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>SAVE CHECK-IN</Text>
            )}
          </TouchableOpacity>

          {/* ================= RECENT CHECK-INS ================= */}
          {pastLogs && pastLogs.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyKicker}>RECENT CHECK-INS</Text>
              <View style={styles.historyList}>
                {pastLogs.slice(0, 5).map((log) => (
                  <View key={log.id} style={styles.historyCard}>
                    <View style={styles.historyTopRow}>
                      <Text style={styles.historyDate}>{log.date}</Text>
                      <Text style={styles.historyWeight}>
                        {log.weight_lbs !== null && log.weight_lbs !== undefined
                          ? `${log.weight_lbs} kg`
                          : '--'}
                      </Text>
                    </View>
                    <Text style={styles.historyMeta}>
                      {log.water_intake_oz || 0}L water • {log.sleep_hours || 0} hrs sleep • Energy {log.energy_rating || 5}/5
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  innerContent: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: SPACING.lg,
  },

  // Header
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Coach Feedback Card
  coachFeedbackCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  coachFeedbackKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  coachFeedbackText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: SPACING.md,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  largeInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  largeNumericInput: {
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    minWidth: 80,
    padding: 0,
    margin: 0,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  // Water Quick Add
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quickAddBtn: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 0.4,
  },

  // Energy
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  energyPill: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  energyPillSelected: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  energyPillUnselected: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  energyPillText: {
    fontSize: 16,
  },
  energyPillTextSelected: {
    fontWeight: '800',
    color: '#080A0C',
  },
  energyPillTextUnselected: {
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Save Button
  saveButton: {
    height: 52,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080A0C',
    letterSpacing: 0.4,
  },

  // History Section
  historySection: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  historyKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  historyList: {
    gap: SPACING.xs,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyWeight: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
  historyMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
