import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Apple, Dumbbell, Bell } from 'lucide-react-native';
import { useUIStore } from '../lib/store';
import { DARK_THEME } from '../theme/theme';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { CoachDashboardScreen } from '../screens/coach/DashboardScreen';
import { ClientDetailScreen } from '../screens/coach/ClientDetailScreen';
import { DietPlanEditorScreen } from '../screens/coach/DietPlanEditorScreen';
import { ExercisePlanEditorScreen } from '../screens/coach/ExercisePlanEditorScreen';
import { ReminderEditorScreen } from '../screens/coach/ReminderEditorScreen';
import { CoachProfileEditorScreen } from '../screens/coach/CoachProfileEditorScreen';

export const CoachNavigator: React.FC = () => {
  const { coachActiveTab, setCoachActiveTab, logout, user } = useUIStore();
  const theme = DARK_THEME;
  const insets = useSafeAreaInsets();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const renderScreen = () => {
    switch (coachActiveTab) {
      case 'dashboard':
        return <CoachDashboardScreen />;
      case 'client-detail':
        return <ClientDetailScreen />;
      case 'diet-editor':
        return <DietPlanEditorScreen />;
      case 'exercise-editor':
        return <ExercisePlanEditorScreen />;
      case 'reminder-editor':
        return <ReminderEditorScreen />;
      case 'coach-profile':
        return <CoachProfileEditorScreen />;
      default:
        return <CoachDashboardScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.cardBorder,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        {/* Brand: Official Logo + FITTRACK */}
        <TouchableOpacity
          onPress={() => setCoachActiveTab('dashboard')}
          style={styles.brandRow}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/app-logo.png')}
            style={styles.brandLogoImg}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            FIT<Text style={styles.neonText}>TRACK</Text>
          </Text>
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => setIsProfileMenuOpen(true)}
          style={[
            styles.profilePill,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.cardBorder,
            },
          ]}
          activeOpacity={0.75}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>
                {(user?.name || user?.email || 'C')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileTextCol}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]} numberOfLines={1}>
              {user?.name?.split(' ')[0] || 'Coach'}
            </Text>
            <Text style={styles.profileBadge}>Head Coach</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Dropdown Dark Menu */}
      <ProfileDropdown
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        user={user}
        role="Head Coach"
        onLogout={logout}
      />

      {/* Main Canvas */}
      <View style={styles.canvas}>{renderScreen()}</View>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.cardBorder,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setCoachActiveTab('dashboard')}
          style={styles.navTab}
        >
          <Users size={20} color={coachActiveTab === 'dashboard' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: coachActiveTab === 'dashboard' ? '#CCFF00' : '#64748B' }]}>
            Roster
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCoachActiveTab('client-detail')}
          style={styles.navTab}
        >
          <Apple size={20} color={coachActiveTab === 'client-detail' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: coachActiveTab === 'client-detail' ? '#CCFF00' : '#64748B' }]}>
            Active Plans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCoachActiveTab('reminder-editor')}
          style={styles.navTab}
        >
          <Bell size={20} color={coachActiveTab === 'reminder-editor' ? '#CCFF00' : '#64748B'} />
          <Text style={[styles.navText, { color: coachActiveTab === 'reminder-editor' ? '#CCFF00' : '#64748B' }]}>
            Reminders
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoImg: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  neonText: {
    color: '#CCFF00',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  profileTextCol: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 90,
  },
  profileBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCFF00',
  },
  canvas: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  navTab: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
