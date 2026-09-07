import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, StyleSheet, RefreshControl } from 'react-native';
import { Users, Search, RefreshCw, Flame, ChevronRight, Dumbbell, Clock, Apple, CircleCheck, Moon, Phone } from 'lucide-react-native';
import { useClients } from '../../lib/queries/profiles';
import { useAllDietPlans } from '../../lib/queries/dietPlans';
import { useAllExercisePlans } from '../../lib/queries/exercisePlans';
import { useUIStore } from '../../lib/store';
import { LIGHT_THEME, DARK_THEME } from '../../theme/theme';
import { DayOfWeek } from '../../types/database';

const getTodayDayOfWeek = (): DayOfWeek => {
  const dayIndex = new Date().getDay();
  const mapping: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return mapping[dayIndex] || 'Monday';
};

export const CoachDashboardScreen: React.FC = () => {
  const { themeMode, setSelectedClientId, setCoachActiveTab } = useUIStore();
  const theme = themeMode === 'dark' ? DARK_THEME : LIGHT_THEME;

  const { data: clients, isLoading, refetch, isRefetching } = useClients();
  const { data: allDietPlans } = useAllDietPlans();
  const { data: allExercisePlans } = useAllExercisePlans();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');

  const today = getTodayDayOfWeek();

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
  const activeClientCount = (clients || []).filter((c) => c.status === 'active').length;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#CCFF00" />}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {/* Header Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>TOTAL CLIENTS</Text>
            <View style={styles.iconPillGreen}>
              <Users size={16} color="#CCFF00" />
            </View>
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalClients}</Text>
          <Text style={styles.statSubGreen}>{activeClientCount} Active in Roster</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>ROSTER STATUS</Text>
            <View style={styles.iconPillOrange}>
              <Flame size={16} color="#F97316" />
            </View>
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>
            {totalClients > 0 ? `${Math.round((activeClientCount / totalClients) * 100)}%` : 'Ready'}
          </Text>
          <Text style={styles.statSubGreen}>{totalClients > 0 ? 'Active Engagement' : 'Awaiting Signups'}</Text>
        </View>
      </View>

      {/* Controls Bar: Search & Filters */}
      <View style={styles.controlsBar}>
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search clients..."
            placeholderTextColor="#64748B"
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filterPill,
                statusFilter === status
                  ? styles.filterPillActive
                  : { backgroundColor: '#090D16', borderColor: '#1E293B' },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === status ? styles.filterTextActive : { color: '#94A3B8' },
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Client Roster List */}
      <View style={styles.clientList}>
        {filteredClients.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.emptyIconCircle}>
              <Users size={32} color="#94A3B8" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Clients in Roster Yet</Text>
            <Text style={styles.emptySubtitle}>
              When your clients sign in to FitTrack with their Google accounts, they will automatically appear here with their workout & diet progress.
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn} activeOpacity={0.8}>
              <RefreshCw size={14} color="#0F172A" />
              <Text style={styles.refreshBtnText}>Refresh Roster</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredClients.map((client) => {
            const displayName = client.full_name?.trim() || 'Client';
            const firstLetter = displayName[0]?.toUpperCase() || 'C';

            // Resolve today's diet and workout status for this client
            const clientDiet = (allDietPlans || []).find((p) => p.client_id === client.id);
            const clientExercise = (allExercisePlans || []).find((p) => p.client_id === client.id);

            const todayDietDay = clientDiet?.day_plans?.[today];
            const todayMeals = todayDietDay?.meals || clientDiet?.meals || [];
            const todayMealsDone = todayMeals.filter((m) => m.completed).length;

            const todayExDay = clientExercise?.day_routines?.[today];
            const isRestToday = todayExDay ? todayExDay.is_rest_day : false;
            const todayExercises = todayExDay?.exercises || clientExercise?.exercises || [];
            const todayExDone = todayExercises.filter((e) => e.completed).length;

            return (
              <TouchableOpacity
                key={client.id}
                onPress={() => handleSelectClient(client.id)}
                style={[styles.clientCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                activeOpacity={0.85}
              >
                <View style={styles.clientHeader}>
                  {client.avatar_url ? (
                    <Image
                      source={{
                        uri: client.avatar_url,
                      }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{firstLetter}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientName, { color: theme.textPrimary }]}>
                      {displayName}
                    </Text>
                    <Text style={styles.clientRoleSubtitle}>Client</Text>
                    {client.phone_number ? (
                      <View style={styles.phoneRow}>
                        <Phone size={10} color="#64748B" />
                        <Text style={styles.phoneText}>{client.phone_number}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      client.status === 'active'
                        ? styles.statusActive
                        : client.status === 'pending'
                          ? styles.statusPending
                          : styles.statusInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        client.status === 'active'
                          ? { color: '#34D399' }
                          : client.status === 'pending'
                            ? { color: '#FBBF24' }
                            : { color: '#94A3B8' },
                      ]}
                    >
                      {(client.status || 'active').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Today's Live Compliance Chips */}
                <View style={styles.complianceRow}>
                  {/* Diet Status Chip */}
                  <View style={[styles.miniChip, todayMealsDone === todayMeals.length && todayMeals.length > 0 ? styles.miniChipFull : styles.miniChipNormal]}>
                    <Apple size={11} color={todayMealsDone === todayMeals.length && todayMeals.length > 0 ? '#34D399' : '#CCFF00'} />
                    <Text style={[styles.miniChipText, todayMealsDone === todayMeals.length && todayMeals.length > 0 ? { color: '#34D399' } : { color: '#E2E8F0' }]}>
                      {todayMeals.length > 0
                        ? `Diet: ${todayMealsDone}/${todayMeals.length} Logged`
                        : 'No Diet Plan'}
                    </Text>
                  </View>

                  {/* Workout Status Chip */}
                  <View style={[styles.miniChip, isRestToday ? styles.miniChipRest : todayExDone === todayExercises.length && todayExercises.length > 0 ? styles.miniChipFull : styles.miniChipNormal]}>
                    {isRestToday ? (
                      <Moon size={11} color="#F97316" />
                    ) : (
                      <Dumbbell size={11} color={todayExDone === todayExercises.length && todayExercises.length > 0 ? '#34D399' : '#38BDF8'} />
                    )}
                    <Text style={[styles.miniChipText, isRestToday ? { color: '#F97316' } : todayExDone === todayExercises.length && todayExercises.length > 0 ? { color: '#34D399' } : { color: '#E2E8F0' }]}>
                      {isRestToday
                        ? 'Rest Day'
                        : todayExercises.length > 0
                          ? `Workout: ${todayExDone}/${todayExercises.length} Done`
                          : 'No Workout Plan'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>Manage Plans & View Profile</Text>
                  <ChevronRight size={16} color="#CCFF00" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  iconPillGreen: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
  },
  iconPillOrange: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statSubGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  controlsBar: {
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  filtersRow: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#0F172A',
  },
  clientList: {
    gap: 12,
  },
  clientCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '800',
  },
  clientRoleSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  statusInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  miniChipNormal: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
  },
  miniChipFull: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  miniChipRest: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 6,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
});
