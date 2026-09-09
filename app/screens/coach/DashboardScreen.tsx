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
  Sparkles,
} from 'lucide-react-native';
import { useClients } from '../../lib/queries/profiles';
import { useAllDietPlans } from '../../lib/queries/dietPlans';
import { useAllExercisePlans } from '../../lib/queries/exercisePlans';
import { useUIStore } from '../../lib/store';
import { COLORS, SPACING, RADIUS, LAYOUT } from '../../theme/theme';
import { DayOfWeek, Profile, DietPlan, ExercisePlan } from '../../types/database';
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

/* ==========================================================================
   COACH CLIENT CARD
   Premium private-coaching athlete roster card:
   - Strong visual hierarchy: Avatar + Client Name
   - Muted phone number directly below the name
   - Compact Diet and Workout status indicators (Apple/Dumbbell icons, Lime active)
   - Minimal client overall status indicator (e.g. ● On Track, ● Needs Attention)
   - 100% tappable card navigating to client Active Plan
   ========================================================================== */
interface CoachClientCardProps {
  client: Profile;
  isDesktop: boolean;
  onPress: () => void;
  dietPlan?: DietPlan;
  exercisePlan?: ExercisePlan;
  today: DayOfWeek;
}

const CoachClientCard: React.FC<CoachClientCardProps> = ({
  client,
  isDesktop,
  onPress,
  dietPlan,
  exercisePlan,
  today,
}) => {
  const displayName = client.full_name?.trim() || 'Athlete';
  const firstLetter = (displayName[0] || 'A').toUpperCase();
  const phoneNumber = client.phone_number?.trim() || null;

  // Diet status computation
  const todayDietDay = dietPlan?.day_plans?.[today];
  const meals = todayDietDay?.meals || dietPlan?.meals || [];
  const mealsDone = meals.filter((m) => m.completed).length;
  const hasDietPlan = Boolean(dietPlan);
  const isDietComplete = hasDietPlan && meals.length > 0 && mealsDone === meals.length;

  const dietStatus = !hasDietPlan
    ? {
      label: 'Pending',
      color: COLORS.warning,
      bgColor: 'rgba(245, 165, 36, 0.08)',
      borderColor: 'rgba(245, 165, 36, 0.22)',
    }
    : isDietComplete
      ? {
        label: 'Completed',
        color: COLORS.brand,
        bgColor: 'rgba(199, 240, 0, 0.08)',
        borderColor: 'rgba(199, 240, 0, 0.22)',
      }
      : {
        label: 'Active',
        color: COLORS.brand,
        bgColor: 'rgba(199, 240, 0, 0.08)',
        borderColor: 'rgba(199, 240, 0, 0.22)',
      };

  // Workout status computation
  const todayExDay = exercisePlan?.day_routines?.[today];
  const isRestToday = Boolean(todayExDay?.is_rest_day);
  const exercises = todayExDay?.exercises || exercisePlan?.exercises || [];
  const exercisesDone = exercises.filter((e) => e.completed).length;
  const hasExercisePlan = Boolean(exercisePlan);
  const isExerciseComplete = hasExercisePlan && exercises.length > 0 && exercisesDone === exercises.length;

  const workoutStatus = !hasExercisePlan
    ? {
      label: 'Pending',
      color: COLORS.warning,
      bgColor: 'rgba(245, 165, 36, 0.08)',
      borderColor: 'rgba(245, 165, 36, 0.22)',
      isRest: false,
    }
    : isRestToday
      ? {
        label: 'Rest Day',
        color: COLORS.textSecondary,
        bgColor: 'rgba(161, 169, 176, 0.08)',
        borderColor: 'rgba(161, 169, 176, 0.2)',
        isRest: true,
      }
      : isExerciseComplete
        ? {
          label: 'Completed',
          color: COLORS.brand,
          bgColor: 'rgba(199, 240, 0, 0.08)',
          borderColor: 'rgba(199, 240, 0, 0.22)',
          isRest: false,
        }
        : {
          label: 'Active',
          color: COLORS.brand,
          bgColor: 'rgba(199, 240, 0, 0.08)',
          borderColor: 'rgba(199, 240, 0, 0.22)',
          isRest: false,
        };

  // Overall athlete status (clean, minimal pill badge)
  const overallStatus =
    client.status === 'inactive'
      ? {
        label: 'Inactive',
        dotColor: COLORS.textMuted,
        color: COLORS.textSecondary,
        bgColor: 'rgba(161, 169, 176, 0.08)',
        borderColor: 'rgba(161, 169, 176, 0.2)',
      }
      : client.status === 'pending'
        ? {
          label: 'Pending',
          dotColor: COLORS.warning,
          color: COLORS.warning,
          bgColor: 'rgba(245, 165, 36, 0.08)',
          borderColor: 'rgba(245, 165, 36, 0.2)',
        }
        : !hasDietPlan || !hasExercisePlan
          ? {
            label: 'Needs Attention',
            dotColor: COLORS.warning,
            color: COLORS.warning,
            bgColor: 'rgba(245, 165, 36, 0.08)',
            borderColor: 'rgba(245, 165, 36, 0.2)',
          }
          : {
            label: 'On Track',
            dotColor: COLORS.brand,
            color: COLORS.brand,
            bgColor: 'rgba(199, 240, 0, 0.08)',
            borderColor: 'rgba(199, 240, 0, 0.2)',
          };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.clientCard, isDesktop && styles.clientCardDesktop]}
      activeOpacity={0.75}
    >
      {isDesktop ? (
        /* Desktop: Spacious horizontal single-row composition */
        <View style={styles.cardDesktopRow}>
          {/* Left: Avatar + Name / Phone directly below */}
          <View style={styles.cardIdentityGroup}>
            {client.avatar_url ? (
              <Image source={{ uri: client.avatar_url }} style={styles.cardAvatar} />
            ) : (
              <View style={styles.cardAvatarFallback}>
                <Text style={styles.cardAvatarLetter}>{firstLetter}</Text>
              </View>
            )}
            <View style={styles.cardNameCol}>
              <Text style={styles.cardName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.cardPhone} numberOfLines={1}>
                {phoneNumber || 'No phone on file'}
              </Text>
            </View>
          </View>

          {/* Center-Right: Compact Diet & Workout status indicators */}
          <View style={styles.cardStatusGroup}>
            {/* Diet Column */}
            <View style={styles.statusCol}>
              <Text style={styles.statusColLabel}>DIET</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: dietStatus.bgColor,
                    borderColor: dietStatus.borderColor,
                  },
                ]}
              >
                <Apple size={11} color={dietStatus.color} strokeWidth={2.2} />
                <Text style={[styles.statusBadgeText, { color: dietStatus.color }]}>
                  {dietStatus.label}
                </Text>
              </View>
            </View>

            {/* Workout Column */}
            <View style={styles.statusCol}>
              <Text style={styles.statusColLabel}>WORKOUT</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: workoutStatus.bgColor,
                    borderColor: workoutStatus.borderColor,
                  },
                ]}
              >
                {workoutStatus.isRest ? (
                  <Moon size={11} color={workoutStatus.color} strokeWidth={2.2} />
                ) : (
                  <Dumbbell size={11} color={workoutStatus.color} strokeWidth={2.2} />
                )}
                <Text style={[styles.statusBadgeText, { color: workoutStatus.color }]}>
                  {workoutStatus.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Far-Right: Clean overall status indicator */}
          <View
            style={[
              styles.overallStatusBadge,
              {
                backgroundColor: overallStatus.bgColor,
                borderColor: overallStatus.borderColor,
              },
            ]}
          >
            <View style={[styles.overallStatusDot, { backgroundColor: overallStatus.dotColor }]} />
            <Text style={[styles.overallStatusText, { color: overallStatus.color }]}>
              {overallStatus.label}
            </Text>
          </View>
        </View>
      ) : (
        /* Mobile: Refined 2-tier composition matching requested layout */
        <View style={styles.cardMobileWrapper}>
          {/* Top Row: Avatar + Name / Phone on left, Overall Status badge on right */}
          <View style={styles.cardMobileTopRow}>
            <View style={styles.cardIdentityGroupMobile}>
              {client.avatar_url ? (
                <Image source={{ uri: client.avatar_url }} style={styles.cardAvatar} />
              ) : (
                <View style={styles.cardAvatarFallback}>
                  <Text style={styles.cardAvatarLetter}>{firstLetter}</Text>
                </View>
              )}
              <View style={styles.cardNameColMobile}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.cardPhone} numberOfLines={1}>
                  {phoneNumber || 'No phone on file'}
                </Text>
              </View>
            </View>

            {/* Overall Status Badge */}
            <View
              style={[
                styles.overallStatusBadge,
                {
                  backgroundColor: overallStatus.bgColor,
                  borderColor: overallStatus.borderColor,
                },
              ]}
            >
              <View style={[styles.overallStatusDot, { backgroundColor: overallStatus.dotColor }]} />
              <Text style={[styles.overallStatusText, { color: overallStatus.color }]}>
                {overallStatus.label}
              </Text>
            </View>
          </View>

          {/* Bottom Row: Diet & Workout status indicators indented directly under name */}
          <View style={styles.cardMobileStatusRow}>
            {/* Diet Column */}
            <View style={styles.statusCol}>
              <Text style={styles.statusColLabel}>DIET</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: dietStatus.bgColor,
                    borderColor: dietStatus.borderColor,
                  },
                ]}
              >
                <Apple size={11} color={dietStatus.color} strokeWidth={2.2} />
                <Text style={[styles.statusBadgeText, { color: dietStatus.color }]}>
                  {dietStatus.label}
                </Text>
              </View>
            </View>

            {/* Workout Column */}
            <View style={styles.statusCol}>
              <Text style={styles.statusColLabel}>WORKOUT</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: workoutStatus.bgColor,
                    borderColor: workoutStatus.borderColor,
                  },
                ]}
              >
                {workoutStatus.isRest ? (
                  <Moon size={11} color={workoutStatus.color} strokeWidth={2.2} />
                ) : (
                  <Dumbbell size={11} color={workoutStatus.color} strokeWidth={2.2} />
                )}
                <Text style={[styles.statusBadgeText, { color: workoutStatus.color }]}>
                  {workoutStatus.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
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
        {totalClients > 0 && attentionClients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionKicker}>ATTENTION NEEDED</Text>
              <Text style={styles.sectionSubtitle}>
                {attentionClients.length} athlete{attentionClients.length > 1 ? 's' : ''} require review or setup
              </Text>
            </View>

            <View style={styles.rosterList}>
              {attentionClients.map((client) => {
                const clientDiet = (allDietPlans || []).find((p) => p.client_id === client.id);
                const clientExercise = (allExercisePlans || []).find((p) => p.client_id === client.id);

                return (
                  <CoachClientCard
                    key={`attention-${client.id}`}
                    client={client}
                    isDesktop={isDesktop}
                    onPress={() => handleSelectClient(client.id)}
                    dietPlan={clientDiet}
                    exercisePlan={clientExercise}
                    today={today}
                  />
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
                const clientDiet = (allDietPlans || []).find((p) => p.client_id === client.id);
                const clientExercise = (allExercisePlans || []).find((p) => p.client_id === client.id);

                return (
                  <CoachClientCard
                    key={client.id}
                    client={client}
                    isDesktop={isDesktop}
                    onPress={() => handleSelectClient(client.id)}
                    dietPlan={clientDiet}
                    exercisePlan={clientExercise}
                    today={today}
                  />
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

  // Redesigned Coach Client Card Styles
  clientCard: {
    backgroundColor: '#111519',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#252B31',
    padding: 16,
  },
  clientCardDesktop: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },

  // Desktop Horizontal Row
  cardDesktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  cardIdentityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 220,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#171C21',
    borderWidth: 1,
    borderColor: '#252B31',
  },
  cardAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#171C21',
    borderWidth: 1,
    borderColor: '#252B31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C7F000',
  },
  cardNameCol: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F7F8',
    letterSpacing: -0.3,
  },
  cardPhone: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A1A9B0',
    letterSpacing: 0.1,
  },

  // Desktop Center Status Group
  cardStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  statusCol: {
    alignItems: 'flex-start',
    gap: 4,
  },
  statusColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A9B0',
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Overall Status Badge (Clean indicator)
  overallStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  overallStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  overallStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Mobile Composition
  cardMobileWrapper: {
    gap: 14,
  },
  cardMobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardIdentityGroupMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  cardNameColMobile: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cardMobileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingLeft: 60, // 48px avatar + 12px gap to align under name
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
    gap: 12,
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
