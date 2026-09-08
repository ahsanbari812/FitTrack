import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
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
        <View style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}>
          {/* Brand: Official Logo + FITTRACK */}
          <TouchableOpacity
            onPress={() => setCoachActiveTab('dashboard')}
            style={styles.brandRow}
            activeOpacity={0.8}
          >
            <View style={styles.logoBadge}>
              <Dumbbell size={16} color="#C7F000" strokeWidth={2.4} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              FIT<Text style={styles.neonText}>TRACK</Text>
            </Text>
          </TouchableOpacity>

          {/* Desktop Header Navigation Tabs */}
          {isDesktop && (
            <View style={styles.desktopNavRow}>
              <TouchableOpacity
                onPress={() => setCoachActiveTab('dashboard')}
                style={[
                  styles.desktopNavTab,
                  coachActiveTab === 'dashboard' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Users
                  size={17}
                  color={coachActiveTab === 'dashboard' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: coachActiveTab === 'dashboard' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Roster
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCoachActiveTab('client-detail')}
                style={[
                  styles.desktopNavTab,
                  coachActiveTab === 'client-detail' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Apple
                  size={17}
                  color={coachActiveTab === 'client-detail' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: coachActiveTab === 'client-detail' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Active Plans
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCoachActiveTab('reminder-editor')}
                style={[
                  styles.desktopNavTab,
                  coachActiveTab === 'reminder-editor' && styles.desktopNavTabActive,
                ]}
                activeOpacity={0.8}
              >
                <Bell
                  size={17}
                  color={coachActiveTab === 'reminder-editor' ? '#CCFF00' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.desktopNavText,
                    { color: coachActiveTab === 'reminder-editor' ? '#CCFF00' : '#94A3B8' },
                  ]}
                >
                  Reminders
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
      </View>

      {/* Profile Dropdown Dark Menu */}
      <ProfileDropdown
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        user={user}
        role="Head Coach"
        onLogout={logout}
      />

      {/* Main Canvas with Responsive Container */}
      <View style={styles.canvas}>
        <View style={[styles.canvasInner, isDesktop && styles.desktopCanvasInner]}>
          {renderScreen()}
        </View>
      </View>

      {/* Bottom Navigation (Mobile Only) */}
      {!isDesktop && (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopHeaderInner: {
    maxWidth: 1160,
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#151A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  neonText: {
    color: '#C7F000',
  },
  desktopNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  desktopNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  desktopNavTabActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  desktopNavText: {
    fontSize: 13,
    fontWeight: '800',
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
    maxWidth: 120,
  },
  profileBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCFF00',
  },
  canvas: {
    flex: 1,
  },
  canvasInner: {
    flex: 1,
    width: '100%',
  },
  desktopCanvasInner: {
    maxWidth: 1160,
    width: '100%',
    alignSelf: 'center',
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
