import React, { useState } from 'react';
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
import { Scale, Droplet, Moon, Star, Save, CircleCheck as CheckCircle2, History } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useLog, useCreateLog, useLogs } from '../../lib/queries/logs';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';

export const ClientLogEntryScreen: React.FC = () => {
  const { themeMode, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const clientId = user?.id || '';
  const today = new Date().toISOString().split('T')[0];

  const { data: todayLog } = useLog(clientId, today);
  const { data: pastLogs } = useLogs(clientId);
  const createLogMutation = useCreateLog();

  const [weight, setWeight] = useState<number>(todayLog?.weight_lbs || 0);
  const [waterOz, setWaterOz] = useState<number>(todayLog?.water_intake_oz || 0);
  const [sleepHours, setSleepHours] = useState<number>(todayLog?.sleep_hours || 0);
  const [energyRating, setEnergyRating] = useState<number>(todayLog?.energy_rating || 5);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveLog = () => {
    createLogMutation.mutate({
      client_id: clientId,
      date: today,
      weight_lbs: weight,
      water_intake_oz: waterOz,
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
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Daily Check-In Log</Text>
        <Text style={styles.subtitle}>Track key recovery & body metrics for {today}</Text>
      </View>

      {/* Primary Log Form */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        {/* Metric 1: Weight */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldLabelRow}>
              <Scale size={16} color="#CCFF00" />
              <Text style={styles.fieldLabel}>Body Weight (kg)</Text>
            </View>
            <Text style={styles.fieldValueGreen}>{weight} kg</Text>
          </View>
          <TextInput
            value={String(weight || '')}
            onChangeText={(val) => setWeight(parseFloat(val) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* Metric 2: Hydration */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldLabelRow}>
              <Droplet size={16} color="#38BDF8" />
              <Text style={styles.fieldLabel}>Hydration (oz)</Text>
            </View>
            <Text style={styles.fieldValueBlue}>{waterOz} oz</Text>
          </View>
          <View style={styles.waterRow}>
            <TextInput
              value={String(waterOz || '')}
              onChangeText={(val) => setWaterOz(parseInt(val) || 0)}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setWaterOz((prev) => prev + 16)} style={styles.quickAddBtn}>
              <Text style={styles.quickAddText}>+16 oz Glass</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metric 3: Sleep */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldLabelRow}>
              <Moon size={16} color="#C084FC" />
              <Text style={styles.fieldLabel}>Sleep Duration (hrs)</Text>
            </View>
            <Text style={styles.fieldValuePurple}>{sleepHours} hrs</Text>
          </View>
          <TextInput
            value={String(sleepHours || '')}
            onChangeText={(val) => setSleepHours(parseFloat(val) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* Metric 4: Energy 1-5 Stars */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Energy & Recovery Rating (1-5)</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setEnergyRating(star)}
                style={[
                  styles.starBtn,
                  energyRating >= star ? styles.starActive : styles.starInactive,
                ]}
              >
                <Star size={16} color={energyRating >= star ? '#FBBF24' : '#475569'} fill={energyRating >= star ? '#FBBF24' : 'transparent'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity onPress={handleSaveLog} style={styles.saveBtn} activeOpacity={0.85}>
          {isSaved ? (
            <>
              <CheckCircle2 size={16} color="#0F172A" />
              <Text style={styles.saveBtnText}>Log Saved!</Text>
            </>
          ) : (
            <>
              <Save size={16} color="#0F172A" />
              <Text style={styles.saveBtnText}>Record Daily Log</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* History */}
      <Text style={styles.sectionHeader}>RECENT CHECK-INS</Text>
      <View style={{ gap: 8 }}>
        {(pastLogs || []).map((log) => (
          <View key={log.id} style={styles.historyCard}>
            <View style={styles.historyTopRow}>
              <Text style={styles.historyDate}>{log.date}</Text>
              <Text style={styles.historyWeight}>{log.weight_lbs} kg</Text>
            </View>
            <Text style={styles.historySub}>
              {log.water_intake_oz} oz water • {log.sleep_hours} hrs sleep • Energy {log.energy_rating}/5
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 120,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  fieldValueGreen: {
    fontSize: 14,
    fontWeight: '900',
    color: '#CCFF00',
  },
  fieldValueBlue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38BDF8',
  },
  fieldValuePurple: {
    fontSize: 14,
    fontWeight: '900',
    color: '#C084FC',
  },
  input: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  quickAddText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  starActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: '#FBBF24',
  },
  starInactive: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#CCFF00',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  historyCard: {
    backgroundColor: 'rgba(9, 13, 22, 0.6)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CCFF00',
  },
  historyWeight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  historySub: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
