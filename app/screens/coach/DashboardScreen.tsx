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

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
};

export const CoachDashboardScreen: React.FC = () => {
  const {
    user,
    logout,
    setSelectedClientId,
    setCoachActiveTab,
  } = useUIStore();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const {
    data: clients,
    refetch,
    isRefetching,
  } = useClients();

  const { data: allDietPlans } = useAllDietPlans();
  const { data: allExercisePlans } = useAllExercisePlans();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const today = getTodayDayOfWeek();

  const filteredClients = (clients || []).filter((client) => {
    const clientName = client.full_name || '';

    const matchesSearch = clientName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCoachActiveTab('client-detail');
  };

  const totalClients = clients?.length || 0;

  const activeCount = (clients || []).filter(
    (client) => client.status === 'active'
  ).length;

  const pendingCount = (clients || []).filter(
    (client) => client.status === 'pending'
  ).length;

  const coachName =
    user?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Coach';

  /**
   * Existing compliance calculation.
   * No data model or business logic has been changed.
   */
  const getClientCompliance = (clientId: string) => {
    const clientDiet = (allDietPlans || []).find(
      (plan) => plan.client_id === clientId
    );

    const clientExercise = (allExercisePlans || []).find(
      (plan) => plan.client_id === clientId
    );

    const todayDietDay = clientDiet?.day_plans?.[today];

    const todayMeals =
      todayDietDay?.meals ||
      clientDiet?.meals ||
      [];

    const todayMealsDone = todayMeals.filter(
      (meal) => meal.completed
    ).length;

    const todayExDay = clientExercise?.day_routines?.[today];

    const isRestToday = todayExDay
      ? todayExDay.is_rest_day
      : false;

    const todayExercises =
      todayExDay?.exercises ||
      clientExercise?.exercises ||
      [];

    const todayExDone = todayExercises.filter(
      (exercise) => exercise.completed
    ).length;

    return {
      hasDietPlan: Boolean(clientDiet),
      hasExercisePlan: Boolean(clientExercise),
      todayMeals,
      todayMealsDone,
      todayExercises,
      todayExDone,
      isRestToday,
    };
  };

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

    if (
      !compliance.hasDietPlan ||
      !compliance.hasExercisePlan
    ) {
      return {
        severity: 'warning' as const,
        badgeText: 'NEEDS PLAN',
        color: COLORS.warning,
        reason:
          !compliance.hasDietPlan &&
            !compliance.hasExercisePlan
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

  const attentionClients = (clients || []).filter((client) => {
    const status = getAthleteStatusInfo(client);

    return (
      status.severity === 'warning' ||
      status.severity === 'error'
    );
  });

  const displayedAttentionClients =
    attentionClients.length > 0
      ? attentionClients
      : (clients || []).slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingHorizontal: isDesktop
            ? LAYOUT.paddingDesktop
            : LAYOUT.paddingMobile,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={COLORS.brand}
        />
      }
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.innerWrapper,
          isDesktop && styles.desktopInnerWrapper,
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitlesCol}>
              <Text style={styles.headerKicker}>
                COACH HOME
              </Text>

              <Text style={styles.headerTitle}>
                Good morning, {coachName}
              </Text>

              <Text style={styles.headerSubtitle}>
                Your athlete roster
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsProfileMenuOpen(true)}
              style={styles.profileBtn}
              activeOpacity={0.8}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.profileAvatar}
                />
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

        <ProfileDropdown
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          user={user}
          role="Head Coach"
          onLogout={logout}
        />

        {/* METRICS */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricCol}>
            <Text style={styles.metricNumber}>
              {totalClients}
            </Text>
            <Text style={styles.metricLabel}>
              ATHLETES
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <Text
              style={[
                styles.metricNumber,
                styles.metricNumberAccent,
              ]}
            >
              {activeCount}
            </Text>

            <Text style={styles.metricLabel}>
              ACTIVE
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <Text
              style={[
                styles.metricNumber,
                pendingCount > 0 &&
                styles.metricNumberWarning,
              ]}
            >
              {pendingCount}
            </Text>

            <Text style={styles.metricLabel}>
              PENDING
            </Text>
          </View>
        </View>

        {/* ATTENTION */}
        {totalClients > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>
                  ATTENTION NEEDED
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {attentionClients.length > 0
                    ? `${attentionClients.length} athlete${attentionClients.length > 1 ? 's' : ''
                    } require review or setup`
                    : 'All active athletes are compliant and on track'}
                </Text>
              </View>
            </View>

            <View style={styles.attentionList}>
              {displayedAttentionClients.map((client) => {
                const displayName =
                  client.full_name?.trim() || 'Athlete';

                const firstLetter =
                  displayName[0]?.toUpperCase() || 'A';

                const statusInfo =
                  getAthleteStatusInfo(client);

                const compliance =
                  getClientCompliance(client.id);

                return (
                  <TouchableOpacity
                    key={client.id}
                    onPress={() =>
                      handleSelectClient(client.id)
                    }
                    style={styles.attentionCard}
                    activeOpacity={0.78}
                  >
                    {/* Identity */}
                    <View style={styles.attentionIdentity}>
                      {client.avatar_url ? (
                        <Image
                          source={{
                            uri: client.avatar_url,
                          }}
                          style={styles.attentionAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.attentionAvatarFallback,
                            {
                              borderColor:
                                statusInfo.color,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.attentionAvatarText,
                              {
                                color:
                                  statusInfo.color,
                              },
                            ]}
                          >
                            {firstLetter}
                          </Text>
                        </View>
                      )}

                      <View style={styles.attentionInfo}>
                        <View style={styles.nameLine}>
                          <Text
                            style={styles.attentionName}
                            numberOfLines={1}
                          >
                            {displayName}
                          </Text>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  statusInfo.color +
                                  '12',
                                borderColor:
                                  statusInfo.color +
                                  '35',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color:
                                    statusInfo.color,
                                },
                              ]}
                            >
                              {statusInfo.badgeText}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={styles.attentionReason}
                          numberOfLines={1}
                        >
                          {statusInfo.reason}
                        </Text>
                      </View>

                      <ChevronRight
                        size={18}
                        color={COLORS.textMuted}
                        strokeWidth={1.8}
                      />
                    </View>

                    {/* Contact / activity */}
                    <View style={styles.attentionMeta}>
                      <Text style={styles.attentionMetaText}>
                        {formatLastActivity(
                          client.updated_at
                        )}
                      </Text>

                      {client.phone_number ? (
                        <>
                          <View
                            style={styles.metaDot}
                          />

                          <Text
                            style={styles.attentionMetaText}
                            numberOfLines={1}
                          >
                            {client.phone_number}
                          </Text>
                        </>
                      ) : null}
                    </View>

                    {/* Compliance */}
                    <View style={styles.complianceRow}>
                      <View
                        style={[
                          styles.complianceItem,
                          compliance.hasDietPlan &&
                          compliance.todayMeals.length >
                          0 &&
                          compliance.todayMealsDone ===
                          compliance.todayMeals.length &&
                          styles.complianceItemComplete,
                        ]}
                      >
                        <Apple
                          size={14}
                          color={
                            !compliance.hasDietPlan
                              ? COLORS.warning
                              : compliance.todayMealsDone ===
                                compliance.todayMeals.length &&
                                compliance.todayMeals.length > 0
                                ? COLORS.brand
                                : COLORS.textSecondary
                          }
                          strokeWidth={1.8}
                        />

                        <View>
                          <Text
                            style={styles.complianceLabel}
                          >
                            DIET
                          </Text>

                          <Text
                            style={[
                              styles.complianceValue,
                              compliance.todayMealsDone ===
                              compliance.todayMeals.length &&
                              compliance.todayMeals.length >
                              0 &&
                              styles.complianceValueComplete,
                            ]}
                            numberOfLines={1}
                          >
                            {compliance.hasDietPlan
                              ? compliance.todayMeals.length >
                                0
                                ? `${compliance.todayMealsDone}/${compliance.todayMeals.length} logged`
                                : 'Scheduled'
                              : 'No plan'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.complianceItem,
                          compliance.isRestToday &&
                          styles.complianceItemRest,
                          !compliance.isRestToday &&
                          compliance.hasExercisePlan &&
                          compliance.todayExercises.length >
                          0 &&
                          compliance.todayExDone ===
                          compliance.todayExercises.length &&
                          styles.complianceItemComplete,
                        ]}
                      >
                        {compliance.isRestToday ? (
                          <Moon
                            size={14}
                            color={COLORS.warning}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <Dumbbell
                            size={14}
                            color={
                              !compliance.hasExercisePlan
                                ? COLORS.warning
                                : compliance.todayExDone ===
                                  compliance.todayExercises.length &&
                                  compliance.todayExercises.length >
                                  0
                                  ? COLORS.brand
                                  : COLORS.info
                            }
                            strokeWidth={1.8}
                          />
                        )}

                        <View>
                          <Text
                            style={styles.complianceLabel}
                          >
                            WORKOUT
                          </Text>

                          <Text
                            style={[
                              styles.complianceValue,
                              !compliance.isRestToday &&
                              compliance.todayExDone ===
                              compliance.todayExercises.length &&
                              compliance.todayExercises.length >
                              0 &&
                              styles.complianceValueComplete,
                              compliance.isRestToday &&
                              styles.complianceValueRest,
                            ]}
                            numberOfLines={1}
                          >
                            {compliance.isRestToday
                              ? 'Rest day'
                              : compliance.hasExercisePlan
                                ? compliance.todayExercises.length >
                                  0
                                  ? `${compliance.todayExDone}/${compliance.todayExercises.length} done`
                                  : 'Scheduled'
                                : 'No plan'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ALL ATHLETES */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>
            ALL ATHLETES
          </Text>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search
              size={17}
              color={COLORS.textMuted}
              strokeWidth={1.8}
            />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search athletes"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
            />
          </View>

          {/* Filters */}
          <View style={styles.filterTabsRow}>
            {(
              ['all', 'active', 'pending', 'inactive'] as const
            ).map((status) => {
              const isSelected =
                statusFilter === status;

              return (
                <TouchableOpacity
                  key={status}
                  onPress={() =>
                    setStatusFilter(status)
                  }
                  style={styles.filterTab}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isSelected &&
                      styles.filterTabTextActive,
                    ]}
                  >
                    {status.toUpperCase()}
                  </Text>

                  {isSelected && (
                    <View
                      style={styles.filterTabIndicator}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Roster */}
          <View style={styles.rosterList}>
            {filteredClients.length === 0 ? (
              totalClients === 0 ? (
                <View style={styles.emptyRosterBox}>
                  <View style={styles.emptyIconCircle}>
                    <Users
                      size={30}
                      color={COLORS.textMuted}
                      strokeWidth={1.6}
                    />
                  </View>

                  <Text style={styles.emptyRosterTitle}>
                    ROSTER IS EMPTY
                  </Text>

                  <Text
                    style={styles.emptyRosterSubtitle}
                  >
                    When your clients sign in to FitTrack
                    with their Google accounts, they will
                    automatically appear here with their
                    workout & diet progress.
                  </Text>

                  <TouchableOpacity
                    onPress={() => refetch()}
                    style={styles.refreshRosterBtn}
                    activeOpacity={0.8}
                  >
                    <RefreshCw
                      size={14}
                      color="#080A0C"
                    />

                    <Text
                      style={styles.refreshRosterText}
                    >
                      Refresh Roster
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyFilteredBox}>
                  <Text
                    style={styles.emptyFilteredTitle}
                  >
                    No Athletes Found
                  </Text>

                  <Text
                    style={styles.emptyFilteredSubtitle}
                  >
                    No athletes matched your query "
                    {searchQuery || statusFilter}".
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    style={styles.clearFilterBtn}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={styles.clearFilterText}
                    >
                      Reset Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              filteredClients.map((client) => {
                const displayName =
                  client.full_name?.trim() || 'Athlete';

                const firstLetter =
                  displayName[0]?.toUpperCase() || 'A';

                return (
                  <TouchableOpacity
                    key={client.id}
                    onPress={() =>
                      handleSelectClient(client.id)
                    }
                    style={styles.athleteRow}
                    activeOpacity={0.78}
                  >
                    {client.avatar_url ? (
                      <Image
                        source={{
                          uri: client.avatar_url,
                        }}
                        style={styles.rowAvatar}
                      />
                    ) : (
                      <View
                        style={styles.rowAvatarFallback}
                      >
                        <Text
                          style={styles.rowAvatarLetter}
                        >
                          {firstLetter}
                        </Text>
                      </View>
                    )}

                    <View
                      style={styles.rowDetailsCol}
                    >
                      <Text
                        style={styles.rowName}
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>

                      <View style={styles.rowMetaRow}>
                        {client.phone_number ? (
                          <View
                            style={styles.rowPhoneWrap}
                          >
                            <Phone
                              size={11}
                              color={COLORS.textMuted}
                              strokeWidth={1.8}
                            />

                            <Text
                              style={styles.rowMetaText}
                              numberOfLines={1}
                            >
                              {client.phone_number}
                            </Text>
                          </View>
                        ) : null}

                        {client.phone_number && (
                          <View
                            style={styles.rowMetaDot}
                          />
                        )}

                        <Text
                          style={styles.rowMetaText}
                          numberOfLines={1}
                        >
                          {formatLastActivity(
                            client.updated_at
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rowRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          client.status === 'active' &&
                          styles.statusBadgeActive,
                          client.status === 'pending' &&
                          styles.statusBadgePending,
                          client.status === 'inactive' &&
                          styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            client.status === 'active' &&
                            styles.statusBadgeTextActive,
                            client.status === 'pending' &&
                            styles.statusBadgeTextPending,
                            client.status === 'inactive' &&
                            styles.statusBadgeTextInactive,
                          ]}
                        >
                          {(
                            client.status || 'active'
                          ).toUpperCase()}
                        </Text>
                      </View>

                      <ChevronRight
                        size={17}
                        color={COLORS.textMuted}
                        strokeWidth={1.8}
                      />
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
    flexGrow: 1,
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

  /* ---------------------------------- */
  /* Header */
  /* ---------------------------------- */

  header: {
    paddingTop: 2,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },

  headerTitlesCol: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },

  headerKicker: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 1.7,
  },

  headerTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.7,
  },

  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  profileBtn: {
    padding: 2,
  },

  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
  },

  profileAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
  },

  /* ---------------------------------- */
  /* Metrics */
  /* ---------------------------------- */

  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 92,
    paddingHorizontal: 4,
  },

  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  metricNumber: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.7,
  },

  metricNumberAccent: {
    color: COLORS.brand,
  },

  metricNumberWarning: {
    color: COLORS.warning,
  },

  metricLabel: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.4,
  },

  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  /* ---------------------------------- */
  /* Sections */
  /* ---------------------------------- */

  section: {
    gap: SPACING.md,
  },

  sectionHeader: {
    gap: 3,
  },

  sectionKicker: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  /* ---------------------------------- */
  /* Premium Attention Cards */
  /* ---------------------------------- */

  attentionList: {
    gap: 10,
  },

  attentionCard: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
  },

  attentionIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  attentionAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceElevated,
  },

  attentionAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  attentionAvatarText: {
    fontSize: 15,
    fontWeight: '800',
  },

  attentionInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },

  attentionName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  attentionReason: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  attentionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 58,
    marginTop: -3,
  },

  attentionMetaText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },

  /* ---------------------------------- */
  /* Compliance */
  /* ---------------------------------- */

  complianceRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  complianceItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
  },

  complianceItemComplete: {
    backgroundColor: 'rgba(199, 240, 0, 0.07)',
  },

  complianceItemRest: {
    backgroundColor: 'rgba(245, 165, 36, 0.07)',
  },

  complianceLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.1,
  },

  complianceValue: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  complianceValueComplete: {
    color: COLORS.brand,
  },

  complianceValueRest: {
    color: COLORS.warning,
  },

  /* ---------------------------------- */
  /* Status */
  /* ---------------------------------- */

  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },

  statusBadgeActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.07)',
    borderColor: 'rgba(199, 240, 0, 0.22)',
  },

  statusBadgePending: {
    backgroundColor: 'rgba(245, 165, 36, 0.07)',
    borderColor: 'rgba(245, 165, 36, 0.22)',
  },

  statusBadgeInactive: {
    backgroundColor: 'rgba(161, 169, 176, 0.06)',
    borderColor: 'rgba(161, 169, 176, 0.16)',
  },

  statusBadgeText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  statusBadgeTextActive: {
    color: COLORS.brand,
  },

  statusBadgeTextPending: {
    color: COLORS.warning,
  },

  statusBadgeTextInactive: {
    color: COLORS.textMuted,
  },

  /* ---------------------------------- */
  /* Search */
  /* ---------------------------------- */

  searchBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  /* ---------------------------------- */
  /* Filters */
  /* ---------------------------------- */

  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 20,
  },

  filterTab: {
    position: 'relative',
    paddingVertical: 11,
    paddingHorizontal: 1,
  },

  filterTabText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.9,
  },

  filterTabTextActive: {
    color: COLORS.brand,
  },

  filterTabIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.brand,
  },

  /* ---------------------------------- */
  /* Roster */
  /* ---------------------------------- */

  rosterList: {
    gap: 8,
  },

  athleteRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 11,
  },

  rowAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
  },

  rowAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowAvatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
  },

  rowDetailsCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  rowName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },

  rowPhoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },

  rowMetaText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  rowMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },

  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  /* ---------------------------------- */
  /* Empty states */
  /* ---------------------------------- */

  emptyRosterBox: {
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    gap: 14,
  },

  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyRosterTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  emptyRosterSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 420,
  },

  refreshRosterBtn: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 2,
  },

  refreshRosterText: {
    fontSize: 12,
    fontWeight: '800',
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
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
});