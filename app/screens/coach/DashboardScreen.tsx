import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import {
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  Dumbbell,
  Apple,
  Moon,
  Phone,
} from 'lucide-react-native';
import { useClients } from '../../lib/queries/profiles';
import { useAllDietPlans } from '../../lib/queries/dietPlans';
import { useAllExercisePlans } from '../../lib/queries/exercisePlans';
import { useUIStore } from '../../lib/store';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { DayOfWeek, Profile } from '../../types/database';
import { ProfileDropdown } from '../../components/ProfileDropdown';

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

const formatLastActivity = (dateStr?: string) => {
  if (!dateStr) return 'No check-in';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Active just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

export const CoachDashboardScreen: React.FC = () => {
  const { user, logout, setSelectedClientId, setCoachActiveTab } = useUIStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { data: clients, refetch, isRefetching } = useClients();
  const { data: allDietPlans } = useAllDietPlans();
  const { data: allExercisePlans } = useAllExercisePlans();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const today = getTodayDayOfWeek();

  // Filter clients by search query and status filter
  const filteredClients = (clients || []).filter((client) => {
    const clientName = client.full_name || '';
    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCoachActiveTab('client-detail');
  };

  const totalClients = clients?.length || 0;
  const activeCount = (clients || []).filter((c) => c.status === 'active').length;
  const pendingCount = (clients || []).filter((c) => c.status === 'pending').length;

  const coachName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Coach';

  // Helper to compute existing compliance for an athlete
  const getClientCompliance = (clientId: string) => {
    const clientDiet = (allDietPlans || []).find((p) => p.client_id === clientId);
    const clientExercise = (allExercisePlans || []).find((p) => p.client_id === clientId);

    const todayDietDay = clientDiet?.day_plans?.[today];
    const todayMeals = todayDietDay?.meals || clientDiet?.meals || [];
    const todayMealsDone = todayMeals.filter((m) => m.completed).length;

    const todayExDay = clientExercise?.day_routines?.[today];
    const isRestToday = todayExDay ? todayExDay.is_rest_day : false;
    const todayExercises = todayExDay?.exercises || clientExercise?.exercises || [];
    const todayExDone = todayExercises.filter((e) => e.completed).length;

    const hasDietPlan = Boolean(clientDiet);
    const hasExercisePlan = Boolean(clientExercise);

    return {
      hasDietPlan,
      hasExercisePlan,
      todayMeals,
      todayMealsDone,
      todayExercises,
      todayExDone,
      isRestToday,
    };
  };

  // Determine visual status using strictly existing athlete data
  const getAthleteStatusInfo = (client: Profile) => {
    const compliance = getClientCompliance(client.id);

    if (client.status === 'inactive') {
      return {
        severity: 'error' as const,
        badgeText: 'INACTIVE',
        color: COLORS.error,
        reason: 'Athlete inactive • Needs re-engagement',
      };
    }

    if (client.status === 'pending') {
      return {
        severity: 'warning' as const,
        badgeText: 'PENDING',
        color: COLORS.warning,
        reason: 'Onboarding pending • Review athlete profile',
      };
    }

    if (!compliance.hasDietPlan || !compliance.hasExercisePlan) {
      return {
        severity: 'warning' as const,
        badgeText: 'NEEDS PLAN',
        color: COLORS.warning,
        reason:
          !compliance.hasDietPlan && !compliance.hasExercisePlan
            ? 'No diet or workout plan assigned'
            : !compliance.hasDietPlan
            ? 'No diet plan assigned'
            : 'No workout plan assigned',
      };
    }

    return {
      severity: 'lime' as const,
      badgeText: 'ON TRACK',
      color: COLORS.brand,
      reason: compliance.isRestToday
        ? `Scheduled Rest Day • ${compliance.todayMealsDone}/${compliance.todayMeals.length} meals`
        : `${compliance.todayExDone}/${compliance.todayExercises.length} exercises • ${compliance.todayMealsDone}/${compliance.todayMeals.length} meals`,
    };
  };

  // Athletes needing attention (warning or error severity)
  const attentionClients = (clients || []).filter((client) => {
    const status = getAthleteStatusInfo(client);
    return status.severity === 'warning' || status.severity === 'error';
  });

  // If no clients currently have warning/error, show active athletes so the coach can monitor compliance
  const displayedAttentionClients =
    attentionClients.length > 0 ? attentionClients : (clients || []).slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingHorizontal: isDesktop ? LAYOUT.paddingDesktop : LAYOUT.paddingMobile,
        },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.brand} />}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.innerWrapper, isDesktop && styles.desktopInnerWrapper]}>
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitlesCol}>
              <Text style={styles.headerKicker}>COACH HOME</Text>
              <Text style={styles.headerTitle}>Good morning, {coachName}</Text>
              <Text style={styles.headerSubtitle}>Your athlete roster</Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsProfileMenuOpen(true)}
              style={styles.profileBtn}
              activeOpacity={0.8}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarFallback}>
                  <Text style={styles.profileAvatarLetter}>
                    {(coachName[0] || 'C').toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Dropdown */}
        <ProfileDropdown
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          user={user}
          role="Head Coach"
          onLogout={logout}
        />

        {/* ================= METRICS STRIP ================= */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricCol}>
            <Text style={styles.metricNumber}>{totalClients}</Text>
            <Text style={styles.metricLabel}>ATHLETES</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricNumber, { color: COLORS.brand }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>ACTIVE</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text
              style={[
                styles.metricNumber,
                pendingCount > 0 ? { color: COLORS.warning } : null,
              ]}
            >
              {pendingCount}
            </Text>
            <Text style={styles.metricLabel}>PENDING</Text>
          </View>
        </View>

        {/* ================= ATTENTION NEEDED ================= */}
        {totalClients > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionKicker}>ATTENTION NEEDED</Text>
              <Text style={styles.sectionSubtitle}>
                {attentionClients.length > 0
                  ? `${attentionClients.length} athlete${attentionClients.length > 1 ? 's' : ''} require review or setup`
                  : 'All active athletes are compliant and on track'}
              </Text>
            </View>

            <View style={styles.attentionCardsContainer}>
              {displayedAttentionClients.map((client) => {
                const displayName = client.full_name?.trim() || 'Athlete';
                const firstLetter = displayName[0]?.toUpperCase() || 'A';
                const statusInfo = getAthleteStatusInfo(client);
                const compliance = getClientCompliance(client.id);

                return (
                  <TouchableOpacity
                    key={client.id}
                    onPress={() => handleSelectClient(client.id)}
                    style={[
                      styles.attentionCard,
                      statusInfo.severity === 'warning' && styles.attentionCardWarning,
                      statusInfo.severity === 'error' && styles.attentionCardError,
                      statusInfo.severity === 'lime' && styles.attentionCardLime,
                    ]}
                    activeOpacity={0.85}
                  >
                    {/* Top Details in Attention Card */}
                    <View style={styles.attentionCardTop}>
                      {client.avatar_url ? (
                        <Image source={{ uri: client.avatar_url }} style={styles.attentionAvatar} />
                      ) : (
                        <View
                          style={[
                            styles.attentionAvatarFallback,
                            {
                              borderColor:
                                statusInfo.severity === 'warning'
                                  ? 'rgba(245, 165, 36, 0.4)'
                                  : statusInfo.severity === 'error'
                                  ? 'rgba(255, 92, 92, 0.4)'
                                  : 'rgba(199, 240, 0, 0.4)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.attentionAvatarText,
                              { color: statusInfo.color },
                            ]}
                          >
                            {firstLetter}
                          </Text>
                        </View>
                      )}

                      <View style={styles.attentionInfoCol}>
                        <View style={styles.attentionNameRow}>
                          <Text style={styles.attentionName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  statusInfo.severity === 'warning'
                                    ? 'rgba(245, 165, 36, 0.12)'
                                    : statusInfo.severity === 'error'
                                    ? 'rgba(255, 92, 92, 0.12)'
                                    : 'rgba(199, 240, 0, 0.12)',
                                borderColor:
                                  statusInfo.severity === 'warning'
                                    ? 'rgba(245, 165, 36, 0.3)'
                                    : statusInfo.severity === 'error'
                                    ? 'rgba(255, 92, 92, 0.3)'
                                    : 'rgba(199, 240, 0, 0.3)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: statusInfo.color },
                              ]}
                            >
                              {statusInfo.badgeText}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.attentionReasonText} numberOfLines={1}>
                          {statusInfo.reason}
                        </Text>

                        <View style={styles.attentionMetaRow}>
                          <Text style={styles.attentionMetaText}>
                            Last check-in: {formatLastActivity(client.updated_at)}
                          </Text>
                          {client.phone_number ? (
                            <>
                              <Text style={styles.attentionMetaDot}>•</Text>
                              <Text style={styles.attentionMetaText}>{client.phone_number}</Text>
                            </>
                          ) : null}
                        </View>
                      </View>

                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </View>

                    {/* Live Compliance Indicators */}
                    <View style={styles.complianceRow}>
                      {/* Diet Compliance Chip */}
                      <View
                        style={[
                          styles.complianceChip,
                          compliance.hasDietPlan &&
                          compliance.todayMeals.length > 0 &&
                          compliance.todayMealsDone === compliance.todayMeals.length
                            ? styles.complianceChipComplete
                            : styles.complianceChipNormal,
                        ]}
                      >
                        <Apple
                          size={12}
                          color={
                            !compliance.hasDietPlan
                              ? COLORS.warning
                              : compliance.todayMealsDone === compliance.todayMeals.length &&
                                compliance.todayMeals.length > 0
                              ? COLORS.brand
                              : COLORS.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.complianceChipText,
                            compliance.todayMealsDone === compliance.todayMeals.length &&
                            compliance.todayMeals.length > 0
                              ? { color: COLORS.brand }
                              : { color: COLORS.textSecondary },
                          ]}
                        >
                          {compliance.hasDietPlan
                            ? compliance.todayMeals.length > 0
                              ? `Diet: ${compliance.todayMealsDone}/${compliance.todayMeals.length} logged`
                              : 'Diet: Scheduled'
                            : 'No Diet Plan'}
                        </Text>
                      </View>

                      {/* Workout Compliance Chip */}
                      <View
                        style={[
                          styles.complianceChip,
                          compliance.isRestToday
                            ? styles.complianceChipRest
                            : compliance.hasExercisePlan &&
                              compliance.todayExercises.length > 0 &&
                              compliance.todayExDone === compliance.todayExercises.length
                            ? styles.complianceChipComplete
                            : styles.complianceChipNormal,
                        ]}
                      >
                        {compliance.isRestToday ? (
                          <Moon size={12} color={COLORS.warning} />
                        ) : (
                          <Dumbbell
                            size={12}
                            color={
                              !compliance.hasExercisePlan
                                ? COLORS.warning
                                : compliance.todayExDone === compliance.todayExercises.length &&
                                  compliance.todayExercises.length > 0
                                ? COLORS.brand
                                : COLORS.info
                            }
                          />
                        )}
                        <Text
                          style={[
                            styles.complianceChipText,
                            compliance.isRestToday
                              ? { color: COLORS.warning }
                              : compliance.todayExDone === compliance.todayExercises.length &&
                                compliance.todayExercises.length > 0
                              ? { color: COLORS.brand }
                              : { color: COLORS.textSecondary },
                          ]}
                        >
                          {compliance.isRestToday
                            ? 'Rest Day'
                            : compliance.hasExercisePlan
                            ? compliance.todayExercises.length > 0
                              ? `Workout: ${compliance.todayExDone}/${compliance.todayExercises.length} done`
                              : 'Workout: Scheduled'
                            : 'No Workout Plan'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= ALL ATHLETES ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>ALL ATHLETES</Text>

          {/* Search Field */}
          <View style={styles.searchBox}>
            <Search size={16} color={COLORS.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search athletes..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
            />
          </View>

          {/* Underline Filter Tabs: ALL, ACTIVE, PENDING, INACTIVE */}
          <View style={styles.filterTabsRow}>
            {(['all', 'active', 'pending', 'inactive'] as const).map((status) => {
              const isSelected = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[styles.filterTab, isSelected && styles.filterTabActive]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isSelected && styles.filterTabTextActive,
                    ]}
                  >
                    {status.toUpperCase()}
                  </Text>
                  {isSelected && <View style={styles.filterTabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Roster List or Empty State */}
          <View style={styles.rosterList}>
            {filteredClients.length === 0 ? (
              totalClients === 0 ? (
                /* Empty Roster (no athletes at all) */
                <View style={styles.emptyRosterBox}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={36} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.emptyRosterTitle}>ROSTER IS EMPTY</Text>
                  <Text style={styles.emptyRosterSubtitle}>
                    When your clients sign in to FitTrack with their Google accounts, they will automatically appear here with their workout & diet progress.
                  </Text>
                  <TouchableOpacity
                    onPress={() => refetch()}
                    style={styles.refreshRosterBtn}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={14} color="#080A0C" />
                    <Text style={styles.refreshRosterText}>Refresh Roster</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Empty Filter / Search Result */
                <View style={styles.emptyFilteredBox}>
                  <Text style={styles.emptyFilteredTitle}>No Athletes Found</Text>
                  <Text style={styles.emptyFilteredSubtitle}>
                    No athletes matched your query "{searchQuery || statusFilter}".
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    style={styles.clearFilterBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearFilterText}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              filteredClients.map((client) => {
                const displayName = client.full_name?.trim() || 'Athlete';
                const firstLetter = displayName[0]?.toUpperCase() || 'A';

                return (
                  <TouchableOpacity
                    key={client.id}
                    onPress={() => handleSelectClient(client.id)}
                    style={styles.athleteRow}
                    activeOpacity={0.75}
                  >
                    {/* 40px Avatar */}
                    {client.avatar_url ? (
                      <Image source={{ uri: client.avatar_url }} style={styles.rowAvatar} />
                    ) : (
                      <View style={styles.rowAvatarFallback}>
                        <Text style={styles.rowAvatarLetter}>{firstLetter}</Text>
                      </View>
                    )}

                    {/* Name and phone / last check-in */}
                    <View style={styles.rowDetailsCol}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <View style={styles.rowMetaRow}>
                        {client.phone_number ? (
                          <View style={styles.rowPhoneWrap}>
                            <Phone size={10} color={COLORS.textMuted} />
                            <Text style={styles.rowMetaText}>{client.phone_number}</Text>
                            <Text style={styles.rowMetaDot}>•</Text>
                          </View>
                        ) : null}
                        <Text style={styles.rowMetaText}>
                          Check-in: {formatLastActivity(client.updated_at)}
                        </Text>
                      </View>
                    </View>

                    {/* Right: status badge & Chevron */}
                    <View style={styles.rowRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          client.status === 'active'
                            ? styles.statusBadgeActive
                            : client.status === 'pending'
                            ? styles.statusBadgePending
                            : styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            client.status === 'active'
                              ? { color: COLORS.brand }
                              : client.status === 'pending'
                              ? { color: COLORS.warning }
                              : { color: COLORS.textMuted },
                          ]}
                        >
                          {(client.status || 'active').toUpperCase()}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
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
    gap: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  headerTitlesCol: {
    flex: 1,
    gap: 4,
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
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  profileBtn: {
    padding: 2,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },

  // Metric Strip
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },

  // Sections
  section: {
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    gap: 2,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Attention Section Cards
  attentionCardsContainer: {
    gap: SPACING.md,
  },
  attentionCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  attentionCardWarning: {
    borderColor: 'rgba(245, 165, 36, 0.28)',
  },
  attentionCardError: {
    borderColor: 'rgba(255, 92, 92, 0.28)',
  },
  attentionCardLime: {
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  attentionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attentionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
  },
  attentionAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionAvatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  attentionInfoCol: {
    flex: 1,
    gap: 3,
  },
  attentionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attentionName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  attentionReasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  attentionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  attentionMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  attentionMetaDot: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Compliance Chips
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 43, 49, 0.6)',
  },
  complianceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  complianceChipNormal: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  complianceChipComplete: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  complianceChipRest: {
    backgroundColor: 'rgba(245, 165, 36, 0.08)',
    borderColor: 'rgba(245, 165, 36, 0.25)',
  },
  complianceChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Status Badges
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.08)',
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 165, 36, 0.08)',
    borderColor: 'rgba(245, 165, 36, 0.25)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(161, 169, 176, 0.08)',
    borderColor: 'rgba(161, 169, 176, 0.2)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Search Field
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    position: 'relative',
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  filterTabTextActive: {
    color: COLORS.brand,
    fontWeight: '700',
  },
  filterTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.brand,
    borderRadius: 1,
  },

  // Roster List
  rosterList: {
    gap: 10,
  },
  athleteRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
  },
  rowAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },
  rowDetailsCol: {
    flex: 1,
    gap: 3,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  rowPhoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rowMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  rowMetaDot: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Empty States
  emptyRosterBox: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRosterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  emptyRosterSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },
  refreshRosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  refreshRosterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080A0C',
  },
  emptyFilteredBox: {
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyFilteredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyFilteredSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
  },
});
