import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Apple, Dumbbell, Edit3, TrendingUp } from 'lucide-react-native';
import { useUIStore } from '../lib/store';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, LAYOUT } from '../theme/theme';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { CoachProfileModal } from '../components/CoachProfileModal';
import { ClientHomeScreen } from '../screens/client/HomeScreen';
import { ClientDietPlanScreen } from '../screens/client/DietPlanScreen';
import { ClientExercisePlanScreen } from '../screens/client/ExercisePlanScreen';
import { ClientLogEntryScreen } from '../screens/client/LogEntryScreen';
import { ClientProgressHistoryScreen } from '../screens/client/ProgressHistoryScreen';

export const ClientNavigator: React.FC = () => {
  const {
    clientActiveTab,
    setClientActiveTab,
    logout,
    user,
    isCoachProfileModalOpen,
    setCoachProfileModalOpen,
  } = useUIStore();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const renderScreen = () => {
    switch (clientActiveTab) {
      case 'home':
        return <ClientHomeScreen />;
      case 'diet':
        return <ClientDietPlanScreen />;
      case 'workout':
        return <ClientExercisePlanScreen />;
      case 'log':
        return <ClientLogEntryScreen />;
      case 'progress':
        return <ClientProgressHistoryScreen />;
      default:
        return <ClientHomeScreen />;
    }
  };

  const navItems = [
    { key: 'home' as const, label: 'Home', icon: Home },
    { key: 'diet' as const, label: 'Diet', icon: Apple },
    { key: 'workout' as const, label: 'Workout', icon: Dumbbell },
    { key: 'log' as const, label: 'Daily Log', icon: Edit3 },
    { key: 'progress' as const, label: 'Progress', icon: TrendingUp },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Sticky Header / Top Navigation */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, SPACING.md),
            paddingHorizontal: isDesktop ? LAYOUT.paddingDesktop : LAYOUT.paddingMobile,
          },
        ]}
      >
        <View style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}>
          {/* Brand Logo */}
          <TouchableOpacity
            onPress={() => setClientActiveTab('home')}
            style={styles.brandRow}
            activeOpacity={0.8}
          >
            <View style={styles.logoBadge}>
              <Dumbbell size={16} color={COLORS.brand} strokeWidth={2.4} />
            </View>
            <Text style={styles.brandTitle}>
              FIT<Text style={styles.brandAccent}>TRACK</Text>
            </Text>
          </TouchableOpacity>

          {/* Desktop Navigation Center Tabs */}
          {isDesktop && (
            <View style={styles.desktopNavRow}>
              {navItems.map((item) => {
                const isActive = clientActiveTab === item.key;
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setClientActiveTab(item.key)}
                    style={[styles.desktopNavTab, isActive && styles.desktopNavTabActive]}
                    activeOpacity={0.8}
                  >
                    <IconComponent
                      size={15}
                      color={isActive ? COLORS.brand : COLORS.textSecondary}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <Text
                      style={[
                        styles.desktopNavText,
                        { color: isActive ? COLORS.brand : COLORS.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Athlete Profile Pill */}
          <TouchableOpacity
            onPress={() => setIsProfileMenuOpen(true)}
            style={styles.profilePill}
            activeOpacity={0.75}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>
                  {(user?.name || user?.email || 'A')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
              {user?.name?.split(' ')[0] || 'Athlete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Meet Your Coach Modal */}
      <CoachProfileModal
        isOpen={isCoachProfileModalOpen}
        onClose={() => setCoachProfileModalOpen(false)}
      />

      {/* Profile Dropdown Menu */}
      <ProfileDropdown
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        user={user}
        role="Client"
        onLogout={logout}
      />

      {/* Main Responsive Canvas */}
      <View
        style={[
          styles.canvas,
          !isDesktop && {
            paddingBottom: 56 + Math.max(insets.bottom, SPACING.sm),
          },
        ]}
      >
        <View style={[styles.canvasInner, isDesktop && styles.desktopCanvasInner]}>
          {renderScreen()}
        </View>
      </View>

      {/* Mobile Bottom Navigation (<768px) */}
      {!isDesktop && (
        <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: Math.max(insets.bottom, SPACING.sm),
            },
          ]}
        >
          {navItems.map((item) => {
            const isActive = clientActiveTab === item.key;
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setClientActiveTab(item.key)}
                style={styles.navTab}
                activeOpacity={0.8}
              >
                <IconComponent
                  size={20}
                  color={isActive ? COLORS.brand : COLORS.textMuted}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <Text
                  style={[
                    styles.navText,
                    { color: isActive ? COLORS.brand : COLORS.textMuted },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    height: '100%',
  },
  header: {
    backgroundColor: COLORS.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    zIndex: 10,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopHeaderInner: {
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: COLORS.textPrimary,
  },
  brandAccent: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  desktopNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desktopNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  desktopNavTabActive: {
    backgroundColor: 'rgba(199, 240, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 240, 0, 0.25)',
  },
  desktopNavText: {
    fontSize: 13,
    fontWeight: '600',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: 4,
    paddingRight: SPACING.md,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfacePrimary,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 100,
  },
  canvas: {
    flex: 1,
  },
  canvasInner: {
    flex: 1,
    width: '100%',
  },
  desktopCanvasInner: {
    maxWidth: LAYOUT.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    zIndex: 1000,
    elevation: 10,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 52,
    gap: 3,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
