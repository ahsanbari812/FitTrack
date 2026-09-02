import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useLogs } from '../../lib/queries/logs';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';

export const ClientProgressHistoryScreen: React.FC = () => {
  const { themeMode, user } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const clientId = user?.id || '';
  const { data: logs } = useLogs(clientId);

  const logsList = logs || [];
  const latestLog = logsList[0];
  const oldestLog = logsList[logsList.length - 1];

  const weightChange = latestLog?.weight_lbs && oldestLog?.weight_lbs && logsList.length > 1
    ? (latestLog.weight_lbs - oldestLog.weight_lbs).toFixed(1)
    : '--';

  const avgSleep = logsList.length > 0
    ? (logsList.reduce((acc, l) => acc + (l.sleep_hours || 0), 0) / logsList.length).toFixed(1)
    : '--';

  const dietAdherence = logsList.length > 0
    ? `${Math.round((logsList.filter((l) => l.completed_diet).length / logsList.length) * 100)}%`
    : '--';

  const activeStreak = logsList.filter((l) => l.completed_workout || l.completed_diet).length;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Progress & Analytics</Text>
        <Text style={styles.subtitle}>Body composition trends & recovery rates</Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={styles.kpiLabel}>WEIGHT CHANGE</Text>
          <Text style={[styles.kpiVal, { color: '#CCFF00' }]}>{weightChange} {weightChange !== '--' ? 'kg' : ''}</Text>
          <Text style={styles.kpiSubGreen}>30 Day Trend</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={styles.kpiLabel}>STREAK</Text>
          <View style={styles.streakRow}>
            <Flame size={18} color="#F97316" />
            <Text style={[styles.kpiVal, { color: '#F97316' }]}>{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}</Text>
          </View>
          <Text style={styles.kpiSub}>Active Streak</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={styles.kpiLabel}>AVG SLEEP</Text>
          <Text style={[styles.kpiVal, { color: '#C084FC' }]}>{avgSleep} {avgSleep !== '--' ? 'hrs' : ''}</Text>
          <Text style={styles.kpiSubPurple}>Average Rest</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={styles.kpiLabel}>DIET ADHERENCE</Text>
          <Text style={[styles.kpiVal, { color: '#38BDF8' }]}>{dietAdherence}</Text>
          <Text style={styles.kpiSubBlue}>Consistently Logged</Text>
        </View>
      </View>

      {/* Logged History List */}
      <Text style={styles.sectionHeader}>LOGGED METRICS HISTORY</Text>
      <View style={{ gap: 8 }}>
        {logsList.map((log) => (
          <View key={log.id} style={[styles.logRow, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.logDate}>{log.date}</Text>
              <Text style={styles.logSub}>
                {log.water_intake_oz} oz water • {log.sleep_hours} hrs sleep • Energy {log.energy_rating}/5
              </Text>
            </View>

            <Text style={styles.logWeight}>{log.weight_lbs} kg</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  kpiSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  kpiSubGreen: {
    fontSize: 9,
    color: '#34D399',
    fontWeight: '700',
  },
  kpiSubPurple: {
    fontSize: 9,
    color: '#C084FC',
    fontWeight: '700',
  },
  kpiSubBlue: {
    fontSize: 9,
    color: '#38BDF8',
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  logDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CCFF00',
  },
  logSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  logWeight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
