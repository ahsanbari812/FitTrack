import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Polyline,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Path,
} from 'react-native-svg';
import { Check, Flame, Dumbbell, Apple } from 'lucide-react-native';
import { useUIStore } from '../../lib/store';
import { useLogs } from '../../lib/queries/logs';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';

export const ClientProgressHistoryScreen: React.FC = () => {
  const { user } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const clientId = user?.id || '';
  const { data: logs } = useLogs(clientId);

  const logsList = logs || [];
  const latestLog = logsList[0];
  const oldestLog = logsList[logsList.length - 1];

  // Adherence Calculations (Preserved)
  const dietCount = logsList.filter((l) => l.completed_diet).length;
  const workoutCount = logsList.filter((l) => l.completed_workout).length;
  const dietAdherencePercent =
    logsList.length > 0 ? Math.round((dietCount / logsList.length) * 100) : 0;
  const workoutAdherencePercent =
    logsList.length > 0 ? Math.round((workoutCount / logsList.length) * 100) : 0;

  const activeStreak = logsList.filter(
    (l) => l.completed_workout || l.completed_diet
  ).length;

  // Weight Calculations
  const weightChange =
    latestLog?.weight_lbs && oldestLog?.weight_lbs && logsList.length > 1
      ? (latestLog.weight_lbs - oldestLog.weight_lbs).toFixed(1)
      : '--';

  const weightLogs = logsList
    .filter(
      (l) =>
        l.weight_lbs !== null &&
        l.weight_lbs !== undefined &&
        Number(l.weight_lbs) > 0
    )
    .slice(0, 14)
    .reverse();

  const weights = weightLogs.map((l) => Number(l.weight_lbs));
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const weightRange = maxWeight - minWeight || 1;

  // Responsive Chart Dimensions
  const chartContainerWidth = isDesktop
    ? Math.min(width - 64, LAYOUT.maxContentWidth)
    : width - 40;
  const chartHeight = 160;
  const padTop = 20;
  const padBottom = 24;
  const padLeft = 24;
  const padRight = 24;

  const plotPoints = weightLogs.map((log, idx) => {
    const x =
      weightLogs.length === 1
        ? chartContainerWidth / 2
        : padLeft +
          (idx / (weightLogs.length - 1)) *
            (chartContainerWidth - padLeft - padRight);
    const y =
      padTop +
      (1 - (Number(log.weight_lbs) - minWeight) / weightRange) *
        (chartHeight - padTop - padBottom);
    return { x, y, weight: Number(log.weight_lbs), date: log.date };
  });

  const polylinePointsString = plotPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // SVG Area Fill Path
  const areaPathString =
    plotPoints.length > 1
      ? `M ${plotPoints[0].x},${chartHeight - padBottom} ` +
        plotPoints.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
        ` L ${plotPoints[plotPoints.length - 1].x},${chartHeight - padBottom} Z`
      : '';

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
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROGRESS</Text>
        <Text style={styles.headerSubtitle}>Your consistency over time.</Text>
      </View>

      {/* ================= TOP METRICS (4 COMPACT METRICS) ================= */}
      <View style={styles.metricsRow}>
        {/* Metric 1: Weight */}
        <View style={styles.metricBox}>
          <Text style={styles.metricKicker}>WEIGHT</Text>
          <Text style={styles.metricValue}>
            {latestLog?.weight_lbs ? `${latestLog.weight_lbs}` : '--'}
            <Text style={styles.metricUnit}> lb</Text>
          </Text>
          <Text style={styles.metricSub}>
            {weightChange !== '--'
              ? `${Number(weightChange) > 0 ? `+${weightChange}` : weightChange} lb trend`
              : 'Current'}
          </Text>
        </View>

        {/* Metric 2: Workout */}
        <View style={styles.metricBox}>
          <Text style={styles.metricKicker}>WORKOUT</Text>
          <Text style={[styles.metricValue, { color: COLORS.brand }]}>
            {workoutAdherencePercent}%
          </Text>
          <Text style={styles.metricSub}>{workoutCount} completed</Text>
        </View>

        {/* Metric 3: Nutrition */}
        <View style={styles.metricBox}>
          <Text style={styles.metricKicker}>NUTRITION</Text>
          <Text style={[styles.metricValue, { color: COLORS.info }]}>
            {dietAdherencePercent}%
          </Text>
          <Text style={styles.metricSub}>{dietCount} logged</Text>
        </View>

        {/* Metric 4: Streak */}
        <View style={styles.metricBox}>
          <Text style={styles.metricKicker}>STREAK</Text>
          <View style={styles.streakValRow}>
            <Flame size={16} color={COLORS.warning} />
            <Text style={[styles.metricValue, { color: COLORS.warning }]}>
              {activeStreak}
            </Text>
          </View>
          <Text style={styles.metricSub}>
            {activeStreak === 1 ? 'Active day' : 'Active days'}
          </Text>
        </View>
      </View>

      {/* ================= WEIGHT TREND ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>WEIGHT TREND</Text>

        <View style={styles.chartSurface}>
          {weightLogs.length < 2 ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>
                Log at least 2 check-ins to view your weight progression curve.
              </Text>
            </View>
          ) : (
            <View>
              {/* High / Low Axis Badges */}
              <View style={styles.chartAxisHeader}>
                <Text style={styles.chartAxisLabel}>HIGH: {maxWeight} lb</Text>
                <Text style={styles.chartAxisLabel}>LOW: {minWeight} lb</Text>
              </View>

              {/* Minimal SVG Sparkline */}
              <Svg
                width={chartContainerWidth}
                height={chartHeight}
                style={styles.svgContainer}
              >
                <Defs>
                  <LinearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={COLORS.brand} stopOpacity="0.18" />
                    <Stop offset="1" stopColor={COLORS.brand} stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>

                {/* Subtle Gradient Area */}
                {areaPathString ? (
                  <Path d={areaPathString} fill="url(#limeGradient)" />
                ) : null}

                {/* Trend Polyline */}
                <Polyline
                  points={polylinePointsString}
                  fill="none"
                  stroke={COLORS.brand}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {plotPoints.map((p, idx) => (
                  <Circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={idx === plotPoints.length - 1 ? 5 : 3.5}
                    fill={idx === plotPoints.length - 1 ? COLORS.brand : '#111519'}
                    stroke={COLORS.brand}
                    strokeWidth="2"
                  />
                ))}
              </Svg>

              {/* Date Span Footer */}
              <View style={styles.chartDateFooter}>
                <Text style={styles.chartDateText}>
                  {weightLogs[0]?.date || ''}
                </Text>
                <Text style={styles.chartDateText}>
                  {weightLogs[weightLogs.length - 1]?.date || ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ================= CONSISTENCY (ADHERENCE BARS) ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>CONSISTENCY</Text>

        <View style={styles.consistencyCard}>
          {/* Workout Adherence */}
          <View style={styles.consistencyRow}>
            <View style={styles.consistencyLabelRow}>
              <Text style={styles.consistencyTitle}>WORKOUT</Text>
              <Text style={[styles.consistencyPercent, { color: COLORS.brand }]}>
                {workoutAdherencePercent}%
              </Text>
            </View>
            <View style={styles.consistencyTrack}>
              <View
                style={[
                  styles.consistencyBar,
                  {
                    backgroundColor: COLORS.brand,
                    width: `${Math.min(100, Math.max(0, workoutAdherencePercent))}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Nutrition Adherence */}
          <View style={styles.consistencyRow}>
            <View style={styles.consistencyLabelRow}>
              <Text style={styles.consistencyTitle}>NUTRITION</Text>
              <Text style={[styles.consistencyPercent, { color: COLORS.info }]}>
                {dietAdherencePercent}%
              </Text>
            </View>
            <View style={styles.consistencyTrack}>
              <View
                style={[
                  styles.consistencyBar,
                  {
                    backgroundColor: COLORS.info,
                    width: `${Math.min(100, Math.max(0, dietAdherencePercent))}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ================= DAILY HISTORY (VERTICAL TIMELINE) ================= */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>DAILY HISTORY</Text>

        {logsList.length === 0 ? (
          <View style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryText}>
              No check-ins logged yet. Complete your daily log to establish history.
            </Text>
          </View>
        ) : (
          <View style={styles.historyTimeline}>
            {logsList.map((log, idx) => {
              const isLast = idx === logsList.length - 1;
              const hasWeight =
                log.weight_lbs !== null &&
                log.weight_lbs !== undefined &&
                Number(log.weight_lbs) > 0;

              return (
                <View key={log.id || idx} style={styles.historyItem}>
                  {/* Timeline Axis */}
                  <View style={styles.historyAxis}>
                    <View
                      style={[
                        styles.historyDot,
                        (log.completed_workout || log.completed_diet) &&
                          styles.historyDotActive,
                      ]}
                    />
                    {!isLast && <View style={styles.historyLine} />}
                  </View>

                  {/* History Content */}
                  <View style={styles.historyContent}>
                    <View style={styles.historyLeftCol}>
                      <Text style={styles.historyDate}>{log.date}</Text>
                      <Text style={styles.historyBiometrics}>
                        {hasWeight ? `${log.weight_lbs} lb • ` : ''}
                        {log.water_intake_oz || 0} oz water •{' '}
                        {log.sleep_hours || 0}h sleep • Energy{' '}
                        {log.energy_rating || 5}/5
                      </Text>
                    </View>

                    {/* Workout & Nutrition Status Badges */}
                    <View style={styles.historyBadgesRow}>
                      {/* Workout Status */}
                      <View
                        style={[
                          styles.statusPill,
                          log.completed_workout
                            ? styles.statusPillCompleted
                            : styles.statusPillPending,
                        ]}
                      >
                        <Dumbbell
                          size={11}
                          color={
                            log.completed_workout
                              ? COLORS.brand
                              : COLORS.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            {
                              color: log.completed_workout
                                ? COLORS.brand
                                : COLORS.textMuted,
                            },
                          ]}
                        >
                          WORKOUT
                        </Text>
                      </View>

                      {/* Nutrition Status */}
                      <View
                        style={[
                          styles.statusPill,
                          log.completed_diet
                            ? styles.statusPillCompleted
                            : styles.statusPillPending,
                        ]}
                      >
                        <Apple
                          size={11}
                          color={
                            log.completed_diet ? COLORS.info : COLORS.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            {
                              color: log.completed_diet
                                ? COLORS.info
                                : COLORS.textMuted,
                            },
                          ]}
                        >
                          NUTRITION
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },

  // Header
  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Top Metrics
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  metricBox: {
    flex: 1,
    gap: 3,
  },
  metricKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  streakValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Section Headers
  section: {
    gap: SPACING.sm,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Weight Trend Surface
  chartSurface: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    overflow: 'hidden',
  },
  chartEmpty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  chartEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  chartAxisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: 4,
  },
  chartAxisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  svgContainer: {
    overflow: 'visible',
  },
  chartDateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: 4,
  },
  chartDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Consistency (Adherence)
  consistencyCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: SPACING.lg,
  },
  consistencyRow: {
    gap: SPACING.xs,
  },
  consistencyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consistencyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  consistencyPercent: {
    fontSize: 15,
    fontWeight: '800',
  },
  consistencyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  consistencyBar: {
    height: '100%',
    borderRadius: 3,
  },

  // History Timeline
  historyTimeline: {
    paddingLeft: 4,
  },
  historyItem: {
    flexDirection: 'row',
  },
  historyAxis: {
    width: 22,
    alignItems: 'center',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginTop: 6,
    zIndex: 2,
  },
  historyDotActive: {
    backgroundColor: COLORS.brand,
  },
  historyLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 2,
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingLeft: SPACING.md,
    paddingBottom: 22,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  historyLeftCol: {
    gap: 3,
    flex: 1,
    minWidth: 180,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyBiometrics: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  statusPillCompleted: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.2)',
  },
  statusPillPending: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Empty State
  emptyHistoryCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
